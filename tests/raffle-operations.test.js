const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
function load(){
 const properties=new Map();let reads=0;
 const c={console,Date,JSON,Math,String,Number,Object,Array,RegExp,Error,Set,
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null})},
  SpreadsheetApp:{openById(){reads++;throw Error('unexpected source read');},getActiveSpreadsheet(){reads++;throw Error('unexpected data read');}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);
 return {c,properties,reads:()=>reads};
}
const campaign={id:'future-2027',name:'未來活動',sourceSpreadsheetId:'future-source-1234567890',readyPrizeVenues:[]};
const headers=['OB email名稱','OB名字','驗證碼','中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間'];
const row=['student@example.com','同名學生','code-1','A賞','提袋','晴光','choose_venue','2027-01-01'];
const prizeHeaders=['獎項ID','獎項等級','獎品名稱','領獎方式','已領取 (程式寫)'];
const prizes=[prizeHeaders,['P1','A賞','提袋','choose_venue',9]];
const plain=v=>JSON.parse(JSON.stringify(v));
test('normalization preserves source stock, creates stable IDs and masks verification codes',()=>{
 const {c}=load();const rows=[headers,row.slice()];const before=JSON.stringify([rows,prizes]);
 const p=c.buildRaffleImportPreview_(campaign,rows,prizes,[]);assert.equal(p.additions.length,1);
 assert.equal(p.additions[0].status,'waiting');assert.equal(p.additions[0].quantity,1);
 assert.equal(p.additions[0].id,c.buildRaffleImportPreview_(campaign,[headers,Array(8).fill(''),row],prizes,[]).additions[0].id);
 assert.equal(JSON.stringify([rows,prizes]),before);assert.ok(!JSON.stringify(p).includes('code-1'));
});
test('ready stock is venue-specific and electronic prizes never need physical delivery',()=>{
 const {c}=load();const config={...campaign,readyPrizeVenues:[{prizeId:'P1',venue:'晴光'}]};
 assert.equal(c.buildRaffleImportPreview_(config,[headers,row],prizes,[]).additions[0].status,'ready');
 assert.equal(c.buildRaffleImportPreview_(config,[headers,[...row.slice(0,5),'劍潭',...row.slice(6)]],prizes,[]).additions[0].status,'waiting');
 const r=row.slice();r[6]='show_code';const p=[prizeHeaders,['P1','A賞','提袋','show_code',9]];
 assert.equal(c.buildRaffleImportPreview_(campaign,[headers,r],p,[]).additions[0].status,'digital');
});
test('duplicate verification identity fails closed and same Email with distinct qualifications survives',()=>{
 const {c}=load();assert.equal(c.buildRaffleImportPreview_(campaign,[headers,row,row],prizes,[]).additions.length,0);
 assert.equal(c.buildRaffleImportPreview_(campaign,[headers,row,row],prizes,[]).errors.length,2);
 const other=row.slice();other[2]='code-2';assert.equal(c.buildRaffleImportPreview_(campaign,[headers,row,other],prizes,[]).additions.length,2);
});
test('missing headers and ambiguous prizes are rejected without guessing',()=>{
 const {c}=load();assert.throws(()=>c.buildRaffleImportPreview_(campaign,[['Email'],['x']],prizes,[]),/欄位/);
 assert.throws(()=>c.buildRaffleImportPreview_(campaign,[[...headers,'驗證碼'],[...row,'x']],prizes,[]),/重複/);
 const p=[...prizes,['P2','A賞','提袋','choose_venue',1]];
 assert.equal(c.buildRaffleImportPreview_(campaign,[headers,row],p,[]).errors.length,1);
});
test('reimport does not reset redeemed claims and changed venue is a conflict',()=>{
 const {c}=load();const claim=c.buildRaffleImportPreview_(campaign,[headers,row],prizes,[]).additions[0];
 const redeemed={...plain(claim),status:'claimed',claimedQuantity:1};
 const p=c.buildRaffleImportPreview_(campaign,[headers,row],prizes,[redeemed]);assert.equal(p.duplicates,1);assert.equal(p.additions.length,0);assert.equal(redeemed.status,'claimed');
 const changed=row.slice();changed[5]='劍潭';const conflict=c.buildRaffleImportPreview_(campaign,[headers,changed],prizes,[redeemed]);assert.equal(conflict.conflicts.length,1);
});
test('teacher search distinguishes same names and does not disclose full Email or source IDs',()=>{
 const {c}=load();const claims=[{id:'1',campaignId:campaign.id,studentName:'同名',email:'a@example.com',prizeName:'提袋',status:'ready',sourceFingerprint:'hidden'}, {id:'2',campaignId:campaign.id,studentName:'同名',email:'b@example.com',prizeName:'護腕',status:'waiting'}];
 const results=c.filterRaffleTeacherClaims_(claims,'同名');assert.equal(results.length,2);assert.notEqual(results[0].studentKey,results[1].studentKey);
 assert.ok(!JSON.stringify(results).includes('a@example.com'));assert.ok(!JSON.stringify(results).includes('sourceFingerprint'));
 assert.equal(c.filterRaffleTeacherClaims_(claims,'同').length,0);
});
test('unauthorized or disabled workspace cannot read source spreadsheet',()=>{
 const {c,properties,reads}=load();assert.throws(()=>c.getRaffleWorkspace_(null,{}),/登入/);
 assert.throws(()=>c.previewRaffleImport_({teacherName:'老師',managementCapabilities:[]},'x'),/權限/);
 assert.equal(c.getRaffleWorkspace_({teacherName:'老師',managementCapabilities:[]},{}).enabled,false);
 assert.equal(reads(),0);properties.set('RAFFLE_ENABLED','true');properties.set('RAFFLE_CAMPAIGNS_JSON','[]');
 assert.throws(()=>c.previewRaffleImport_({teacherName:'管理',managementCapabilities:['raffle_admin']},'unregistered'),/活動/);assert.equal(reads(),0);
});
test('registered campaigns reject old event and cross-campaign reads',()=>{
 const {c,properties}=load();properties.set('RAFFLE_ENABLED','true');
 properties.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,sourceSpreadsheetId:'19TDX3I5qwmObpQR55LhIGlxeSY_g2GyG6MJHF6VFNtY'}]));
 assert.throws(()=>c.getRaffleWorkspace_({teacherName:'管理',managementCapabilities:['raffle_admin']},{mode:'admin'}),/歷史/);
});
test('legacy admin fallback never grants new raffle capabilities',()=>{
 const {c}=load();c.findAccount_=()=>null;
 assert.ok(!c.getSessionManagementCapabilities_({teacherName:'管理',role:'管理員'}).includes('raffle_admin'));
 assert.throws(()=>c.previewRaffleImport_({teacherName:'管理',role:'管理員'},'x'),/權限/);
});
test('read limits fail instead of returning a truncated inventory and optional tables never get created',()=>{
 const {c}=load();const optional=c.readRaffleTable_({getSheetByName:()=>null},'RaffleClaims',true);assert.equal(optional.length,0);
 assert.throws(()=>c.readRaffleTable_({getSheetByName:()=>({getLastRow:()=>5002,getLastColumn:()=>8})},'抽獎名單',false),/安全/);
});
test('configured preview uses only registered source and strips source identities',()=>{
 const {c,properties}=load();properties.set('RAFFLE_ENABLED','true');properties.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([campaign]));
 let opened='';const sheet=rows=>({getLastRow:()=>rows.length,getLastColumn:()=>rows[0].length,getRange:(r,k,n,m)=>{assert.deepEqual([r,k,n,m],[1,1,rows.length,rows[0].length]);return{getDisplayValues:()=>rows};}});
 c.SpreadsheetApp={openById:id=>{opened=id;return{getSheetByName:name=>sheet(name==='抽獎名單'?[headers,row]:prizes)};},getActiveSpreadsheet:()=>({getSheetByName:()=>null})};
 const p=c.previewRaffleImport_({teacherName:'管理',managementCapabilities:['raffle_admin']},campaign.id);
 assert.equal(opened,'future-source-1234567890');assert.equal(p.additionCount,1);assert.ok(!JSON.stringify(p).includes('sourceFingerprint'));assert.ok(!JSON.stringify(p).includes('student@example.com'));
});
