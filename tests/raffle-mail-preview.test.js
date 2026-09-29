const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
function load() {
 const c = {Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);return c;
}
const campaign={id:'future',name:'未來活動',sourceSpreadsheetId:'future-source-1234567890',websiteUrl:'https://example.com/raffle'};
const headers=['OB email名稱','OB名字','驗證碼','API購課ID','是否已使用(Yes/空白)','寄送e-mail(Yes/空格)','寄送日期'];
const row=(code='code-A',email='a@example.com')=>[email,'學生',code,'purchase-1','','',''];
test('groups qualifications by Email and identity is stable across row order without mutating source',()=>{
 const c=load(), rows=[headers,row(),row('code-B','A@EXAMPLE.COM')], before=JSON.stringify(rows);
 const p=c.buildRaffleInvitationPreview_(campaign,rows,[]);
 assert.equal(p.dryRun,true);assert.equal(p.jobs.length,1);assert.equal(p.jobs[0].email,'a@example.com');
 assert.match(p.jobs[0].body,/code-A/);assert.match(p.jobs[0].body,/code-B/);assert.match(p.jobs[0].body,/https:\/\/example.com\/raffle/);
 assert.equal(p.jobs[0].qualificationIds.length,2);
 assert.equal(c.buildRaffleInvitationPreview_(campaign,[headers,rows[2],rows[1]],[]).jobs[0].id,p.jobs[0].id);
 assert.equal(JSON.stringify(rows),before);
});
test('suppresses individual reserved qualifications even after new codes join the same Email',()=>{
 const c=load(), first=c.buildRaffleInvitationPreview_(campaign,[headers,row()],[]).jobs[0];
 for(const status of ['queued','sending','sent','uncertain']) {
  const p=c.buildRaffleInvitationPreview_(campaign,[headers,row(),row('code-B')],[{qualificationId:first.qualificationIds[0],status}]);
  assert.equal(p.jobs.length,1);assert.doesNotMatch(p.jobs[0].body,/code-A/);assert.match(p.jobs[0].body,/code-B/);assert.equal(p.skipped,1);
 }
});
test('legacy sent flag or date, used or missing purchase are never invitations',()=>{
 const c=load(), rows=[headers];
 for(const [index,value] of [[4,'Yes'],[5,'Yes'],[6,'2026-09-01'],[3,'']]) {const r=row('code-'+rows.length);r[index]=value;rows.push(r);}
 const p=c.buildRaffleInvitationPreview_(campaign,rows,[]);assert.equal(p.jobs.length,0);assert.equal(p.skipped,4);
});
test('duplicate code including already sent rows, malformed Email or missing headers blocks whole plan',()=>{
 const c=load(), sent=row();sent[5]='Yes';
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,row(),sent],[]),/重複/);
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,row('code-B','a@example.com\nb@example.com')],[]),/Email/);
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[['OB名字'],['學生']],[]),/欄位/);
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,row('')],[]),/驗證碼/);
});
test('unknown or duplicate reservation states stop instead of enabling retry',()=>{
 const c=load(), q=c.buildRaffleInvitationPreview_(campaign,[headers,row()],[]).jobs[0].qualificationIds[0];
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,row()],[{qualificationId:q,status:'failed'}]),/紀錄/);
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,row()],[{qualificationId:q,status:'sent'},{qualificationId:q,status:'queued'}]),/紀錄/);
 assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,row()],null),/紀錄/);
});
test('unsafe campaign links and historical activity cannot produce invitations',()=>{
 const c=load();
 for(const websiteUrl of ['javascript:alert(1)','http://example.com','https://user:password@example.com','https://example.com\nInjected'])
  assert.throws(()=>c.buildRaffleInvitationPreview_({...campaign,websiteUrl},[headers,row()],[]),/活動/);
 assert.throws(()=>c.buildRaffleInvitationPreview_({...campaign,sourceSpreadsheetId:'19TDX3I5qwmObpQR55LhIGlxeSY_g2GyG6MJHF6VFNtY'},[headers,row()],[]),/歷史/);
});
test('truncated or sparse required legacy status cells cannot be treated as not yet sent',()=>{
 const c=load(), sparse=row();delete sparse[5];
 for(const broken of [row().slice(0,4),sparse])
  assert.throws(()=>c.buildRaffleInvitationPreview_(campaign,[headers,broken],[]),/資料列/);
});
test('mail preview authorization and configured campaign gates run before any source read',()=>{
 const c=load();c.PropertiesService={getScriptProperties:()=>({getProperty:()=>null})};
 const admin={teacherName:'管理',managementCapabilities:['raffle_admin']};
 assert.throws(()=>c.previewRaffleInvitations_({teacherName:'老師',managementCapabilities:[]},'future'),/權限/);
 assert.throws(()=>c.previewRaffleInvitations_(admin,'future'),/啟用/);
 c.PropertiesService={getScriptProperties:()=>({getProperty:key=>key==='RAFFLE_ENABLED'?'true':JSON.stringify([campaign])})};
 assert.throws(()=>c.previewRaffleInvitations_(admin,'unknown'),/活動/);
});
test('source preview is bounded and explicitly not checked against durable mail records',()=>{
 const c=load(), rows=[headers,...Array.from({length:21},(_,i)=>row('code-'+i,'student'+i+'@example.com'))];
 c.PropertiesService={getScriptProperties:()=>({getProperty:key=>key==='RAFFLE_ENABLED'?'true':JSON.stringify([campaign])})};
 c.SpreadsheetApp={openById:id=>{assert.equal(id,campaign.sourceSpreadsheetId);return{getSheetByName:name=>{assert.equal(name,'抽獎名單');return{getLastRow:()=>rows.length,getLastColumn:()=>7,getRange:()=>({getDisplayValues:()=>rows})};}};}};
 const p=c.previewRaffleInvitations_({teacherName:'管理',managementCapabilities:['raffle_admin']},'future');
 assert.equal(p.dryRun,true);assert.equal(p.deliveryChecked,false);assert.equal(p.candidateCount,21);assert.equal(p.previews.length,20);assert.equal(p.skipped,0);
 assert.match(p.previews[0].body,/驗證碼/);assert.equal(p.previews[0].qualificationIds,undefined);assert.equal(p.previews[0].id,undefined);
});
