import {
  bytesToBase64Url,
  canonicalJson,
  GatewayError,
  sha256Base64Url,
} from './security.js';

const INTERNAL_ACTION = 'issueEcpayInvoice';
const INTERNAL_VERSION = 'v1';
const MAX_CLOCK_SKEW_SECONDS = 300;

function header(request, name) {
  return String(request.headers.get(name) || '').trim();
}

function base64UrlToBytes(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch (_error) {
    return null;
  }
}

async function importHmacKey(secret, usages) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

async function signingInput({ body, timestamp, nonce }) {
  const digest = await sha256Base64Url(canonicalJson(body));
  return [INTERNAL_VERSION, INTERNAL_ACTION, timestamp, nonce, digest].join('\n');
}

export async function signInternalInvoiceRequest({ body, timestamp, nonce, secret }) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new GatewayError(503, 'internal_auth_not_configured', '內部服務尚未完成設定。');
  }
  const input = await signingInput({ body, timestamp: String(timestamp), nonce: String(nonce) });
  const key = await importHmacKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return bytesToBase64Url(new Uint8Array(signature));
}

function copyString(value, maximum = 200) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > maximum) {
    throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
  }
  return text;
}

function copyInteger(value, minimum = 0) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
  }
  return number;
}

export function sanitizeInternalInvoicePayload(body) {
  const value = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const profile = copyString(value.merchantProfile, 20);
  if (!['primary', 'secondary'].includes(profile)) {
    throw new GatewayError(400, 'invalid_merchant_profile', '開票帳號不正確。');
  }
  const source = value.invoice && typeof value.invoice === 'object' && !Array.isArray(value.invoice)
    ? value.invoice
    : null;
  if (!source || !Array.isArray(source.items) || source.items.length < 1 || source.items.length > 100) {
    throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
  }
  const invoiceKind = copyString(source.invoiceKind, 20);
  if (!['personal', 'business'].includes(invoiceKind)) {
    throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
  }
  return {
    merchantProfile: profile,
    invoice: {
      relateNumber: copyString(source.relateNumber, 30),
      customerEmail: copyString(source.customerEmail, 200),
      customerIdentifier: copyString(source.customerIdentifier, 8),
      customerName: copyString(source.customerName, 60),
      customerAddress: copyString(source.customerAddress, 200),
      salesAmount: copyInteger(source.salesAmount, 0),
      invoiceKind,
      items: source.items.map((item) => ({
        itemSeq: copyInteger(item && item.itemSeq, 1),
        itemName: copyString(item && item.itemName, 100),
        itemCount: copyInteger(item && item.itemCount, 1),
        itemWord: copyString(item && item.itemWord, 20),
        itemPrice: copyInteger(item && item.itemPrice, 0),
        itemAmount: copyInteger(item && item.itemAmount, 0),
      })),
    },
  };
}

export async function verifyInternalInvoiceRequest(request, body, secret, options = {}) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new GatewayError(503, 'internal_auth_not_configured', '內部服務尚未完成設定。');
  }
  const version = header(request, 'X-Sherry-Version');
  const timestamp = header(request, 'X-Sherry-Timestamp');
  const nonce = header(request, 'X-Sherry-Nonce');
  const signature = header(request, 'X-Sherry-Signature');
  if (!version || !timestamp || !nonce || !signature) {
    throw new GatewayError(401, 'internal_auth_missing', '內部驗證資料不完整。');
  }
  if (version !== INTERNAL_VERSION || !/^\d{10}$/.test(timestamp)
    || !/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) {
    throw new GatewayError(401, 'internal_auth_invalid', '內部驗證失敗。');
  }
  const nowSeconds = Number.isFinite(Number(options.nowSeconds))
    ? Math.floor(Number(options.nowSeconds))
    : Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) {
    throw new GatewayError(401, 'internal_auth_expired', '內部請求已逾時。');
  }
  const received = base64UrlToBytes(signature);
  if (!received) throw new GatewayError(401, 'internal_auth_invalid', '內部驗證失敗。');
  const key = await importHmacKey(secret, ['verify']);
  const input = await signingInput({ body, timestamp, nonce });
  const valid = await crypto.subtle.verify('HMAC', key, received, new TextEncoder().encode(input));
  if (!valid) throw new GatewayError(401, 'internal_auth_invalid', '內部驗證失敗。');
  return sanitizeInternalInvoicePayload(body);
}

export function getInternalInvoiceNonce(request) {
  return header(request, 'X-Sherry-Nonce');
}
