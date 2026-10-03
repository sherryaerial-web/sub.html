const test=require('node:test'),assert=require('node:assert/strict');
const {setup,admin,campaign}=require('./helpers/raffle-mail-fixture');
function closed(){const s=setup();s.queue();const job=s.c.readRaffleMailState_().jobs[0];s.c.closeRaffleQueuedMail_(admin,{campaignId:'future',jobId:job.id,reason:'內容調整',requestId:'close-reopen-0001'});return{...s,job};}
function op(s){const p=s.c.previewRaffleMailReopen_(admin,'future',s.job.id);return{campaignId:'future',jobId:s.job.id,previewToken:p.previewToken,reason:'已核對新內容',requestId:'reopen-mail-0001'};}
test('reopen keeps exact job identity and qualification subset, preserves history, and never sends',()=>{
 const s=closed();s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,name:'更新活動'}]));s.rows.push([s.rows[1][0],'學生','NEW-CODE','new-purchase','','','']);
 const p=s.c.previewRaffleMailReopen_(admin,'future',s.job.id);assert.match(p.before.subject,/新活動/);assert.match(p.after.subject,/更新活動/);assert.ok(!p.after.body.includes('NEW-CODE'));assert.equal(s.mails.length,0);
 const request=op(s);s.fault('after');assert.throws(()=>s.c.reopenRaffleMail_(admin,request),/uncertain/);const n=s.writes();assert.equal(s.c.reopenRaffleMail_(admin,request).status,'queued');assert.equal(s.writes(),n);
 const state=s.c.readRaffleMailState_();assert.equal(state.jobs.length,1);assert.equal(state.jobs[0].id,s.job.id);assert.deepEqual(Array.from(state.jobs[0].qualificationIds),Array.from(s.job.qualificationIds));assert.match(state.events[0].event.jobs[0].subject,/新活動/);
 assert.equal(s.c.previewRaffleInvitations_(admin,'future').candidateCount,1);assert.equal(s.c.previewRaffleMailSend_(admin,'future').batchCount,1);assert.equal(s.mails.length,0);
});
test('reopen rejects changed recipient/qualification, stale source, gates, role and reason',()=>{
 for(const kind of ['email','code','used','stale','gate','role','reason']){const s=closed(),request=op(s),n=s.writes();
  if(kind==='email')s.rows[1][0]='other@example.com';if(kind==='code')s.rows[1][2]='changed';if(kind==='used')s.rows[1][4]='Yes';if(kind==='stale')s.rows[1][1]='新名字';if(kind==='gate')s.props.delete('RAFFLE_MAIL_QUEUE_ENABLED');if(kind==='reason')request.reason='';
  assert.throws(()=>s.c.reopenRaffleMail_(kind==='role'?{teacherName:'老師',managementCapabilities:[]}:admin,request));assert.equal(s.writes(),n);assert.equal(s.mails.length,0);
 }
});
test('only closed-before-send jobs reopen; replay cannot reopen a queued or attempted job',()=>{
 const s=setup();s.queue();const j=s.c.readRaffleMailState_().jobs[0];assert.throws(()=>s.c.previewRaffleMailReopen_(admin,'future',j.id));
 s.fault('transport');s.c.sendRaffleMailBatch_(admin,s.operation());s.c.reconcileRaffleMail_(admin,{campaignId:'future',jobId:j.id,status:'closed',reason:'結果未知',requestId:'close-attempt-0001'});assert.throws(()=>s.c.previewRaffleMailReopen_(admin,'future',j.id));
 const a=closed();a.c.reopenRaffleMail_(admin,op(a));const row=a.tables.get('RaffleMailJournal').data.at(-1),e=JSON.parse(row[4]);e.result.status='sent';row[4]=JSON.stringify(e);row[3]=a.c.raffleHash_(row[4]);assert.throws(()=>a.c.readRaffleMailState_(),/紀錄/);
});
