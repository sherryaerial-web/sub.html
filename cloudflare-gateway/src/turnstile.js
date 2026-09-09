import { GatewayError, parseCsv } from './security.js';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile({
  token,
  expectedAction,
  remoteIp,
  secret,
  allowedHostnames,
  fetchImpl = fetch,
  idempotencyKey = crypto.randomUUID(),
}) {
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);
  form.set('idempotency_key', idempotencyKey);

  let response;
  let payload;
  try {
    response = await fetchImpl(new Request(SITEVERIFY_URL, { method: 'POST', body: form }));
    if (!response.ok) throw new Error('siteverify_http_error');
    payload = await response.json();
  } catch (_error) {
    throw new GatewayError(
      503,
      'turnstile_unavailable',
      '驗證服務暫時無法使用，請稍後再試。',
    );
  }

  const hostnames = parseCsv(allowedHostnames);
  if (
    !payload
    || payload.success !== true
    || !hostnames.includes(String(payload.hostname || ''))
    || String(payload.action || '') !== expectedAction
  ) {
    throw new GatewayError(403, 'turnstile_rejected', '驗證未通過，請重新操作。');
  }
  return { success: true };
}
