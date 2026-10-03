import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_NODE_MODULES,'playwright'));
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=(await fs.readFile(path.join(repo,'index.html'),'utf8')).replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\n    initialize\(\);/,'');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page=await browser.newPage();await page.route('**/*',r=>r.abort());await page.setContent(html);await page.addScriptTag({path:path.join(repo,'raffle.js')});
 await page.evaluate(()=>{
  window.readyWrites=[];window.readyQueued=false;window.readySent=false;window.readyFail=false;window.readyMode='normal';
  callApi=async(action,params)=>{
   const item={email:'fixture@example.com',subject:'測試活動｜獎品可領取通知',body:'您好：\n提袋｜晴光｜尚可領取 1 件\n護腕｜劍潭｜尚可領取 1 件\n尚未備妥的其他獎品不在本次通知內。'};
   if(action==='getRaffleWorkspace')return{enabled:true,readOnly:false,canPrepare:true,canCorrect:true,campaigns:[{id:'fixture',name:'本機測試活動'}],claims:[]};
   if(action==='previewRaffleReadyNotifications'){
    const result={kind:readyMode==='wrong'?'invitation':'ready',dryRun:true,deliveryChecked:true,sendEnabled:false,readOnly:false,previewToken:'preview',batchCount:readyQueued?0:1,candidateCount:readyQueued?0:1,skipped:0,previews:readyQueued?[]:[item]};
    if(readyMode==='pending')return new Promise(resolve=>{window.finishReady=()=>resolve(result);});return result;
   }
   if(action==='confirmRaffleReadyNotifications'||action==='sendRaffleReadyMailBatch'){
    readyWrites.push({action,operation:params.operation});if(readyFail){readyFail=false;throw Error('測試結果不確定');}
    if(action==='confirmRaffleReadyNotifications'){readyQueued=true;return{queued:1,remaining:0};}
    readySent=true;return{attemptId:'attempt',sent:1,total:1,pendingReview:0,closed:0};
   }
   if(action==='previewRaffleReadyMailSend')return{kind:'ready',dryRun:true,sendEnabled:true,quota:100,batchCount:1,previewToken:'send-preview',previews:[item]};
   if(action==='getRaffleMailRecords')return{total:1,offset:0,hasMore:false,reviewCount:0,canReconcile:true,records:[{id:'job',kind:'ready',email:item.email,status:readySent?'sent':'queued',qualificationCount:2,actor:'測試店長',createdAt:'測試時間'}]};
   throw Error('Wrong mail API '+action);
  };
  authState.sessionToken='fixture';authState.teacherName='測試店長';authState.managementCapabilities=['raffle_admin'];document.getElementById('app-shell').hidden=false;document.getElementById('auth-shell').hidden=true;activeAdminTab='raffle';activeAdminSection='raffle';switchView('view-admin');
 });
 await page.locator('[data-raffle-ready-preview]').click();await page.getByText('可領取通知預覽 · 不會寄出',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>readyWrites.length),0);
 await fs.mkdir('/private/tmp/raffle-preview',{recursive:true});
 for(const [name,width,height] of [['ready-mobile',390,844],['ready-desktop',1280,1000]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`/private/tmp/raffle-preview/${name}.png`,fullPage:true});}
 await page.locator('[data-raffle-confirm-mail]').click();await page.locator('[data-raffle-cancel]').click();assert.equal(await page.evaluate(()=>readyWrites.length),0);
 await page.locator('[data-raffle-confirm-mail]').click();await page.evaluate(()=>{readyFail=true;});await page.locator('[data-raffle-save]').click();await page.getByText('測試結果不確定',{exact:false}).waitFor();await page.locator('[data-raffle-save]').click();await page.getByText('目前沒有符合條件的可領取通知。',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>readyWrites[0].operation.requestId===readyWrites[1].operation.requestId),true);
 await page.locator('[data-raffle-ready-send]').click();await page.locator('[data-raffle-confirm-send]').click();await page.locator('[data-raffle-cancel]').click();assert.equal(await page.evaluate(()=>readyWrites.length),2);
 await page.locator('[data-raffle-confirm-send]').click();await page.evaluate(()=>{readyFail=true;});await page.locator('[data-raffle-save]').click();await page.getByText('測試結果不確定',{exact:false}).waitFor();await page.locator('[data-raffle-save]').click();await page.getByText('可領取通知｜已送出／已核對｜2 筆獎品',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>readyWrites[2].operation.requestId===readyWrites[3].operation.requestId),true);
 assert.deepEqual(await page.evaluate(()=>readyWrites.map(w=>w.action)),['confirmRaffleReadyNotifications','confirmRaffleReadyNotifications','sendRaffleReadyMailBatch','sendRaffleReadyMailBatch']);
 await page.evaluate(()=>{readyMode='wrong';});await page.locator('[data-raffle-ready-preview]').click();await page.getByText('寄信用途不符，請重新核對。',{exact:true}).waitFor();assert.equal(await page.locator('[data-raffle-confirm-mail]').count(),0);
 await page.evaluate(()=>{readyMode='pending';});await page.locator('[data-raffle-ready-preview]').click();await page.locator('[data-raffle-campaign]').dispatchEvent('change');await page.evaluate(()=>finishReady());assert.equal(await page.locator('[data-raffle-confirm-mail]').count(),0);
 await page.locator('[data-raffle-ready-preview]').click();await page.evaluate(()=>{clearSession();finishReady();});assert.equal(await page.locator('[data-raffle-confirm-mail]').count(),0);
 await page.evaluate(()=>{authState.sessionToken='teacher';authState.teacherName='老師';authState.managementCapabilities=[];document.getElementById('app-shell').hidden=false;document.getElementById('auth-shell').hidden=true;switchView('view-raffle');});await page.locator('[data-raffle-query]').waitFor();assert.equal(await page.locator('[data-raffle-ready-preview]').count(),0);assert.equal(await page.locator('[data-raffle-ready-send]').count(),0);
 console.log('PASS ready notices: preview no write, separate API purpose, queue/send cancel and same-ID retry, record labels, wrong-kind rejection, stale replies/logout, teacher controls hidden, mobile/desktop');
}finally{await browser.close();}
