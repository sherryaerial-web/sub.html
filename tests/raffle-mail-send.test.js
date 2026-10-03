const test=require('node:test'),assert=require('node:assert/strict');
const {setup,admin,campaign}=require('./helpers/raffle-mail-fixture');
test('sending reserves before delivery, sends only reviewed batch and never repeats request',()=>{
 const s=setup(7),source=JSON.stringify(s.rows);s.queue();s.queue();const p=s.c.previewRaffleMailSend_(admin,'future');assert.equal(p.batchCount,5);assert.equal(p.quota,100);assert.equal(s.mails.length,0);
 const op=s.operation(),r=s.c.sendRaffleMailBatch_(admin,op);assert.equal(r.sent,5);assert.equal(r.pendingReview,0);assert.equal(r.total,5);assert.equal(s.mails.length,5);assert.deepEqual(Object.keys(s.mails[0]).sort(),['body','name','subject','to']);assert.match(s.mails[0].body,/CODE-0/);
 assert.equal(s.c.sendRaffleMailBatch_(admin,op).sent,5);assert.equal(s.mails.length,5);assert.equal(s.c.previewRaffleMailSend_(admin,'future').batchCount,2);assert.equal(JSON.stringify(s.rows),source);
 assert.throws(()=>s.c.sendRaffleMailBatch_(admin,{...op,requestId:'request-send-00002'}),/變更/);assert.equal(s.mails.length,5);
});
test('all gates, source handoff and admin scope block send without new writes',()=>{
 for(const gate of ['RAFFLE_ENABLED','RAFFLE_WRITES_ENABLED','RAFFLE_MAIL_SEND_ENABLED','RAFFLE_MAIL_HANDOFF_JSON']){const s=setup();s.queue();const op=s.operation(),before=s.writes();s.props.delete(gate);assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/啟用|交接/);assert.equal(s.mails.length,0);assert.equal(s.writes(),before);}
 const s=setup();s.queue();assert.throws(()=>s.c.previewRaffleMailSend_({teacherName:'老師',managementCapabilities:[]},'future'),/權限/);assert.throws(()=>s.c.sendRaffleMailBatch_({teacherName:'老師',managementCapabilities:[]},s.operation()),/權限/);
});
test('insufficient or invalid quota leaves all jobs queued',()=>{
 for(const q of [0,1,NaN,-1]){const s=setup(2);s.queue();const op=s.operation(),before=s.writes();s.setQuota(q);assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/配額/);assert.equal(s.writes(),before);assert.equal(s.mails.length,0);assert.ok(s.c.readRaffleMailState_().jobs.every(j=>j.status==='queued'));}
 const s=setup(2);s.queue();s.setQuota(2);assert.equal(s.c.sendRaffleMailBatch_(admin,s.operation()).sent,2);
});
test('source or website changes invalidate queued content before delivery',()=>{
 for(const change of [s=>s.rows[1][0]='other@example.com',s=>s.rows[1][2]='NEW',s=>s.rows[1][4]='Yes',s=>s.rows[1][5]='Yes',s=>s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,websiteUrl:'https://example.com/other'}]))]){const s=setup();s.queue();const op=s.operation(),before=s.writes();change(s);assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/變更|不符/);assert.equal(s.writes(),before);assert.equal(s.mails.length,0);}
});
test('start flush uncertainty never sends and repeat observes held batch',()=>{
 const s=setup();s.queue();const op=s.operation();s.fault('after');assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/uncertain/);assert.equal(s.mails.length,0);assert.equal(s.c.sendRaffleMailBatch_(admin,op).pendingReview,1);assert.equal(s.mails.length,0);
});
test('start flush failure before persistence allows same confirmation with no earlier delivery',()=>{
 const s=setup();s.queue();const op=s.operation();s.fault('before');assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/failed/);assert.equal(s.mails.length,0);assert.equal(s.c.sendRaffleMailBatch_(admin,op).sent,1);
});
test('transport exception stops batch, keeps reservations, repeat cannot send remaining jobs',()=>{
 const s=setup(2);s.queue();const op=s.operation();s.fault('transport');const r=s.c.sendRaffleMailBatch_(admin,op);assert.equal(r.pendingReview,2);assert.equal(r.sent,0);assert.equal(s.mails.length,1);assert.equal(s.c.sendRaffleMailBatch_(admin,op).pendingReview,2);assert.equal(s.mails.length,1);assert.equal(s.c.previewRaffleInvitations_(admin,'future').candidateCount,0);
});
test('post-send journal failure never repeats accepted email or resumes remaining batch',()=>{
 for(const kind of ['before','after']){const s=setup(2);s.queue();const op=s.operation();s.fault(kind,2);assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/failed|uncertain/);assert.equal(s.mails.length,1);s.c.sendRaffleMailBatch_(admin,op);assert.equal(s.mails.length,1);}
});
test('manual reconciliation requires admin, reason, uncertain job and keeps reservations',()=>{
 const s=setup();s.queue();s.fault('transport');s.c.sendRaffleMailBatch_(admin,s.operation());const job=s.c.readRaffleMailState_().jobs[0],op={campaignId:'future',jobId:job.id,status:'sent',reason:'已向收件人確認收到',requestId:'manual-check-00001'};
 assert.throws(()=>s.c.reconcileRaffleMail_(admin,{...op,reason:''}),/理由/);assert.throws(()=>s.c.reconcileRaffleMail_({teacherName:'老師',managementCapabilities:[]},op),/權限/);
 assert.equal(s.c.reconcileRaffleMail_(admin,op).status,'sent');assert.equal(s.c.reconcileRaffleMail_(admin,op).status,'sent');assert.equal(s.mails.length,1);assert.equal(s.c.previewRaffleInvitations_(admin,'future').candidateCount,0);
 const record=s.c.getRaffleMailRecords_(admin,'future').records[0];assert.equal(record.status,'sent');assert.equal(record.reason,op.reason);assert.ok(!JSON.stringify(record).includes('CODE-0'));
});
test('valid-digest illegal status transitions or cross-campaign changes fail closed',()=>{
 const s=setup();s.queue();s.c.sendRaffleMailBatch_(admin,s.operation());const data=s.tables.get('RaffleMailJournal').data;
 const last=data[data.length-1],event=JSON.parse(last[4]);event.status='queued';last[4]=JSON.stringify(event);last[3]=s.c.raffleHash_(last[4]);assert.throws(()=>s.c.readRaffleMailState_(),/紀錄/);
});
test('old pending review attempts remain visible when more than fifty jobs are queued',()=>{
 const s=setup(60);for(let i=0;i<12;i++)s.queue();s.fault('transport');s.c.sendRaffleMailBatch_(admin,s.operation());
 const data=s.c.getRaffleMailRecords_(admin,'future');assert.equal(data.reviewCount,5);assert.equal(data.records.length,50);assert.equal(data.records.filter(j=>['sending','uncertain'].includes(j.status)).length,5);
 assert.equal(data.hasMore,true);const next=s.c.getRaffleMailRecords_(admin,'future',50);assert.equal(next.records.length,10);assert.equal(next.hasMore,false);assert.equal(new Set([...data.records,...next.records].map(j=>j.id)).size,60);
 assert.throws(()=>s.c.getRaffleMailRecords_(admin,'future',-1),/分頁/);
});
