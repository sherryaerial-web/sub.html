const test=require('node:test'),assert=require('node:assert/strict');
const {setup:base,admin}=require('./helpers/raffle-mail-fixture');
function setup(count=1){
 const s=base(count),ob=[];s.props.set('OMCEAN_API_TOKEN','fixture-secret');
 s.c.UrlFetchApp={fetch:(url,options)=>{
  assert.equal(url,'https://api.omceanbooking.com/v1/messages');assert.equal(options.method,'post');assert.equal(options.followRedirects,false);
  assert.equal(options.headers.Authorization,'Bearer fixture-secret');const payload=JSON.parse(options.payload);
  assert.deepEqual(Object.keys(payload).sort(),['email','lineNotification','message','pushNotification']);assert.equal(payload.pushNotification,true);assert.equal(payload.lineNotification,false);
  const job=s.c.readRaffleMailState_().jobs.find(j=>j.email===payload.email);
  assert.equal(job.channels.ob.status,'sending');ob.push(payload);
  if(s.obThrow)throw Error('timeout');
  return {getResponseCode:()=>s.obCode||200,getContentText:()=>JSON.stringify(s.obResult||{recipientCount:1,messageIds:[100+ob.length]})};
 }};
 return Object.assign(s,{ob});
}
test('manual invitation confirmation sends both channels once with push and persists separate evidence',()=>{
 const s=setup();s.queue();const op=s.operation();assert.equal(s.ob.length,0);assert.equal(s.mails.length,0);
 const result=s.c.sendRaffleMailBatch_(admin,op);assert.equal(result.sent,1);assert.equal(s.ob.length,1);assert.equal(s.mails.length,1);
 assert.equal(s.ob[0].email,'student0@example.com');assert.match(s.ob[0].message,/CODE-0/);
 assert.ok(s.ob[0].message.endsWith('\n\n此為系統自動通知，請勿直接回覆。如有問題，請透過官方 LINE 聯繫我們。'));
 assert.ok(!s.mails[0].body.includes('請勿直接回覆'));
 const record=s.c.getRaffleMailRecords_(admin,'future').records[0];assert.equal(record.channels.email.status,'sent');assert.equal(record.channels.ob.status,'sent');assert.deepEqual(Array.from(record.channels.ob.messageIds),[101]);
 s.c.sendRaffleMailBatch_(admin,op);assert.equal(s.ob.length,1);assert.equal(s.mails.length,1);
});
test('OB footer is idempotent and included in the 1500-character limit',()=>{
 const s=setup(),footer='此為系統自動通知，請勿直接回覆。如有問題，請透過官方 LINE 聯繫我們。';
 const body='A'.repeat(1500-footer.length-2),message=body+'\n\n'+footer;
 assert.equal(s.c.formatObSystemMessage_(body),message);
 assert.equal(s.c.formatObSystemMessage_(message),message);
 assert.throws(()=>s.c.formatObSystemMessage_(body+'A'),/1500/);
 assert.throws(()=>s.c.formatObSystemMessage_(' '),/空白/);
});
test('OB timeout/ambiguous customer/malformed success never becomes all-sent; email still sends without retry',()=>{
 for(const configure of [s=>s.obThrow=true,s=>s.obCode=409,s=>s.obCode=404,s=>s.obResult={},s=>s.obResult={recipientCount:2,messageIds:[1,2]}]){
  const s=setup(2);s.queue();configure(s);const op=s.operation(),r=s.c.sendRaffleMailBatch_(admin,op);
  assert.equal(r.sent,0);assert.equal(r.pendingReview,2);assert.equal(s.mails.length,1);assert.equal(s.ob.length,1);
  const job=s.c.readRaffleMailState_().jobs[0];assert.equal(job.channels.email.status,'sent');assert.equal(job.channels.ob.status,'uncertain');
  s.c.sendRaffleMailBatch_(admin,op);assert.equal(s.ob.length,1);assert.equal(s.mails.length,1);
 }
});
test('email timeout does not suppress OB and neither channel is retried',()=>{
 const s=setup();s.queue();s.fault('transport');const op=s.operation();s.c.sendRaffleMailBatch_(admin,op);
 assert.equal(s.ob.length,1);const j=s.c.readRaffleMailState_().jobs[0];assert.equal(j.channels.email.status,'uncertain');assert.equal(j.channels.ob.status,'sent');assert.equal(j.status,'uncertain');
 s.c.sendRaffleMailBatch_(admin,op);assert.equal(s.ob.length,1);assert.equal(s.mails.length,1);
});
test('missing token and OB oversize body fail before any send or journal write',()=>{
 for(const kind of ['token','length']){const s=setup();if(kind==='length')s.rows[1][2]='X'.repeat(1501);s.queue();const op=s.operation(),before=s.writes();if(kind==='token')s.props.delete('OMCEAN_API_TOKEN');
 assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/OB|1500/);assert.equal(s.writes(),before);assert.equal(s.mails.length,0);assert.equal(s.ob.length,0);}
});
test('channel reservation/result flush failure prevents duplicate transport and preserves partial evidence',()=>{
 for(const offset of [2,3,4,5,6])for(const kind of ['before','after']){
  const s=setup();s.queue();const op=s.operation();s.fault(kind,offset);assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/failed|uncertain/);
  const counts=[s.mails.length,s.ob.length];s.c.sendRaffleMailBatch_(admin,op);assert.deepEqual([s.mails.length,s.ob.length],counts);
 }
});
test('unattempted channel cannot be manually claimed as sent; old email-only events remain readable',()=>{
 const s=setup(2);s.queue();s.fault('transport');s.c.sendRaffleMailBatch_(admin,s.operation());const j=s.c.readRaffleMailState_().jobs[1];
 assert.throws(()=>s.c.reconcileRaffleMail_(admin,{campaignId:'future',jobId:j.id,status:'sent',reason:'未核對',requestId:'reconcile-dual-01'}),/尚未發送/);
 const t=setup();t.queue();const queued=t.c.readRaffleMailState_().jobs[0];
 const events=[{action:'send-start',actor:'店長',campaignId:'future',jobIds:[queued.id]},{action:'send-result',actor:'店長',campaignId:'future',jobId:queued.id,attemptId:'legacy-start-0001',status:'sent'}];
 t.c.withScriptLock_(()=>events.forEach((e,i)=>t.c.appendRaffleMailEvent_(t.c.readRaffleMailState_(),{requestId:i?'mail_result_'+t.c.raffleHash_(JSON.stringify(['legacy-start-0001',queued.id])):'legacy-start-0001',requestHash:t.c.raffleHash_(JSON.stringify(e))},e)));
 assert.equal(t.c.readRaffleMailState_().jobs[0].status,'sent');assert.equal(t.c.getRaffleMailRecords_(admin,'future').records[0].channels,null);assert.equal(t.ob.length,0);
});
