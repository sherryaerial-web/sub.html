const test=require('node:test'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {createAdminTransport}=require('../admin-transport.js');
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
