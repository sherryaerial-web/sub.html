const test=require('node:test'),assert=require('node:assert/strict');
const {setup:base,admin,campaign}=require('./helpers/raffle-mail-fixture');
test('ready notice reopening uses current source and same prize set without including newly ready awards',()=>{
 const s=setup(2,true);s.seeds[2][9]='waiting';s.queueReady();const job=s.c.readRaffleMailState_().jobs[0];
 s.c.closeRaffleQueuedMail_(admin,{campaignId:'future',jobId:job.id,reason:'更新期限',requestId:'ready-close-00001'});s.seeds[2][9]='ready';
 s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,pickupDeadline:'2099-12-31T00:00Z'}]));
 const p=s.c.previewRaffleMailReopen_(admin,'future',job.id);assert.match(p.after.body,/2099/);assert.ok(!p.after.body.includes('劍潭'));assert.equal(p.kind,'ready');
 const op={campaignId:'future',jobId:job.id,previewToken:p.previewToken,reason:'確認期限',requestId:'ready-reopen-0001'};
 s.props.delete('RAFFLE_READY_MAIL_ENABLED');assert.throws(()=>s.c.reopenRaffleMail_(admin,op),/啟用/);s.props.set('RAFFLE_READY_MAIL_ENABLED','true');
 s.c.reopenRaffleMail_(admin,op);assert.equal(s.c.previewRaffleReadyMailSend_(admin,'future').batchCount,1);assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,1);assert.equal(s.mails.length,0);
});
test('revocation or accepted source change blocks old pickup mail without releasing stable reservation',()=>{
 for(const action of ['revoke','resolve']){
  const s=setup(1);s.tables.set('RaffleJournal',s.sheet([]));s.queueReady();const op=s.sendOp(),claim=s.c.readRaffleClaims_()[0];
  if(action==='revoke')s.c.mutateRaffleClaim_(admin,{claimId:claim.id,version:0,action:'revoke',reason:'取消剩餘交付',requestId:'revoke-mail-test-01'});
  else {s.rows[1][9]='劍潭';const p=s.c.previewRaffleImport_(admin,'future');s.c.resolveRaffleConflict_(admin,{campaignId:'future',claimId:claim.id,version:0,previewToken:p.previewToken,reason:'改館',requestId:'resolve-mail-test-01'});}
  assert.throws(()=>s.c.sendRaffleReadyMailBatch_(admin,op));assert.equal(s.mails.length,0);
  assert.equal(s.c.readRaffleMailState_().readyReservations.length,1);assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,0);
 }
});
function setup(count=2,sameEmail=false){
 const s=base(count);s.props.set('RAFFLE_READY_MAIL_ENABLED','true');
 s.rows[0].push('中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間');s.rows.slice(1).forEach((r,i)=>{if(sameEmail)r[0]='same@example.com';r[4]='Yes';r.push('A','提袋',i%2?'劍潭':'晴光','choose_venue','2027-01-01');});
 const prizes=[['獎項ID','獎項等級','獎品名稱','領獎方式'],['p1','A','提袋','choose_venue']];
 s.c.SpreadsheetApp.openById=id=>{assert.equal(id,campaign.sourceSpreadsheetId);return{getSheetByName:n=>n==='抽獎名單'?s.sheet(s.rows):n==='獎項設定'?s.sheet(prizes):null};};
 const claims=s.c.buildRaffleImportPreview_(campaign,s.rows,prizes,[]).additions.map(c=>({...c,status:'ready'}));
 const headers=['id','campaignId','email','studentName','prizeId','prizeName','venue','quantity','claimedQuantity','status','claimedAt','claimedBy','sourceFingerprint'];
 const seeds=[headers,...claims.map(c=>headers.map(k=>c[k]??''))];s.tables.set('RaffleClaims',s.sheet(seeds));
 return{...s,claims,seeds,prizes,queueReady:(id='ready-queue-00001')=>s.c.confirmRaffleReadyNotifications_(admin,{campaignId:'future',previewToken:s.c.previewRaffleReadyNotifications_(admin,'future').previewToken,requestId:id}),sendOp:()=>({campaignId:'future',previewToken:s.c.previewRaffleReadyMailSend_(admin,'future').previewToken,requestId:'ready-send-00001'})};
}
test('legacy queued ready subject still sends once after fresh review, without changing stored content',()=>{
 const s=setup(1);s.queueReady();const row=s.tables.get('RaffleMailJournal').data[1],event=JSON.parse(row[4]);event.jobs[0].subject='新活動｜獎品可領取通知';row[4]=JSON.stringify(event);row[3]=s.c.raffleHash_(row[4]);
 const op=s.sendOp();assert.equal(s.c.sendRaffleReadyMailBatch_(admin,op).sent,1);assert.equal(s.mails[0].subject,'新活動｜獎品可領取通知');
 s.c.sendRaffleReadyMailBatch_(admin,op);assert.equal(s.mails.length,1);
});
test('ready notices merge same email, use remaining quantity and exclude unready/digital/claimed',()=>{
 const s=setup(5),claims=s.claims.map((c,i)=>({...c,email:'same@example.com',status:['ready','partial','waiting','digital','claimed'][i],quantity:i===1?3:1,claimedQuantity:i===1?1:i===4?1:0}));
 const p=s.c.buildRaffleReadyNotificationPreview_(campaign,claims,[]);assert.equal(p.jobs.length,1);assert.equal(p.jobs[0].kind,'ready');assert.equal(p.jobs[0].qualificationIds.length,2);assert.match(p.jobs[0].body,/晴光.*1 件/);assert.match(p.jobs[0].body,/劍潭.*2 件/);assert.match(p.jobs[0].body,/example.com\/raffle/);assert.ok(!p.jobs[0].body.includes('CODE-'));assert.equal(p.skipped,3);
});
test('preview/queue never mail or change claims/source; actual sender is separate from invitations',()=>{
 const s=setup(),original=JSON.stringify([s.rows,s.seeds,s.prizes]);const p=s.c.previewRaffleReadyNotifications_(admin,'future');assert.equal(p.candidateCount,2);assert.equal(p.readOnly,false);assert.equal(s.writes(),0);assert.equal(s.mails.length,0);
 s.queueReady();assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,0);assert.equal(s.c.previewRaffleMailSend_(admin,'future').batchCount,0);
 const ob=[];s.c.UrlFetchApp={fetch:(url,options)=>{ob.push(JSON.parse(options.payload));return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({recipientCount:1,messageIds:[100+ob.length]})};}};
 const op=s.sendOp(),r=s.c.sendRaffleReadyMailBatch_(admin,op);assert.equal(r.sent,2);assert.equal(s.mails.length,2);assert.match(s.mails[0].subject,/領獎/);assert.equal(JSON.stringify([s.rows,s.seeds,s.prizes]),original);assert.equal(s.c.sendRaffleReadyMailBatch_(admin,op).sent,2);assert.equal(s.mails.length,2);
 assert.equal(ob.length,2);assert.equal(ob[0].pushNotification,true);assert.match(ob[0].message,/領獎通知/);assert.ok(!ob[0].message.includes('CODE-'));assert.equal(s.c.getRaffleMailRecords_(admin,'future').records[0].channels.ob.status,'sent');
 assert.equal(s.c.getRaffleMailRecords_(admin,'future').records[0].kind,'ready');
});
test('permissions and dedicated ready gate block queue/send but preview stays read only',()=>{
 const s=setup();assert.throws(()=>s.c.previewRaffleReadyNotifications_({teacherName:'Tako',managementCapabilities:['raffle_fulfillment']},'future'),/權限/);assert.equal(s.writes(),0);
 s.props.delete('RAFFLE_READY_MAIL_ENABLED');assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').readOnly,true);assert.throws(()=>s.queueReady(),/啟用/);assert.equal(s.writes(),0);
 s.props.set('RAFFLE_READY_MAIL_ENABLED','true');s.queueReady();const op=s.sendOp();s.props.delete('RAFFLE_READY_MAIL_ENABLED');assert.equal(s.c.previewRaffleReadyMailSend_(admin,'future').sendEnabled,false);assert.throws(()=>s.c.sendRaffleReadyMailBatch_(admin,op),/啟用/);assert.equal(s.mails.length,0);
});
test('changed pickup status or source blocks queued notification; preview snapshot becomes stale',()=>{
 for(const change of [s=>{s.seeds[1][8]=1;s.seeds[1][9]='claimed';},s=>{s.rows[1][9]='其他館';},s=>{s.rows.splice(1,1);},s=>{s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,pickupDeadline:'2000-01-01T00:00+08:00'}]));}]){
  const s=setup();s.queueReady();const op=s.sendOp(),writes=s.writes();change(s);assert.throws(()=>s.c.sendRaffleReadyMailBatch_(admin,op),/變更|不符|截止|来源|來源/);assert.equal(s.mails.length,0);assert.equal(s.writes(),writes);
 }
 const s=setup(),p=s.c.previewRaffleReadyNotifications_(admin,'future');s.seeds[1][9]='waiting';assert.throws(()=>s.c.confirmRaffleReadyNotifications_(admin,{campaignId:'future',previewToken:p.previewToken,requestId:'ready-queue-00001'}),/變更/);
});
test('ready identity remains reserved after correction/version bump; newly prepared claim is eligible separately',()=>{
 const s=setup();s.seeds[2][9]='waiting';s.queueReady();s.c.sendRaffleReadyMailBatch_(admin,s.sendOp());s.seeds[2][9]='ready';const p=s.c.previewRaffleReadyNotifications_(admin,'future');assert.equal(p.candidateCount,1);assert.equal(p.previews[0].email,'student1@example.com');
 const plan=s.c.buildRaffleReadyNotificationPreview_(campaign,s.claims.map(c=>({...c,version:99})),s.c.readRaffleMailState_().readyReservations);assert.equal(plan.jobs.length,1);
});
test('ready send quota and uncertain delivery retain reservations and never retry automatically',()=>{
 const s=setup();s.queueReady();const op=s.sendOp();s.setQuota(1);assert.throws(()=>s.c.sendRaffleReadyMailBatch_(admin,op),/配額/);assert.equal(s.mails.length,0);s.setQuota(10);s.fault('transport');assert.equal(s.c.sendRaffleReadyMailBatch_(admin,op).pendingReview,2);assert.equal(s.mails.length,1);s.c.sendRaffleReadyMailBatch_(admin,op);assert.equal(s.mails.length,1);assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,0);
});
test('uncertain ready queue/start flush is idempotent and never leaks into invitation delivery',()=>{
 const s=setup(),p=s.c.previewRaffleReadyNotifications_(admin,'future'),op={campaignId:'future',previewToken:p.previewToken,requestId:'ready-queue-00001'};s.fault('after');assert.throws(()=>s.c.confirmRaffleReadyNotifications_(admin,op),/uncertain/);assert.equal(s.c.confirmRaffleReadyNotifications_(admin,op).queued,2);assert.equal(s.c.readRaffleMailState_().jobs.length,2);
 const send=s.sendOp();s.fault('after');assert.throws(()=>s.c.sendRaffleReadyMailBatch_(admin,send),/uncertain/);assert.equal(s.mails.length,0);assert.equal(s.c.sendRaffleReadyMailBatch_(admin,send).pendingReview,2);assert.equal(s.c.readRaffleMailState_().reservations.length,0);
});
test('different notification types cannot reuse an attempt ID or invalid journal kind',()=>{
 const s=setup();s.queueReady();const op=s.sendOp();s.c.sendRaffleReadyMailBatch_(admin,op);assert.throws(()=>s.c.sendRaffleMailBatch_(admin,op),/識別/);
 const row=s.tables.get('RaffleMailJournal').data[1],e=JSON.parse(row[4]);e.jobs[0].kind='unknown';row[4]=JSON.stringify(e);row[3]=s.c.raffleHash_(row[4]);assert.throws(()=>s.c.readRaffleMailState_(),/紀錄/);
});
test('later readiness for same email does not alter queued prize set or resend earlier prize',()=>{
 const s=setup(2,true);s.seeds[2][9]='waiting';s.queueReady();s.seeds[2][9]='ready';const p=s.c.previewRaffleReadyMailSend_(admin,'future');assert.equal(p.batchCount,1);assert.ok(!p.previews[0].body.includes('劍潭'));s.c.sendRaffleReadyMailBatch_(admin,s.sendOp());const later=s.c.previewRaffleReadyNotifications_(admin,'future');assert.equal(later.candidateCount,1);assert.match(later.previews[0].body,/劍潭/);assert.ok(!later.previews[0].body.includes('晴光'));
});
test('two staggered queues for same email retain their own prize sets at send time',()=>{
 const s=setup(2,true);s.seeds[2][9]='waiting';s.queueReady();s.seeds[2][9]='ready';s.queueReady('ready-queue-00002');
 const p=s.c.previewRaffleReadyMailSend_(admin,'future');assert.equal(p.batchCount,2);assert.match(p.previews[0].body,/晴光/);assert.ok(!p.previews[0].body.includes('劍潭'));assert.match(p.previews[1].body,/劍潭/);assert.ok(!p.previews[1].body.includes('晴光'));
 assert.equal(s.c.sendRaffleReadyMailBatch_(admin,s.sendOp()).sent,2);assert.equal(s.mails.length,2);assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,0);
});
test('invitation and pickup jobs coexist without cross-delivery or cross-reservation',()=>{
 const s=setup();s.rows.push(['new@example.com','新學生','NEW-CODE','new-buy','','','','','','','','']);s.queue();s.queueReady();assert.equal(s.c.previewRaffleMailSend_(admin,'future').batchCount,1);assert.equal(s.c.previewRaffleReadyMailSend_(admin,'future').batchCount,2);s.c.sendRaffleReadyMailBatch_(admin,s.sendOp());assert.equal(s.mails.length,2);assert.ok(s.mails.every(m=>!m.body.includes('NEW-CODE')));assert.equal(s.c.previewRaffleMailSend_(admin,'future').batchCount,1);assert.equal(s.c.previewRaffleInvitations_(admin,'future').candidateCount,0);
});
test('manual closure of uncertain ready notice never releases prize identity',()=>{
 const s=setup(1);s.queueReady();s.fault('transport');s.c.sendRaffleReadyMailBatch_(admin,s.sendOp());const job=s.c.readRaffleMailState_().jobs[0];s.c.reconcileRaffleMail_(admin,{campaignId:'future',jobId:job.id,status:'closed',reason:'確認不重寄',requestId:'ready-review-0001'});assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,0);assert.equal(s.mails.length,1);
});
test('closing obsolete queued ready notice unblocks next job without re-queuing closed prize',()=>{
 const s=setup();s.queueReady();s.seeds[1][8]=1;s.seeds[1][9]='claimed';assert.throws(()=>s.sendOp(),/不符/);
 const job=s.c.readRaffleMailState_().jobs[0];s.c.closeRaffleQueuedMail_(admin,{campaignId:'future',jobId:job.id,reason:'學生已領取，停止通知',requestId:'ready-close-0001'});
 assert.equal(s.c.previewRaffleReadyMailSend_(admin,'future').batchCount,1);assert.equal(s.c.sendRaffleReadyMailBatch_(admin,s.sendOp()).sent,1);assert.equal(s.mails[0].to,'student1@example.com');s.seeds[1][8]=0;s.seeds[1][9]='ready';assert.equal(s.c.previewRaffleReadyNotifications_(admin,'future').candidateCount,0);
});
