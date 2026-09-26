const NONCE_TTL_MS = 10 * 60 * 1000;

export class InvoiceRequestGuard {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/claim') {
      return new Response(null, { status: 404 });
    }
    let body;
    try {
      body = await request.json();
    } catch (_error) {
      return new Response(null, { status: 400 });
    }
    const nonce = typeof body.nonce === 'string' ? body.nonce : '';
    const nowMs = Number.isFinite(Number(body.nowMs)) ? Math.floor(Number(body.nowMs)) : Date.now();
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) return new Response(null, { status: 400 });
    const key = `nonce:${nonce}`;
    const claimed = await this.state.storage.transaction(async (transaction) => {
      const existingExpiry = Number(await transaction.get(key) || 0);
      if (existingExpiry > nowMs) return false;
      await transaction.put(key, nowMs + NONCE_TTL_MS);
      return true;
    });
    if (!claimed) return new Response(null, { status: 409 });
    await this.state.storage.setAlarm(nowMs + NONCE_TTL_MS);
    return new Response(null, { status: 200 });
  }

  async alarm() {
    const nowMs = Date.now();
    const entries = await this.state.storage.list({ prefix: 'nonce:' });
    const expiredKeys = [];
    for (const [key, expiry] of entries) {
      if (Number(expiry) <= nowMs) expiredKeys.push(key);
    }
    if (expiredKeys.length) await this.state.storage.delete(expiredKeys);
    if (entries.size > expiredKeys.length) await this.state.storage.setAlarm(nowMs + NONCE_TTL_MS);
  }
}
