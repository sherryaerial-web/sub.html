const test=require('node:test'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {createAdminTransport}=require('../admin-transport.js');
test('ready notification owns its receipt: lost send is not retried and readback is not blocked',async()=>{
 const s=fixture(p=>{assert.equal(p.clientOperationId,undefined);if(p.action==='dispatchRaffleReadyAppDelivery')throw Error('lost');return{status:'success',data:{testOnly:true}};});
 const t=s.make(),params={sessionToken:'session-a',expectedActor:'Tako',campaignId:'future'};
 await assert.rejects(t.call('dispatchRaffleReadyAppDelivery',{...params,operation:'{}'}));
 assert.equal((await t.call('reconcileRaffleReadyAppDelivery',{...params,operation:'{}'})).testOnly,true);
 assert.deepEqual(s.calls.map(p=>p.action),['dispatchRaffleReadyAppDelivery','reconcileRaffleReadyAppDelivery']);assert.equal(s.data.size,0);
});
test('gift journal owns reconciliation without an outer receipt blocking its same-ID retry',async()=>{
 const s=fixture(p=>{assert.equal(p.clientOperationId,undefined);return {status:'success',data:{state:'recorded'}};});
 await s.make().call('mutateActivityGift',{sessionToken:'session-a',expectedActor:'Tako',operation:{requestId:'gift-request-0001'}});
 assert.equal(s.data.size,0);
});
function fixture(handler) {
 const data=new Map(),calls=[],notices=[];
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const fetch=async(_url,options)=>{const params=Object.fromEntries(new URLSearchParams(options.body));calls.push(params);return {ok:true,json:async()=>handler(params)};};
 const make=(extra={})=>createAdminTransport({url:'https://example.test/exec',fetch,storage,crypto:webcrypto,getSessionToken:()=> 'session-a',getSessionOwner:()=> 'Tako',onStatus:(...args)=>notices.push(args),timeoutMs:20,...extra});
 return {make,calls,data,notices};
}
test('returning from another app checks the session before sending and never reloads form inputs',async()=>{
 const s=fixture(p=>({status:'success',data:p.action==='getSession'?{teacherName:'Tako'}:{id:'booking'}})),t=s.make();
 await t.resume();const result=await t.call('createPracticeBooking',{sessionToken:'session-a',practice:{time:'11:00'}});
 assert.equal(result.id,'booking');assert.deepEqual(s.calls.map(p=>p.action),['getSession','createPracticeBooking']);
 assert.ok(s.calls[1].clientOperationId);assert.equal(s.calls[1].transport,undefined);
});
test('lost response queries receipt, returns confirmed result and never repeats mutation',async()=>{
 const s=fixture(p=>{if(p.action==='createPracticeBooking')throw Error('lost network');return {status:'success',data:{state:'completed',payload:{status:'success',data:{id:'booking'}}}};});
 assert.equal((await s.make().call('createPracticeBooking',{sessionToken:'session-a'})).id,'booking');
 assert.deepEqual(s.calls.map(p=>p.action),['createPracticeBooking','getAdminOperationStatus']);
});
test('unknown outcome survives reopening and a repeated click only checks status',async()=>{
 const s=fixture(p=>{if(p.action==='issueInvoiceBatch')throw Error('lost network');return {status:'success',data:{state:'running'}};});
 const params={sessionToken:'session-a',invoiceIds:['one','two']};
 await assert.rejects(s.make().call('issueInvoiceBatch',params),/處理中|待確認/);
 await assert.rejects(s.make().call('issueInvoiceBatch',params),/處理中|待確認/);
 assert.equal(s.calls.filter(p=>p.action==='issueInvoiceBatch').length,1);
});
test('not received cannot be mistaken for failure or automatically resent',async()=>{
 const s=fixture(p=>{if(p.action==='confirmStudentPracticeQualification')throw Error('offline');return {status:'success',data:{state:'not_received'}};});
 await assert.rejects(s.make().call('confirmStudentPracticeQualification',{sessionToken:'session-a',participantId:'p1'}),/未確認|待確認/);
 assert.equal(s.calls.filter(p=>p.action==='confirmStudentPracticeQualification').length,1);
});
test('failed resume preflight never sends a write or discards persisted pending metadata',async()=>{
 const s=fixture(()=>{throw Error('offline');}),t=s.make();await t.resume();
 await assert.rejects(t.call('createPracticeBooking',{sessionToken:'session-a'}),/尚未送出/);
 assert.equal(s.calls.some(p=>p.action==='createPracticeBooking'),false);
});
test('double-click shares one mutation and stores no input values or tokens',async()=>{
 const s=fixture(()=>({status:'success',data:{id:'ok'}})),t=s.make();
 await Promise.all([t.call('createPracticeBooking',{sessionToken:'session-a',practice:{note:'private note'}}),t.call('createPracticeBooking',{sessionToken:'session-a',practice:{note:'private note'}})]);
 assert.equal(s.calls.length,1);assert.ok(!JSON.stringify([...s.data.values()]).includes('session-a'));assert.ok(!JSON.stringify([...s.data.values()]).includes('private note'));
});
test('same account after login again reconciles original receipt rather than submitting again',async()=>{
 const s=fixture(p=>{if(p.action==='createPracticeBooking')throw Error('lost');return {status:'success',data:{state:'running'}};});
 await assert.rejects(s.make().call('createPracticeBooking',{sessionToken:'session-a'}));
 await assert.rejects(s.make().call('createPracticeBooking',{sessionToken:'new-token'}));
 assert.equal(s.calls.filter(p=>p.action==='createPracticeBooking').length,1);
});
test('evicted result requires explicit reconciliation and never resends in the acknowledgment click',async()=>{
 const s=fixture(p=>{if(p.action==='syncInvoicePurchases')throw Error('lost');return {status:'success',data:{state:'completed',payload:null}};});
 await assert.rejects(s.make().call('syncInvoicePurchases',{sessionToken:'session-a'}));
 await assert.rejects(s.make().call('syncInvoicePurchases',{sessionToken:'session-a'}));
 assert.equal(JSON.parse([...s.data.values()][0]).length,1);
 await assert.rejects(s.make({confirmReconciled:()=>true}).call('syncInvoicePurchases',{sessionToken:'session-a'}),/本次未送出/);
 assert.equal(JSON.parse([...s.data.values()][0]).length,0);
 assert.equal(s.calls.filter(p=>p.action==='syncInvoicePurchases').length,1);
});

test('resume identifies the original action and its time instead of blaming the current page',async()=>{
 const s=fixture(p=>{if(p.action==='createPracticeBooking')throw Error('lost');return {status:'success',data:{state:'expired'}};});const t=s.make();
 await assert.rejects(t.call('createPracticeBooking',{sessionToken:'session-a'}));
 await t.resume();
 const notice=s.notices.at(-1);assert.match(notice[0],/自主練習/);assert.match(notice[0],/確認期限/);assert.match(notice[0],/\d{4}/);
 assert.equal(s.calls.filter(p=>p.action==='createPracticeBooking').length,1);assert.equal(JSON.parse([...s.data.values()][0]).length,1);
});

const pendingKey='sherry-admin-pending-v1';
async function pendingRecord(owner='Tako',extra={}) {
 const hash=async value=>Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
 const action='createPracticeBooking';
 return {id:Date.parse('2026-10-09T00:54:55+08:00').toString(36)+'_old-operation',owner:await hash(owner),signature:await hash(JSON.stringify([await hash(owner),action,[]])),action,...extra};
}
function stored(s) { return JSON.parse(s.data.get(pendingKey)); }
function hasExpiredNotice(s,record=stored(s)[0]) {
 return s.data.get('sherry-admin-expiry-notice-v1:'+JSON.stringify([record.owner,record.id]))==='expired';
}
function statusFixture() {
 let state='expired',fail=false;
 const s=fixture(p=>{
  if(p.action==='getSession')return {status:'success',data:{}};
  assert.equal(p.action,'getAdminOperationStatus');
  if(fail)throw Error('new network failure');
  return {status:'success',data:{state}};
 });
 return {...s,setState:value=>{state=value;},setFailure:value=>{fail=value;}};
}
test('expired notice persists across resumes, session refresh and page reconstruction without removing protection',async()=>{
 const s=statusFixture(),record=await pendingRecord();s.data.set(pendingKey,JSON.stringify([record]));
 let token='session-a';const t=s.make({getSessionToken:()=>token});
 await t.resume();await t.resume();token='refreshed-token';await t.resume();
 await s.make({getSessionToken:()=>token}).resume();
 assert.equal(s.notices.length,1);
 assert.deepEqual(stored(s),[record]);
 assert.equal(hasExpiredNotice(s),true);
 assert.equal(s.calls.filter(p=>p.action==='getAdminOperationStatus').length,4);
});
test('expired suppression is scoped to owner and ID, including identical IDs for another owner',async()=>{
 const s=statusFixture(),a=await pendingRecord(),b=await pendingRecord('Other',{id:a.id});
 s.data.set(pendingKey,JSON.stringify([a,b]));let owner='Tako';const t=s.make({getSessionOwner:()=>owner});
 await t.resume();await t.resume();owner='Other';await t.resume();await t.resume();
 const fresh=await pendingRecord('Other',{id:b.id+'-new'});s.data.set(pendingKey,JSON.stringify(stored(s).concat(fresh)));
 await t.resume();owner='Tako';await t.resume();
 assert.equal(s.notices.length,3);assert.equal(stored(s).length,3);
 assert.deepEqual(s.calls.filter(p=>p.action==='getAdminOperationStatus').map(p=>p.clientOperationId),[a.id,a.id,b.id,b.id,b.id,fresh.id,a.id]);
});
test('uncertain resets expired notice durably so a later expired transition alerts once again',async()=>{
 const s=statusFixture();s.data.set(pendingKey,JSON.stringify([await pendingRecord()]));const t=s.make();
 await t.resume();s.setState('uncertain');await t.resume();
 assert.equal(hasExpiredNotice(s),false);
 s.setState('expired');const reopened=s.make();await reopened.resume();await reopened.resume();
 assert.deepEqual(s.notices.map(n=>n[1]),['expired','uncertain','expired']);
});
test('a new status query failure or new unknown receipt is not hidden by an old expired notice',async()=>{
 const s=statusFixture();s.data.set(pendingKey,JSON.stringify([await pendingRecord()]));const t=s.make();
 await t.resume();s.setFailure(true);await t.resume();s.setFailure(false);await t.resume();await t.resume();
 assert.deepEqual(s.notices.map(n=>n[1]),['expired','uncertain','expired']);
 s.setState('uncertain');s.data.set(pendingKey,JSON.stringify(stored(s).concat(await pendingRecord('Tako',{id:Date.now().toString(36)+'_new-operation'}))));
 await t.resume();assert.deepEqual(s.notices.slice(-2).map(n=>n[1]),['uncertain','uncertain']);
});
test('failed notice persistence falls back to in-page dedup and still resets on uncertain',async()=>{
 const s=statusFixture(),record=await pendingRecord(),original=JSON.stringify([record]);s.data.set(pendingKey,original);
 const t=s.make({storage:{getItem:k=>s.data.get(k)||null,setItem:()=>{throw Error('storage denied');}}});
 await t.resume();await t.resume();s.setState('uncertain');await t.resume();s.setState('expired');await t.resume();await t.resume();
 assert.deepEqual(s.notices.map(n=>n[1]),['expired','uncertain','expired']);
 assert.equal(s.data.get(pendingKey),original);
});
test('failed reset persistence overrides an old durable expired marker in the same page',async()=>{
 const s=statusFixture();s.data.set(pendingKey,JSON.stringify([await pendingRecord()]));await s.make().resume();
 const t=s.make({storage:{getItem:k=>s.data.get(k)||null,setItem:()=>{throw Error('storage denied');}}});
 s.setState('uncertain');await t.resume();s.setState('expired');await t.resume();await t.resume();
 assert.deepEqual(s.notices.map(n=>n[1]),['expired','uncertain','expired']);
});
test('silent storage rejection dedups in-page and persists once storage recovers',async()=>{
 const s=statusFixture(),record=await pendingRecord();s.data.set(pendingKey,JSON.stringify([record]));let writable=false;
 const t=s.make({storage:{getItem:k=>s.data.get(k)||null,setItem:(k,v)=>{if(writable)s.data.set(k,v);}}});
 await t.resume();await t.resume();assert.deepEqual(stored(s),[record]);assert.equal(s.notices.length,1);
 writable=true;await t.resume();await s.make().resume();
 assert.equal(hasExpiredNotice(s),true);assert.equal(s.notices.length,1);
});
test('notice metadata merges latest records without reviving removed receipts or losing concurrent additions',async()=>{
 const a=await pendingRecord(),b=await pendingRecord('Tako',{id:a.id+'-other'}),added=await pendingRecord('Other');
 const s=fixture(p=>{
  if(p.action==='getSession')return {status:'success',data:{}};
  const records=stored(s);
  if(p.clientOperationId===a.id)s.data.set(pendingKey,JSON.stringify(records.filter(r=>r.id!==a.id).concat(added)));
  else s.data.set(pendingKey,JSON.stringify(records.map(r=>r.id===b.id?{...r,concurrentField:'preserved'}:r)));
  return {status:'success',data:{state:'expired'}};
 });
 s.data.set(pendingKey,JSON.stringify([a,b]));await s.make().resume();
 assert.deepEqual(stored(s).map(r=>r.id),[b.id,added.id]);
 assert.equal(stored(s)[0].concurrentField,'preserved');assert.equal(hasExpiredNotice(s),true);
 assert.deepEqual(stored(s)[1],added);
});
test('expired reminder bookkeeping never overwrites pending receipts added by another tab before storage write',async()=>{
 const s=statusFixture(),record=await pendingRecord(),added=await pendingRecord('Other');
 s.data.set(pendingKey,JSON.stringify([record]));let interleaved=false;const writes=[];
 const t=s.make({storage:{getItem:k=>s.data.get(k)||null,setItem:(k,v)=>{
  writes.push(k);
  if(!interleaved){interleaved=true;s.data.set(pendingKey,JSON.stringify(stored(s).concat(added)));}
  s.data.set(k,v);
 }}});
 await t.resume();
 assert.equal(interleaved,true);
 assert.deepEqual(stored(s),[record,added]);
 assert.equal(writes.includes(pendingKey),false);
});
test('suppressed old expiry still requires original confirmation and neither acknowledgment click resends',async()=>{
 const s=statusFixture(),record=await pendingRecord();s.data.set(pendingKey,JSON.stringify([record]));let confirmations=0;
 const t=s.make({confirmReconciled:()=>{confirmations++;return false;}});await t.resume();await t.resume();
 await assert.rejects(t.call(record.action,{sessionToken:'refreshed-token'}),/待確認/);
 assert.equal(confirmations,1);assert.equal(stored(s).length,1);
 await assert.rejects(s.make({confirmReconciled:()=>true}).call(record.action,{sessionToken:'another-token'}),/本次未送出/);
 assert.equal(stored(s).length,0);assert.ok(s.calls.every(p=>['getSession','getAdminOperationStatus'].includes(p.action)));
 assert.equal(s.notices.length,1);
});
test('no token never queries or marks expiry and completed leftovers remain unchanged',async()=>{
 const s=statusFixture(),record=await pendingRecord();s.data.set(pendingKey,JSON.stringify([record]));
 await s.make({getSessionToken:()=>''}).resume();assert.equal(s.calls.length,0);assert.deepEqual(stored(s),[record]);
 s.setState('completed');await s.make().resume();assert.deepEqual(stored(s),[record]);assert.equal(s.notices[0][1],'completed');
});
