// Manager operations. Existing claim journals and all fixed spreadsheet indexes remain unchanged.
function activityToolCampaign_(session,id) {
  assertCapabilitySession_(session,'raffle_admin');
  var config=getRaffleConfiguration_(),c=config.enabled&&config.campaigns.filter(function(c){return c.id===id;})[0];
  if(!c)throw Error('找不到本次活動。');return c;
}
function activityToolWrite_(session,op) {
  assertCapabilitySession_(session,'raffle_admin');assertRaffleTestAccess_(session);
  if(PropertiesService.getScriptProperties().getProperty('RAFFLE_WRITES_ENABLED')!=='true')throw Error('目前為唯讀模式。');
  if(!op||!/^[A-Za-z0-9_-]{12,100}$/.test(op.requestId||''))throw Error('操作編號無效。');
}
function activityPackingRow_(c){return {id:c.id,version:c.version,studentName:c.studentName,email:c.email,prizeId:c.prizeId,prizeName:c.prizeName,venue:c.venue,quantity:c.quantity-c.claimedQuantity,total:c.quantity,claimed:c.claimedQuantity,status:c.status};}
function getActivityPacking_(session,q) {
  q=q||{};activityToolCampaign_(session,q.campaignId);
  var offset=Number(q.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>10000)throw Error('頁碼不正確。');
  var all=readRaffleClaims_().filter(function(c){return c.campaignId===q.campaignId&&['waiting','ready','partial'].indexOf(c.status)>=0&&c.quantity>c.claimedQuantity&&c.venue&&c.prizeId!=='test-notice-only';});
  var venues=Array.from(new Set(all.map(function(c){return c.venue;}))).sort(),prizes=Array.from(new Set(all.map(function(c){return c.prizeName;}))).sort();
  var matches=all.filter(function(c){return(!q.venue||c.venue===q.venue)&&(!q.prizeName||c.prizeName===q.prizeName)&&(!q.state||c.status===q.state);}).sort(function(a,b){return(a.venue+a.prizeName+a.studentName+a.id).localeCompare(b.venue+b.prizeName+b.studentName+b.id);});
  return{rows:matches.slice(offset,offset+50).map(activityPackingRow_),offset,nextOffset:offset+50<matches.length?offset+50:null,total:matches.length,venues,prizes};
}
function previewActivityArrival_(session,op) {
  var campaign=activityToolCampaign_(session,op.campaignId);
  if(!Array.isArray(op.items)||!op.items.length||op.items.length>10)throw Error('每批請選 1 至 10 筆。');
  var claims=readRaffleClaims_(),seen={};
  var rows=op.items.map(function(i){
    if(!i||seen[i.id])throw Error('選取項目重複。');seen[i.id]=true;
    var c=claims.filter(function(c){return c.id===i.id&&c.campaignId===campaign.id;})[0];
    if(!c||c.version!==i.version||c.venue!==i.venue)throw Error('備貨資料已變更，請更新清單。');
    applyRaffleClaimMutation_(c,session,{action:'prepare',venue:i.venue},campaign,new Date().toISOString());
    return activityPackingRow_(c);
  });
  return {rows:rows,readOnly:true};
}
function prepareActivityArrival_(session,op){
  activityToolWrite_(session,op);var campaign=activityToolCampaign_(session,op.campaignId);
  if(op.action!=='prepare')throw Error('只可登記到館。');
  var prior=rafflePriorResult_(readRaffleState_(),raffleWriteContext_(session,op,'claim'));
  if(!prior){
    previewActivityArrival_(session,{campaignId:op.campaignId,items:[{id:op.claimId,version:op.version,venue:op.venue}]});
    var plan=raffleImportPlan_(campaign);
    if(plan.preview.errors.length||plan.preview.conflicts.length)throw Error('來源獎品或館別已變更，請先同步核對；尚未到館或通知。');
  }
  return mutateRaffleClaimAndNotify_(session,op);
}
function activityInventoryRows_(table,claims) {
  var c=raffleColumns_(table,['獎項ID','獎品名稱','總量','已領取 (程式寫)','剩餘 (公式算）','領獎方式','啟用']),seen={};
  return table.slice(1).filter(function(r){return r.some(function(x){return cleanText_(x);});}).map(function(r){
    var id=cleanText_(r[c['獎項ID']]),name=cleanText_(r[c['獎品名稱']]);
    function count(k){var raw=cleanText_(r[c[k]]),v=Number(raw);if(!/^\d+$/.test(raw)||!Number.isSafeInteger(v))throw Error('庫存數量需核對：'+name);return v;}
    var total=count('總量'),allocated=count('已領取 (程式寫)'),available=count('剩餘 (公式算）');
    if(!id||!name||seen[id]||allocated+available!==total)throw Error('庫存編號或剩餘數量需核對：'+name);seen[id]=true;
    var synced=claims.filter(function(x){return x.prizeId===id;}),claimed=0,reserved=0;
    synced.forEach(function(x){claimed+=x.claimedQuantity;if(['waiting','ready','partial'].indexOf(x.status)>=0)reserved+=x.quantity-x.claimedQuantity;});
    if(claimed+reserved>allocated)throw Error('來源庫存與領取紀錄不同步：'+name);
    return{id,name,total,allocated,available,reserved,claimed,enabled:['yes','true'].indexOf(cleanText_(r[c['啟用']]).toLowerCase())>=0,method:cleanText_(r[c['領獎方式']])};
  });
}
function activityToolEvents_(){
  var rows=readRaffleTable_(SpreadsheetApp.getActiveSpreadsheet(),'ActivityToolJournal',true),events=[];if(!rows.length)return events;
  var c=raffleColumns_(rows,['requestId','requestHash','createdAt','payloadHash','eventJson']),seen={};
  if(rows.length>1001)throw Error('管理工具紀錄已達容量，請聯繫管理員。');
  rows.slice(1).forEach(function(r){var e=JSON.parse(r[c.eventJson]);if(seen[r[c.requestId]]||raffleHash_(r[c.eventJson])!==r[c.payloadHash]||!['inventorySettings','template'].includes(e.kind))throw Error('管理工具紀錄需核對。');seen[r[c.requestId]]=true;events.push({id:r[c.requestId],hash:r[c.requestHash],at:r[c.createdAt],event:e});});return events;
}
function activityToolAppend_(session,op,kind,payload){
  var events=activityToolEvents_(),hash=raffleHash_(JSON.stringify([getSessionTeacherName_(session),kind,op])),prior=events.filter(function(e){return e.id===op.requestId;})[0];
  if(prior){if(prior.hash!==hash)throw Error('操作編號已用於其他內容。');return{saved:true,id:prior.id};}
  if(events.length>=1000)throw Error('管理工具紀錄已達容量。');
  var e={kind:kind,actor:getSessionTeacherName_(session),campaignId:op.campaignId,payload:payload},json=JSON.stringify(e);if(json.length>45000)throw Error('內容過長，未儲存。');
  var book=SpreadsheetApp.getActiveSpreadsheet(),sheet=book.getSheetByName('ActivityToolJournal');
  try{if(!sheet)sheet=book.insertSheet('ActivityToolJournal');if(!sheet.getLastRow())sheet.getRange(1,1,1,5).setValues([['requestId','requestHash','createdAt','payloadHash','eventJson']]);var target=Math.max(2,sheet.getLastRow()+1);if(target>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),target-sheet.getMaxRows());sheet.getRange(target,1,1,5).setValues([[op.requestId,hash,new Date().toISOString(),raffleHash_(json),json]]);}finally{SpreadsheetApp.flush();}
  return{saved:true,id:op.requestId};
}
function activityInventorySettings_(id){var es=activityToolEvents_().filter(function(e){return e.event.kind==='inventorySettings'&&e.event.campaignId===id;});return es.length?{version:es.length,...es[es.length-1].event.payload}:{version:0,enabled:false,thresholds:{},defaultThreshold:5};}
function activityInventory_(campaign){
  var claims=readRaffleClaims_().filter(function(c){return c.campaignId===campaign.id;}),book=SpreadsheetApp.openById(campaign.sourceSpreadsheetId);
  var rows=activityInventoryRows_(readRaffleTable_(book,'獎項設定'),claims),settings=activityInventorySettings_(campaign.id);
  if(campaign.sourceSpreadsheetId==='1Sdi96hIru-Vag8hFl6bEo6xMhpjgVkro75dH1PNvpRM'){
    var ball=readRaffleBallCatalog_(),reserved=0,claimed=0;claims.filter(function(c){return c.prizeId===ball.prizeId;}).forEach(function(c){assertRaffleFixedGiftClaim_(c);claimed+=c.claimedQuantity;if(c.status!=='cancelled')reserved+=c.quantity-c.claimedQuantity;});
    if(reserved+claimed>ball.total)throw Error('球庫存需核對。');rows.push({id:ball.prizeId,name:ball.name,total:ball.total,allocated:reserved+claimed,available:ball.total-reserved-claimed,reserved,claimed,enabled:ball.enabled,method:'direct_pickup'});
  }
  rows.forEach(function(r){r.threshold=Object.prototype.hasOwnProperty.call(settings.thresholds,r.id)?settings.thresholds[r.id]:settings.defaultThreshold;r.low=r.enabled&&r.available<=r.threshold;});
  return{rows,settings,checkedAt:new Date().toISOString()};
}
function getActivityInventory_(session,q){return activityInventory_(activityToolCampaign_(session,q.campaignId));}
function saveActivityInventory_(session,op){
  activityToolWrite_(session,op);var campaign=activityToolCampaign_(session,op.campaignId);
  return withScriptLock_(function(){var events=activityToolEvents_(),prior=events.filter(function(e){return e.id===op.requestId;})[0];if(prior)return activityToolAppend_(session,op,'inventorySettings',null);
    var current=activityInventory_(campaign);if(op.version!==current.settings.version)throw Error('提醒設定已更新，請重新載入。');
    if(typeof op.enabled!=='boolean'||!op.thresholds||Array.isArray(op.thresholds)||Object.keys(op.thresholds).length>100)throw Error('設定格式錯誤。');
    var ids=current.rows.map(function(r){return r.id;}),thresholds={};Object.keys(op.thresholds).sort().forEach(function(id){var n=op.thresholds[id];if(ids.indexOf(id)<0||!Number.isSafeInteger(n)||n<0||n>10000)throw Error('提醒門檻無效。');thresholds[id]=n;});
    return activityToolAppend_(session,op,'inventorySettings',{enabled:op.enabled,thresholds,defaultThreshold:5});
  });
}
function runActivityLowStock_(campaign){
  var plan=withScriptLock_(function(){
    if(!activityInventorySettings_(campaign.id).enabled)return null;
    var data=activityInventory_(campaign),p=PropertiesService.getScriptProperties(),key='ACTIVITY_LOW_STOCK_'+raffleHash_(campaign.id),raw=p.getProperty(key)||'',previous=JSON.parse(raw||'{"episode":0,"ids":[]}');
    var ids=data.rows.filter(function(r){return r.low;}).map(function(r){return r.id;}).sort(),newIds=ids.filter(function(id){return previous.ids.indexOf(id)<0;});
    return{key:key,raw:raw,ids:ids,newIds:newIds,episode:previous.episode+(newIds.length?1:0),rows:data.rows};
  });
  if(!plan)return{disabled:true};
  if(plan.newIds.length){
    var msg={heading:'活動獎品｜庫存提醒',content:plan.rows.filter(function(r){return plan.newIds.indexOf(r.id)>=0;}).slice(0,5).map(function(r){return r.name.slice(0,50)+'：可用 '+r.available+' 件（門檻 '+r.threshold+'）；已同步待領 '+r.reserved+' 件。';}).join('\n')+'\n共有 '+plan.ids.length+' 個獎項低於門檻，完整清單請查看後台「庫存提醒」。',eventKey:'activity-low-'+raffleHash_(JSON.stringify([campaign.id,plan.episode,plan.newIds])),type:'raffle-stock',relatedId:campaign.id,actor:'庫存檢查',url:buildAppViewUrl_('admin','raffle')};
    var result=persistInboxNotification_(['Tako'],msg);if(!result||!result.saved)throw Error('庫存提醒未保存。');
  }
  withScriptLock_(function(){var p=PropertiesService.getScriptProperties();if((p.getProperty(plan.key)||'')===plan.raw)p.setProperty(plan.key,JSON.stringify({episode:plan.episode,ids:plan.ids}));});
  return{low:plan.ids.length,newNotices:plan.newIds.length};
}
function activityToolBridge_(payload){
  var key=PropertiesService.getScriptProperties().getProperty('PRODUCTION_TASK_APP_SECRET');
  if(ScriptApp.getScriptId()!=='16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW'||!key||key.length<32||key.length>256)throw Error('活動資料橋接尚未設定。');
  var r=UrlFetchApp.fetch('https://sherry-activity-production.sherry-line-ai.workers.dev/internal/operations',{method:'post',contentType:'application/json',followRedirects:false,muteHttpExceptions:true,headers:{'x-production-task-app-secret':key},payload:JSON.stringify(payload)}),text=r.getContentText();
  if(r.getResponseCode()!==200||text.length>100000)throw Error('活動紀錄暫時無法讀取；不可視為沒有紀錄。');var d=JSON.parse(text);if(d.ok!==true||d.campaignId!=='christmas-2026')throw Error('活動紀錄回應需核對。');return d;
}
function getActivityStudentHistory_(session,q){
  var campaign=activityToolCampaign_(session,q.campaignId),email=cleanText_(q.email).toLowerCase(),offset=Number(q.offset||0);
  if(!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)||email.length>100||!Number.isSafeInteger(offset)||offset<0||offset>10000)throw Error('請輸入完整 Email。');
  var state=readRaffleState_(),claims=state.claims.filter(function(c){return c.campaignId===campaign.id&&c.email.toLowerCase()===email;}),ids=claims.map(function(c){return c.id;}),events=state.events.filter(function(e){return e.event.changes.some(function(x){return ids.indexOf(x.claim.id)>=0;});}).map(function(e){return{at:e.createdAt,actor:e.event.actor,action:e.event.action,reason:e.event.reason};}).reverse(),mail=readRaffleMailState_().jobs.filter(function(j){return j.campaignId===campaign.id&&j.email.toLowerCase()===email;}).map(function(j){return{at:j.createdAt,status:j.status,kind:j.kind||'invitation',channels:j.channels?Object.keys(j.channels).map(function(k){return {name:k,status:j.channels[k].status};}):[]};}).reverse();
  var activity;try{if(campaign.id!=='christmas-2026')throw Error();activity=activityToolBridge_({action:'student',email:email,offset:offset});}catch(_){activity={available:false,reason:'unavailable'};}
  return{email:email,activity:activity,claims:claims.slice(offset,offset+50).map(activityPackingRow_),events:events.slice(offset,offset+50),notifications:mail.slice(offset,offset+50),offset:offset,nextOffset:[claims,events,mail].some(function(a){return a.length>offset+50;})||activity.nextOffset?offset+50:null};
}
function activityTemplate_(campaign,table,rules,name){
  var headers=['獎項ID','獎項等級','中獎機率','獎品名稱','總量','已領取 (程式寫)','剩餘 (公式算）','獎項類型','領獎方式','折扣碼模式','折扣碼','可領取館別','主圖URL','樣式圖URL','尺寸表URL','顯示備註','啟用','排序'];
  var c=raffleColumns_(table,['獎項ID','獎品名稱','中獎機率','領獎方式','啟用']);
  var prizes=table.slice(1).filter(function(r){return cleanText_(r[c['獎項ID']])&&['yes','true'].indexOf(cleanText_(r[c['啟用']]).toLowerCase())>=0;}).map(function(r){var p={};headers.forEach(function(h){var i=table[0].indexOf(h);p[h]=i<0?'':r[i];});['總量','已領取 (程式寫)','剩餘 (公式算）'].forEach(function(h){p[h]=0;});p['啟用']='No';p['折扣碼']='';p['顯示備註']='';return p;});
  var safeRules={descriptions:{},starsPerDraw:rules.starsPerDraw,purchaseRules:(rules.purchaseRules||[]).map(function(r){return{points:r.points,stars:r.stars,balls:r.balls};}),tasks:{}};
  ['photo','referral','venues'].forEach(function(k){if(rules.descriptions&&typeof rules.descriptions[k]==='string')safeRules.descriptions[k]=rules.descriptions[k].slice(0,500);if(rules.tasks&&rules.tasks[k])safeRules.tasks[k]={award:rules.tasks[k].award,enabled:false};});
  return{schemaVersion:1,name:name,enabled:false,startsAt:null,endsAt:null,claimDeadline:null,couponDeadline:null,ballTotal:0,rules:safeRules,prizes:prizes,notificationStyle:'沿用現行圖文；LINE 優先，未綁定或明確失敗才用 OB＋Email',requiresConfirmation:['活動日期與期限','獎品與球的本次庫存','課卡與館別對應','折扣碼與學生說明','活動規則、獎項機率、通知樣式','獨立資料來源及上線確認']};
}
function previewActivityTemplate_(session,q){
  var c=activityToolCampaign_(session,q.campaignId),name=cleanText_(q.name);if(!name||name.length>60)throw Error('請填 1 至 60 字的草稿名稱。');
  var rules=activityToolBridge_({action:'template'}).rules;if(!rules||rules.starsPerDraw!==3)throw Error('活動規則需核對。');
  var draft=activityTemplate_(c,readRaffleTable_(SpreadsheetApp.openById(c.sourceSpreadsheetId),'獎項設定'),rules,name);
  return{draft:draft,previewToken:raffleHash_(JSON.stringify(draft))};
}
function saveActivityTemplate_(session,op){
  activityToolWrite_(session,op);activityToolCampaign_(session,op.campaignId);
  return withScriptLock_(function(){var prior=activityToolEvents_().filter(function(e){return e.id===op.requestId;})[0];if(prior)return activityToolAppend_(session,op,'template',null);
    var p=previewActivityTemplate_(session,op);if(p.previewToken!==op.previewToken)throw Error('來源已變更，請重新預覽草稿。');return activityToolAppend_(session,op,'template',p.draft);
  });
}
function getActivityTemplates_(session,q){activityToolCampaign_(session,q.campaignId);return{drafts:activityToolEvents_().filter(function(e){return e.event.kind==='template';}).map(function(e){return{id:e.id,at:e.at,draft:e.event.payload};}).reverse().slice(0,30)};}
