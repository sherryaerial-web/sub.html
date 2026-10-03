import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url), {chromium}=require(path.join(process.env.CODEX_NODE_MODULES,'playwright'));
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=(await fs.readFile(path.join(repo,'index.html'),'utf8')).replace(/<script\b[^>]*src=[^>]*><\/script>/g,'').replace(/\n    initialize\(\);/,'');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page=await browser.newPage();await page.route('**/*',r=>r.abort());await page.setContent(html);await page.addScriptTag({path:path.join(repo,'raffle.js')});
 await page.evaluate(()=>{
  window.settingsState={readOnly:false,operationalEnabled:false,campaigns:[]};window.settingsWrites=[];window.settingsCalls=[];window.settingsFail=false;
  callApi=async(action,params)=>{
   settingsCalls.push(action);
   if(action==='getRaffleWorkspace')return{enabled:false,campaigns:[],claims:[]};
   if(action==='getRaffleCampaignSettings')return structuredClone(settingsState);
   if(action==='saveRaffleCampaign'||action==='activateRaffleCampaign'){
    const op=JSON.parse(params.operation);settingsWrites.push({action,op});
    if(settingsFail){settingsFail=false;throw Error('測試回應不確定');}
    if(window.settingsStale&&action==='activateRaffleCampaign'){window.settingsStale=false;throw Error('活動版本或來源資料已變更，請重新預覽。');}
    const item=action==='saveRaffleCampaign'?{campaign:op.campaign,version:op.version+1,status:'draft'}:{...settingsState.campaigns[0],version:op.version+1,status:'active'};
    settingsState.campaigns=[item];return{campaignId:item.campaign.id,version:item.version,status:item.status};
   }
   if(action==='previewRaffleCampaignActivation'){
    const result={canActivate:true,campaignId:'fixture',version:settingsState.campaigns[0].version,sourceRows:0,prizeCount:2,previewToken:'test-token'};
    if(window.settingsPause)return new Promise(resolve=>{window.finishSettings=()=>resolve(result);});return result;
   }
   throw Error('Unexpected '+action);
  };
  authState.sessionToken='fixture';authState.teacherName='測試管理員';authState.managementCapabilities=['raffle_admin'];document.getElementById('app-shell').hidden=false;document.getElementById('auth-shell').hidden=true;activeAdminTab='raffle';activeAdminSection='raffle';switchView('view-admin');
 });
 await page.locator('[data-raffle-settings]').click();await page.locator('[data-settings-new]').click();
 for(const [key,value] of Object.entries({id:'fixture',name:'本機測試活動',sourceSpreadsheetId:'fixture-source-1234567890',websiteUrl:'https://example.com/raffle'}))await page.locator(`[data-settings-form] [name="${key}"]`).fill(value);
 assert.equal(await page.evaluate(()=>settingsWrites.length),0);
 await page.locator('[name="obDateFrom"]').fill('2027-01-01');await page.locator('[name="obDateTo"]').fill('2027-01-31');await page.locator('[name="obPassIds"]').fill('123,456');
 await page.locator('[name="fixedGifts"]').fill('123｜gift1｜晴光');
 assert.equal(await page.locator('[name="fixedGifts"]').evaluate(e=>!!(e.compareDocumentPosition(e.form.querySelector('[type="submit"]'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
 await page.evaluate(()=>{settingsFail=true;});await page.getByRole('button',{name:'儲存草稿（不啟用）',exact:true}).click();await page.locator('[data-settings-retry]').waitFor();
 assert.equal(await page.locator('[data-settings-form] [name="name"]').isDisabled(),true);
 await page.locator('[data-settings-retry]').click();await page.getByText('草稿已儲存，尚未啟用。',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>settingsWrites[0].op.requestId===settingsWrites[1].op.requestId),true);
 assert.deepEqual(await page.evaluate(()=>settingsWrites[1].op.campaign.obSync),{dateFrom:'2027-01-01',dateTo:'2027-01-31',passIds:['123','456'],fixedGifts:[{passId:'123',prizeId:'gift1',venue:'晴光'}]});
 await page.locator('[name="name"]').fill('未存變更');await page.locator('[data-settings-preview]').click();await page.getByText('請先儲存變更，再核對來源。',{exact:true}).waitFor();
 await page.locator('[name="name"]').fill('本機測試活動');await page.locator('[data-settings-preview]').click();await page.locator('[data-settings-activate]').waitFor();
 await fs.mkdir('/private/tmp/raffle-preview',{recursive:true});
 for(const [name,width,height] of [['settings-mobile',390,844],['settings-desktop',1280,1000]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('dialog[open]').evaluate(e=>e.scrollWidth>e.clientWidth),false);await page.screenshot({path:`/private/tmp/raffle-preview/${name}.png`,fullPage:true});}
 page.once('dialog',d=>d.dismiss());await page.locator('[data-settings-activate]').click();assert.equal(await page.evaluate(()=>settingsWrites.length),2);
 await page.evaluate(()=>{window.settingsStale=true;});page.once('dialog',d=>d.accept());await page.locator('[data-settings-activate]').click();await page.locator('[data-settings-reload]').waitFor();await page.locator('[data-settings-reload]').click();await page.locator('[data-settings-edit]').click();await page.locator('[data-settings-preview]').click();await page.locator('[data-settings-activate]').waitFor();
 page.once('dialog',d=>d.accept());await page.locator('[data-settings-activate]').click();await page.getByText('已啟用活動設定；未匯入或寄信。請離開再進入領獎工作台，更新活動清單。',{exact:true}).waitFor();
 assert.equal(await page.locator('[data-settings-edit]').count(),0);
 assert.deepEqual(await page.evaluate(()=>[...new Set(settingsCalls)]),['getRaffleWorkspace','getRaffleCampaignSettings','saveRaffleCampaign','previewRaffleCampaignActivation','activateRaffleCampaign']);
 await page.locator('[data-settings-close]').click();
 await page.evaluate(()=>{settingsState.campaigns[0].status='draft';settingsPause=true;});await page.locator('[data-raffle-settings]').click();await page.locator('[data-settings-edit]').click();await page.locator('[data-settings-preview]').click();await page.locator('[data-settings-close]').click();await page.evaluate(()=>finishSettings());assert.equal(await page.locator('[data-settings-activate]').count(),0);
 await page.locator('[data-raffle-settings]').click();await page.locator('[data-settings-edit]').click();await page.locator('[data-settings-preview]').click();await page.evaluate(()=>{clearSession();finishSettings();});assert.equal(await page.locator('[data-settings-form]').count(),0);
 console.log('PASS settings: disabled workspace access, draft only, same-ID retry, unsaved changes, activation cancel/confirm, no mail/import, mobile/desktop overflow, closed/logout stale response');
}finally{await browser.close();}
