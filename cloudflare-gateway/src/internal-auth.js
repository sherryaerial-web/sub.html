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

function isValidTaiwanBusinessNumber(value) {
  const identifier = String(value || '');
  if (!/^\d{8}$/.test(identifier) || /^0{8}$/.test(identifier)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const total = [...identifier].reduce((sum, character, index) => {
    const product = Number(character) * weights[index];
    return sum + Math.floor(product / 10) + (product % 10);
  }, 0);
  if (total % 5 === 0) return true;
  return identifier[6] === '7' && (total - 1) % 5 === 0;
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
  if (!source || !Array.isArray(source.Items) || source.Items.length < 1 || source.Items.length > 100) {
    throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
  }
  const invoice = {
    RelateNumber: copyString(source.RelateNumber, 30),
    CustomerIdentifier: copyString(source.CustomerIdentifier, 8),
    CustomerName: copyString(source.CustomerName, 60),
    CustomerAddr: copyString(source.CustomerAddr, 100),
    CustomerPhone: copyString(source.CustomerPhone, 20),
    CustomerEmail: copyString(source.CustomerEmail, 80),
    Print: copyString(source.Print, 1),
    Donation: copyString(source.Donation, 1),
    LoveCode: copyString(source.LoveCode, 7),
    CarrierType: copyString(source.CarrierType, 1),
    CarrierNum: copyString(source.CarrierNum, 64),
    TaxType: copyString(source.TaxType, 1),
    SalesAmount: copyInteger(source.SalesAmount, 0),
    InvoiceRemark: copyString(source.InvoiceRemark, 200),
    InvType: copyString(source.InvType, 2),
    vat: copyString(source.vat, 1),
    Items: source.Items.map((item) => ({
      ItemSeq: copyInteger(item && item.ItemSeq, 1),
      ItemName: copyString(item && item.ItemName, 100),
      ItemCount: copyInteger(item && item.ItemCount, 1),
      ItemWord: copyString(item && item.ItemWord, 6),
      ItemPrice: copyInteger(item && item.ItemPrice, 0),
      ItemAmount: copyInteger(item && item.ItemAmount, 0),
    })),
  };
  const identifierValid = invoice.CustomerIdentifier === ''
    || isValidTaiwanBusinessNumber(invoice.CustomerIdentifier);
  const businessFieldsValid = invoice.CustomerIdentifier === ''
    ? invoice.Print === '0'
    : invoice.Print === '1' && Boolean(invoice.CustomerName) && Boolean(invoice.CustomerAddr);
  const itemTotal = invoice.Items.reduce((total, item, index) => {
    if (item.ItemSeq !== index + 1 || !item.ItemName || !item.ItemWord
      || item.ItemPrice * item.ItemCount !== item.ItemAmount) {
      throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
    }
    return total + item.ItemAmount;
  }, 0);
  if (!/^[A-Za-z0-9]{1,30}$/.test(invoice.RelateNumber)
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.CustomerEmail)
    || !identifierValid
    || !businessFieldsValid
    || invoice.Donation !== '0'
    || invoice.LoveCode !== ''
    || invoice.CarrierType !== ''
    || invoice.CarrierNum !== ''
    || invoice.TaxType !== '1'
    || invoice.InvType !== '07'
    || invoice.vat !== '1'
    || itemTotal !== invoice.SalesAmount) {
    throw new GatewayError(400, 'invalid_invoice_payload', '發票資料格式錯誤。');
  }
  return { merchantProfile: profile, invoice };
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
