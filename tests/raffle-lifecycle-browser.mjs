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
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>{
   const host=document.createElement('main');document.body.replaceChildren(host);window.lifecycleWrites=[];window.failResolution=true;window.resolved=false;window.revoked=false;
   const claim={id:'claim-fixture',campaignId:'fixture',studentKey:'fixture-key',studentName:'測試學生',maskedEmail:'f•••@example.com',prizeName:'測試提袋',venue:'晴光',quantity:1,claimedQuantity:0,status:'ready',version:1};
   SherryRaffle.mount(host,{mode:'admin',api:async(action,params)=>{
    if(action==='getRaffleWorkspace')return{enabled:true,readOnly:false,canCorrect:true,canPrepare:true,campaigns:[{id:'fixture',name:'測試活動'}],claims:params.query?[{...claim,status:revoked?'cancelled':'ready',version:revoked?2:1,pickupBlocked:true,pickupDeadline:'2000-01-01'}]:[]};
    if(action==='previewRaffleImport')return{readOnly:false,previewToken:'fixture-preview',batchCount:0,conflictCount:resolved?0:1,conflicts:resolved?[]:[{row:2,id:claim.id,resolvable:true,before:claim,after:{...claim,venue:'劍潭',status:'waiting'}}],errors:[],additions:[]};
    if(action==='resolveRaffleConflict'){lifecycleWrites.push({action,...params.operation});if(failResolution){failResolution=false;return{};}resolved=true;return{claimId:claim.id,version:2,status:'waiting',claimedQuantity:0};}
    if(action==='mutateRaffleClaim'){lifecycleWrites.push({action,...params.operation});revoked=true;return{claimId:claim.id,version:2,status:'cancelled',claimedQuantity:0};}
    throw Error('unexpected API '+action);
   }});
  });
  await page.locator('[data-raffle-preview]').click();await page.locator('[data-raffle-resolve]').click();
  await page.locator('[data-raffle-cancel]').click();assert.equal(await page.evaluate(()=>lifecycleWrites.length),0);
  await page.locator('[data-raffle-resolve]').click();await page.locator('[data-raffle-save]').click();assert.equal(await page.evaluate(()=>lifecycleWrites.length),0);
  await page.locator('[data-raffle-reason]').fill('已向學生確認更改領取館別');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`/private/tmp/raffle-preview/lifecycle-${width}.png`,fullPage:true});
  await page.locator('[data-raffle-save]').click();await page.getByText('未收到完整領獎異動結果。',{exact:false}).waitFor();
  await page.locator('[data-raffle-save]').click();await page.getByText('需核對 0 筆',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>lifecycleWrites[0].requestId===lifecycleWrites[1].requestId),true);
  await page.locator('[data-raffle-query]').fill('測試學生');await page.getByRole('button',{name:'查詢學生',exact:true}).click();
  await page.getByText('已過領取期限',{exact:false}).waitFor();assert.equal(await page.locator('[data-raffle-action="collect"]').count(),0);
  await page.locator('[data-raffle-action="revoke"]').click();await page.locator('[data-raffle-save]').click();assert.equal(await page.evaluate(()=>lifecycleWrites.length),2);
  await page.locator('[data-raffle-reason]').fill('測試撤銷，保留領取歷程');await page.locator('[data-raffle-save]').click();
  await page.getByText('已撤銷／取消',{exact:true}).waitFor();assert.equal(await page.locator('[data-raffle-action="revoke"]').count(),0);
 }
 console.log('PASS lifecycle mobile/desktop: comparison, cancel, required reason, malformed reply, same-ID retry, expiry, revoke, terminal controls, no overflow. Network blocked.');
}finally{await browser.close();}
