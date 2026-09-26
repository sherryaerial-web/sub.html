import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { matchRoute } from '../src/routes.js';

const routes = [
  ['POST', '/internal/ecpay/invoices/issue', 'issueEcpayInvoice'],
  ['GET', '/api/student-practice/availability', 'getStudentPracticeAvailability'],
  ['POST', '/api/student-practice/submit', 'submitStudentPractice'],
  ['GET', '/api/vvip/members', 'getVvipMembers'],
  ['POST', '/api/vvip/selection', 'getVvipSelection'],
  ['POST', '/api/vvip/submit', 'submitVvipSelection'],
  ['GET', '/health', 'health'],
];

test('only the documented method and path pairs resolve', () => {
  for (const [method, path, action] of routes) {
    assert.equal(matchRoute(method, path).action, action);
  }
  assert.equal(matchRoute('GET', '/api/vvip/submit'), null);
  assert.equal(matchRoute('GET', '/internal/ecpay/invoices/issue'), null);
  assert.equal(matchRoute('POST', '/api/anything'), null);
});

test('internal invoice route is isolated from browser security metadata', () => {
  const route = matchRoute('POST', '/internal/ecpay/invoices/issue');
  assert.equal(route.internal, true);
  assert.equal(route.turnstileRequired, false);
  assert.equal(route.maxBodyBytes, 32 * 1024);
});

test('health reports configuration without contacting GAS', async () => {
  let upstreamCalls = 0;
  const response = await worker.fetch(new Request('https://gateway.test/health'), {
    GAS_UPSTREAM_URL: 'https://script.google.com/macros/s/test/exec',
    GAS_GATEWAY_SECRET: 'x'.repeat(32),
    TURNSTILE_SECRET_KEY: 'turnstile-test',
    fetch: async () => {
      upstreamCalls += 1;
      throw new Error('health must not call GAS');
    },
  }, {});

  assert.equal(response.status, 200);
  assert.equal(upstreamCalls, 0);
  assert.deepEqual(await response.json(), {
    status: 'success',
    data: { configured: true, invoiceConfigured: false },
  });
});

test('health reports invoice readiness only when both merchants auth and replay guard are configured', async () => {
  const response = await worker.fetch(new Request('https://gateway.test/health'), {
    GAS_UPSTREAM_URL: 'https://script.google.com/macros/s/test/exec',
    GAS_GATEWAY_SECRET: 'x'.repeat(32),
    TURNSTILE_SECRET_KEY: 'turnstile-test',
    INVOICE_GATEWAY_SECRET: 'i'.repeat(32),
    ECPAY_PRIMARY_MERCHANT_ID: '2000132',
    ECPAY_PRIMARY_HASH_KEY: '1234567890ABCDEF',
    ECPAY_PRIMARY_HASH_IV: 'FEDCBA0987654321',
    ECPAY_SECONDARY_MERCHANT_ID: '2000133',
    ECPAY_SECONDARY_HASH_KEY: 'ABCDEF1234567890',
    ECPAY_SECONDARY_HASH_IV: '0987654321FEDCBA',
    ECPAY_ENVIRONMENT: 'stage',
    INVOICE_REQUEST_GUARD: {
      idFromName: () => ({ id: 'guard' }),
      get: () => ({ fetch: async () => new Response('{}') }),
    },
  }, {});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'success',
    data: { configured: true, invoiceConfigured: true },
  });
});

test('unknown paths return a JSON 404 response', async () => {
  const response = await worker.fetch(new Request('https://gateway.test/api/unknown'), {}, {});
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    status: 'error',
    error: { code: 'route_not_found', message: '找不到此服務。' },
  });
});
