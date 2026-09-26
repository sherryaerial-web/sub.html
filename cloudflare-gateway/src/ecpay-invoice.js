import { GatewayError } from './security.js';

const ENDPOINTS = Object.freeze({
  stage: 'https://einvoice-stage.ecpay.com.tw/B2CInvoice/Issue',
  production: 'https://einvoice.ecpay.com.tw/B2CInvoice/Issue',
});

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('invalid encrypted data');
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function validateAesMaterial(hashKey, hashIv) {
  const keyBytes = new TextEncoder().encode(String(hashKey || ''));
  const ivBytes = new TextEncoder().encode(String(hashIv || ''));
  if (keyBytes.byteLength !== 16 || ivBytes.byteLength !== 16) {
    throw new GatewayError(503, 'ecpay_not_configured', '綠界服務尚未完成設定。');
  }
  return { keyBytes, ivBytes };
}

async function importAesKey(hashKey, usages) {
  const { keyBytes } = validateAesMaterial(hashKey, '1234567890123456');
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, usages);
}

export async function encryptEcpayData_(payload, hashKey, hashIv) {
  const { ivBytes } = validateAesMaterial(hashKey, hashIv);
  const key = await importAesKey(hashKey, ['encrypt']);
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBytes },
    key,
    new TextEncoder().encode(encoded),
  );
  return bytesToBase64(new Uint8Array(encrypted));
}

export async function decryptEcpayData_(encrypted, hashKey, hashIv) {
  const { ivBytes } = validateAesMaterial(hashKey, hashIv);
  const key = await importAesKey(hashKey, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes },
    key,
    base64ToBytes(encrypted),
  );
  const encoded = new TextDecoder().decode(decrypted);
  return JSON.parse(decodeURIComponent(encoded));
}

export function resolveMerchantSecrets_(env, merchantProfile) {
  const profile = String(merchantProfile || '').trim();
  if (!['primary', 'secondary'].includes(profile)) {
    throw new GatewayError(400, 'invalid_merchant_profile', '開票帳號不正確。');
  }
  const prefix = profile === 'primary' ? 'ECPAY_PRIMARY' : 'ECPAY_SECONDARY';
  const result = {
    merchantId: String(env[`${prefix}_MERCHANT_ID`] || '').trim(),
    hashKey: String(env[`${prefix}_HASH_KEY`] || ''),
    hashIv: String(env[`${prefix}_HASH_IV`] || ''),
  };
  if (!result.merchantId || result.merchantId.length > 10) {
    throw new GatewayError(503, 'ecpay_not_configured', '綠界服務尚未完成設定。');
  }
  validateAesMaterial(result.hashKey, result.hashIv);
  return result;
}

function safeTraceId(value) {
  const text = String(value || '').trim();
  if (/^[A-Za-z0-9_-]{1,64}$/.test(text)) return text;
  return crypto.randomUUID();
}

function safeMessage(value, fallback) {
  const text = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return (text || fallback).slice(0, 200);
}

function pickInvoiceData(invoice, merchantId) {
  const value = invoice || {};
  const fields = [
    'RelateNumber', 'CustomerIdentifier', 'CustomerName', 'CustomerAddr', 'CustomerPhone',
    'CustomerEmail', 'Print', 'Donation', 'LoveCode', 'CarrierType', 'CarrierNum',
    'TaxType', 'SalesAmount', 'InvoiceRemark', 'InvType', 'vat', 'Items',
  ];
  const result = { MerchantID: merchantId };
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(value, field)) result[field] = value[field];
  }
  return result;
}

export function sanitizeEcpayResult_(result) {
  const value = result || {};
  const outcome = ['issued', 'rejected', 'unknown'].includes(value.outcome)
    ? value.outcome
    : 'unknown';
  const safe = {
    outcome,
    traceId: safeTraceId(value.traceId),
    code: String(value.code || (outcome === 'unknown' ? 'UNKNOWN' : '')).slice(0, 40),
    message: safeMessage(value.message, outcome === 'unknown' ? '無法確認綠界處理結果。' : '綠界拒絕開立。'),
  };
  if (outcome === 'issued') {
    safe.invoiceNo = String(value.invoiceNo || '').slice(0, 10);
    safe.invoiceDate = String(value.invoiceDate || '').slice(0, 20);
    safe.randomNumber = String(value.randomNumber || '').slice(0, 4);
  }
  return safe;
}

export async function issueEcpayInvoice_(requestValue, env, fetchImpl = fetch) {
  const request = requestValue || {};
  const traceId = safeTraceId(request.traceId);
  let secrets;
  let endpoint;
  try {
    secrets = resolveMerchantSecrets_(env, request.merchantProfile);
    endpoint = ENDPOINTS[String(env.ECPAY_ENVIRONMENT || '').trim()];
    if (!endpoint) throw new GatewayError(503, 'ecpay_not_configured', '綠界服務尚未完成設定。');
    const timestamp = Number.isFinite(Number(request.timestamp))
      ? Math.floor(Number(request.timestamp))
      : Math.floor(Date.now() / 1000);
    const encrypted = await encryptEcpayData_(
      pickInvoiceData(request.invoice, secrets.merchantId),
      secrets.hashKey,
      secrets.hashIv,
    );
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MerchantID: secrets.merchantId,
        RqHeader: { Timestamp: timestamp },
        Data: encrypted,
      }),
    });
    if (!response.ok) {
      return sanitizeEcpayResult_({ outcome: 'unknown', traceId, code: `HTTP_${response.status}` });
    }
    let envelope;
    try {
      envelope = await response.json();
    } catch (_error) {
      return sanitizeEcpayResult_({ outcome: 'unknown', traceId, code: 'INVALID_RESPONSE' });
    }
    if (Number(envelope.TransCode) !== 1) {
      return sanitizeEcpayResult_({
        outcome: 'rejected',
        traceId,
        code: `TRANS_${String(envelope.TransCode ?? '')}`,
        message: envelope.TransMsg,
      });
    }
    let data;
    try {
      data = await decryptEcpayData_(envelope.Data, secrets.hashKey, secrets.hashIv);
    } catch (_error) {
      return sanitizeEcpayResult_({ outcome: 'unknown', traceId, code: 'INVALID_ENCRYPTED_RESPONSE' });
    }
    if (Number(data.RtnCode) !== 1) {
      return sanitizeEcpayResult_({
        outcome: 'rejected',
        traceId,
        code: String(data.RtnCode ?? ''),
        message: data.RtnMsg,
      });
    }
    return sanitizeEcpayResult_({
      outcome: 'issued',
      traceId,
      code: String(data.RtnCode),
      message: data.RtnMsg,
      invoiceNo: data.InvoiceNo,
      invoiceDate: data.InvoiceDate,
      randomNumber: data.RandomNumber,
    });
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    return sanitizeEcpayResult_({ outcome: 'unknown', traceId, code: 'NETWORK_ERROR' });
  }
}
