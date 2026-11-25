const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const backend = fs.readFileSync(require.resolve('../Code.gs'), 'utf8');

function fixture() {
  const entries = new Map();
  const calls = [];
  let tick = 0;
  const users = {
    tako: { teacherName: 'Tako', managementCapabilities: ['course_admin'] },
    teacher: { teacherName: '老師甲', managementCapabilities: ['course_admin'] },
    restricted: { teacherName: 'Tako', managementCapabilities: [] },
  };
  const context = vm.createContext({
    console: { error() {} },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput(text) { return { text, setMimeType() { return this; } }; } },
  });
  vm.runInContext(backend, context);
  Object.assign(context, {
    currentTimeMs_: () => tick,
    requireSession_: token => { if (!users[token]) throw Error('登入狀態無效'); return users[token]; },
    createRandomToken_: () => crypto.randomBytes(32).toString('hex'),
    sha256Base64Url_: text => crypto.createHash('sha256').update(text).digest('base64url'),
    getScriptCache_: () => ({
      get(key) { return entries.get(key); },
      put(key, value, seconds) { entries.set(key, value); calls.push({ key, value, seconds }); },
      remove(key) { entries.delete(key); },
    }),
    withScriptLock_: fn => fn(),
  });
  const post = (action, params={}) => JSON.parse(context.doPost({ parameter: { ...params, action } }).text);
  return { post, calls, advance: ms => { tick += ms; } };
}

test('assistant portal limits entry to Tako with permission and blocks acting mode', () => {
  const { post, calls } = fixture();
  for (const params of [{}, {sessionToken:'teacher',teacherName:'Tako'}, {sessionToken:'restricted'}, {sessionToken:'tako',actingTeacherName:'老師甲'}]) {
    assert.equal(post('createAssistantGrant',params).status,'error');
  }
  assert.equal(calls.length,0);
  const reply = post('createAssistantGrant',{sessionToken:'tako'});
  assert.equal(reply.status,'success');
  assert.match(reply.data.grant,/^[a-f0-9]{64}$/);
  assert.equal(calls[0].seconds,120);
  assert.ok(!JSON.stringify(calls).includes(reply.data.grant));
});

test('assistant portal grants expire and are consumed once', () => {
  const f = fixture();
  const issue = () => f.post('createAssistantGrant',{sessionToken:'tako'}).data.grant;
  const grant = issue();
  assert.equal(f.post('redeemAssistantGrant',{grant:'a'.repeat(64)}).status,'error');
  assert.equal(f.post('redeemAssistantGrant',{grant}).data.approved,true);
  assert.equal(f.post('redeemAssistantGrant',{grant}).status,'error');
  const old = issue();
  f.advance(120000);
  assert.equal(f.post('redeemAssistantGrant',{grant:old}).status,'error');
});
