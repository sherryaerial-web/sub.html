import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { callGas } from '../src/upstream.js';

const GAS_URL = 'https://script.google.com/macros/s/test/exec';

test('signed student write reaches GAS once without forwarding Turnstile token', async () => {
  const requests = [];
  const result = await callGas({
    action: 'submitStudentPractice',
    payload: { practice: { appName: '學生甲', email: 'student@example.com' } },
    env: { GAS_UPSTREAM_URL: GAS_URL, GAS_GATEWAY_SECRET: 'g'.repeat(32) },
    fetchImpl: async (request) => {
      requests.push(request);
      return new Response(JSON.stringify({ status: 'success', data: { status: '已成立' } }));
    },
    now: () => 1788883200000,
    nonceFactory: () => 'nonce-1234567890',
  });

  assert.deepEqual(result, { status: '已成立' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'POST');
  const form = new URLSearchParams(await requests[0].text());
  assert.equal(form.get('action'), 'submitStudentPractice');
  assert.equal(form.get('gatewayVersion'), 'v1');
  assert.equal(form.get('gatewayTimestamp'), '1788883200');
  assert.equal(form.get('gatewayNonce'), 'nonce-1234567890');
  assert.equal(form.get('gatewayPayload'), '{"practice":{"appName":"學生甲","email":"student@example.com"}}');
  assert.equal(form.get('practice'), '{"appName":"學生甲","email":"student@example.com"}');
  assert.match(form.get('gatewaySignature'), /^[A-Za-z0-9_-]{43}$/);
  assert.equal(form.has('turnstileToken'), false);
});

test('upstream failures never retry writes or claim success', async () => {
  const cases = [
    {
      response: () => new Response('server down', { status: 503 }),
      code: 'upstream_unavailable',
    },
    {
      response: () => new Response('<html>not json</html>', { status: 200 }),
      code: 'upstream_unavailable',
    },
    {
      response: () => new Response(JSON.stringify({ status: 'error', message: '這個時段已有安排。' })),
      code: 'upstream_rejected',
      message: '這個時段已有安排。',
    },
  ];

  for (const item of cases) {
    let calls = 0;
    await assert.rejects(callGas({
      action: 'submitVvipSelection',
      payload: { vvipId: 'member-1', calendarIds: ['calendar-1'] },
      env: { GAS_UPSTREAM_URL: GAS_URL, GAS_GATEWAY_SECRET: 'g'.repeat(32) },
      fetchImpl: async () => { calls += 1; return item.response(); },
      now: () => 1788883200000,
      nonceFactory: () => 'nonce-1234567890',
    }), (error) => {
      assert.equal(error.code, item.code);
      if (item.message) assert.equal(error.message, item.message);
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('Worker validates Turnstile then proxies a student write', async () => {
  const urls = [];
  const env = {
    GAS_UPSTREAM_URL: GAS_URL,
    GAS_GATEWAY_SECRET: 'g'.repeat(32),
    TURNSTILE_SECRET_KEY: 'turnstile-secret',
    ALLOWED_ORIGINS: 'https://sherryaerial-web.github.io',
    TURNSTILE_HOSTNAMES: 'sherryaerial-web.github.io',
    PUBLIC_WRITE_LIMITER: { limit: async () => ({ success: true }) },
    PUBLIC_READ_LIMITER: { limit: async () => ({ success: true }) },
    async fetch(request) {
      urls.push(request.url);
      if (request.url.includes('/siteverify')) {
        return new Response(JSON.stringify({
          success: true,
          hostname: 'sherryaerial-web.github.io',
          action: 'student_practice_submit',
        }));
      }
      return new Response(JSON.stringify({ status: 'success', data: { status: '已成立' } }));
    },
  };
  const response = await worker.fetch(new Request(
    'https://gateway.test/api/student-practice/submit',
    {
      method: 'POST',
      headers: {
        Origin: 'https://sherryaerial-web.github.io',
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.8',
      },
      body: JSON.stringify({
        turnstileToken: 'turnstile-token',
        practice: { appName: '學生甲', email: 'student@example.com' },
      }),
    },
  ), env, {});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'success', data: { status: '已成立' } });
  assert.deepEqual(urls, [
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    GAS_URL,
  ]);
});

