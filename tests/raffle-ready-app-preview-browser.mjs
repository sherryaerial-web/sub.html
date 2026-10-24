import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{setup,admin}=require('./helpers/raffle-ready-fixture.js');
const {chromium}=require('/Users/ivy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const s=setup(1);s.props.set('RAFFLE_READY_NOTIFICATION_OWNER','line');s.props.set('RAFFLE_READY_SOURCE_TEST_CAMPAIGN','future');
const before=s.writes(),calls=[];
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><main></main>'}));
 await page.goto('https://app-preview.test/');
 await page.exposeFunction('testApi',(action,p)=>{
  calls.push(action);
  if(action==='getRaffleWorkspace')return s.c.getRaffleWorkspace_(admin,p);
  if(action==='previewRaffleReadyAppNotice')return s.c.previewRaffleReadyAppNotice_(admin,p.campaignId,p.claimId);
  throw Error('unexpected action '+action);
 });
 await page.addScriptTag({path:fileURLToPath(new URL('../raffle.js',import.meta.url))});
 await page.evaluate(()=>{window.dispose=SherryRaffle.mount(document.querySelector('main'),{mode:'admin',api:window.testApi});});
 await page.locator('[data-raffle-query]').fill('student0@example.com');await page.getByRole('button',{name:'查詢學生',exact:true}).click();
 const preview=page.locator('[data-raffle-result] [data-raffle-ready-preview]');await preview.click();
 await page.getByText('限定測試預覽，尚未寄送',{exact:true}).waitFor();
 assert.match(await page.locator('[data-ready-app-preview]').textContent(),/提袋/);
 assert.equal(await page.locator('[data-ready-app-preview] button').count(),0);
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:850});assert.equal(await page.locator('[data-ready-app-preview]').evaluate(el=>el.scrollWidth>el.clientWidth),false);}
 await page.evaluate(()=>window.dispose());assert.equal(await page.locator('main').textContent(),'');
 assert.equal(s.writes(),before);assert.equal(s.mails.length,0);assert.deepEqual(errors,[]);
 assert.deepEqual(calls,['getRaffleWorkspace','getRaffleWorkspace','previewRaffleReadyAppNotice']);
 console.log('PASS native App search → source preview, 320/390/1280 preview widths, disposal, no writes or sends');
}finally{await browser.close();}
