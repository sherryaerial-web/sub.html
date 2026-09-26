import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import {
  sanitizeInternalInvoicePayload,
  signInternalInvoiceRequest,
  verifyInternalInvoiceRequest,
} from '../src/internal-auth.js';
import { InvoiceRequestGuard } from '../src/invoice-request-guard.js';

const SECRET = 'invoice-gateway-secret-for-tests-1234567890';

function invoiceBody(extra = {}) {
  return {
    merchantProfile: 'primary',
    invoice: {
      RelateNumber: '20260926001',
      CustomerIdentifier: '',
      CustomerName: '學生',
      CustomerAddr: '',
      CustomerPhone: '',
      CustomerEmail: 'student@example.com',
      Print: '0',
      Donation: '0',
      LoveCode: '',
      CarrierType: '',
      CarrierNum: '',
      TaxType: '1',
      SalesAmount: 3000,
      InvoiceRemark: '',
      InvType: '07',
      vat: '1',
      Items: [{
        ItemSeq: 1,
        ItemName: '十堂課卡',
        ItemCount: 1,
        ItemWord: '張',
        ItemPrice: 3000,
        ItemAmount: 3000,
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
  assert.equal(result.invoice.RelateNumber, '20260926001');
  assert.equal(result.ignoredTopLevel, undefined);
  assert.deepEqual(Object.keys(result.invoice).sort(), [
    'CarrierNum', 'CarrierType', 'CustomerAddr', 'CustomerEmail', 'CustomerIdentifier',
    'CustomerName', 'CustomerPhone', 'Donation', 'InvType', 'InvoiceRemark', 'Items',
    'LoveCode', 'Print', 'RelateNumber', 'SalesAmount', 'TaxType', 'vat',
  ]);
  assert.deepEqual(Object.keys(result.invoice.Items[0]).sort(), [
    'ItemAmount', 'ItemCount', 'ItemName', 'ItemPrice', 'ItemSeq', 'ItemWord',
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

test('internal invoice payload rejects invalid tax flags identity fields and amount totals', () => {
  const valid = invoiceBody();
  const invalidInvoices = [
    { ...valid.invoice, TaxType: '2' },
    { ...valid.invoice, Donation: '1' },
    { ...valid.invoice, CustomerEmail: 'not-an-email' },
    { ...valid.invoice, SalesAmount: 2999 },
    { ...valid.invoice, CustomerIdentifier: '12345678', Print: '0' },
    { ...valid.invoice, CustomerIdentifier: '12345678', Print: '1', CustomerAddr: '' },
  ];

  for (const invoice of invalidInvoices) {
    assert.throws(
      () => sanitizeInternalInvoicePayload({ merchantProfile: 'primary', invoice }),
      /發票資料格式錯誤/,
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
    ECPAY_ENVIRONMENT: 'stage',
    ECPAY_PRIMARY_MERCHANT_ID: '2000132',
    ECPAY_PRIMARY_HASH_KEY: 'ejCk326UnaZWKisg',
    ECPAY_PRIMARY_HASH_IV: 'q9jcZX8Ib9LM8wYk',
    PUBLIC_WRITE_LIMITER: { async limit() { publicLimitCalls += 1; return { success: true }; } },
    PUBLIC_READ_LIMITER: { async limit() { publicLimitCalls += 1; return { success: true }; } },
    fetch: async () => new Response('not-json', { status: 200 }),
    nowSeconds: 1_800_000_000,
  };
  const first = await worker.fetch(await signedRequest(), env, {});
  const replay = await worker.fetch(await signedRequest(), env, {});
  const replayText = await replay.text();

  assert.equal(first.status, 502);
  assert.equal(replay.status, 409);
  assert.equal(publicLimitCalls, 0);
  assert.equal(first.headers.get('Access-Control-Allow-Origin'), null);
  assert.match(replayText, /internal_replay/);
  assert.doesNotMatch(replayText, /invoice-gateway-secret|student@example\.com|X-Sherry-Signature/);
});
