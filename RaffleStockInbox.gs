// Complete add-on for the existing classroom GAS. No LINE stock pushes.
function raffleStockAppNotice_(claim) {
  if (!claim || claim.status !== 'waiting' || !claim.id || !claim.campaignId || !claim.venue || claim.claimedQuantity !== 0 ||
      !Number.isSafeInteger(claim.quantity) || claim.quantity < 1 || !claim.studentName || !claim.prizeName ||
      !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(claim.email || '') || /[\r\n]/.test(claim.studentName + claim.prizeName + claim.venue)) throw Error('備貨資料不完整，未通知。');
  var message = {heading:'聖誕活動｜待備貨送館',
    content:'學生：' + claim.studentName + '\nEmail：' + claim.email + '\n獎品：' + claim.prizeName + '\n數量：' + claim.quantity + ' 件\n領取館別：' + claim.venue + '\n請備貨送至指定館別，到館後在「獎品／館別備貨清單」逐筆確認到館並通知學生。',
    eventKey:'raffle-stock-v1-' + raffleHash_(JSON.stringify([claim.campaignId,claim.id,claim.sourceFingerprint])),
    type:'raffle-stock',relatedId:claim.id,actor:'系統備貨同步',url:buildAppViewUrl_('admin','raffle')};
  var result = persistInboxNotification_(['Tako'],message);
  if (!result || result.saved !== true) throw Error('備貨訊息尚未保存。');
  // The inbox is authoritative. Push is a one-time hint; unknown outcomes are not retried.
  if (result.appendedRecipients > 0) { try { sendPushNotificationSafely_(['Tako'],message); } catch (_) {} }
  return {saved:true,duplicate:result.appendedRecipients === 0};
}

function runRaffleStockAppSync() {
  var p=PropertiesService.getScriptProperties();
  if (p.getProperty('RAFFLE_STOCK_APP_ENABLED') !== 'true' || p.getProperty('RAFFLE_WRITES_ENABLED') !== 'true' || p.getProperty('RAFFLE_ACCESS_TEST_ONLY') === 'true') return {disabled:true};
  if (ScriptApp.getScriptId() !== '16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW') throw Error('備貨同步專案不符。');
  var now=Date.now(),start=Date.parse('2026-11-15T00:00:00+08:00'),end=Date.parse('2027-01-31T00:00:00+08:00');
  if (now<start || now>=end) return {outsideWindow:true};
  var config=getRaffleConfiguration_(),campaigns=config.enabled?config.campaigns.filter(function(c){return c.sourceSpreadsheetId==='1Sdi96hIru-Vag8hFl6bEo6xMhpjgVkro75dH1PNvpRM';}):[];
  if (campaigns.length!==1) throw Error('正式活動無法唯一確認，未同步。');
  var campaign=campaigns[0],pending=withScriptLock_(function(){
    var plan=raffleImportPlan_(campaign),state=readRaffleState_();
    if(plan.preview.errors.length || plan.preview.conflicts.length) throw Error('來源異常或衝突，備貨同步停止；請核對來源。');
    var additions=plan.preview.additions.slice(0,25);
    if(additions.length){
      var context={actor:'系統備貨同步',requestId:'stock_import_'+raffleHash_(JSON.stringify(additions.map(function(c){return[c.id,c.sourceFingerprint];}))),requestHash:raffleHash_(JSON.stringify(additions))};
      if(!rafflePriorResult_(state,context))appendRaffleEvent_(state,context,{actor:context.actor,action:'import',reason:'',changes:additions.map(function(c){return{beforeVersion:null,claim:Object.assign({},c,{version:1})};}),result:{imported:additions.length,remaining:plan.preview.additions.length-additions.length}});
    }
    // Choose-venue items only. Courses, direct gifts, codes and cancelled claims never create stock reminders.
    var ss=SpreadsheetApp.openById(campaign.sourceSpreadsheetId),prizes=readRaffleTable_(ss,'獎項設定'),pc=raffleColumns_(prizes,['獎項ID','領獎方式']),deliver={};
    prizes.slice(1).forEach(function(r){if(cleanText_(r[pc['領獎方式']])==='choose_venue')deliver[cleanText_(r[pc['獎項ID']])]=true;});
    return readRaffleClaims_().filter(function(c){return c.campaignId===campaign.id&&c.status==='waiting'&&deliver[c.prizeId]&&c.venue&&!p.getProperty('RAFFLE_STOCK_RECEIPT_'+raffleHash_(JSON.stringify([c.campaignId,c.id,c.sourceFingerprint])));}).slice(0,100);
  });
  var saved=0;pending.forEach(function(c){if(!raffleStockAppNotice_(c).duplicate)saved++;p.setProperty('RAFFLE_STOCK_RECEIPT_'+raffleHash_(JSON.stringify([c.campaignId,c.id,c.sourceFingerprint])),new Date().toISOString());});
  p.setProperty('RAFFLE_STOCK_APP_LAST_SUCCESS',new Date().toISOString());
  return {scanned:pending.length,newNotices:saved};
}

function installRaffleStockAppSync() {
  if(ScriptApp.getScriptId()!=='16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW')throw Error('專案不符。');
  var triggers=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='runRaffleStockAppSync';});
  if(triggers.length>1)throw Error('備貨同步觸發器重複，請先核對。');
  if(!triggers.length)ScriptApp.newTrigger('runRaffleStockAppSync').timeBased().everyMinutes(5).create();
  PropertiesService.getScriptProperties().setProperty('RAFFLE_STOCK_APP_ENABLED','true');
  var result={enabled:true,intervalMinutes:5,recipient:'Tako',result:runRaffleStockAppSync(),readyOwner:raffleReadyLegacyOwner_()?'legacy':'other',readyMailEnabled:PropertiesService.getScriptProperties().getProperty('RAFFLE_READY_MAIL_ENABLED')==='true',campaigns:getRaffleConfiguration_().campaigns.map(function(c){return{id:c.id,readySendEnabled:raffleMailSendEnabled_(c)};})};
  console.log(JSON.stringify(result));return result;
}

function raffleNotifyPreparedClaim_(session,claimId) {
  assertCapabilitySession_(session,'raffle_admin');
  var prep=withScriptLock_(function(){
    var claim=readRaffleClaims_().filter(function(c){return c.id===claimId;})[0];
    if(!claim)throw Error('找不到領獎紀錄。');
    var campaign=raffleMailCampaign_(claim.campaignId),p=PropertiesService.getScriptProperties();
    if(!raffleReadyLegacyOwner_()||!raffleMailSendEnabled_(campaign)||p.getProperty('RAFFLE_MAIL_QUEUE_ENABLED')!=='true'||p.getProperty('RAFFLE_READY_MAIL_ENABLED')!=='true')return {status:'disabled'};
    var state=readRaffleMailState_(),id=raffleReadyIdentity_(campaign,claim),reserved=state.readyReservations.filter(function(r){return r.qualificationId===id;})[0];
    if(reserved){
      var prior=state.jobs.filter(function(j){return j.qualificationIds.indexOf(id)>=0;})[0];
      if(!prior||prior.qualificationIds.length!==1)return{status:'needs_review'};
      if(prior.status==='sent')return{status:'sent'};
      if(prior.status!=='queued'||prior.attemptId)return{status:'needs_review'};
      return {campaign:campaign,jobId:prior.id};
    }
    var ids={};ids[id]=true;var plan=raffleReadyNotificationPlan_(campaign,state,ids),jobs=plan.preview.jobs;
    if(jobs.length!==1||jobs[0].qualificationIds.length!==1||jobs[0].qualificationIds[0]!==id)throw Error('這筆獎品目前無法通知，請核對來源。');
    var job=Object.assign({},jobs[0],{campaignId:campaign.id,status:'queued'}),actor=getSessionTeacherName_(session),key='prepared_queue_'+raffleHash_(id);
    appendRaffleMailEvent_(state,{requestId:key,requestHash:raffleHash_(JSON.stringify([actor,job]))},{actor:actor,action:'queue',campaignId:campaign.id,jobs:[job],result:{queued:1,remaining:0}});
    return {campaign:campaign,jobId:job.id};
  });
  if(prep.status)return prep;
  var plan=raffleMailSendPlan_(prep.campaign,readRaffleMailState_(),'ready',prep.jobId);
  if(plan.jobs.length!==1||plan.jobs[0].id!==prep.jobId)return{status:'needs_review'};
  var result=sendRaffleMailBatch_(session,{campaignId:prep.campaign.id,onlyJobId:prep.jobId,previewToken:plan.token,requestId:'prepared_send_'+raffleHash_(prep.jobId)},'ready');
  return {status:result.pendingReview?'needs_review':result.sent===1?'sent':'needs_review'};
}

function mutateRaffleClaimAndNotify_(session,operation) {
  var result=mutateRaffleClaim_(session,operation);
  if(operation.action!=='prepare')return result;
  var notification;
  try{notification=getSessionManagementCapabilities_(session).indexOf('raffle_admin')>=0?raffleNotifyPreparedClaim_(session,result.claimId):{status:'needs_review'};}
  catch(_){notification={status:'needs_review'};}
  return Object.assign({},result,{notification:notification});
}

function previewRaffleStockApp20261031() {
  var result=raffleStockAppNotice_({id:'stock-app-preview-20261031',campaignId:'notification-preview',studentName:'示範學生（測試）',email:'sample@example.com',prizeName:'Elia 止滑襪（通知樣張，不需備貨）',venue:'晴光 A',quantity:1,claimedQuantity:0,status:'waiting',sourceFingerprint:'stock-app-preview-20261031-v1'});
  console.log(JSON.stringify({testOnly:true,inbox:result,recipient:'Tako',noRealPrize:true}));return result;
}
