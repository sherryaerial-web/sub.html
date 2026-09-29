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
 await page.getByText('核對結果 · 尚未匯入').waitFor();
 await page.screenshot({path:'/private/tmp/raffle-preview/admin-mobile.png',fullPage:true});
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
 await page.getByText('已匯入 1 筆，剩餘 0 筆；沒有寄信。').waitFor();
 assert.equal(await page.evaluate(()=>window.writeCalls.filter(c=>c.action==='confirmRaffleImport').length),1);
 await page.evaluate(()=>clearSession());
 assert.equal(await page.locator('[data-raffle-result]').count(),0);
 console.log('PASS: teacher/admin, disabled, minimum query, same-name grouping, cancellation, venue, same-ID uncertain retry, confirmed import, audit, stale response, logout and mobile/desktop layout');
} finally { await browser.close(); }
