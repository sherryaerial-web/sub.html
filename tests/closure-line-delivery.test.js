const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const START = Date.parse('2026-09-26T22:34:00+08:00');
function fixture() {
  let now = START, locked = false;
  const props = new Map([['CLOSURE_LINE_ENABLED', 'true'], ['CLOSURE_LINE_URL', 'https://notifier.example/closure'], ['CLOSURE_LINE_SECRET', 'd'.repeat(40)]]);
  const calls = [];
  const c = { console, Date, JSON, Math, String, Number, Object, Array, RegExp, Error,
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props.get(k) || null, setProperty: (k,v) => props.set(k,v) }) },
    Utilities: { getUuid: () => crypto.randomUUID(), computeHmacSha256Signature: (v,k) => [...crypto.createHmac('sha256',k).update(v).digest()], base64EncodeWebSafe: b => Buffer.from(b).toString('base64url'),
      formatDate: (date, _tz, pattern) => { const d = new Date(+date + 8 * 3600000).toISOString(); return pattern === 'HH:mm' ? d.slice(11,16) : pattern === 'yyyy/MM/dd' ? d.slice(0,10).replaceAll('-','/') : d.slice(0,10); } },
    Session: { getScriptTimeZone: () => 'Asia/Taipei' },
    LockService: { getScriptLock: () => ({ waitLock() { assert.equal(locked,false); locked=true; }, releaseLock() { locked=false; } }) },
    UrlFetchApp: { fetch(url, options) { assert.equal(locked,false, 'network must run outside lock'); calls.push({url,...options}); return { getResponseCode: () => 202, getContentText: () => '{"ok":true,"queued":true}' }; } }
  };
  vm.createContext(c); vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'), c);
  c.currentTimeMs_ = () => now;
  return { c, props, calls, time(v) { now=v; } };
}
const result = () => ({ stage: '22:30', targetDate: '2026/09/27', failedCount: 0, socialCopy: { content: '明10:30空瑜缺二\n等到23:40' } });

test('LINE queue defaults off and ignores empty/second-round/failed results', () => {
  const f = fixture(); f.props.delete('CLOSURE_LINE_ENABLED');
  f.c.queueCourseClosureLineCopySafely_(result());
  assert.equal(f.props.has('CLOSURE_LINE_PENDING'),false);
  f.props.set('CLOSURE_LINE_ENABLED','true');
  for (const value of [{...result(),stage:'23:40'}, {...result(),failedCount:1}, {...result(),socialCopy:{content:''}}]) f.c.queueCourseClosureLineCopySafely_(value);
  assert.equal(f.calls.length,0);
  assert.equal(f.props.has('CLOSURE_LINE_PENDING'),false);
});

test('LINE failed handoff retries unchanged payload and never reexecutes closure', () => {
  const f=fixture(); const original=f.c.UrlFetchApp.fetch;
  f.c.UrlFetchApp.fetch = () => { throw new Error('timeout'); };
  f.c.queueCourseClosureLineCopySafely_(result());
  assert.equal(JSON.parse(f.props.get('CLOSURE_LINE_PENDING')).status,'pending');
  f.time(START+61000); f.c.UrlFetchApp.fetch=original;
  f.c.drainCourseClosureLineCopySafely_();
  assert.equal(JSON.parse(f.props.get('CLOSURE_LINE_PENDING')).status,'queued');
  assert.equal(JSON.parse(JSON.parse(f.calls[0].payload).payload).content,'明10:30空瑜缺二\n等到23:40');
  f.c.queueCourseClosureLineCopySafely_(result());
  assert.equal(f.calls.length,1);
});

test('LINE delivery never replaces first payload, and stops retry at second round', () => {
  const f=fixture(); f.c.UrlFetchApp.fetch=()=> { throw new Error('timeout'); };
  f.c.queueCourseClosureLineCopySafely_(result());
  f.c.queueCourseClosureLineCopySafely_({...result(), socialCopy:{content:'changed'}});
  assert.equal(JSON.parse(f.props.get('CLOSURE_LINE_PENDING')).payload.content,result().socialCopy.content);
  assert.equal(JSON.parse(f.props.get('CLOSURE_LINE_PENDING')).conflictReason,'copy-changed');
  assert.equal(JSON.parse(f.props.get('CLOSURE_LINE_PENDING')).conflictAt,START);
  f.time(Date.parse('2026-09-26T23:40:00+08:00'));
  f.c.drainCourseClosureLineCopySafely_();
  assert.equal(JSON.parse(f.props.get('CLOSURE_LINE_PENDING')).status,'expired');
});

test('GAS signature matches actual Worker verifier and does not expose secret in body', async () => {
  const f=fixture(); f.c.queueCourseClosureLineCopySafely_(result());
  const e=JSON.parse(f.calls[0].payload);
  const {sign}=await import('../line-notifier/src/index.mjs');
  assert.equal(e.signature,await sign('d'.repeat(40),`${e.timestamp}\n${e.nonce}\n/closure\n${e.payload}`));
  assert.ok(!f.calls[0].payload.includes('d'.repeat(40)));
});

test('actual manual closure hooks after core and keeps result despite failed notification', () => {
  const f=fixture(); const order=[]; const r=result();
  f.c.assertCapabilitySession_=()=> 'admin'; f.c.assertManualCourseClosureStageAvailable_=()=>{};
  f.c.getTomorrowDate_=()=> '2026/09/27';
  f.c.executeNextDayClosuresCore_=()=> {order.push('core');return r;};
  f.c.notifyCourseClosureFailures_=()=>{}; f.c.refreshPracticeAfterCourseClosure_=()=>{}; f.c.notifyCourseClosureResult_=()=>{};
  f.c.UrlFetchApp.fetch=()=> {order.push('line');throw new Error('offline');};
  assert.equal(f.c.executeNextDayClosures_({},'22:30'),r);
  assert.deepEqual(order,['core','line']);
});
