import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('/Users/ivy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage(),calls=[],errors=[];let failSend=false;page.setDefaultTimeout(5000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><main></main>'}));await page.goto('https://native-ready.test');
 const notice={id:'notice-one',claimId:'claim-one',revision:2,status:'accepted',channels:{line:'accepted',ob:'skipped',email:'skipped'},nextAction:null,readConfirmed:false};
 await page.exposeFunction('testApi',async(action,p)=>{
  calls.push({action,p});
  if(action==='getRaffleWorkspace')return {enabled:true,readOnly:true,readyDeliveryCampaign:'future',campaigns:[{id:'future',name:'測試'}],claims:[{id:'claim-one',campaignId:'future',studentKey:'one',studentName:'測試學生',status:'ready',quantity:1,prizeName:'提袋',venue:'晴光'}]};
  if(action==='previewRaffleReadyAppDelivery')return {actor:'店長',testOnly:true,dryRun:true,sendEnabled:true,campaignId:'future',claimId:'claim-one',noticeId:'notice-one',previewToken:'proof',remaining:1,content:{prizeName:'提袋',venue:'晴光',pickupDeadline:'2027-01-30'}};
  if(action==='dispatchRaffleReadyAppDelivery'){assert.equal(p.expectedActor,'店長');await new Promise(r=>setTimeout(r,100));if(failSend)throw Error('結果未確認');return{testOnly:true,campaignId:'future',notice};}
  if(action==='reconcileRaffleReadyAppDelivery')return{testOnly:true,campaignId:'future',notice};
  throw Error('unexpected '+action);
 });
 await page.addScriptTag({path:fileURLToPath(new URL('../raffle.js',import.meta.url))});
 const mount=async()=>{await page.evaluate(()=>{window.dispose?.();window.dispose=SherryRaffle.mount(document.querySelector('main'),{mode:'admin',api:window.testApi});});await page.locator('[data-raffle-query]').fill('測試學生');await page.getByRole('button',{name:'查詢學生',exact:true}).click();};
 await mount();await page.locator('[data-ready-delivery]').waitFor({timeout:3000});await page.locator('[data-ready-delivery]').click();
 await page.locator('[data-ready-delivery-send]').waitFor();
 assert.equal(calls.filter(c=>c.action==='dispatchRaffleReadyAppDelivery').length,0);
 await page.locator('[data-ready-delivery-send]').evaluate(b=>{b.click();b.click();});
 await page.getByText('服務已接受通知，不代表學生已讀。',{exact:true}).waitFor();
 assert.equal(calls.filter(c=>c.action==='dispatchRaffleReadyAppDelivery').length,1);assert.equal(await page.locator('[data-ready-delivery-send]').count(),0);
 failSend=true;await mount();await page.locator('[data-ready-delivery]').click();await page.locator('[data-ready-delivery-send]').click();
 await page.waitForFunction(()=>document.querySelector('[data-ready-delivery-box]')?.textContent.includes('結果未確認'));assert.equal(await page.locator('[data-ready-delivery-send]').count(),0);
 await page.locator('[data-ready-delivery-check]').click();await page.getByText('服務已接受通知，不代表學生已讀。',{exact:true}).waitFor();
 assert.equal(calls.filter(c=>c.action==='dispatchRaffleReadyAppDelivery').length,2);
 assert.equal(calls.filter(c=>c.action==='reconcileRaffleReadyAppDelivery').length,1);
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:850});assert.equal(await page.locator('[data-ready-delivery-box]').evaluate(el=>el.scrollWidth>el.clientWidth),false);}
 await page.evaluate(()=>window.dispose());assert.equal(await page.locator('main').textContent(),'');assert.deepEqual(errors,[]);
 console.log('PASS native preview/explicit send/double click/unknown readback/no resend/mobile/disposal; fake network only');
}finally{await browser.close();}
