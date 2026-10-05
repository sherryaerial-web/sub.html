const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
function backend() {
  const properties = new Map(), cache = new Map(); let writes = 0;
  const c = { console, Date, PropertiesService: { getScriptProperties: () => ({
    getProperty: k => properties.get(k) || null, getProperties: () => Object.fromEntries(properties),
    setProperty: (k,v) => properties.set(k,v), deleteProperty: k => properties.delete(k),
  }) }, CacheService: { getScriptCache: () => ({ get:k=>cache.get(k)||null, put:(k,v)=>cache.set(k,v) }) },
    LockService: { getScriptLock:()=>({waitLock(){},releaseLock(){}}) },
    Utilities: { DigestAlgorithm:{SHA_256:'sha256'}, Charset:{UTF_8:'utf8'}, computeDigest:(_a,v)=>[...crypto.createHash('sha256').update(v).digest()] } };
  vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(__dirname,'../Code.gs'),'utf8'),c);
  c.requireSession_ = token => ({teacherName: token === 'session-b' ? 'Other' : 'Tako'});
  const params = {action:'createPracticeBooking',sessionToken:'session-a',clientOperationId:Date.now().toString(36)+'_operation-test-1234',practice:'{"date":"2026/11/01"}'};
  return {c,params,properties,cache,run:(p=params,fn=()=>({id:'booking-1'}))=>c.runTrackedAdminOperation_(p,()=>{writes++;return fn();}),writes:()=>writes};
}
test('lost response is recovered without repeating a booking or invoice handler',()=>{
  for(const action of ['createPracticeBooking','confirmStudentPracticeQualification','issueInvoiceBatch']) {
    const s=backend();s.params.action=action;
    assert.equal(s.run().data.id,'booking-1');
    assert.equal(s.run().data.id,'booking-1');assert.equal(s.writes(),1);
    assert.equal(s.run({...s.params,sessionToken:'session-refreshed'}).data.id,'booking-1');assert.equal(s.writes(),1);
    const status=s.c.getAdminOperationStatus_(s.params);
    assert.equal(status.state,'completed');assert.equal(status.payload.data.id,'booking-1');
    assert.ok(!JSON.stringify([...s.properties.values()]).includes('booking-1'));
  }
});
test('duplicate during execution, mismatched content, and another session cannot repeat or read it',()=>{
  const s=backend();s.run(s.params,()=>{assert.equal(s.run().status,'pending');return {id:'done'};});
  assert.equal(s.writes(),1);
  assert.throws(()=>s.run({...s.params,practice:'different'}),/不同|不符/);
  assert.throws(()=>s.c.getAdminOperationStatus_({...s.params,sessionToken:'session-b'}),/不符|權限/);
});
test('expired, evicted or failed results never imply a safe retry',()=>{
  const s=backend();s.run();s.cache.clear();assert.equal(s.run().status,'pending');assert.equal(s.writes(),1);
  const old={...s.params,clientOperationId:(Date.now()-25*3600000).toString(36)+'_operation-test-old'};
  assert.throws(()=>s.run(old),/過期/);
  const f=backend();f.run(f.params,()=>{throw Error('partial failure');});f.run();assert.equal(f.writes(),1);
  assert.equal(f.c.getAdminOperationStatus_(f.params).state,'uncertain');
});
test('status lookup of an absent operation does not create a receipt or execute a write',()=>{
  const s=backend();assert.equal(s.c.getAdminOperationStatus_(s.params).state,'not_received');assert.equal(s.properties.size,0);assert.equal(s.writes(),0);
});
