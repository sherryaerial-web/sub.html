import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handle, drain, sign } from '../src/index.mjs';

const START = Date.parse('2026-09-26T22:34:00+08:00');
const users = ['U' + '1'.repeat(32), 'U' + '2'.repeat(32)];
function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  function prepare(query) {
    let params = [];
    const s = { bind(...v) { params = v; return s; },
      async first() { return sql.prepare(query).get(...params) || null; },
      async all() { return { results: sql.prepare(query).all(...params) }; },
      async run() { const r = sql.prepare(query).run(...params); return { meta: { changes: Number(r.changes) } }; } };
    return s;
  }
  const env = { DB: { prepare, async batch(items) {
    sql.exec('BEGIN'); try { const r = []; for (const item of items) r.push(await item.run()); sql.exec('COMMIT'); return r; }
    catch (e) { sql.exec('ROLLBACK'); throw e; }
  } }, ENABLED: 'true', ADMIN_SECRET: 'a'.repeat(40), DELIVERY_SECRET: 'd'.repeat(40), LINE_CHANNEL_SECRET: 's'.repeat(32), LINE_CHANNEL_ACCESS_TOKEN: 'fake-token' };
  let now = START;
  const calls = [];
  const deps = { now: () => now, fetchImpl: async (url, options) => { calls.push({ url, ...options }); return new Response('{}', { status: 200 }); } };
  async function request(path, payload, { secret = path.startsWith('/admin/') ? env.ADMIN_SECRET : env.DELIVERY_SECRET, nonce = crypto.randomUUID(), timestamp = now } = {}) {
    const content = JSON.stringify(payload);
    const signature = await sign(secret, `${timestamp}\n${nonce}\n${path}\n${content}`);
    return handle(new Request('https://notify.test' + path, { method: 'POST', body: JSON.stringify({ timestamp, nonce, payload: content, signature }) }), env, deps);
  }
  async function bind(role, userId, codeOverride) {
    const r = await request('/admin/code', { role });
    const { code } = await r.json();
    const body = JSON.stringify({ events: [{ type: 'message', webhookEventId: crypto.randomUUID(), source: { type: 'user', userId }, message: { type: 'text', text: `綁定關課 ${codeOverride || code}` } }] });
    const signature = await sign(env.LINE_CHANNEL_SECRET, body, 'base64');
    return handle(new Request('https://notify.test/line-binding', { method: 'POST', headers: { 'x-line-signature': signature }, body }), env, deps);
  }
  return { env, sql, deps, calls, request, bind, time(v) { now = v; } };
}
const payload = { targetDate: '2026/09/27', stage: '22:30', content: '明10:30劍潭Melody空瑜缺二\n等到23:40', failedCount: 0 };

test('two privately bound roles receive exact copy once, including concurrent drains', async () => {
  const f = fixture();
  await f.bind('ivy', users[0]); await f.bind('tako', users[1]);
  assert.equal((await f.request('/closure', payload)).status, 202);
  await Promise.all([drain(f.env, f.deps), drain(f.env, f.deps)]);
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.calls.map(c => JSON.parse(c.body).to).sort(), users);
  assert.ok(f.calls.every(c => JSON.parse(c.body).messages[0].text === payload.content));
  assert.equal((await f.request('/closure', payload)).status, 202);
  await drain(f.env, f.deps);
  assert.equal(f.calls.length, 2);
  assert.equal((await f.request('/closure', { ...payload, content: 'changed' })).status, 409);
  const report=await (await f.request('/admin/status',{})).json();
  assert.ok(report.deliveries.every(r=>r.conflict_reason==='copy_or_recipient_changed' && r.conflict_at===START));
});

test('stale concurrent drain snapshot cannot bypass Retry-After or increment attempts again', async () => {
  const f=fixture(); await f.bind('ivy',users[0]); await f.bind('tako',users[1]); await f.request('/closure',payload);
  let snapshotCount=0, releaseFirst, releaseSecond;
  const bothRead=new Promise(resolve=>{releaseFirst=resolve;});
  const firstFinished=new Promise(resolve=>{releaseSecond=resolve;});
  const prepare=f.env.DB.prepare;
  f.env.DB.prepare=query=>{
    const stmt=prepare(query);
    if(query.startsWith('SELECT * FROM outbox')) {
      const all=stmt.all;
      stmt.all=async()=>{const rows=await all();snapshotCount++;
        if(snapshotCount===1) await bothRead;
        else {releaseFirst();await firstFinished;}
        return rows;
      };
    }
    return stmt;
  };
  const calls=[];
  f.deps.fetchImpl=async(_url,options)=>{calls.push(options);return new Response('{}',{status:429,headers:{'retry-after':'120'}});};
  const one=drain(f.env,f.deps).finally(()=>releaseSecond());
  const two=drain(f.env,f.deps);
  await Promise.all([one,two]);
  assert.equal(calls.length,2);
  assert.deepEqual(f.sql.prepare('select attempts from outbox').all().map(r=>r.attempts),[1,1]);
});

test('authentication rejects bad signature, stale timestamp and replay before writes', async () => {
  const f = fixture();
  assert.equal((await f.request('/admin/code', { role: 'ivy' }, { secret: f.env.DELIVERY_SECRET })).status, 401);
  assert.equal((await f.request('/admin/code', { role: 'ivy' }, { timestamp: START - 301000 })).status, 401);
  const nonce = crypto.randomUUID();
  assert.equal((await f.request('/admin/code', { role: 'ivy' }, { nonce })).status, 200);
  assert.equal((await f.request('/admin/code', { role: 'ivy' }, { nonce })).status, 409);
  assert.equal(f.sql.prepare('select count(*) n from recipients').get().n, 1);
});

test('binding is one-use and cannot replace existing recipient; unbound delivery waits', async () => {
  const f = fixture();
  assert.equal((await f.request('/closure', payload)).status, 503);
  await f.bind('ivy', users[0]);
  assert.equal((await f.request('/admin/code', { role: 'ivy' })).status, 409);
  await f.bind('tako', users[0]);
  assert.equal(f.sql.prepare('select count(*) n from recipients where user_id is not null').get().n, 1);
  assert.equal((await f.request('/closure', payload)).status, 503);
});

test('LINE webhook rejects forgery, group binding, expired code and replay', async () => {
  const f = fixture();
  const { code } = await (await f.request('/admin/code', { role: 'ivy' })).json();
  async function send(source, signatureOverride) {
    const body = JSON.stringify({ events: [{ type: 'message', source, message: { type: 'text', text: '綁定關課 ' + code } }] });
    return handle(new Request('https://notify.test/line-binding', { method: 'POST', headers: { 'x-line-signature': signatureOverride || await sign(f.env.LINE_CHANNEL_SECRET, body, 'base64') }, body }), f.env, f.deps);
  }
  assert.equal((await send({ type: 'user', userId: users[0] }, 'forged')).status, 401);
  await send({ type: 'group', userId: users[0] });
  assert.equal(f.sql.prepare('select user_id from recipients').get().user_id, null);
  f.time(START + 1800001);
  await send({ type: 'user', userId: users[0] });
  assert.equal(f.sql.prepare('select user_id from recipients').get().user_id, null);
});

test('accepted but timed out uses unchanged body and retry key; other recipient not resent', async () => {
  const f = fixture(); await f.bind('ivy', users[0]); await f.bind('tako', users[1]);
  await f.request('/closure', payload);
  const calls = []; let first = true;
  f.deps.fetchImpl = async (url, opts) => {
    calls.push(opts);
    if (JSON.parse(opts.body).to === users[0]) {
      if (first) { first = false; throw new Error('timeout'); }
      return new Response('{}', { status: 409, headers: { 'x-line-accepted-request-id': 'accepted-id' } });
    }
    return new Response('{}');
  };
  await drain(f.env, f.deps);
  f.time(START + 61000); await drain(f.env, f.deps);
  assert.equal(calls.length, 3);
  const retry = calls.filter(c => JSON.parse(c.body).to === users[0]);
  assert.equal(retry[0].body, retry[1].body);
  assert.equal(retry[0].headers['X-Line-Retry-Key'], retry[1].headers['X-Line-Retry-Key']);
  assert.equal(f.sql.prepare("select count(*) n from outbox where status='accepted'").get().n, 2);
});

test('disabled, empty, failed closure, wrong stage/date and expired copy do not send', async () => {
  const f = fixture(); await f.bind('ivy', users[0]); await f.bind('tako', users[1]);
  for (const invalid of [{ ...payload, content: '' }, { ...payload, stage: '23:40' }, { ...payload, failedCount: 1 }, { ...payload, targetDate: '2026/09/26' }]) {
    assert.equal((await f.request('/closure', invalid)).status, 422);
  }
  f.env.ENABLED = 'false'; assert.equal((await f.request('/closure', payload)).status, 503);
  f.env.ENABLED = 'true'; await f.request('/closure', payload);
  f.time(Date.parse('2026-09-26T23:40:00+08:00'));
  await drain(f.env, f.deps);
  assert.equal(f.calls.length, 0);
  assert.equal((await f.request('/closure', payload)).status, 422);
});

test('permanent errors stop, 429 retries are delayed and bounded', async () => {
  const f = fixture(); await f.bind('ivy', users[0]); await f.bind('tako', users[1]); await f.request('/closure', payload);
  const calls = [];
  f.deps.fetchImpl = async (_url, opts) => { calls.push(opts); return new Response('{}', { status: JSON.parse(opts.body).to === users[0] ? 400 : 429, headers: { 'retry-after': '120' } }); };
  await drain(f.env, f.deps); f.time(START + 61000); await drain(f.env, f.deps);
  assert.equal(calls.length, 2);
  f.time(START + 121000); await drain(f.env, f.deps);
  assert.equal(calls.length, 3);
  assert.equal(f.sql.prepare("select status from outbox where role='ivy'").get().status, 'failed');
});
