import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { buildRateLimitKey } from '../src/security.js';

const ORIGIN = 'https://sherryaerial-web.github.io';

function createFixture(options = {}) {
  const rateKeys = [];
  const fetchRequests = [];
  const env = {
    GAS_UPSTREAM_URL: 'https://script.google.com/macros/s/test/exec',
    GAS_GATEWAY_SECRET: 'g'.repeat(32),
    TURNSTILE_SECRET_KEY: 'turnstile-secret',
    ALLOWED_ORIGINS: `${ORIGIN},http://localhost:4173`,
    TURNSTILE_HOSTNAMES: 'sherryaerial-web.github.io,localhost',
    PUBLIC_WRITE_LIMITER: {
      async limit({ key }) {
        rateKeys.push(key);
        return { success: options.limitSuccess !== false };
      },
    },
    PUBLIC_READ_LIMITER: {
      async limit({ key }) {
        rateKeys.push(key);
        return { success: true };
      },
    },
    async fetch(request) {
      fetchRequests.push(request);
      if (options.fetchError) throw new Error(options.fetchError);
      return new Response(JSON.stringify(options.siteverify || {
        success: true,
        hostname: 'sherryaerial-web.github.io',
        action: 'student_practice_submit',
      }), { status: options.fetchStatus || 200 });
    },
  };
  return { env, rateKeys, fetchRequests };
}

function request(path, body, ip = '203.0.113.8') {
  return new Request(`https://gateway.test${path}`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
    },
    body: JSON.stringify(body),
  });
}

test('missing Turnstile token is rejected before limiter and network calls', async () => {
  const fixture = createFixture();
  const response = await worker.fetch(request('/api/student-practice/submit', {
    practice: { appName: '學生甲', email: 'student@example.com' },
  }), fixture.env, {});

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'turnstile_required');
  assert.equal(fixture.rateKeys.length, 0);
  assert.equal(fixture.fetchRequests.length, 0);
});

test('rate limit rejection happens before Turnstile and GAS', async () => {
  const fixture = createFixture({ limitSuccess: false });
  const response = await worker.fetch(request('/api/student-practice/submit', {
    turnstileToken: 'turnstile-token',
    practice: { appName: '學生甲', email: 'student@example.com' },
  }), fixture.env, {});

  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, 'rate_limited');
  assert.equal(fixture.rateKeys.length, 1);
  assert.equal(fixture.fetchRequests.length, 0);
});

test('Turnstile rejects unsuccessful, wrong-host, and wrong-action responses', async () => {
  const cases = [
    { success: false, 'error-codes': ['invalid-input-response'] },
    { success: true, hostname: 'evil.example', action: 'student_practice_submit' },
    { success: true, hostname: 'sherryaerial-web.github.io', action: 'wrong_action' },
  ];
  for (const siteverify of cases) {
    const fixture = createFixture({ siteverify });
    const response = await worker.fetch(request('/api/student-practice/submit', {
      turnstileToken: 'turnstile-token',
      practice: { studentToken: 'opaque-student-token' },
    }), fixture.env, {});
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, 'turnstile_rejected');
    assert.equal(fixture.fetchRequests.length, 1);
  }
});

test('Turnstile outage is retryable and never echoes sensitive values', async () => {
  const fixture = createFixture({ fetchError: 'turnstile-secret turnstile-token' });
  const response = await worker.fetch(request('/api/student-practice/submit', {
    turnstileToken: 'turnstile-token',
    practice: { studentToken: 'opaque-student-token' },
  }), fixture.env, {});
  const text = await response.text();

  assert.equal(response.status, 503);
  assert.match(text, /turnstile_unavailable/);
  assert.doesNotMatch(text, /turnstile-secret|turnstile-token|opaque-student-token/);
});

test('rate-limit keys normalize identity and contain no raw personal data', async () => {
  const route = { path: '/api/student-practice/submit', action: 'submitStudentPractice' };
  const first = await buildRateLimitKey(route, {
    practice: { email: ' Student@Example.COM ' },
  }, '203.0.113.8');
  const same = await buildRateLimitKey(route, {
    practice: { email: 'student@example.com' },
  }, '203.0.113.8');
  const otherNetwork = await buildRateLimitKey(route, {
    practice: { email: 'student@example.com' },
  }, '203.0.113.9');
  const returning = await buildRateLimitKey(route, {
    practice: { studentToken: 'opaque-student-token' },
  }, '203.0.113.8');

  assert.equal(first, same);
  assert.notEqual(first, otherNetwork);
  assert.doesNotMatch(first, /student@example\.com|203\.0\.113\.8/i);
  assert.doesNotMatch(returning, /opaque-student-token|203\.0\.113\.8/);
});
