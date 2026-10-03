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
 page.on('dialog',d=>d.type()==='prompt'?d.accept('核對維護'):d.accept());
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>{
   const host=document.createElement('main');document.body.replaceChildren(host);window.controlWrites=[];
   const item={campaign:{id:'fixture',name:'測試活動',sourceSpreadsheetId:'fixture-source-123456789',websiteUrl:'https://example.com',pickupDeadline:'',readyPrizeVenues:[]},version:2,status:'active'};
   SherryRaffle.mountCampaignSettings(host,{api:async(action,params)=>{
    if(action==='getRaffleCampaignSettings')return{readOnly:false,operationalEnabled:true,campaigns:[structuredClone(item)]};
    if(action==='previewRaffleCampaignActivation')return{canActivate:true,campaignId:'fixture',version:item.version,sourceRows:1,prizeCount:1,previewToken:'fixture-token'};
    const op=JSON.parse(params.operation);controlWrites.push({action,op});
    if(action==='manageRaffleCampaign'){item.status='paused';if(op.action==='update')item.campaign=op.campaign;}
    else if(action==='activateRaffleCampaign')item.status='active';else throw Error(action);
    item.version++;return{campaignId:'fixture',version:item.version,status:item.status};
   }});
  });
  await page.locator('[data-settings-pause]').click();await page.locator('[name="maintenanceReason"]').waitFor();assert.equal(await page.locator('[name="sourceSpreadsheetId"]').getAttribute('readonly'),'');
  await page.locator('[name="name"]').fill('更新測試活動');await page.locator('[name="maintenanceReason"]').fill('修改活動名稱');await page.locator('[data-settings-form] [type="submit"]').click();
  await page.waitForFunction(()=>controlWrites.length===2);await page.locator('[name="maintenanceReason"]').fill('來源核對完成');await page.locator('[data-settings-preview]').click();await page.locator('[data-settings-activate]').click();await page.locator('[data-settings-pause]').waitFor();
  assert.deepEqual(await page.evaluate(()=>controlWrites.map(w=>w.op.action||w.action)),['pause','update','activateRaffleCampaign']);
  await page.evaluate(()=>{
   const host=document.createElement('main');document.body.replaceChildren(host);window.controlWrites=[];window.reopened=false;window.restored=false;window.badReopen=true;window.holdPreview=false;window.releasePreview=null;
   const claim={id:'claim',campaignId:'fixture',studentKey:'key',studentName:'測試學生',maskedEmail:'f•••@example.com',prizeName:'測試提袋',venue:'晴光',quantity:1,claimedQuantity:0,status:'cancelled',version:2};
   window.unmountControls=SherryRaffle.mount(host,{mode:'admin',api:async(action,p)=>{
    if(action==='getRaffleWorkspace')return{enabled:true,readOnly:false,canCorrect:true,campaigns:[{id:'fixture',name:'測試活動'}],claims:p.query?[{...claim,status:restored?'waiting':'cancelled',version:restored?3:2}]:[]};
    if(action==='mutateRaffleClaim'){controlWrites.push({action,op:p.operation});restored=true;return{claimId:'claim',status:'waiting',version:3,claimedQuantity:0};}
    if(action==='getRaffleMailRecords')return{total:1,reviewCount:0,canReopen:true,records:[{id:'job',email:'fixture@example.com',kind:'invitation',status:reopened?'queued':'closed',closedBeforeSend:!reopened,qualificationCount:1}]};
    if(action==='previewRaffleMailReopen'){
     const result={campaignId:'fixture',jobId:'job',kind:'invitation',email:'fixture@example.com',dryRun:true,sendEnabled:false,readOnly:false,previewToken:'fixture-token',before:{subject:'舊活動',body:'舊內容'},after:{subject:'新活動',body:'新內容：不會直接寄出'}};
     if(holdPreview)return new Promise(resolve=>{releasePreview=()=>resolve(result);});return result;
    }
    if(action==='reopenRaffleMail'){controlWrites.push({action,op:p.operation});if(badReopen){badReopen=false;return{};}reopened=true;return{jobId:'job',status:'queued'};}
    throw Error(action);
   }});
  });
  await page.locator('[data-raffle-query]').fill('測試');await page.locator('.raffle-search button[type="submit"]').first().click();await page.locator('[data-raffle-action="restore"]').click();
  await page.locator('[data-raffle-venue]').selectOption('晴光');await page.locator('[data-raffle-reason]').fill('核對誤撤銷');await page.locator('[data-raffle-save]').click();await page.waitForFunction(()=>restored);assert.equal(await page.evaluate(()=>controlWrites[0].op.action),'restore');
  await page.locator('[data-raffle-mail-records]').click();await page.locator('[data-raffle-reopen]').click();await page.locator('[data-raffle-dialog][open]').waitFor();
  await page.locator('[data-raffle-cancel]').click();assert.equal(await page.evaluate(()=>controlWrites.length),1);
  await page.locator('[data-raffle-reopen]').click();await page.locator('[data-raffle-mail-reason]').fill('核對新内容');await page.locator('[data-raffle-save]').click();await page.waitForFunction(()=>document.querySelector('[data-raffle-operation-error]').textContent.includes('未收到完整'));
  await page.locator('[data-raffle-save]').click();await page.waitForFunction(()=>reopened);assert.equal(await page.evaluate(()=>controlWrites[1].op.requestId===controlWrites[2].op.requestId),true);
  await fs.mkdir('/private/tmp/raffle-preview',{recursive:true});await page.screenshot({path:`/private/tmp/raffle-preview/controls-${width}.png`,fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.evaluate(()=>{reopened=false;holdPreview=true;});await page.locator('[data-raffle-mail-records]').click();await page.locator('[data-raffle-reopen]').click();await page.waitForFunction(()=>!!releasePreview);await page.evaluate(()=>{unmountControls();releasePreview();});await page.waitForTimeout(20);assert.equal(await page.locator('dialog[open]').count(),0);
 }
 console.log('PASS desktop/mobile campaign pause-edit-resume, restore, reopen preview/cancel/ambiguous retry, disposed response; offline only');
} finally {await browser.close();}
