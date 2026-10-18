import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_NODE_MODULES,'playwright'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page=await browser.newPage();
 await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><main id="root"></main>'}));
 await page.goto('https://gift-test.invalid');
 await page.addScriptTag({content:await fs.readFile(new URL('../raffle.js',import.meta.url),'utf8')});
 page.on('dialog',dialog=>dialog.accept());
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:850});
  await page.evaluate(()=>{
   localStorage.clear();window.writes=0;window.finish=null;
   const claims=[{id:'ball',studentName:'測試學生',email:'test@example.test',prizeName:'測試球',venue:'',quantity:2,claimedQuantity:0,status:'waiting',directPickup:true,version:1},{id:'bag',studentName:'測試學生',email:'test@example.test',prizeName:'測試提袋',venue:'劍潭',quantity:1,claimedQuantity:0,status:'waiting',directPickup:false,version:1}];
   SherryRaffle.mountActivityGifts(document.querySelector('#root'),{api:async action=>{
    if(action==='getActivityGiftWorkspace')return{testOnly:true,actor:'Tako',readOnly:false,claims};
    if(action==='mutateActivityGift'){window.writes++;await new Promise(resolve=>window.finish=resolve);claims[0].claimedQuantity=1;claims[0].status='partial';claims[0].version=2;return{state:'recorded'};}
    throw Error('Unexpected action '+action);
   }});
  });
  await page.locator('[data-gift-load]').click();
  await page.getByText('剩餘 2 顆',{exact:false}).waitFor();
  await page.locator('[data-gift-prize]').selectOption('測試提袋');
  assert.equal(await page.locator('[data-gift-id="ball"]').count(),0);
  assert.equal(await page.locator('[data-gift-action="collect"]').count(),0);
  await page.locator('[data-gift-search]').fill('查不到');
  await page.getByText('查無符合條件',{exact:false}).waitFor();
  await page.locator('[data-gift-search]').fill('');
  await page.locator('[data-gift-prize]').selectOption('測試球');
  await page.locator('[data-gift-id="ball"][data-gift-quantity="1"]').click();
  await page.getByText('處理中',{exact:false}).waitFor();
  assert.equal(await page.locator('[data-gift-id="ball"]').first().isDisabled(),true);
  await page.evaluate(()=>window.finish());
  await page.getByText('已核對完成',{exact:false}).waitFor();
  assert.equal(await page.locator('[data-gift-prize]').inputValue(),'測試球');
  await page.getByText('剩餘 1 顆',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>window.writes),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 const {setup,admin}=require('./helpers/raffle-mail-fixture.js');
 const backend=setup(0),calls=[];
 await page.exposeFunction('readinessApi',async action=>{
  calls.push(action);
  if(action==='getRaffleCampaignSettings')return {campaigns:[],readOnly:true,operationalEnabled:false};
  if(action==='getActivityProductionReadiness')return backend.c.getActivityProductionReadiness_(admin);
  throw Error('Unexpected write '+action);
 });
 for(const width of [320,1280]){
  await page.setViewportSize({width,height:850});
  await page.evaluate(()=>SherryRaffle.mountCampaignSettings(document.querySelector('#root'),{api:window.readinessApi}));
  await page.locator('[data-production-check]').click();
  await page.getByText('尚未設定正式活動草稿',{exact:true}).waitFor();
  await page.getByText('全店會員身分配對',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-production-report] button').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 assert.equal(backend.writes(),0);assert.equal(backend.mails.length,0);
 assert.ok(calls.every(a=>['getRaffleCampaignSettings','getActivityProductionReadiness'].includes(a)));
 console.log('PASS real DOM 320/390/1280: gift filters/pending feedback; admin readiness button to real GAS evaluator, missing draft and acceptance checklist, no activation or writes. All HTTP intercepted.');
} finally {await browser.close();}
