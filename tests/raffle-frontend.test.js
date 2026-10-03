const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../raffle.js'), 'utf8'), context);
  return context.window.SherryRaffle;
}
test('actual send preview requires full payload, explicit gate and enough quota',()=>{
 const api=load(),p={dryRun:true,sendEnabled:true,quota:2,batchCount:2,previewToken:'token',previews:[{email:'a@example.com',subject:'test',body:'<unsafe>'},{email:'b@example.com',subject:'test',body:'two'}]};
 assert.match(api.renderMailSendPreview(p),/data-raffle-confirm-send/);assert.match(api.renderMailSendPreview(p),/&lt;unsafe&gt;/);
 for(const bad of [{...p,sendEnabled:false},{...p,quota:1},{...p,quota:null}]) assert.ok(!api.renderMailSendPreview(bad).includes('data-raffle-confirm-send'));
 assert.throws(()=>api.renderMailSendPreview({}),/完整/);
});
test('mail record statuses distinguish acceptance from delivery and offer review only for uncertain attempts',()=>{
 const api=load(),data={canReconcile:true,total:5,records:['queued','sending','sent','uncertain','closed'].map((status,i)=>({id:'job'+i,email:'a@example.com',status,qualificationCount:1,actor:'店長',createdAt:'today',reason:'<核對理由>'}))};
 const html=api.renderMailRecords(data);assert.match(html,/不代表收件人已收到/);assert.match(html,/寄送結果待確認/);assert.match(html,/結案（不重寄）/);assert.match(html,/&lt;核對理由&gt;/);assert.equal((html.match(/data-raffle-reconcile=/g)||[]).length,2);
 assert.ok(!api.renderMailRecords({...data,canReconcile:false}).includes('data-raffle-reconcile='));
});
test('mail records can navigate beyond fifty jobs',()=>{
 const api=load();assert.match(api.renderMailRecords({total:60,reviewCount:5,offset:0,hasMore:true,records:[]}),/data-raffle-mail-page="50"/);
 assert.match(api.renderMailRecords({total:60,reviewCount:5,offset:50,hasMore:false,records:[]}),/data-raffle-mail-page="0"/);
});
test('fulfillment summary shows unit totals, excludes digital and escapes names with reachable pages',()=>{
 const api=load(),data={totals:{waiting:3,ready:4,claimed:1},excluded:{digital:2,cancelled:1},groups:[{id:'group',prizeName:'<img>',venue:'晴光',claimCount:4,waiting:3,ready:4,claimed:1}],claims:[],offset:0,totalGroups:51,hasMore:true};
 const html=api.renderFulfillment(data,[]);assert.match(html,/待備貨 3 件/);assert.match(html,/已備妥未領 4 件/);assert.match(html,/電子獎 2 筆/);assert.match(html,/&lt;img&gt;/);assert.match(html,/data-raffle-fulfillment-group="group"/);assert.match(html,/data-raffle-fulfillment-page="50"/);assert.ok(!html.includes('data-raffle-action="prepare"'));
 assert.throws(()=>api.renderFulfillment({},[]),/完整/);
});
test('fulfillment detail retains individual preparation but blocks expired collection controls',()=>{
 const api=load(),data={totals:{waiting:1,ready:1,claimed:0},excluded:{digital:0,cancelled:0},groups:[],group:{id:'g',prizeName:'提袋',venue:'晴光'},claims:[{id:'a',studentKey:'a',studentName:'甲',status:'waiting',quantity:1,claimedQuantity:0},{id:'b',studentKey:'b',studentName:'乙',status:'ready',quantity:1,claimedQuantity:0}],offset:0,totalClaims:2,hasMore:false,readOnly:false,canPrepare:true,pickupBlocked:true};
 const html=api.renderFulfillment(data,[]);assert.match(html,/截止|期限/);assert.match(html,/data-raffle-action="prepare"/);assert.ok(!html.includes('data-raffle-action="collect"'));assert.match(html,/返回備貨總覽/);
});
test('mail preview warns delivery history is unchecked and escapes body without send controls',()=>{
  const html=load().renderMailPreview({dryRun:true,deliveryChecked:false,candidateCount:21,skipped:2,previews:[{email:'<unsafe>',subject:'邀請',body:'<script>bad()</script>\ncode'}]});
 assert.match(html,/尚未核對寄信紀錄/);assert.match(html,/21/);assert.match(html,/&lt;script&gt;/);
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<button'));
  assert.throws(()=>load().renderMailPreview({}),/完整/);
});
test('queue action requires checked history and enabled gate; records never imply queued means sent',()=>{
 const api=load(),data={dryRun:true,deliveryChecked:true,sendEnabled:false,readOnly:false,previewToken:'token',batchCount:2,candidateCount:2,skipped:0,previews:[]};
 assert.match(api.renderMailPreview(data),/data-raffle-confirm-mail/);
 assert.ok(!api.renderMailPreview({...data,readOnly:true}).includes('data-raffle-confirm-mail'));
 assert.ok(!api.renderMailPreview({...data,deliveryChecked:false}).includes('data-raffle-confirm-mail'));
 const html=api.renderMailRecords({total:1,records:[{email:'<script>',status:'queued',qualificationCount:2,actor:'店長',createdAt:'2026-10-03'}]});
 assert.match(html,/待寄（尚未寄出）/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
});
test('teacher cards group by student identity, never by display name', () => {
  const html = load().renderClaims([
    { studentKey: 'a', studentName: '同名', maskedEmail: 'a•••@example.com', prizeName: '提袋', status: 'ready', quantity: 1, claimedQuantity: 0 },
    { studentKey: 'b', studentName: '同名', maskedEmail: 'b•••@example.com', prizeName: '護腕', status: 'waiting', quantity: 1, claimedQuantity: 0 }
  ], []);
  assert.equal((html.match(/data-raffle-student=/g) || []).length, 2);
  assert.match(html, /可領取/); assert.match(html, /待備貨/);
});
test('untrusted names and statuses never become markup or active buttons', () => {
  const html = load().renderClaims([{ studentKey: '" onclick="bad', studentName: '<img src=x onerror=bad()>', prizeName: '<script>bad()</script>', status: '" onclick="bad', quantity: 1 }], []);
  assert.ok(!html.includes('<img')); assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<button'));
  assert.match(html, /狀態待核對/);
});
test('preview makes no claim that data was written and displays error totals', () => {
  const html = load().renderPreview({ additionCount: 0, duplicates: 2, conflictCount: 1, errorCount: 1, pendingSelection: 3, additions: [], conflicts: [{row:2,message:'來源異動'}], errors: [{row:3,message:'<invalid>'}] });
  assert.match(html, /尚未匯入/); assert.match(html, /來源異動/); assert.match(html, /&lt;invalid&gt;/);
  assert.ok(!html.includes('<button'));
});
test('write controls are per claim and constrained by readiness and capabilities', () => {
 const rows=[{id:'one',studentKey:'a',studentName:'甲',status:'ready',quantity:2,claimedQuantity:1},{id:'two',studentKey:'a',studentName:'甲',status:'waiting',quantity:1,claimedQuantity:0},{id:'three',studentKey:'a',studentName:'甲',status:'digital',quantity:1,claimedQuantity:0}];
 const api=load(), teacher=api.renderClaims(rows,[],{readOnly:false});
 assert.equal((teacher.match(/data-raffle-action="collect"/g)||[]).length,1);assert.ok(!teacher.includes('data-raffle-action="prepare"'));
 const admin=api.renderClaims(rows,[],{readOnly:false,canPrepare:true,canCorrect:true});
 assert.equal((admin.match(/data-raffle-action="prepare"/g)||[]).length,1);assert.equal((admin.match(/data-raffle-action="correct"/g)||[]).length,1);
 assert.ok(!api.renderClaims(rows,[],{readOnly:true,canPrepare:true}).includes('data-raffle-action="collect"'));
});
test('import confirmation is absent when disabled or preview has unresolved conflicts',()=>{
 const api=load(), data={readOnly:false,additionCount:2,batchCount:2,previewToken:'token',errorCount:0,conflictCount:0};
 assert.match(api.renderPreview(data),/data-raffle-confirm-import/);
 assert.ok(!api.renderPreview({...data,readOnly:true}).includes('data-raffle-confirm-import'));
 assert.ok(!api.renderPreview({...data,conflictCount:1}).includes('data-raffle-confirm-import'));
});
