const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const admin={teacherName:'店長',managementCapabilities:['raffle_admin']};
const campaign={id:'future',name:'未來活動',sourceSpreadsheetId:'future-source-1234567890',websiteUrl:'https://example.com/raffle',pickupDeadline:'',readyPrizeVenues:[]};
function setup(){
 const props=new Map(Object.entries({RAFFLE_ENABLED:'true',RAFFLE_WRITES_ENABLED:'true',RAFFLE_CAMPAIGN_SETTINGS_ENABLED:'true',RAFFLE_CAMPAIGNS_JSON:'[]'})),tables=new Map(),pending=[];
 let locked=false,writes=0,reads=0,fail=false;
 const rows=[['OB email名稱','OB名字','驗證碼','API購課ID','是否已使用(Yes/空白)','寄送e-mail(Yes/空格)','寄送日期','中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間'],['a@example.com','學生','CODE1','BUY1','','','','','','','','']];
 const prizes=[['獎項ID','獎項等級','獎品名稱','領獎方式'],['p1','A','提袋','choose_venue']];
 const sheet=data=>({data,getLastRow:()=>data.length,getLastColumn:()=>Math.max(0,...data.map(r=>r.length)),getMaxRows:()=>10000,getRange:(r,c,n=1,m=1)=>({getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>String(data[r-1+i]?.[c-1+j]??''))),setValues:values=>{assert.ok(locked);writes++;pending.push(()=>values.forEach((line,i)=>{data[r-1+i]||=[];line.forEach((v,j)=>data[r-1+i][c-1+j]=v);}));}})});
 const c={Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null})},LockService:{getScriptLock:()=>({waitLock:()=>{assert.equal(locked,false);locked=true;},releaseLock:()=>{assert.equal(pending.length,0);locked=false;}})},SpreadsheetApp:{getActiveSpreadsheet:()=>{reads++;return{getSheetByName:n=>tables.get(n)||null,insertSheet:n=>{assert.equal(n,'RaffleCampaignJournal');const s=sheet([]);tables.set(n,s);return s;}};},openById:id=>{reads++;assert.equal(id,campaign.sourceSpreadsheetId);return{getSheetByName:n=>n==='抽獎名單'?sheet(rows):n==='獎項設定'?sheet(prizes):null};},flush:()=>{assert.ok(locked);pending.splice(0).forEach(f=>f());if(fail){fail=false;throw Error('flush uncertain');}}},MailApp:{sendEmail:()=>assert.fail('no email')}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);
 const op=()=>({campaign:{...campaign},version:0,requestId:'campaign-save-0001'});
 const save=()=>c.saveRaffleCampaign_(admin,op());
 const activate=()=>{const p=c.previewRaffleCampaignActivation_(admin,'future');return c.activateRaffleCampaign_(admin,{campaignId:'future',version:1,previewToken:p.previewToken,requestId:'campaign-activate-0001'});};
 return{c,props,tables,rows,prizes,op,save,activate,writes:()=>writes,reads:()=>reads,fail:()=>{fail=true;}};
}
test('draft persists but cannot enter operational campaigns; activation only changes config',()=>{
 const s=setup(),source=JSON.stringify([s.rows,s.prizes]);s.save();assert.equal(s.c.getRaffleConfiguration_().campaigns.length,0);assert.equal(s.c.getRaffleCampaignSettings_(admin).campaigns[0].status,'draft');
 const preview=s.c.previewRaffleCampaignActivation_(admin,'future');assert.equal(preview.canActivate,true);assert.equal(preview.sourceRows,1);assert.ok(!JSON.stringify(preview).includes('CODE1'));assert.ok(!JSON.stringify(preview).includes('a@example.com'));
 s.activate();assert.equal(s.c.getRaffleConfiguration_().campaigns[0].id,'future');assert.equal(JSON.stringify([s.rows,s.prizes]),source);assert.deepEqual([...s.tables.keys()],['RaffleCampaignJournal']);assert.equal(s.props.get('RAFFLE_CAMPAIGNS_JSON'),'[]');
});
test('admin and dedicated gate precede reads; write gate precedes writes; global operational off permits draft only',()=>{
 const s=setup();assert.throws(()=>s.c.getRaffleCampaignSettings_({teacherName:'Tako',managementCapabilities:['raffle_fulfillment']}),/權限/);assert.equal(s.reads(),0);
 s.props.delete('RAFFLE_CAMPAIGN_SETTINGS_ENABLED');assert.throws(()=>s.c.getRaffleCampaignSettings_(admin),/啟用/);assert.equal(s.reads(),0);
 s.props.set('RAFFLE_CAMPAIGN_SETTINGS_ENABLED','true');s.props.delete('RAFFLE_WRITES_ENABLED');assert.throws(()=>s.save(),/寫入/);assert.equal(s.writes(),0);
 s.props.set('RAFFLE_WRITES_ENABLED','true');s.props.set('RAFFLE_ENABLED','false');s.save();assert.equal(s.c.getRaffleConfiguration_().enabled,false);assert.equal(s.c.getRaffleCampaignSettings_(admin).operationalEnabled,false);
});
test('uncertain save and activation reuse request IDs without duplicate events',()=>{
 const s=setup();s.fail();assert.throws(()=>s.save(),/uncertain/);const count=s.writes();assert.equal(s.save().version,1);assert.equal(s.writes(),count);
 const p=s.c.previewRaffleCampaignActivation_(admin,'future'),op={campaignId:'future',version:1,previewToken:p.previewToken,requestId:'activate-test-0001'};s.fail();assert.throws(()=>s.c.activateRaffleCampaign_(admin,op),/uncertain/);assert.equal(s.c.activateRaffleCampaign_(admin,op).status,'active');assert.equal(s.tables.get('RaffleCampaignJournal').data.length,3);
});
test('stale revisions and stale source block; active source and config cannot be edited',()=>{
 const s=setup();s.save();assert.throws(()=>s.c.saveRaffleCampaign_(admin,{...s.op(),requestId:'campaign-save-0002'}),/版本/);
 const p=s.c.previewRaffleCampaignActivation_(admin,'future');s.rows[1][0]='new@example.com';assert.throws(()=>s.c.activateRaffleCampaign_(admin,{campaignId:'future',version:1,previewToken:p.previewToken,requestId:'activate-test-0001'}),/變更/);s.activate();
 assert.throws(()=>s.c.saveRaffleCampaign_(admin,{...s.op(),version:2,requestId:'campaign-save-0003'}),/啟用|草稿/);
});
test('invalid fields and historical source never write',()=>{
 for(const patch of [{name:'bad\nsubject'},{sourceSpreadsheetId:'19TDX3I5qwmObpQR55LhIGlxeSY_g2GyG6MJHF6VFNtY'},{websiteUrl:'javascript:bad'},{pickupDeadline:'2027-01-01'},{readyPrizeVenues:[{prizeId:'p1',venue:''}]}]){const s=setup();assert.throws(()=>s.c.saveRaffleCampaign_(admin,{...s.op(),campaign:{...campaign,...patch}}));assert.equal(s.writes(),0);}
});
test('legacy configured campaigns survive and are read-only; duplicate source cannot activate twice',()=>{
 const s=setup();s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,id:'legacy'}]));s.save();assert.equal(s.c.getRaffleConfiguration_().campaigns.length,1);assert.equal(s.c.getRaffleCampaignSettings_(admin).campaigns.length,2);assert.throws(()=>s.activate(),/來源|重複/);
});
test('invalid source columns or stock mapping block activation without import',()=>{
 const s=setup();s.save();s.rows[0][0]='wrong';assert.throws(()=>s.c.previewRaffleCampaignActivation_(admin,'future'),/欄位/);assert.equal(s.tables.get('RaffleCampaignJournal').data.length,2);
 const t=setup();t.c.saveRaffleCampaign_(admin,{...t.op(),campaign:{...campaign,readyPrizeVenues:[{prizeId:'unknown',venue:'晴光'}]}});assert.throws(()=>t.activate(),/獎品/);
});
test('corrupt valid-digest transitions fail closed',()=>{
 const s=setup();s.save();const row=s.tables.get('RaffleCampaignJournal').data[1],event=JSON.parse(row[4]);event.version=9;row[4]=JSON.stringify(event);row[3]=s.c.raffleHash_(row[4]);assert.throws(()=>s.c.getRaffleConfiguration_(),/紀錄|版本/);
});
