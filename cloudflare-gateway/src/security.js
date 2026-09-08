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

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return bytesToBase64Url(new Uint8Array(digest));
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
