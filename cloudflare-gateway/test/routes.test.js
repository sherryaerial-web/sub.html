import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { matchRoute } from '../src/routes.js';

const routes = [
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
  assert.equal(matchRoute('POST', '/api/anything'), null);
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
    data: { configured: true },
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

