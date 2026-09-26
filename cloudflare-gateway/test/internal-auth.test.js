import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import {
  signInternalInvoiceRequest,
  verifyInternalInvoiceRequest,
} from '../src/internal-auth.js';
import { InvoiceRequestGuard } from '../src/invoice-request-guard.js';

const SECRET = 'invoice-gateway-secret-for-tests-1234567890';

function invoiceBody(extra = {}) {
  return {
    merchantProfile: 'primary',
    invoice: {
      relateNumber: '20260926001',
      customerEmail: 'student@example.com',
      customerIdentifier: '',
      customerName: '學生',
      customerAddress: '',
      salesAmount: 3000,
      invoiceKind: 'personal',
      items: [{
        itemSeq: 1,
        itemName: '十堂課卡',
        itemCount: 1,
        itemWord: '張',
        itemPrice: 3000,
        itemAmount: 3000,
      }],
    },
    ...extra,
  };
}

async function signedRequest(body = invoiceBody(), options = {}) {
  const timestamp = String(options.timestamp ?? 1_800_000_000);
  const nonce = options.nonce || 'nonce-unique-1234567890';
  const signature = await signInternalInvoiceRequest({
    body,
    timestamp,
    nonce,
    secret: options.secret || SECRET,
  });
  return new Request('https://gateway.test/internal/ecpay/invoices/issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sherry-Version': options.version || 'v1',
      'X-Sherry-Timestamp': timestamp,
      'X-Sherry-Nonce': nonce,
      'X-Sherry-Signature': options.signature || signature,
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });
}

test('internal invoice authentication accepts the fixed canonical contract and strips unknown fields', async () => {
  const request = await signedRequest(invoiceBody({ ignoredTopLevel: 'secret-looking-value' }));

  const result = await verifyInternalInvoiceRequest(request, invoiceBody({
    ignoredTopLevel: 'secret-looking-value',
  }), SECRET, { nowSeconds: 1_800_000_100 });

  assert.equal(result.merchantProfile, 'primary');
  assert.equal(result.invoice.relateNumber, '20260926001');
  assert.equal(result.ignoredTopLevel, undefined);
  assert.deepEqual(Object.keys(result.invoice).sort(), [
    'customerAddress', 'customerEmail', 'customerIdentifier', 'customerName',
    'invoiceKind', 'items', 'relateNumber', 'salesAmount',
  ]);
  assert.deepEqual(Object.keys(result.invoice.items[0]).sort(), [
    'itemAmount', 'itemCount', 'itemName', 'itemPrice', 'itemSeq', 'itemWord',
  ]);
});

test('internal invoice authentication rejects missing headers invalid HMAC and out-of-window timestamps', async () => {
  const cases = [
    {
      request: await signedRequest(invoiceBody(), {
        headers: { 'X-Sherry-Signature': '' },
      }),
      code: 'internal_auth_missing',
    },
    {
      request: await signedRequest(invoiceBody(), { signature: 'invalid-signature' }),
      code: 'internal_auth_invalid',
    },
    {
      request: await signedRequest(invoiceBody(), { timestamp: 1_799_999_699 }),
      code: 'internal_auth_expired',
    },
    {
      request: await signedRequest(invoiceBody(), { timestamp: 1_800_000_301 }),
      code: 'internal_auth_expired',
    },
  ];

  for (const item of cases) {
    await assert.rejects(
      verifyInternalInvoiceRequest(item.request, invoiceBody(), SECRET, {
        nowSeconds: 1_800_000_000,
      }),
      (error) => error.code === item.code,
    );
  }
});

function createMemoryStorage() {
  const values = new Map();
  let alarm = null;
  let transactionTail = Promise.resolve();
  return {
    async transaction(callback) {
      let release;
      const previous = transactionTail;
      transactionTail = new Promise((resolve) => { release = resolve; });
      await previous;
      try {
        return await callback({
          get: async (key) => values.get(key),
          put: async (key, value) => values.set(key, value),
        });
      } finally {
        release();
      }
    },
    async list() { return new Map(values); },
    async delete(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) values.delete(key);
    },
    async setAlarm(value) { alarm = value; },
    get alarm() { return alarm; },
  };
}

test('replay guard atomically accepts one nonce and rejects its replay', async () => {
  const storage = createMemoryStorage();
  const guard = new InvoiceRequestGuard({ storage }, {});
  const request = () => new Request('https://guard.test/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: 'nonce-replay-123456', nowMs: 1000 }),
  });

  const [first, second] = await Promise.all([guard.fetch(request()), guard.fetch(request())]);

  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
  assert.equal(storage.alarm, 601000);
});

function createGuardBinding() {
  const claimed = new Set();
  return {
    idFromName(name) { return name; },
    get() {
      return {
        async fetch(_url, init) {
          const { nonce } = JSON.parse(init.body);
          if (claimed.has(nonce)) return new Response(null, { status: 409 });
          claimed.add(nonce);
          return new Response(null, { status: 200 });
        },
      };
    },
  };
}

test('internal invoice route bypasses browser controls but rejects replay without leaking request data', async () => {
  let publicLimitCalls = 0;
  const env = {
    INVOICE_GATEWAY_SECRET: SECRET,
    INVOICE_REQUEST_GUARD: createGuardBinding(),
    PUBLIC_WRITE_LIMITER: { async limit() { publicLimitCalls += 1; return { success: true }; } },
    PUBLIC_READ_LIMITER: { async limit() { publicLimitCalls += 1; return { success: true }; } },
    nowSeconds: 1_800_000_000,
  };
  const first = await worker.fetch(await signedRequest(), env, {});
  const replay = await worker.fetch(await signedRequest(), env, {});
  const replayText = await replay.text();

  assert.equal(first.status, 501);
  assert.equal(replay.status, 409);
  assert.equal(publicLimitCalls, 0);
  assert.equal(first.headers.get('Access-Control-Allow-Origin'), null);
  assert.match(replayText, /internal_replay/);
  assert.doesNotMatch(replayText, /invoice-gateway-secret|student@example\.com|X-Sherry-Signature/);
});
