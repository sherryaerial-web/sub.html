const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const pref=(id='original',revision=0)=>({schemaVersion:1,mode:'preset',presetId:id,primary:id==='rose'?'#857377':'#786c64',secondary:id==='rose'?'#e9dcdf':'#eee0dc',revision,updatedAt:revision?'2026-11-10T00:00:00.000Z':''});
function backend() {
  const properties=new Map(),cache=new Map(),writes=[];let locked=false,failWrite=false,loseReadback=false;
  const props={getProperty:k=>loseReadback&&k.startsWith('PERSONAL_APPEARANCE_V1_')?'broken':properties.get(k)??null,
    getProperties:()=>Object.fromEntries(properties),setProperty(k,v){
      if(k.startsWith('PERSONAL_APPEARANCE_V1_')) {assert.equal(locked,true);if(failWrite)throw Error('capacity');}
      writes.push(k);properties.set(k,v);
    },deleteProperty:k=>properties.delete(k)};
  const c={console:{...console,error(){}},Date,
    PropertiesService:{getScriptProperties:()=>props},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
    LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true;},releaseLock(){locked=false;}})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_a,v)=>[...crypto.createHash('sha256').update(v).digest()]},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},
    SpreadsheetApp:new Proxy({},{get(){throw Error('business Sheets access');}}),
    MailApp:new Proxy({},{get(){throw Error('mail access');}}),UrlFetchApp:new Proxy({},{get(){throw Error('network access');}})};
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../Code.gs'),'utf8'),c);
  // Keep the real session validator and canonical account resolution, isolating only account storage.
  c.findAccount_=name=>['Teacher A','Teacher B'].includes(name)?{teacherName:name,role:'老師',active:true}:null;
  c.storeSession_('a',{teacherName:'Teacher A',role:'老師',expiresAt:Date.now()+3600000});
  c.storeSession_('a2',{teacherName:'Teacher A',role:'老師',expiresAt:Date.now()+3600000});
  c.storeSession_('b',{teacherName:'Teacher B',role:'老師',expiresAt:Date.now()+3600000});writes.length=0;
  let id=0;
  const params=(extra={})=>({action:'savePersonalAppearance',sessionToken:'a',preference:JSON.stringify(pref('rose')),expectedRevision:'0',clientOperationId:Date.now().toString(36)+'_appearance-test-'+(++id),...extra});
  const post=p=>JSON.parse(c.doPost({parameter:p}).text);
  const get=(extra={})=>post({action:'getPersonalAppearance',sessionToken:'a',...extra});
  return {c,properties,cache,writes,props,params,post,get,key:'PERSONAL_APPEARANCE_V1_'+crypto.createHash('sha256').update('Teacher A').digest('hex'),
    failWrite:()=>{failWrite=true;},loseReadback:()=>{loseReadback=true;},isLocked:()=>locked};
}
test('authenticated missing read returns exact revision-zero original without any writes',()=>{
  const f=backend(),r=f.get();assert.equal(r.status,'success');assert.deepEqual(r.data,{available:true,preference:pref()});assert.equal(f.writes.length,0);
  assert.equal(f.get({sessionToken:'bad'}).status,'error');
});
test('canonical session owner is shared across tokens and isolated across accounts',()=>{
  const f=backend(),r=f.post(f.params());assert.equal(r.data.saved,true);assert.equal(r.data.preference.revision,1);assert.ok(r.data.preference.updatedAt);
  assert.equal(f.get({sessionToken:'a2'}).data.preference.presetId,'rose');assert.equal(f.get({sessionToken:'b'}).data.preference.presetId,'original');
  assert.ok(f.properties.has(f.key));assert.ok(f.writes.every(k=>k===f.key||k.startsWith('ADMIN_OP_')));assert.equal(f.isLocked(),false);
});
test('real session expiry and deactivated accounts cannot read or write appearance',()=>{
  const f=backend();f.c.storeSession_('expired',{teacherName:'Teacher A',role:'老師',expiresAt:Date.now()-1});
  assert.equal(f.get({sessionToken:'expired'}).status,'error');assert.equal(f.post(f.params({sessionToken:'expired'})).status,'error');
  f.c.findAccount_=()=>({teacherName:'Teacher A',role:'老師',active:false});assert.equal(f.get().status,'error');assert.ok(!f.properties.has(f.key));
});
for(const field of ['owner','teacherName','target','targetTeacherName','account','actingTeacherName']) {
  test(`rejects injected ${field} through completed non-saved result`,()=>{
    const f=backend(),p=f.params({[field]:'Teacher B'}),r=f.post(p);assert.equal(r.status,'success');assert.equal(r.data.saved,false);
    assert.equal(f.c.getAdminOperationStatus_(p).state,'completed');assert.ok(!f.properties.has(f.key));
    assert.equal(f.get({[field]:'Teacher B'}).data.available,false);
  });
}
test('save requires a tracked operation receipt rather than an untracked write',()=>{
  const f=backend(),p=f.params();delete p.clientOperationId;const r=f.post(p);assert.equal(r.data.saved,false);assert.equal(f.writes.length,0);
});
for(const bad of [{schemaVersion:2},{mode:'css'},{presetId:'foreign'},{primary:'#fff'},{primary:'url(x)'},{secondary:'#ffffff;'},
  {revision:-1},{revision:1.1},{revision:'0'},{updatedAt:12},{owner:'Teacher B'},{extra:'x'.repeat(1100)},{primary:'#ffffff'}]) {
  test(`rejects invalid record ${JSON.stringify(bad).slice(0,70)} without uncertain receipt`,()=>{
    const f=backend(),p=f.params({preference:JSON.stringify({...pref('rose'),...bad})}),r=f.post(p);
    assert.equal(r.status,'success');assert.equal(r.data.saved,false);assert.equal(f.c.getAdminOperationStatus_(p).state,'completed');assert.ok(!f.properties.has(f.key));
  });
}
test('malformed JSON and bad expected revisions are explicit pre-write rejections',()=>{
  for(const extra of [{preference:'{'},{expectedRevision:'-1'},{expectedRevision:'1.5'},{expectedRevision:''},{expectedRevision:'0x0'},{expectedRevision:true}]) {
    const f=backend(),p=f.params(extra),r=f.post(p);assert.equal(r.status,'success');assert.equal(r.data.saved,false);assert.equal(f.c.getAdminOperationStatus_(p).state,'completed');assert.ok(!f.properties.has(f.key));
  }
});
test('custom hex is normalized and unknown keys cannot inject CSS or account identity',()=>{
  const f=backend(),custom={...pref('rose'),mode:'custom',primary:'#ABCDEF',secondary:'#FFFFFF'};
  const r=f.post(f.params({preference:JSON.stringify(custom)}));assert.equal(r.data.saved,true);assert.equal(r.data.preference.primary,'#abcdef');assert.equal(r.data.preference.presetId,'rose');
});
test('identical save is no-op, conflict preserves record, reset increments revision',()=>{
  const f=backend();const first=f.post(f.params()).data.preference;const count=()=>f.writes.filter(k=>k===f.key).length;
  const same=f.post(f.params());assert.equal(same.data.saved,true);assert.equal(same.data.preference.revision,1);assert.equal(count(),1);
  const conflict=f.post(f.params({preference:JSON.stringify(pref())}));assert.equal(conflict.data.saved,false);assert.equal(conflict.data.reason,'conflict');assert.deepEqual(conflict.data.current,first);assert.equal(count(),1);
  const reset=f.post(f.params({preference:JSON.stringify({...pref(),revision:1,updatedAt:first.updatedAt}),expectedRevision:'1'}));assert.equal(reset.data.preference.revision,2);assert.equal(reset.data.preference.presetId,'original');assert.equal(count(),2);
});
test('current revision is reread inside lock before writing',()=>{
  const f=backend();let enters=0;
  f.c.LockService.getScriptLock=()=>({waitLock(){if(++enters===2) f.properties.set(f.key,JSON.stringify(pref('rose',7)));},releaseLock(){}});
  const r=f.post(f.params({preference:JSON.stringify(pref())}));assert.equal(r.data.reason,'conflict');assert.equal(r.data.current.revision,7);assert.equal(f.writes.filter(k=>k===f.key).length,0);
});
for(const raw of ['', '{',JSON.stringify({...pref(),schemaVersion:99}),JSON.stringify({...pref(),extra:'bad'}),'x'.repeat(1025)]) {
  test(`corrupt persisted record is unavailable and never overwritten: ${raw.slice(0,25)}`,()=>{
    const f=backend();f.properties.set(f.key,raw);assert.equal(f.get().data.available,false);
    const r=f.post(f.params());assert.equal(r.status,'success');assert.equal(r.data.saved,false);assert.equal(f.properties.get(f.key),raw);
  });
}
test('property write failure preserves previous value and retains uncertain operation',()=>{
  const f=backend();f.properties.set(f.key,JSON.stringify(pref()));f.failWrite();const p=f.params();assert.equal(f.post(p).status,'error');
  assert.equal(f.c.getAdminOperationStatus_(p).state,'uncertain');assert.deepEqual(JSON.parse(f.properties.get(f.key)),pref());assert.equal(f.isLocked(),false);
});
test('failed readback stays uncertain and duplicate request never reexecutes',()=>{
  const f=backend(),set=f.props.setProperty;f.props.setProperty=(k,v)=>{set(k,v);if(k===f.key)f.loseReadback();};
  const p=f.params();assert.equal(f.post(p).status,'error');assert.equal(f.c.getAdminOperationStatus_(p).state,'uncertain');
  f.post(p);assert.equal(f.writes.filter(k=>k===f.key).length,1);
});
test('tracked response loss is recoverable, completed rejection remains completed, no business services touched',()=>{
  const f=backend(),p=f.params(),first=f.post(p);assert.equal(first.data.saved,true);assert.deepEqual(f.post(p),first);assert.equal(f.writes.filter(k=>k===f.key).length,1);
  f.cache.clear();assert.equal(f.post(p).status,'pending');assert.equal(f.writes.filter(k=>k===f.key).length,1);
  const bad=f.params({expectedRevision:'broken'});assert.equal(f.post(bad).data.saved,false);assert.equal(f.c.getAdminOperationStatus_(bad).state,'completed');
});

function connected(options={}) {
  const f=backend(),data=new Map(),calls=[];
  const storage={getItem:k=>data.get(k)||null,setItem(k,v){
    if(options.denyStorage || (options.denyCleanup && k==='sherry-admin-pending-v1' && v==='[]')) throw Error('SecurityError');
    data.set(k,v);
  }};
  const {createAdminTransport}=require('../admin-transport');
  const transport=createAdminTransport({url:'https://offline.invalid/exec',storage,crypto:crypto.webcrypto,
    getSessionToken:()=> 'a',getSessionOwner:()=> 'Teacher A',fetch:async(_url,request)=>{
      const p=Object.fromEntries(new URLSearchParams(request.body));calls.push(p);
      if(options.dropBeforeDelivery && p.action==='savePersonalAppearance') throw Error('request lost before delivery');
      if(options.statusOverride && p.action==='getAdminOperationStatus') return {ok:true,json:async()=>({status:'success',data:{state:options.statusOverride}})};
      const payload=f.post(p);if(options.loseResponse && p.action==='savePersonalAppearance')throw Error('lost response');
      return {ok:true,json:async()=>payload};
    }});
  const c=require('../personal-appearance').createController({request:transport.call,storage});
  c.setSession({owner:'Teacher A',token:'a',verified:true,acting:false});
  return {f,c,data,calls};
}
test('real controller/transport/backend recovers lost delivery without a second property write',async()=>{
  const {f,c,data,calls}=connected({loseResponse:true});await c.open();c.setPreset('rose');await c.save();
  assert.equal(c.snapshot().status,'saved');assert.deepEqual(calls.map(p=>p.action),['getPersonalAppearance','savePersonalAppearance','getAdminOperationStatus']);
  assert.equal(f.writes.filter(k=>k===f.key).length,1);assert.deepEqual(JSON.parse(data.get('sherry-admin-pending-v1')),[]);
});
test('real transport storage guard stops save before any HTTP mutation',async()=>{
  const {c,calls,f}=connected({denyStorage:true});await c.open();c.setPreset('rose');await c.save();
  assert.equal(c.snapshot().status,'error');assert.equal(c.snapshot().draft.presetId,'rose');assert.deepEqual(calls.map(p=>p.action),['getPersonalAppearance']);assert.equal(f.writes.length,0);
});
test('receipt cleanup failure after a committed save keeps the original signature for recovery',async()=>{
  const options={denyCleanup:true},{f,c,calls}=connected(options);await c.open();c.setPreset('rose');await c.save();
  assert.equal(c.snapshot().status,'error');assert.equal(f.writes.filter(k=>k===f.key).length,1);
  c.setPreset('blue');assert.equal(c.snapshot().draft.presetId,'rose');options.denyCleanup=false;await c.save();
  assert.equal(c.snapshot().status,'saved');assert.equal(calls.filter(p=>p.action==='savePersonalAppearance').length,1);assert.equal(f.writes.filter(k=>k===f.key).length,1);
});
test('every domain preset and custom base validates through the backend contract',()=>{
  const f=backend(),domain=require('../personal-appearance');
  for(const p of domain.palettes) for(const mode of ['preset','custom']) {
    const preference={...domain.defaultPreference(),presetId:p.id,primary:p.primary,secondary:p.secondary,mode};
    assert.ok(f.c.personalAppearanceValidate_(preference));
  }
});
test('not_received explicit retry reuses the exact operation ID and fingerprint after cancel/reopen',async()=>{
  const options={dropBeforeDelivery:true},{f,c,calls}=connected(options);
  await c.open();c.setPreset('rose');await c.save();assert.equal(c.snapshot().status,'uncertain');assert.equal(f.writes.length,0);
  const first=calls.find(p=>p.action==='savePersonalAppearance');
  c.cancel();await c.open();c.setPreset('blue');options.dropBeforeDelivery=false;await c.save();
  const attempts=calls.filter(p=>p.action==='savePersonalAppearance');assert.equal(attempts.length,2);assert.deepEqual(attempts[1],first);
  assert.ok(calls.filter(p=>p.action==='getAdminOperationStatus').every(p=>p.clientOperationId===first.clientOperationId));
  assert.equal(c.snapshot().status,'saved');assert.equal(f.writes.filter(k=>k===f.key).length,1);
});
for(const state of ['running','uncertain','completed']) test(`${state} unknown result only checks the original operation; never resubmits`,async()=>{
  const options={loseResponse:true,statusOverride:state},{f,c,calls}=connected(options);
  await c.open();c.setPreset('rose');await c.save();assert.equal(c.snapshot().status,'uncertain');
  c.cancel();await c.open();await c.save();
  const sent=calls.filter(p=>p.action==='savePersonalAppearance');assert.equal(sent.length,1);
  assert.ok(calls.filter(p=>p.action==='getAdminOperationStatus').every(p=>p.clientOperationId===sent[0].clientOperationId));
  delete options.statusOverride;await c.save();assert.equal(c.snapshot().status,'saved');assert.equal(f.writes.filter(k=>k===f.key).length,1);
});
test('same-account token refresh preserves tracked identity for the same unreceived content',async()=>{
  const options={dropBeforeDelivery:true},{f,c,calls}=connected(options);
  await c.open();c.setPreset('rose');await c.save();const first=calls.find(p=>p.action==='savePersonalAppearance');
  c.setSession({owner:'Teacher A',token:'a2',verified:true,acting:false});await c.open();c.setPreset('rose');
  options.dropBeforeDelivery=false;await c.save();const attempts=calls.filter(p=>p.action==='savePersonalAppearance');
  assert.equal(attempts.length,2);assert.equal(attempts[1].sessionToken,'a2');assert.equal(attempts[1].clientOperationId,first.clientOperationId);
  assert.equal(attempts[1].preference,first.preference);assert.equal(attempts[1].expectedRevision,first.expectedRevision);
  assert.equal(c.snapshot().status,'saved');assert.equal(f.writes.filter(k=>k===f.key).length,1);
});
