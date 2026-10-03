import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_NODE_MODULES,'playwright'));
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage();await page.route('**/*',r=>r.request().url()==='http://localhost/'?r.fulfill({contentType:'text/html',body:'<main id="root"></main>'}):r.abort());
 await page.goto('http://localhost/');await page.addScriptTag({path:path.join(repo,'raffle.js')});
 await page.evaluate(()=>{
  window.calls=[];window.failWrite=false;window.pause=false;
  window.api=async(action,params)=>{
   calls.push({action,params});
   if(action==='getRaffleWorkspace')return {enabled:true,campaigns:[{id:'future',name:'未來活動'}],claims:[],readOnly:false};
   if(action==='previewRaffleObSync'){
    const data={campaignId:'future',dryRun:true,readOnly:false,dateFrom:'2027-01-01',dateTo:'2027-01-31',passIds:['123'],fetched:2,newCount:2,raffleCount:1,giftCount:1,gifts:[{purchaseId:'1',studentName:'測試學生',prizeName:'固定提袋',venue:'晴光'}],excludedZeroPrice:0,needsReview:0,reviewPurchases:[],existing:0,skipped:0,batchCount:2,previewToken:'test'};
    if(pause)return new Promise(resolve=>{window.finish=()=>resolve(data);});return data;
   }
   if(action==='confirmRaffleObSync')return failWrite?{}:{campaignId:'future',inserted:2,raffleInserted:1,giftInserted:1,remaining:0,mailSent:false};
   throw Error('Unexpected '+action);
  };
  window.dispose=SherryRaffle.mount(document.getElementById('root'),{api,mode:'admin'});
 });
 await page.locator('[data-raffle-ob-sync]').click();await page.locator('[data-ob-confirm]').waitFor();
 for(const width of [390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('dialog[open]').evaluate(e=>e.scrollWidth>e.clientWidth),false);}
 page.once('dialog',d=>d.dismiss());await page.locator('[data-ob-confirm]').click();assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='confirmRaffleObSync').length),0);
 page.once('dialog',d=>d.accept());await page.locator('[data-ob-confirm]').click();await page.getByText(/已新增 1 筆抽獎資格、1 件固定贈品/).waitFor();assert.equal(await page.locator('[data-ob-confirm]').count(),0);
 assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='confirmRaffleObSync').length),1);
 await page.evaluate(()=>{failWrite=true;});await page.locator('[data-ob-preview]').click();await page.locator('[data-ob-confirm]').waitFor();page.once('dialog',d=>d.accept());await page.locator('[data-ob-confirm]').click();await page.getByText(/尚未確認結果，請先重新核對 OB/).waitFor();assert.equal(await page.locator('[data-ob-confirm]').count(),0);
 await page.evaluate(()=>{pause=true;});await page.locator('[data-ob-preview]').click();await page.locator('[data-ob-close]').click();await page.evaluate(()=>finish());assert.equal(await page.locator('[data-ob-confirm]').count(),0);
 await page.evaluate(()=>{dispose();dispose=SherryRaffle.mount(document.getElementById('root'),{api,mode:'teacher'});});await page.locator('[data-raffle-query]').waitFor();assert.equal(await page.locator('[data-raffle-ob-sync]').count(),0);
 assert.deepEqual(await page.evaluate(()=>[...new Set(calls.map(c=>c.action))]),['getRaffleWorkspace','previewRaffleObSync','confirmRaffleObSync']);
 console.log('PASS OB sync UI: admin-only entry, preview, cancel, confirm, uncertain result, closed late response, mobile/desktop, no mail');
}finally{await browser.close();}
