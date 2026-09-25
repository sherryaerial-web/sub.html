import { proxyLine } from './proxy.mjs';
const encoder = new TextEncoder();
const roles = ['ivy', 'tako'];
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const bytes64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
export async function sign(secret, message, format = 'url') {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const value = bytes64(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
  return format === 'base64' ? value : value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const hash = async value => bytes64(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
function equal(a, b) {
  if (typeof a !== 'string' || a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < b.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function deadline(targetDate) {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(targetDate || '')) return NaN;
  const midnight = Date.parse(targetDate.replaceAll('/', '-') + 'T00:00:00+08:00');
  // Tomorrow's midnight minus twenty minutes is tonight's 23:40.
  return midnight - 20 * 60000;
}
const run = (env, sql, ...values) => env.DB.prepare(sql).bind(...values).run();
const first = (env, sql, ...values) => env.DB.prepare(sql).bind(...values).first();

async function authenticate(raw, path, env, now) {
  let e; try { e = JSON.parse(raw); } catch { return null; }
  const secret = path.startsWith('/admin/') ? env.ADMIN_SECRET : env.DELIVERY_SECRET;
  if (!secret || secret.length < 32 || !Number.isSafeInteger(e.timestamp) || Math.abs(now - e.timestamp) > 300000 ||
      !/^[a-zA-Z0-9-]{16,80}$/.test(e.nonce || '') || typeof e.payload !== 'string') return null;
  if (!equal(e.signature, await sign(secret, `${e.timestamp}\n${e.nonce}\n${path}\n${e.payload}`))) return null;
  let payload; try { payload = JSON.parse(e.payload); } catch { return null; }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  await run(env, 'DELETE FROM nonces WHERE expires < ?', now);
  const result = await run(env, 'INSERT OR IGNORE INTO nonces(nonce,expires) VALUES(?,?)', e.nonce, now + 600000);
  return result.meta.changes ? { payload } : { replay: true };
}

async function binding(raw, request, env, now) {
  const signature = request.headers.get('x-line-signature');
  const verified = env.LINE_PROXY
    ? await proxyLine(env, 'verify', { raw, signature }).then(async r => r.ok && (await r.json()).valid === true)
    : env.LINE_CHANNEL_SECRET && equal(signature, await sign(env.LINE_CHANNEL_SECRET, raw, 'base64'));
  if (!verified) return json({ error: 'unauthorized' }, 401);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: 'invalid_json' }, 400); }
  if (!Array.isArray(body.events) || body.events.length > 100) return json({ error: 'invalid_events' }, 400);
  for (const event of body.events) {
    const match = /^綁定關課 ([a-f0-9]{32})$/.exec(event.message?.text?.trim() || '');
    if (event.type !== 'message' || event.message?.type !== 'text' || event.source?.type !== 'user' ||
        !/^U[a-f0-9]{32}$/.test(event.source?.userId || '') || !match) continue;
    // One SQL statement consumes the code and binds the role; unique user_id forbids double roles.
    await run(env, `UPDATE recipients SET user_id=?, bound_at=?, code_hash=NULL, code_expires=NULL
      WHERE user_id IS NULL AND code_hash=? AND code_expires>?
      AND NOT EXISTS(SELECT 1 FROM recipients WHERE user_id=?)`, event.source.userId, now, await hash(match[1]), now, event.source.userId);
  }
  // No names, ids, codes, or binding results disclosed to the webhook caller.
  return json({ ok: true });
}

export async function handle(request, env, deps = {}) {
  const now = (deps.now || Date.now)();
  const path = new URL(request.url).pathname;
  if (path === '/health' && request.method === 'GET') return json({ ok: true, service: 'closure-line-notifier', enabled: env.ENABLED === 'true' });
  if (request.method !== 'POST' || !['/closure', '/line-binding', '/admin/code', '/admin/revoke', '/admin/status'].includes(path)) return json({ error: 'not_found' }, 404);
  const raw = await request.text();
  if (encoder.encode(raw).length > 32768) return json({ error: 'too_large' }, 413);
  if (!env.DB) return json({ error: 'not_configured' }, 503);
  try {
    if (path === '/line-binding') return await binding(raw, request, env, now);
    const auth = await authenticate(raw, path, env, now);
    if (!auth) return json({ error: 'unauthorized' }, 401);
    if (auth.replay) return json({ error: 'replay' }, 409);
    const p = auth.payload;
    if (path === '/admin/status') {
      const { results } = await env.DB.prepare('SELECT role, user_id IS NOT NULL AS bound, bound_at FROM recipients ORDER BY role').all();
      const { results: deliveries } = await env.DB.prepare('SELECT id,role,status,attempts,last_error,conflict_reason,conflict_at,accepted_at FROM outbox ORDER BY expires DESC LIMIT 20').all();
      return json({ recipients: results, deliveries });
    }
    if (path === '/admin/code' || path === '/admin/revoke') {
      if (!roles.includes(p.role)) return json({ error: 'invalid_role' }, 422);
      if (path === '/admin/revoke') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM recipients WHERE role=?').bind(p.role),
          env.DB.prepare("UPDATE outbox SET status='revoked' WHERE role=? AND status='pending'").bind(p.role)
        ]);
        return json({ ok: true });
      }
      const code = crypto.randomUUID().replaceAll('-', '');
      const changed = await run(env, `INSERT INTO recipients(role,code_hash,code_expires) VALUES(?,?,?)
        ON CONFLICT(role) DO UPDATE SET code_hash=excluded.code_hash,code_expires=excluded.code_expires WHERE recipients.user_id IS NULL`, p.role, await hash(code), now + 1800000);
      return changed.meta.changes ? json({ code, expiresAt: now + 1800000 }) : json({ error: 'already_bound' }, 409);
    }
    if (env.ENABLED !== 'true') return json({ error: 'disabled' }, 503);
    const expires = deadline(p.targetDate);
    if (p.stage !== '22:30' || p.failedCount !== 0 || typeof p.content !== 'string' || !p.content.trim() || p.content.length > 5000 ||
        !Number.isFinite(expires) || now >= expires || now < expires - 70 * 60000) return json({ error: 'invalid_or_expired_copy' }, 422);
    const { results: recipients } = await env.DB.prepare('SELECT role,user_id FROM recipients WHERE user_id IS NOT NULL ORDER BY role').all();
    if (recipients.length !== 2) return json({ error: 'binding_required' }, 503);
    const prefix = `${p.targetDate}/22:30/`;
    // Transaction makes both enqueue operations atomic; each id also remains unique under concurrency.
    await env.DB.batch(recipients.map(r => env.DB.prepare(`INSERT OR IGNORE INTO outbox(id,role,user_id,content,retry_key,expires) VALUES(?,?,?,?,?,?)`)
      .bind(prefix + r.role, r.role, r.user_id, p.content, crypto.randomUUID(), expires)));
    let conflict = false;
    for (const r of recipients) {
      const existing = await first(env, 'SELECT content,user_id FROM outbox WHERE id=?', prefix + r.role);
      if (existing.content !== p.content || existing.user_id !== r.user_id) {
        conflict = true;
        await run(env, "UPDATE outbox SET conflict_reason='copy_or_recipient_changed',conflict_at=? WHERE id=?", now, prefix + r.role);
      }
    }
    if (conflict) return json({ error: 'copy_or_recipient_changed' }, 409);
    return json({ ok: true, queued: true }, 202);
  } catch {
    // Never return/log request bodies or LINE credentials.
    return json({ error: 'storage_unavailable' }, 503);
  }
}

export async function drain(env, deps = {}) {
  if (env.ENABLED !== 'true' || !env.DB || (!env.LINE_CHANNEL_ACCESS_TOKEN && !env.LINE_PROXY)) return;
  const clock = deps.now || Date.now;
  const fetchImpl = deps.fetchImpl || fetch;
  const now = clock();
  await run(env, "UPDATE outbox SET status='expired' WHERE status='pending' AND expires<=?", now);
  const { results } = await env.DB.prepare("SELECT * FROM outbox WHERE status='pending' AND next_at<=? AND lease_until<=? AND expires>? AND attempts<6 ORDER BY expires LIMIT 2").bind(now, now, now).all();
  for (const item of results) {
    const lease = crypto.randomUUID();
    const acquired = await run(env, `UPDATE outbox SET lease_until=?,lease_token=?,attempts=attempts+1 WHERE id=? AND status='pending' AND lease_until<=? AND expires>? AND next_at<=? AND attempts=? AND attempts<6`, clock() + 120000, lease, item.id, clock(), clock(), clock(), item.attempts);
    if (!acquired.meta.changes) continue;
    const recipient = await first(env, 'SELECT user_id FROM recipients WHERE role=?', item.role);
    let status = 'pending', error = null, wait = 60000 * 2 ** item.attempts;
    if (recipient?.user_id !== item.user_id) { status = 'revoked'; }
    else if (clock() >= item.expires) { status = 'expired'; }
    else {
      try {
        const response = env.LINE_PROXY ? await proxyLine(env, 'push', { to: item.user_id, text: item.content, retryKey: item.retry_key, expires: item.expires }) : await fetchImpl('https://api.line.me/v2/bot/message/push', {
          method: 'POST', signal: AbortSignal.timeout(10000),
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`, 'X-Line-Retry-Key': item.retry_key },
          body: JSON.stringify({ to: item.user_id, messages: [{ type: 'text', text: item.content }] })
        });
        if (response.ok || (response.status === 409 && response.headers.get('x-line-accepted-request-id'))) status = 'accepted';
        else {
          error = `line_http_${response.status}`;
          if (response.status !== 429 && response.status < 500) status = 'failed';
          if (response.status === 429) {
            const retry = response.headers.get('retry-after');
            const delay = /^\d+$/.test(retry || '') ? Number(retry) * 1000 : Date.parse(retry) - clock();
            if (Number.isFinite(delay)) wait = Math.max(wait, delay);
          }
        }
      } catch { error = 'line_transport_error'; }
    }
    if (status === 'pending' && item.attempts + 1 >= 6) status = 'failed';
    await run(env, `UPDATE outbox SET status=?,last_error=?,next_at=?,lease_until=0,lease_token=NULL,accepted_at=? WHERE id=? AND lease_token=?`,
      status, error, clock() + wait, status === 'accepted' ? clock() : null, item.id, lease);
  }
}

export default {
  async fetch(request, env, ctx) {
    const response = await handle(request, env);
    if (response.status === 202) ctx.waitUntil(drain(env));
    return response;
  },
  async scheduled(_event, env) { await drain(env); }
};
