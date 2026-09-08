import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson,
  signGatewayRequest,
} from '../src/security.js';

test('canonical JSON sorts nested object keys and preserves arrays', () => {
  assert.equal(canonicalJson({
    z: null,
    practice: { room: 'A', appName: '學生甲', durationMinutes: 60 },
    list: [{ b: 2, a: 1 }, true],
  }), '{"list":[{"a":1,"b":2},true],"practice":{"appName":"學生甲","durationMinutes":60,"room":"A"},"z":null}');
});

test('canonical JSON rejects values that cannot be signed consistently', () => {
  assert.throws(() => canonicalJson({ value: undefined }), /無法簽章/);
  assert.throws(() => canonicalJson({ value: Number.NaN }), /無法簽章/);
  assert.throws(() => canonicalJson({ value: Number.POSITIVE_INFINITY }), /無法簽章/);
});

test('canonical payload and HMAC match a hand-derived fixed vector', async () => {
  const signed = await signGatewayRequest({
    action: 'submitStudentPractice',
    payload: { practice: { room: 'A', appName: '學生甲', durationMinutes: 60 } },
    timestamp: 1788883200,
    nonce: 'nonce-1234567890',
    secret: 's'.repeat(32),
  });

  assert.deepEqual(signed, {
    version: 'v1',
    timestamp: 1788883200,
    nonce: 'nonce-1234567890',
    canonicalPayload: '{"practice":{"appName":"學生甲","durationMinutes":60,"room":"A"}}',
    payloadSha256: 'IrDravxVHR9xU93SyzHO1XNVldTTNs3uDpOmiw3cToY',
    signingInput: 'v1\nsubmitStudentPractice\n1788883200\nnonce-1234567890\nIrDravxVHR9xU93SyzHO1XNVldTTNs3uDpOmiw3cToY',
    signature: '7BUysdYeSzVpia9W3eCWnoQtX_cZsthVA5Uh_Cb96v4',
  });
});

