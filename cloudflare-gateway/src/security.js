export class GatewayError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
  }
}

export function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('資料包含無法簽章的數值。');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => {
      if (typeof value[key] === 'undefined') throw new Error('資料包含無法簽章的欄位。');
      return `${JSON.stringify(key)}:${canonicalJson(value[key])}`;
    }).join(',')}}`;
  }
  throw new Error('資料包含無法簽章的內容。');
}

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function signGatewayRequest({ action, payload, timestamp, nonce, secret }) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new GatewayError(503, 'gateway_not_configured', '服務尚未完成設定。');
  }
  const version = 'v1';
  const canonicalPayload = canonicalJson(payload);
  const payloadSha256 = await sha256Base64Url(canonicalPayload);
  const signingInput = [version, action, timestamp, nonce, payloadSha256].join('\n');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput),
  );
  return {
    version,
    timestamp,
    nonce,
    canonicalPayload,
    payloadSha256,
    signingInput,
    signature: bytesToBase64Url(new Uint8Array(signatureBytes)),
  };
}

export async function buildRateLimitKey(route, body, remoteIp) {
  let identity = 'anonymous';
  if (route.action === 'submitStudentPractice') {
    const practice = body && body.practice && typeof body.practice === 'object'
      ? body.practice
      : {};
    const studentToken = String(practice.studentToken || '').trim();
    if (studentToken) {
      identity = `student-token:${studentToken}`;
    } else {
      const email = String(practice.email || '').trim().toLowerCase();
      identity = `student-email:${email}|network:${String(remoteIp || '').trim()}`;
    }
  } else if (route.action === 'getVvipSelection' || route.action === 'submitVvipSelection') {
    identity = `vvip:${String(body && body.vvipId || '').trim()}`;
  } else {
    identity = `network:${String(remoteIp || '').trim()}`;
  }
  return `${route.path}:${await sha256Base64Url(identity)}`;
}

export function validateOrigin(request, allowedOrigins) {
  const origin = request.headers.get('Origin') || '';
  if (!origin || !parseCsv(allowedOrigins).includes(origin)) {
    throw new GatewayError(403, 'origin_not_allowed', '此來源無法使用服務。');
  }
  return origin;
}

export function corsHeaders(origin, method) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': method,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export async function readJsonBody(request, maxBodyBytes) {
  const contentType = request.headers.get('Content-Type') || '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new GatewayError(415, 'invalid_content_type', '請使用 JSON 格式送出。');
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > maxBodyBytes) {
    throw new GatewayError(413, 'body_too_large', '送出的資料過大。');
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBodyBytes) {
    throw new GatewayError(413, 'body_too_large', '送出的資料過大。');
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch (_error) {
    throw new GatewayError(400, 'invalid_json', '送出的資料格式錯誤。');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new GatewayError(400, 'invalid_json', '送出的資料格式錯誤。');
  }
  return value;
}
