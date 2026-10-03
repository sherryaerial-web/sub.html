import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CODEX_NODE_MODULES ? path.join(process.env.CODEX_NODE_MODULES, 'playwright') : 'playwright');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = (await fs.readFile(path.join(repo, 'index.html'), 'utf8'))
  .replace(/<script\b[^>]*src=[^>]*><\/script>/g, '')
  .replace(/\n    initialize\(\);/, '');
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page = await browser.newPage();
 await page.route('**/*', route => route.abort());
 await page.setContent(html);
 await page.addScriptTag({path:path.join(repo,'raffle.js')});
 await page.evaluate(() => {
   window.raffleCalls=[];
   window.raffleFixture={enabled:true,readOnly:true,campaigns:[{id:'future',name:'2027 新年活動'}],claims:[]};
   callApi=async(action,params)=>{window.raffleCalls.push({action,params});return window.raffleFixture;};
   authState.sessionToken='local-fixture';authState.teacherName='測試老師';authState.managementCapabilities=[];
   document.getElementById('app-shell').hidden=false;
   document.getElementById('auth-shell').hidden=true;
   switchView('view-raffle');
 });
 await page.locator('[data-raffle-query]').waitFor();
 await page.locator('[data-raffle-query]').fill('林');
 await page.getByRole('button',{name:'查詢學生',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.raffleCalls.length),1);
 await page.evaluate(()=> {window.raffleFixture.claims=[
   {studentKey:'a',studentName:'同名學生',maskedEmail:'a•••@example.com',campaignId:'future',prizeName:'教室現貨・小提袋',venue:'晴光館',status:'ready',quantity:1,claimedQuantity:0},
   {studentKey:'b',studentName:'同名學生',maskedEmail:'b•••@example.com',campaignId:'future',prizeName:'訂製腳架',venue:'劍潭館',status:'waiting',quantity:1,claimedQuantity:0}
 ];});
 await page.locator('[data-raffle-query]').fill('同名');
 await page.getByRole('button',{name:'查詢學生',exact:true}).click();
 await page.locator('[data-raffle-student]').first().waitFor();
 assert.equal(await page.locator('[data-raffle-student]').count(),2);
 assert.equal(await page.locator('[data-raffle-preview]').count(),0);
 await fs.mkdir('/private/tmp/raffle-preview',{recursive:true});
 for(const [name,width,height] of [['desktop',1280,1000],['mobile',390,844]]) {
   await page.setViewportSize({width,height});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`/private/tmp/raffle-preview/${name}.png`,fullPage:true});
 }
 await page.evaluate(()=>{window.raffleFixture={enabled:false,campaigns:[],claims:[]};clearRaffleWorkspace();renderRaffleWorkspace('teacher');});
 await page.getByText('領獎工作台尚未開放。',{exact:false}).waitFor();
 await page.evaluate(()=>{clearRaffleWorkspace();callApi=async()=>{throw Error('<讀取失敗>');};renderRaffleWorkspace('teacher');});
 await page.getByText('<讀取失敗>',{exact:true}).waitFor();
 await page.evaluate(()=>{clearRaffleWorkspace();callApi=()=>new Promise(resolve=>{window.finishRaffle=resolve;});renderRaffleWorkspace('teacher');clearRaffleWorkspace();window.finishRaffle({enabled:true,campaigns:[{id:'x',name:'不應顯示'}],claims:[]});});
 assert.equal(await page.locator('[data-raffle-query]').count(),0);
 await page.evaluate(()=>{authState.managementCapabilities=[];renderRaffleWorkspace('admin');});
 assert.match(await page.locator('#admin-tab-content').textContent(),/沒有抽獎管理權限/);
 await page.evaluate(()=>{
   authState.managementCapabilities=['raffle_admin'];
   callApi=async(action)=>action==='previewRaffleImport'?{additionCount:1,duplicates:2,errorCount:0,conflictCount:0,additions:[{studentName:'新同學',prizeName:'小提袋',venue:'晴光館',status:'ready'}]}:{enabled:true,campaigns:[{id:'future',name:'2027 新年活動'}],claims:[]};
   activeAdminTab='raffle';activeAdminSection='raffle';switchView('view-admin');
 });
 await page.locator('[data-raffle-preview]').click();
 await page.getByText('核對結果 · 尚未同步').waitFor();
 await page.screenshot({path:'/private/tmp/raffle-preview/admin-mobile.png',fullPage:true});
 await page.evaluate(()=>{
   clearRaffleWorkspace();
   window.mailCalls=[];
   window.mailMode='normal';
   callApi=async(action,params)=>{
     if(action==='getRaffleWorkspace') return {enabled:true,readOnly:true,campaigns:[{id:'future',name:'2027 新年活動'}],claims:[]};
     window.mailCalls.push({action,params});
     if(action!=='previewRaffleInvitations') throw Error('Unexpected mail action');
     if(window.mailMode==='pending') return new Promise(resolve=>{window.finishMailPreview=resolve;});
     if(window.mailMode==='error') throw Error('活動網址尚未設定');
     return {dryRun:true,deliveryChecked:false,candidateCount:1,skipped:2,previews:[{email:'student@example.com',subject:'新活動｜抽獎邀請',body:'您好：\nhttps://example.com/'+ 'long'.repeat(40)+'\n驗證碼：ABC\n<script>bad()</script>'}]};
   };
   renderRaffleWorkspace('admin');
 });
 await page.locator('[data-raffle-mail-preview]').click();
 await page.getByText('邀請信預覽 · 不會寄出',{exact:true}).waitFor();
 assert.match(await page.locator('[data-raffle-result]').textContent(),/尚未核對寄信紀錄/);
 assert.equal(await page.locator('[data-raffle-result] button').count(),0);
 assert.equal(await page.locator('[data-raffle-result] script').count(),0);
 for(const [name,width,height] of [['mail-mobile',390,844],['mail-desktop',1280,1000]]) {
   await page.setViewportSize({width,height});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`/private/tmp/raffle-preview/${name}.png`,fullPage:true});
 }
 assert.equal(await page.evaluate(()=>window.mailCalls[0].action),'previewRaffleInvitations');
 await page.evaluate(()=>{window.mailMode='pending';});
 await page.locator('[data-raffle-mail-preview]').click();
 await page.locator('[data-raffle-campaign]').dispatchEvent('change');
 await page.evaluate(()=>window.finishMailPreview({previews:[{email:'stale@example.com',subject:'stale',body:'stale'}]}));
 assert.doesNotMatch(await page.locator('[data-raffle-result]').textContent(),/stale@example.com/);
 await page.evaluate(()=>{window.mailMode='error';});
 await page.locator('[data-raffle-mail-preview]').click();
 await page.getByText('活動網址尚未設定',{exact:true}).waitFor();
 await page.evaluate(()=>{
   clearRaffleWorkspace();window.queueCalls=[];window.queued=false;
   callApi=async(action,params)=>{
     if(action==='getRaffleWorkspace') return {enabled:true,readOnly:false,campaigns:[{id:'future',name:'新活動'}],claims:[]};
     if(action==='previewRaffleInvitations') return {dryRun:true,deliveryChecked:true,sendEnabled:false,readOnly:false,previewToken:'queue-token',batchCount:window.queued?0:1,candidateCount:window.queued?0:1,skipped:window.queued?1:0,previews:window.queued?[]:[{email:'student@example.com',subject:'邀請',body:'驗證碼 ABC'}]};
     if(action==='confirmRaffleInvitations'){window.queueCalls.push(params.operation);window.queued=true;if(window.queueCalls.length===1)throw Error('排入結果逾時');return{queued:1,remaining:0};}
     if(action==='getRaffleMailRecords') return {total:1,records:[{email:'student@example.com',status:'queued',qualificationCount:1,actor:'店長',createdAt:'2026-10-03'}]};
     throw Error('Unexpected queue action');
   };renderRaffleWorkspace('admin');
 });
 await page.locator('[data-raffle-mail-preview]').click();
 await page.locator('[data-raffle-confirm-mail]').click();
 await page.locator('[data-raffle-cancel]').click();
 assert.equal(await page.evaluate(()=>window.queueCalls.length),0);
 await page.locator('[data-raffle-confirm-mail]').click();
 await page.locator('[data-raffle-save]').click();
 await page.getByText('排入結果逾時',{exact:false}).waitFor();
 await page.locator('[data-raffle-save]').click();
 await page.getByText('已排入待寄 1 封，尚未寄出；可到寄信紀錄查看。',{exact:true}).waitFor();
 const queueCalls=await page.evaluate(()=>window.queueCalls);assert.equal(queueCalls.length,2);assert.deepEqual(queueCalls[0],queueCalls[1]);
 assert.equal(await page.locator('[data-raffle-confirm-mail]').count(),0);
 await page.locator('[data-raffle-mail-records]').click();
 await page.getByText('抽獎邀請｜待寄（尚未寄出）｜1 筆資格',{exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'/private/tmp/raffle-preview/mail-queue-mobile.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
   clearRaffleWorkspace();
   window.writeCalls=[];
   window.writableFixture={enabled:true,readOnly:false,canPrepare:true,canCorrect:true,campaigns:[{id:'future',name:'新活動'}],claims:[{id:'claim-a',version:1,studentKey:'a',studentName:'同名學生',maskedEmail:'a•••@example.com',campaignId:'future',prizeName:'提袋',venue:'晴光',status:'ready',quantity:1,claimedQuantity:0}]};
   callApi=async(action,params)=>{
     if(action==='getRaffleWorkspace') return window.writableFixture;
     if(action==='previewRaffleImport') return {readOnly:false,previewToken:'token',campaignId:'future',batchCount:1,additionCount:1,duplicates:0,conflictCount:0,errorCount:0,additions:[]};
     if(action==='confirmRaffleImport'){window.writeCalls.push({action,...params});return{imported:1,remaining:0};}
     if(action==='mutateRaffleClaim') {
       window.writeCalls.push({action,...params});
       window.writableFixture.claims[0]={...window.writableFixture.claims[0],status:'claimed',claimedQuantity:1,version:2};
       if(window.writeCalls.filter(c=>c.action==='mutateRaffleClaim').length===1) throw Error('模擬結果逾時');
       return {claimId:'claim-a',status:'claimed',version:2,claimedQuantity:1};
     }
     if(action==='getRaffleAudit') return {events:[{actor:'老師',action:'collect',at:'2027-01-01',reason:'',claimedQuantity:1}]};
     throw Error('unexpected action');
   };
   renderRaffleWorkspace('admin');
 });
 await page.locator('[data-raffle-query]').fill('同名');
 await page.getByRole('button',{name:'查詢學生',exact:true}).click();
 await page.locator('[data-raffle-action=collect]').click();
 await page.locator('[data-raffle-cancel]').click();
 assert.equal(await page.evaluate(()=>window.writeCalls.length),0);
 await page.locator('[data-raffle-action=collect]').click();
 await page.locator('[data-raffle-venue]').selectOption('wrong-venue');
 await page.locator('[data-raffle-save]').click();
 assert.equal(await page.evaluate(()=>window.writeCalls.length),0);
 await page.locator('[data-raffle-venue]').selectOption('晴光');
 await page.locator('[data-raffle-save]').click();
 await page.getByText('模擬結果逾時',{exact:false}).waitFor();
 assert.equal(await page.locator('[data-raffle-quantity]').isDisabled(),true);
 await page.screenshot({path:'/private/tmp/raffle-preview/retry-mobile.png'});
 await page.locator('[data-raffle-save]').click();
 await page.getByText('這一筆已更新，已保留操作紀錄。').waitFor();
 assert.equal(await page.locator('[data-raffle-action=collect]').count(),0);
 const calls=await page.evaluate(()=>window.writeCalls);assert.equal(calls.length,2);assert.deepEqual(calls[0].operation,calls[1].operation);
 await page.locator('[data-raffle-action=audit]').click();
 await page.getByText('2027-01-01｜老師｜已領 1 件').waitFor();
 await page.locator('[data-raffle-cancel]').click();
 await page.locator('[data-raffle-preview]').click();
 await page.locator('[data-raffle-confirm-import]').click();
 await page.locator('[data-raffle-save]').click();
 await page.getByText('已同步 1 筆，剩餘 0 筆；沒有寄信。').waitFor();
 assert.equal(await page.evaluate(()=>window.writeCalls.filter(c=>c.action==='confirmRaffleImport').length),1);
 await page.evaluate(()=>{
   clearRaffleWorkspace();window.sendCalls=[];window.reconcileCalls=[];window.sendMode='normal';
   callApi=async(action,params)=>{
     if(action==='getRaffleWorkspace')return{enabled:true,readOnly:false,campaigns:[{id:'future',name:'新活動'}],claims:[]};
     if(action==='previewRaffleMailSend'){
       const preview={dryRun:true,sendEnabled:true,channels:['email','ob'],obPush:true,quota:2,batchCount:1,previewToken:'send-token',previews:[{email:'student@example.com',subject:'邀請信',body:'https://example.com/'+ 'long'.repeat(40)+'\nCODE 測試內容'}]};
       if(window.sendMode==='pending')return new Promise(resolve=>{window.finishSendPreview=()=>resolve(preview);});
       return preview;
     }
     if(action==='sendRaffleMailBatch'){window.sendCalls.push(params.operation);if(window.sendCalls.length===1)throw Error('寄送結果逾時');return{attemptId:params.operation.requestId,total:1,sent:0,pendingReview:1,closed:0};}
     if(action==='getRaffleMailRecords')return{canReconcile:true,total:60,reviewCount:window.reconcileCalls.length?0:1,offset:params.offset || 0,hasMore:!params.offset,records:[{id:'job-one',email:params.offset?'page2@example.com':'student@example.com',qualificationCount:1,status:window.reconcileCalls.length?'sent':'uncertain',createdAt:'2026-10-03',actor:'店長'}]};
     if(action==='reconcileRaffleMail'){window.reconcileCalls.push(params.operation);return{jobId:'job-one',status:'sent'};}
     throw Error('Unexpected send action '+action);
   };renderRaffleWorkspace('admin');
 });
 await page.locator('[data-raffle-mail-send]').click();
 for(const [name,width,height] of [['mail-send-mobile',390,844],['mail-send-desktop',1280,1000]]){
   await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`/private/tmp/raffle-preview/${name}.png`,fullPage:true});
 }
 await page.locator('[data-raffle-confirm-send]').click();
 await page.locator('[data-raffle-cancel]').click();assert.equal(await page.evaluate(()=>window.sendCalls.length),0);
 await page.locator('[data-raffle-confirm-send]').click();await page.locator('[data-raffle-save]').click();
 await page.getByText('寄送結果逾時',{exact:false}).waitFor();await page.locator('[data-raffle-save]').click();
 await page.getByText('本批 1 封：已送出／核對 0 封，待確認 1 封。',{exact:false}).waitFor();
 const sends=await page.evaluate(()=>window.sendCalls);assert.equal(sends.length,2);assert.deepEqual(sends[0],sends[1]);
 await page.locator('[data-raffle-reconcile]').click();await page.locator('[data-raffle-save]').click();assert.equal(await page.evaluate(()=>window.reconcileCalls.length),0);
 await page.locator('[data-raffle-mail-status]').selectOption('sent');await page.locator('[data-raffle-mail-reason]').fill('已向收件人確認收到');await page.locator('[data-raffle-save]').click();
 await page.getByText('已保存核對結論與理由，沒有重寄。').waitFor();assert.equal(await page.locator('[data-raffle-reconcile]').count(),0);
 await page.locator('[data-raffle-mail-page="50"]').click();await page.getByText('page2@example.com',{exact:true}).waitFor();
 await page.locator('[data-raffle-mail-page="0"]').click();await page.locator('[data-raffle-result]').getByText('student@example.com',{exact:true}).waitFor();
 await page.evaluate(()=>{window.sendMode='pending';});await page.locator('[data-raffle-mail-send]').click();
 await page.locator('[data-raffle-campaign]').dispatchEvent('change');await page.evaluate(()=>window.finishSendPreview());
 assert.equal(await page.locator('[data-raffle-confirm-send]').count(),0);
 await page.evaluate(()=>{
   clearRaffleWorkspace();window.prepWrites=[];window.prepReady=false;window.prepMode='normal';
   authState.managementCapabilities=['raffle_fulfillment'];
   callApi=async(action,params)=>{
     if(action==='getRaffleWorkspace')return{enabled:true,readOnly:false,canPrepare:true,canCorrect:false,campaigns:[{id:'future',name:'新活動'}],claims:[]};
     if(action==='getRaffleFulfillment'){
       const g={id:'group1',prizeName:'教室現貨與訂製提袋',venue:'晴光',claimCount:2,waiting:window.prepReady?1:2,ready:window.prepReady?1:0,claimed:0};
       const data={campaignId:'future',readOnly:false,canPrepare:true,canCorrect:false,totals:{waiting:g.waiting,ready:g.ready,claimed:0},excluded:{digital:1,cancelled:0},offset:params.offset||0,totalGroups:51,hasMore:!params.offset,groups:params.groupId?[]:[g],claims:params.groupId?[{id:'claim1',version:1,studentKey:'a',studentName:'同名學生',maskedEmail:'a•••@example.com',campaignId:'future',prizeName:g.prizeName,venue:'晴光',quantity:1,claimedQuantity:0,status:window.prepReady?'ready':'waiting'},{id:'claim2',version:1,studentKey:'b',studentName:'同名學生',maskedEmail:'b•••@example.com',campaignId:'future',prizeName:g.prizeName,venue:'晴光',quantity:1,claimedQuantity:0,status:'waiting'}]:[]};
       if(params.groupId){data.group=g;data.totalClaims=2;data.hasMore=false;}
       if(window.prepMode==='pending')return new Promise(resolve=>{window.finishPrep=()=>resolve(data);});
       return data;
     }
     if(action==='mutateRaffleClaim'){window.prepWrites.push(params.operation);window.prepReady=true;return{claimId:'claim1',version:2,status:'ready',claimedQuantity:0};}
     throw Error('Unexpected prep action '+action);
   };switchView('view-raffle');
 });
 await page.locator('[data-raffle-fulfillment]').click();await page.getByText('請先選擇一個活動，再查看備貨清單。').waitFor();
 await page.locator('[data-raffle-campaign]').selectOption('future');await page.locator('[data-raffle-fulfillment]').click();
 for(const [name,width,height] of [['prep-mobile',390,844],['prep-desktop',1280,1000]]){
   await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`/private/tmp/raffle-preview/${name}.png`,fullPage:true});
 }
 assert.equal(await page.locator('[data-raffle-mail-send]').count(),0);
 await page.locator('[data-raffle-fulfillment-page="50"]').click();await page.getByText('每頁最多 50 組，第 2 頁。').waitFor();
 await page.locator('[data-raffle-fulfillment-page="0"]').click();
 await page.locator('[data-raffle-fulfillment-group="group1"]').click();assert.equal(await page.locator('[data-raffle-student]').count(),2);
 await page.locator('[data-raffle-action="prepare"]').first().click();await page.locator('[data-raffle-cancel]').click();assert.equal(await page.evaluate(()=>window.prepWrites.length),0);
 await page.locator('[data-raffle-action="prepare"]').first().click();await page.locator('[data-raffle-venue]').selectOption('晴光');await page.locator('[data-raffle-save]').click();
 await page.getByText('這一筆已更新，已保留操作紀錄。').waitFor();assert.equal(await page.locator('[data-raffle-action="prepare"]').count(),1);
 await page.locator('[data-raffle-fulfillment-group=""]').click();await page.getByText('待備貨 1 件 · 已備妥未領 1 件 · 已領取 0 件').first().waitFor();
 await page.evaluate(()=>{window.prepMode='pending';});await page.locator('[data-raffle-fulfillment]').click();await page.locator('[data-raffle-campaign]').dispatchEvent('change');await page.evaluate(()=>window.finishPrep());assert.equal(await page.locator('[data-raffle-fulfillment-group]').count(),0);
 await page.evaluate(()=>clearSession());
 assert.equal(await page.locator('[data-raffle-result]').count(),0);
 console.log('PASS: teacher/admin, disabled, minimum query, same-name grouping, cancellation, venue, same-ID uncertain retry, confirmed import, audit, stale response, logout and mobile/desktop layout');
} finally { await browser.close(); }
