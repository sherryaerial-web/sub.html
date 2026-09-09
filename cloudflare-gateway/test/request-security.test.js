import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

function createEnvFixture() {
  let rateCount = 0;
  let fetchCount = 0;
  return {
    env: {
      GAS_UPSTREAM_URL: 'https://script.google.com/macros/s/test/exec',
      GAS_GATEWAY_SECRET: 'g'.repeat(32),
      TURNSTILE_SECRET_KEY: 'turnstile-test',
      ALLOWED_ORIGINS: 'https://sherryaerial-web.github.io,http://127.0.0.1:4173,http://localhost:4173',
      TURNSTILE_HOSTNAMES: 'sherryaerial-web.github.io,localhost,127.0.0.1',
      PUBLIC_WRITE_LIMITER: {
        async limit() { rateCount += 1; return { success: true }; },
      },
      PUBLIC_READ_LIMITER: {
        async limit() { rateCount += 1; return { success: true }; },
      },
      fetch: async () => {
        fetchCount += 1;
        return new Response(JSON.stringify({ status: 'success', data: {} }));
      },
    },
    rateCalls: () => rateCount,
    fetchCalls: () => fetchCount,
  };
}

function studentRequest(body, headers = {}) {
  return new Request('https://gateway.test/api/student-practice/submit', {
    method: 'POST',
    headers: {
      Origin: 'https://sherryaerial-web.github.io',
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });
}

test('foreign origin is rejected before limiter and upstream', async () => {
  const fixture = createEnvFixture();
  const response = await worker.fetch(studentRequest('{}', {
    Origin: 'https://evil.example',
  }), fixture.env, {});

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'origin_not_allowed');
  assert.equal(fixture.rateCalls(), 0);
  assert.equal(fixture.fetchCalls(), 0);
});

test('allowed preflight receives route-specific CORS headers', async () => {
  const fixture = createEnvFixture();
  const response = await worker.fetch(new Request(
    'https://gateway.test/api/student-practice/submit',
    {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://sherryaerial-web.github.io',
        'Access-Control-Request-Method': 'POST',
      },
    },
  ), fixture.env, {});

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://sherryaerial-web.github.io');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  assert.equal(fixture.rateCalls(), 0);
  assert.equal(fixture.fetchCalls(), 0);
});

test('post routes reject missing or wrong JSON content type before upstream work', async () => {
  for (const contentType of ['', 'text/plain']) {
    const fixture = createEnvFixture();
    const headers = contentType ? { 'Content-Type': contentType } : { 'Content-Type': '' };
    const response = await worker.fetch(studentRequest('{}', headers), fixture.env, {});
    assert.equal(response.status, 415);
    assert.equal((await response.json()).error.code, 'invalid_content_type');
    assert.equal(fixture.rateCalls(), 0);
    assert.equal(fixture.fetchCalls(), 0);
  }
});

test('post routes reject malformed, array, and oversized JSON bodies', async () => {
  const cases = [
    { body: '{', status: 400, code: 'invalid_json' },
    { body: '[]', status: 400, code: 'invalid_json' },
    { body: JSON.stringify({ note: 'x'.repeat(17 * 1024) }), status: 413, code: 'body_too_large' },
  ];

  for (const item of cases) {
    const fixture = createEnvFixture();
    const response = await worker.fetch(studentRequest(item.body), fixture.env, {});
    assert.equal(response.status, item.status);
    assert.equal((await response.json()).error.code, item.code);
    assert.equal(fixture.rateCalls(), 0);
    assert.equal(fixture.fetchCalls(), 0);
  }
});

