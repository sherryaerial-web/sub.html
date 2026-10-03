// Owner-run isolated acceptance only. Never include this file in production GAS.
var SANDBOX_SHEET = '1k_ULYH9PG1xt45Ncrtd6UjWU3yy9BbGPsLkXBdsbgFE';
var SANDBOX_SCRIPT = '10zm4vErpaK9kXskt9cQ4-zOmZGafgUwob4ZqiAM2uO0UUTDbcbiu7tKq';

function sandboxGuard_() {
  if (ScriptApp.getScriptId() !== SANDBOX_SCRIPT) throw new Error('Wrong sandbox project');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss || ss.getId() !== SANDBOX_SHEET) throw new Error('Wrong sandbox spreadsheet');
  var marker = ss.getSheetByName('測試說明');
  if (!marker || marker.getRange('B2').getDisplayValue() !== 'raffle-sandbox-20261003-v1') throw new Error('Missing sandbox marker');
  return ss;
}

function runSandboxIntegration() {
  var ss = sandboxGuard_(), props = PropertiesService.getScriptProperties();
  if (props.getProperty('SANDBOX_STARTED')) throw new Error('Already started: preserve evidence; use inspectSandboxIntegration, do not reset');
  if (ss.getSheetByName('RaffleJournal')) throw new Error('Existing journal: do not overwrite');
  props.setProperty('SANDBOX_STARTED', new Date().toISOString());
  var campaign = {id:'sandbox_20261003',name:'隔離測試，不寄信',sourceSpreadsheetId:SANDBOX_SHEET,
    websiteUrl:'https://example.invalid/raffle',pickupDeadline:'2099-12-31T23:59:59+08:00',
    readyPrizeVenues:[{prizeId:'test-bag',venue:'晴光'}]};
  props.setProperties({RAFFLE_ENABLED:'true',RAFFLE_WRITES_ENABLED:'true',RAFFLE_CAMPAIGN_SETTINGS_ENABLED:'false',
    RAFFLE_MAIL_SEND_ENABLED:'false',RAFFLE_MAIL_QUEUE_ENABLED:'false',RAFFLE_READY_MAIL_ENABLED:'false',
    RAFFLE_CAMPAIGNS_JSON:JSON.stringify([campaign])});
  var admin={teacherName:'測試管理員',managementCapabilities:['raffle_admin']};
  var teacher={teacherName:'測試老師',managementCapabilities:[]};
  var preparer={teacherName:'測試備貨員',managementCapabilities:['raffle_fulfillment']};
  var checks=[];
  function ok(condition,label){if(!condition)throw new Error('FAIL: '+label);checks.push(label);console.log('PASS '+label);}
  function reject(fn,pattern,label){var error;try{fn();}catch(e){error=e;}ok(error && pattern.test(error.message),label);}
  function rows(){var s=ss.getSheetByName('RaffleJournal');return s?s.getLastRow():0;}
  var sourceBefore=JSON.stringify([readRaffleTable_(ss,'抽獎名單'),readRaffleTable_(ss,'獎項設定')]);
  try {
    var preview=previewRaffleImport_(admin,campaign.id);
    ok(preview.additionCount===3 && preview.pendingSelection===1 && preview.errorCount===0,'real source preview');
    ok(rows()===0,'preview creates no journal');
    var operation={campaignId:campaign.id,previewToken:preview.previewToken,requestId:'sandbox-import-0001'};
    reject(function(){confirmRaffleImport_(teacher,operation);},/權限/,'teacher cannot import');
    ok(confirmRaffleImport_(admin,operation).imported===3,'import three claims');
    ok(rows()===2,'single append persists batch');
    ok(confirmRaffleImport_(admin,operation).imported===3 && rows()===2,'same request retry has no extra append');
    preview=previewRaffleImport_(admin,campaign.id);
    ok(preview.duplicates===3 && preview.additionCount===0,'reimport does not reset claims');
    var claims=readRaffleClaims_(),ready=claims.filter(function(c){return c.prizeId==='test-bag';})[0];
    var waiting=claims.filter(function(c){return c.prizeId==='test-belt';})[0];
    var digital=claims.filter(function(c){return c.prizeId==='test-digital';})[0];
    ok(ready.status==='ready' && waiting.status==='waiting' && digital.status==='digital','real journal state replay');
    var collect={action:'collect',claimId:ready.id,version:1,venue:'晴光',quantity:1,requestId:'sandbox-collect-0001'};
    reject(function(){mutateRaffleClaim_(teacher,Object.assign({},collect,{venue:'劍潭'}));},/館別/,'wrong venue rejected');
    var r=mutateRaffleClaim_(teacher,collect);
    ok(r.claimedQuantity===1 && r.status==='claimed' && rows()===3,'teacher collection persisted');
    ok(mutateRaffleClaim_(teacher,collect).claimedQuantity===1 && rows()===3,'collection retry does not double count');
    reject(function(){mutateRaffleClaim_(teacher,Object.assign({},collect,{requestId:'sandbox-stale-0001'}));},/版本/,'stale second collection rejected');
    var prepare={action:'prepare',claimId:waiting.id,version:1,venue:'劍潭',requestId:'sandbox-prepare-0001'};
    reject(function(){mutateRaffleClaim_(teacher,prepare);},/權限/,'teacher cannot prepare');
    ok(mutateRaffleClaim_(preparer,prepare).status==='ready' && rows()===4,'preparer can confirm arrival');
    reject(function(){mutateRaffleClaim_(teacher,{action:'collect',claimId:digital.id,version:1,venue:'晴光',quantity:1,requestId:'sandbox-digital-0001'});},/實體|備貨/,'digital cannot be collected physically');
    campaign.pickupDeadline='2000-01-01T00:00:00Z';props.setProperty('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([campaign]));
    reject(function(){mutateRaffleClaim_(teacher,{action:'collect',claimId:waiting.id,version:2,venue:'劍潭',quantity:1,requestId:'sandbox-expired-0001'});},/期限|截止/,'expired collection rejected');
    ok(rows()===4,'rejections append nothing');
    ok(JSON.stringify([readRaffleTable_(ss,'抽獎名單'),readRaffleTable_(ss,'獎項設定')])===sourceBefore,'source and prize tables unchanged');
    props.setProperty('SANDBOX_RESULT',JSON.stringify({status:'passed',checks:checks.length,labels:checks,at:new Date().toISOString(),journalRows:rows()}));
  } catch(e) {
    props.setProperty('SANDBOX_RESULT',JSON.stringify({status:'failed',checks:checks.length,error:e.message,at:new Date().toISOString()}));
    throw e;
  } finally {
    props.setProperty('RAFFLE_WRITES_ENABLED','false');
    props.setProperty('RAFFLE_ENABLED','false');
  }
  console.log(props.getProperty('SANDBOX_RESULT'));
}

function inspectSandboxIntegration() {
  sandboxGuard_();
  var p=PropertiesService.getScriptProperties();
  console.log(JSON.stringify({result:JSON.parse(p.getProperty('SANDBOX_RESULT')||'null'),writesEnabled:p.getProperty('RAFFLE_WRITES_ENABLED'),sendEnabled:p.getProperty('RAFFLE_MAIL_SEND_ENABLED')}));
}

// Two separate owner editor executions meet at a bounded barrier; no triggers/web app.
function raceSandboxA() { return raceSandbox_('A'); }
function raceSandboxB() { return raceSandbox_('B'); }
function raceSandbox_(participant) {
  sandboxGuard_();
  var p=PropertiesService.getScriptProperties();
  if (JSON.parse(p.getProperty('SANDBOX_RESULT')||'{}').status!=='passed') throw new Error('First acceptance must pass');
  var start=withScriptLock_(function(){
    if(p.getProperty('SANDBOX_RACE_'+participant))throw new Error('Participant already ran');
    var at=Number(p.getProperty('SANDBOX_RACE_AT'));
    if(!at){
      var campaigns=JSON.parse(p.getProperty('RAFFLE_CAMPAIGNS_JSON'));
      if(campaigns.length!==1 || campaigns[0].sourceSpreadsheetId!==SANDBOX_SHEET)throw new Error('Wrong race source');
      campaigns[0].pickupDeadline='2099-12-31T23:59:59+08:00';
      p.setProperties({RAFFLE_CAMPAIGNS_JSON:JSON.stringify(campaigns),RAFFLE_ENABLED:'true',RAFFLE_WRITES_ENABLED:'true'});
      at=Date.now()+25000;p.setProperty('SANDBOX_RACE_AT',String(at));
    }
    if(Date.now()>at+10000)throw new Error('Race window elapsed; do not restart');
    p.setProperty('SANDBOX_RACE_'+participant,JSON.stringify({status:'waiting',arrived:Date.now()}));return at;
  });
  while(Date.now()<start)Utilities.sleep(Math.min(250,start-Date.now()));
  var began=Date.now(),result;
  try{
    result={status:'collected',result:mutateRaffleClaim_({teacherName:'並行測試'+participant,managementCapabilities:[]},
      {claimId:'raffle_094e3729d743d655cf8cf0be3d4cbe4b889d1f0dfff104b7d0d72415fdf3ac55',action:'collect',version:2,venue:'劍潭',quantity:1,requestId:'sandbox-race-'+participant+'-0001'})};
  }catch(e){result={status:'rejected',error:e.message};}
  result.began=began;result.ended=Date.now();p.setProperty('SANDBOX_RACE_'+participant,JSON.stringify(result));console.log(JSON.stringify(result));
}

function inspectSandboxRace() {
  var ss=sandboxGuard_(),p=PropertiesService.getScriptProperties();
  p.setProperty('RAFFLE_WRITES_ENABLED','false');p.setProperty('RAFFLE_ENABLED','false');
  var a=JSON.parse(p.getProperty('SANDBOX_RACE_A')||'null'),b=JSON.parse(p.getProperty('SANDBOX_RACE_B')||'null');
  var state=readRaffleState_(),claim=state.claims.filter(function(c){return c.prizeId==='test-belt';})[0];
  var pass=a && b && [a,b].filter(function(r){return r.status==='collected';}).length===1 &&
    [a,b].filter(function(r){return r.status==='rejected' && /版本/.test(r.error);}).length===1 &&
    Math.max(a.began,b.began)<Math.min(a.ended,b.ended) && claim.claimedQuantity===1 && claim.version===3 && ss.getSheetByName('RaffleJournal').getLastRow()===5;
  console.log(JSON.stringify({passed:!!pass,a:a,b:b,journalRows:ss.getSheetByName('RaffleJournal').getLastRow(),writesEnabled:p.getProperty('RAFFLE_WRITES_ENABLED'),sendEnabled:p.getProperty('RAFFLE_MAIL_SEND_ENABLED')}));
  if(!pass)throw new Error('Concurrency not verified; inspect evidence, do not reset');
}
