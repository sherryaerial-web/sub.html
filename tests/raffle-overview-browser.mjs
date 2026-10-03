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
  window.mountOverview=mode=>{
   const root=document.createElement('main');document.body.replaceChildren(root);window.overviewCalls=[];window.overviewBehavior='ok';
   window.disposeOverview=SherryRaffle.mount(root,{mode,api:async(action,params)=>{
    overviewCalls.push(action);if(action==='getRaffleWorkspace')return{enabled:true,readOnly:true,campaigns:[{id:'one',name:'測試活動一'},{id:'two',name:'測試活動二'}],claims:[]};
    if(action!=='getRaffleOverview')throw Error('unexpected write or unrelated API '+action);
    const mail={total:3,queued:1,sending:1,uncertain:0,sent:1,closed:0,review:1};
    const result={readOnly:true,sourceChecked:false,campaignId:params.campaignId,campaignName:params.campaignId==='one'?'測試活動一':'測試活動二',asOf:'2027-01-01T00:00:00Z',claims:{total:5,waiting:1,ready:1,partial:1,claimed:1,digital:0,cancelled:1,deliveredUnits:3,pendingUnits:4,blockedRecords:3,blockedUnits:4},mail:{invitation:mail,ready:mail}};
    if(overviewBehavior==='bad')return{campaignId:params.campaignId};if(overviewBehavior==='wrong')return{...result,campaignId:'not-selected'};
    if(overviewBehavior==='slow')return new Promise(resolve=>window.finishOverview=()=>resolve(result));
    return result;
   }});
  };mountOverview('admin');
 });
 await page.locator('[data-raffle-overview]').click();await page.getByText('測試活動一｜活動總覽',{exact:true}).waitFor();
 for(const width of [390,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`/private/tmp/raffle-preview/overview-${width}.png`,fullPage:true});}
 assert.equal(await page.locator('[data-raffle-result] button').count(),0);
 await page.evaluate(()=>overviewBehavior='bad');await page.locator('[data-raffle-overview]').click();await page.getByText('未收到完整活動總覽',{exact:false}).waitFor();
 await page.evaluate(()=>overviewBehavior='wrong');await page.locator('[data-raffle-overview]').click();await page.getByText('活動總覽與所選活動不符',{exact:false}).waitFor();
 await page.evaluate(()=>overviewBehavior='slow');await page.locator('[data-raffle-overview]').click();await page.locator('[data-raffle-campaign]').selectOption('two');await page.evaluate(()=>finishOverview());await page.getByText('活動已切換',{exact:false}).waitFor();assert.equal(await page.getByText('測試活動一｜活動總覽',{exact:true}).count(),0);
 await page.evaluate(()=>overviewBehavior='ok');await page.locator('[data-raffle-overview]').click();await page.getByText('測試活動二｜活動總覽',{exact:true}).waitFor();
 await page.evaluate(()=>overviewBehavior='slow');await page.locator('[data-raffle-overview]').click();await page.evaluate(()=>{disposeOverview();finishOverview();});await page.waitForTimeout(20);assert.equal(await page.locator('[data-raffle-result]').count(),0);
 assert.equal(await page.evaluate(()=>overviewCalls.every(a=>a==='getRaffleWorkspace'||a==='getRaffleOverview')),true);
 await page.evaluate(()=>mountOverview('teacher'));await page.getByRole('button',{name:'查詢學生',exact:true}).waitFor();assert.equal(await page.locator('[data-raffle-overview]').count(),0);
 console.log('PASS overview: read-only calls, mobile/desktop no overflow, malformed/wrong campaign errors, stale reply on switch/logout discarded, teacher hidden');
}finally{await browser.close();}
