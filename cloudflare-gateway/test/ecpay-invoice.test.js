import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decryptEcpayData_,
  encryptEcpayData_,
  issueEcpayInvoice_,
  resolveMerchantSecrets_,
} from '../src/ecpay-invoice.js';

const TEST_KEY = 'ejCk326UnaZWKisg';
const TEST_IV = 'q9jcZX8Ib9LM8wYk';

function envFixture(overrides = {}) {
  return {
    ECPAY_ENVIRONMENT: 'stage',
    ECPAY_PRIMARY_MERCHANT_ID: '2000132',
    ECPAY_PRIMARY_HASH_KEY: TEST_KEY,
    ECPAY_PRIMARY_HASH_IV: TEST_IV,
    ECPAY_SECONDARY_MERCHANT_ID: 'SECOND002',
    ECPAY_SECONDARY_HASH_KEY: '1234567890ABCDEF',
    ECPAY_SECONDARY_HASH_IV: 'FEDCBA0987654321',
    ...overrides,
  };
}

function invoicePayload() {
  return {
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
      ItemSeq: 1, ItemName: '十堂課卡', ItemCount: 1,
      ItemWord: '張', ItemPrice: 3000, ItemAmount: 3000,
    }],
  };
}

test('ECPay invoice AES matches the official uppercase urlencode vector and decrypts JSON', async () => {
  const payload = { Name: 'Test', ID: 'A123456789' };

  const encrypted = await encryptEcpayData_(payload, TEST_KEY, TEST_IV);

  assert.equal(
    encrypted,
    'uvI4yrErM37XNQkXGAgRgJAgHn2t72jahaMZzYhWL1HmvH4WV18VJDP2i9pTbC+tby5nxVExLLFyAkbjbS2Dvg==',
  );
  assert.deepEqual(await decryptEcpayData_(encrypted, TEST_KEY, TEST_IV), payload);
});

test('ECPay invoice resolves only the selected merchant secret set', () => {
  const primary = resolveMerchantSecrets_(envFixture(), 'primary');
  const secondary = resolveMerchantSecrets_(envFixture(), 'secondary');

  assert.deepEqual(primary, { merchantId: '2000132', hashKey: TEST_KEY, hashIv: TEST_IV });
  assert.equal(secondary.merchantId, 'SECOND002');
  assert.throws(() => resolveMerchantSecrets_(envFixture(), 'other'), /開票帳號/);
});

test('ECPay invoice uses the configured stage endpoint and returns only safe success fields', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, request: JSON.parse(init.body) });
    const encrypted = await encryptEcpayData_({
      RtnCode: 1,
      RtnMsg: '開立發票成功',
      InvoiceNo: 'AB12345678',
      InvoiceDate: '2026-09-26 12:34:56',
      RandomNumber: '9876',
      MerchantID: 'must-not-leak',
    }, TEST_KEY, TEST_IV);
    return new Response(JSON.stringify({
      MerchantID: 'must-not-leak',
      TransCode: 1,
      TransMsg: '',
      Data: encrypted,
    }), { status: 200 });
  };

  const result = await issueEcpayInvoice_({
    merchantProfile: 'primary', invoice: invoicePayload(), traceId: 'trace-safe-1', timestamp: 1_800_000_000,
  }, envFixture(), fetchImpl);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://einvoice-stage.ecpay.com.tw/B2CInvoice/Issue');
  assert.equal(calls[0].request.MerchantID, '2000132');
  assert.equal(result.outcome, 'issued');
  assert.deepEqual(result, {
    outcome: 'issued', traceId: 'trace-safe-1', code: '1', message: '開立發票成功',
    invoiceNo: 'AB12345678', invoiceDate: '2026-09-26 12:34:56', randomNumber: '9876',
  });
  assert.doesNotMatch(JSON.stringify(result), /must-not-leak|ejCk326|q9jcZX/);
});

test('ECPay invoice separates transport and business rejection outcomes', async () => {
  const transportRejected = await issueEcpayInvoice_({
    merchantProfile: 'primary', invoice: invoicePayload(), traceId: 'trace-transport', timestamp: 1_800_000_000,
  }, envFixture(), async () => new Response(JSON.stringify({
    TransCode: 0,
    TransMsg: '傳輸失敗',
    Data: 'opaque-secret-data',
  }), { status: 200 }));
  const businessData = await encryptEcpayData_({
    RtnCode: 999999,
    RtnMsg: '發票資料錯誤',
    MerchantID: 'must-not-leak',
  }, TEST_KEY, TEST_IV);
  const businessRejected = await issueEcpayInvoice_({
    merchantProfile: 'primary', invoice: invoicePayload(), traceId: 'trace-business', timestamp: 1_800_000_000,
  }, envFixture(), async () => new Response(JSON.stringify({
    TransCode: 1,
    TransMsg: '',
    Data: businessData,
  }), { status: 200 }));

  assert.deepEqual(transportRejected, {
    outcome: 'rejected', traceId: 'trace-transport', code: 'TRANS_0', message: '傳輸失敗',
  });
  assert.deepEqual(businessRejected, {
    outcome: 'rejected', traceId: 'trace-business', code: '999999', message: '發票資料錯誤',
  });
  assert.doesNotMatch(JSON.stringify([transportRejected, businessRejected]), /opaque-secret-data|must-not-leak/);
});

test('ECPay invoice treats timeout and malformed upstream replies as unknown without secrets', async () => {
  const cases = [
    async () => { throw new Error(`network ${TEST_KEY} ${TEST_IV}`); },
    async () => new Response('not-json', { status: 200 }),
    async () => new Response(JSON.stringify({ TransCode: 1, Data: 'not-base64' }), { status: 200 }),
  ];

  for (const fetchImpl of cases) {
    const result = await issueEcpayInvoice_({
      merchantProfile: 'primary', invoice: invoicePayload(), traceId: 'trace-unknown', timestamp: 1_800_000_000,
    }, envFixture(), fetchImpl);
    assert.equal(result.outcome, 'unknown');
    assert.equal(result.traceId, 'trace-unknown');
    assert.doesNotMatch(JSON.stringify(result), /network|ejCk326|q9jcZX|not-base64/);
  }
});

test('ECPay invoice production endpoint is fixed by environment and not request data', async () => {
  let calledUrl = '';
  const responseData = await encryptEcpayData_({
    RtnCode: 1, RtnMsg: 'OK', InvoiceNo: 'AB12345678', InvoiceDate: '2026-09-26', RandomNumber: '1234',
  }, TEST_KEY, TEST_IV);
  await issueEcpayInvoice_({
    merchantProfile: 'primary',
    invoice: { ...invoicePayload(), endpoint: 'https://evil.example' },
    traceId: 'trace-production',
    timestamp: 1_800_000_000,
  }, envFixture({ ECPAY_ENVIRONMENT: 'production' }), async (url) => {
    calledUrl = url;
    return new Response(JSON.stringify({ TransCode: 1, Data: responseData }), { status: 200 });
  });

  assert.equal(calledUrl, 'https://einvoice.ecpay.com.tw/B2CInvoice/Issue');
});
