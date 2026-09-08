import { GatewayError, signGatewayRequest } from './security.js';

function appendLegacyFields(form, payload) {
  if (payload.practice) form.set('practice', JSON.stringify(payload.practice));
  if (payload.vvipId) form.set('vvipId', String(payload.vvipId));
  if (Array.isArray(payload.calendarIds)) {
    form.set('calendarIds', JSON.stringify(payload.calendarIds));
  }
}

function safeUpstreamMessage(value) {
  const message = String(value || '').trim().slice(0, 240);
  return message || '系統暫時無法完成操作，請稍後再試。';
}

async function parseGasResponse(response) {
  if (!response.ok) {
    throw new GatewayError(503, 'upstream_unavailable', '系統暫時忙碌，請稍後再試。');
  }
  let payload;
  try {
    payload = await response.json();
  } catch (_error) {
    throw new GatewayError(503, 'upstream_unavailable', '系統暫時忙碌，請稍後再試。');
  }
  if (!payload || payload.status !== 'success') {
    throw new GatewayError(400, 'upstream_rejected', safeUpstreamMessage(payload && payload.message));
  }
  return payload.data;
}

export async function callGas({
  action,
  payload,
  env,
  fetchImpl = fetch,
  now = Date.now,
  nonceFactory = () => crypto.randomUUID(),
  timeoutMs = 8000,
}) {
  if (!env || typeof env.GAS_UPSTREAM_URL !== 'string' || !env.GAS_UPSTREAM_URL.trim()) {
    throw new GatewayError(503, 'gateway_not_configured', '服務尚未完成設定。');
  }

  let request;
  if (action === 'getStudentPracticeAvailability') {
    const url = new URL(env.GAS_UPSTREAM_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('date', String(payload.date || ''));
    request = new Request(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    });
  } else {
    const timestamp = Math.floor(now() / 1000);
    const nonce = nonceFactory();
    const signed = await signGatewayRequest({
      action,
      payload,
      timestamp,
      nonce,
      secret: env.GAS_GATEWAY_SECRET,
    });
    const form = new URLSearchParams({
      action,
      gatewayVersion: signed.version,
      gatewayTimestamp: String(signed.timestamp),
      gatewayNonce: signed.nonce,
      gatewayPayloadSha256: signed.payloadSha256,
      gatewaySignature: signed.signature,
      gatewayPayload: signed.canonicalPayload,
    });
    appendLegacyFields(form, payload);
    request = new Request(env.GAS_UPSTREAM_URL, {
      method: 'POST',
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: form.toString(),
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(new Request(request, { signal: controller.signal }));
  } catch (_error) {
    throw new GatewayError(503, 'upstream_unavailable', '系統暫時忙碌，請稍後再試。');
  } finally {
    clearTimeout(timer);
  }
  return parseGasResponse(response);
}
