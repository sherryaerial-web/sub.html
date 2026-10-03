const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), crypto=require('node:crypto');
const admin={teacherName:'店長',managementCapabilities:['raffle_admin']}, teacher={teacherName:'老師',managementCapabilities:[]}, prep={teacherName:'Tako',managementCapabilities:['raffle_fulfillment']};
const campaign={id:'future',name:'新活動',sourceSpreadsheetId:'future-source-1234567890',readyPrizeVenues:[{prizeId:'p1',venue:'晴光'}]};
const headers=['OB email名稱','OB名字','驗證碼','中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間'];
const row=['a@example.com','小花','code1','A','提袋','晴光','choose_venue','2027-01-01'];
function setup(count=1){
 const props=new Map([['RAFFLE_ENABLED','true'],['RAFFLE_WRITES_ENABLED','true'],['RAFFLE_CAMPAIGNS_JSON',JSON.stringify([campaign])]]);
 let locked=false,writes=0,failAfterWrite=false,buffered=false,failFlush=false;const pendingWrites=[];
 const tables=new Map();
 function sheet(rows){return{rows,getLastRow:()=>rows.length,getLastColumn:()=>Math.max(0,...rows.map(r=>r.length)),getMaxRows:()=>10000,getRange:(r,c,n=1,m=1)=>({getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>String(rows[r-1+i]?.[c-1+j]??''))),setValues:values=>{assert.ok(locked,'writes require lock');writes++;const apply=()=>values.forEach((line,i)=>{rows[r-1+i] ||= [];line.forEach((v,j)=>{rows[r-1+i][c-1+j]=v;});});if(buffered)pendingWrites.push(apply);else apply();if(failAfterWrite&&r>1){failAfterWrite=false;throw Error('transport timeout');}}})};}
 const sourceRows=[headers,...Array.from({length:count},(_,i)=>row.map((v,j)=>j===2?'code'+i:v))];
 const source={getSheetByName:name=>sheet(name==='抽獎名單'?sourceRows:[['獎項ID','獎項等級','獎品名稱','領獎方式'],['p1','A','提袋','choose_venue']])};
 const book={getSheetByName:name=>tables.get(name)||null,insertSheet:name=>{assert.ok(locked);assert.ok(!tables.has(name));const s=sheet([]);tables.set(name,s);return s;}};
 const c={console,Date,Math,JSON,Number,String,Array,Object,Set,Error,RegExp,
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null})},
  LockService:{getScriptLock:()=>({waitLock:()=>{assert.equal(locked,false);locked=true;},releaseLock:()=>{locked=false;}})},
  SpreadsheetApp:{flush:()=>{assert.ok(locked,'flush must hold lock');pendingWrites.splice(0).forEach(fn=>fn());if(failFlush){failFlush=false;throw Error('flush uncertain');}},getActiveSpreadsheet:()=>book,openById:id=>{assert.equal(id,campaign.sourceSpreadsheetId);return source;}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);
 const importNow=(requestId='request-import-0001')=>{const p=c.previewRaffleImport_(admin,'future');return c.confirmRaffleImport_(admin,{campaignId:'future',previewToken:p.previewToken,requestId});};
 return{c,props,tables,sourceRows,importNow,writes:()=>writes,setFail:()=>{failAfterWrite=true;},setBuffered:()=>{buffered=true;},setFlushFail:()=>{failFlush=true;}};
}
test('confirmed import appends journal, preserves source, caps batch and reimport is safe',()=>{
 const s=setup(27),before=JSON.stringify(s.sourceRows);const p=s.c.previewRaffleImport_(admin,'future');assert.equal(p.batchCount,25);
 const r=s.c.confirmRaffleImport_(admin,{campaignId:'future',previewToken:p.previewToken,requestId:'request-import-0001'});assert.equal(r.imported,25);assert.equal(JSON.stringify(s.sourceRows),before);
 assert.equal(s.tables.get('RaffleJournal').rows.length,2);assert.equal(s.c.readRaffleClaims_().length,25);
 assert.equal(s.importNow('request-import-0002').imported,2);assert.equal(s.c.readRaffleClaims_().length,27);
 assert.equal(s.importNow('request-import-0003').imported,0);
});
test('stale preview and disabled/unauthorized operations do not write',()=>{
 const s=setup();const p=s.c.previewRaffleImport_(admin,'future');s.sourceRows[1][5]='劍潭';
 assert.throws(()=>s.c.confirmRaffleImport_(admin,{campaignId:'future',previewToken:p.previewToken,requestId:'request-import-0001'}),/變更/);assert.equal(s.writes(),0);
 s.props.set('RAFFLE_WRITES_ENABLED','false');assert.throws(()=>s.importNow(),/寫入/);assert.equal(s.writes(),0);
 assert.throws(()=>s.c.confirmRaffleImport_(teacher,{campaignId:'future'}),/權限/);
});
test('write timeout retries same request once, different payload with reused request is rejected',()=>{
 const s=setup();const p=s.c.previewRaffleImport_(admin,'future');const req={campaignId:'future',previewToken:p.previewToken,requestId:'request-import-0001'};
 s.setFail();assert.throws(()=>s.c.confirmRaffleImport_(admin,req),/timeout/);const n=s.writes();
 assert.equal(s.c.confirmRaffleImport_(admin,req).imported,1);assert.equal(s.writes(),n);
 assert.throws(()=>s.c.confirmRaffleImport_(admin,{...req,previewToken:'other'}),/識別/);
});
test('collection checks venue/readiness/version and retains same request on duplicate',()=>{
 const s=setup();s.importNow();const claim=s.c.readRaffleClaims_()[0];
 const req={claimId:claim.id,version:1,action:'collect',venue:'劍潭',quantity:1,requestId:'request-collect-0001'};
 assert.throws(()=>s.c.mutateRaffleClaim_(teacher,req),/館別/);
 req.venue='晴光';const result=s.c.mutateRaffleClaim_(teacher,req);assert.equal(result.status,'claimed');
 assert.equal(s.c.mutateRaffleClaim_(teacher,req).status,'claimed');
 assert.throws(()=>s.c.mutateRaffleClaim_({...teacher,teacherName:'另一老師'},{...req,requestId:'request-collect-0002'}),/版本|更新/);
 assert.equal(s.c.readRaffleClaims_()[0].claimedQuantity,1);
});
test('only preparer marks ready and only admin corrects with reason, audit retains both',()=>{
 const s=setup();s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,readyPrizeVenues:[]}]));s.importNow();const claim=s.c.readRaffleClaims_()[0];
 const req={claimId:claim.id,version:1,action:'prepare',venue:'晴光',requestId:'request-prepare-0001'};
 assert.throws(()=>s.c.mutateRaffleClaim_(teacher,req),/權限/);
 assert.throws(()=>s.c.mutateRaffleClaim_(teacher,{...req,action:'collect',quantity:1}),/備貨|可領取/);
 assert.equal(s.c.mutateRaffleClaim_(prep,req).status,'ready');
 s.c.mutateRaffleClaim_(teacher,{...req,action:'collect',version:2,quantity:1,requestId:'request-collect-0001'});
 const correction={...req,version:3,action:'correct',quantity:0,requestId:'request-correct-0001'};
 assert.throws(()=>s.c.mutateRaffleClaim_(prep,correction),/權限/);
 assert.throws(()=>s.c.mutateRaffleClaim_(admin,correction),/理由/);
 assert.equal(s.c.mutateRaffleClaim_(admin,{...correction,reason:'誤按，尚未交付'}).status,'ready');
 const audit=s.c.getRaffleAudit_(admin,claim.id);assert.equal(audit.events.length,4);assert.match(JSON.stringify(audit),/誤按/);assert.ok(!JSON.stringify(audit).includes('a@example.com'));
 assert.throws(()=>s.c.getRaffleAudit_(teacher,claim.id),/權限/);
});
test('partial collection and expired/electronic claims fail safely',()=>{
 const s=setup();const claim={id:'seed',campaignId:'future',email:'a@example.com',studentName:'小花',prizeId:'p1',prizeName:'提袋',venue:'晴光',quantity:3,claimedQuantity:0,status:'ready',sourceFingerprint:'seed',version:0};
 const r=s.c.applyRaffleClaimMutation_(claim,teacher,{action:'collect',quantity:1,venue:'晴光'},campaign,'2027-01-01T00:00:00Z');assert.equal(r.status,'partial');assert.equal(r.claimedQuantity,1);
 assert.throws(()=>s.c.applyRaffleClaimMutation_({...claim,status:'digital'},teacher,{action:'collect',quantity:1,venue:'晴光'},campaign,'2027-01-01T00:00:00Z'),/實體|可領取/);
 assert.throws(()=>s.c.applyRaffleClaimMutation_(claim,teacher,{action:'collect',quantity:1,venue:'晴光'},{...campaign,pickupDeadline:'2026-12-31T23:59:59+08:00'},'2027-01-01T00:00:00Z'),/截止/);
});
test('malformed journal fails closed and request IDs cannot inject formulas',()=>{
 const s=setup();assert.throws(()=>s.importNow('=FORMULA()'),/識別/);assert.equal(s.writes(),0);
 s.importNow();s.tables.get('RaffleJournal').rows[1][3]='bad JSON';assert.throws(()=>s.c.readRaffleClaims_(),/紀錄|日誌/);
});
test('empty journal left by interrupted initialization is repaired without treating payload as headers',()=>{
 const s=setup();s.importNow();s.tables.get('RaffleJournal').rows.splice(0);s.importNow('request-import-0002');
 assert.equal(s.tables.get('RaffleJournal').rows[0][0],'requestId');assert.equal(s.c.readRaffleClaims_().length,1);
});
test('duplicate journal request fails closed, and preparation does not grant admin audit',()=>{
 const s=setup();s.importNow();assert.throws(()=>s.c.getRaffleAudit_(prep,s.c.readRaffleClaims_()[0].id),/權限/);
 const rows=s.tables.get('RaffleJournal').rows;rows.push(rows[1].slice());assert.throws(()=>s.c.readRaffleClaims_(),/重複/);
});
test('buffered Sheets writes commit while holding the lock, so next collector sees the new version',()=>{
 const s=setup();s.importNow();s.setBuffered();const claim=s.c.readRaffleClaims_()[0];
 const req={claimId:claim.id,version:1,action:'collect',quantity:1,venue:'晴光',requestId:'request-collect-0001'};
 s.c.mutateRaffleClaim_(teacher,req);assert.equal(s.c.readRaffleClaims_()[0].status,'claimed');
 assert.throws(()=>s.c.mutateRaffleClaim_({...teacher,teacherName:'另一位'},{...req,requestId:'request-collect-0002'}),/版本/);
});
test('uncertain flush never reports success and retry resolves the original request',()=>{
 const s=setup();s.importNow();s.setBuffered();s.setFlushFail();const claim=s.c.readRaffleClaims_()[0];
 const req={claimId:claim.id,version:1,action:'collect',quantity:1,venue:'晴光',requestId:'request-collect-0001'};
 assert.throws(()=>s.c.mutateRaffleClaim_(teacher,req),/flush uncertain/);
 assert.equal(s.c.mutateRaffleClaim_(teacher,req).status,'claimed');assert.equal(s.tables.get('RaffleJournal').rows.length,3);
});
test('valid JSON with missing claim changes cannot roll back a collected prize',()=>{
 const s=setup();s.importNow();const claim=s.c.readRaffleClaims_()[0];
 s.c.mutateRaffleClaim_(teacher,{claimId:claim.id,version:1,action:'collect',quantity:1,venue:'晴光',requestId:'request-collect-0001'});
 const rows=s.tables.get('RaffleJournal').rows,event=JSON.parse(rows[2][3]);event.changes=[];rows[2][3]=JSON.stringify(event);
 assert.throws(()=>s.c.readRaffleClaims_(),/日誌/);
});
test('journal checks result counts, actor and state consistency',()=>{
 for(const change of [e=>{e.result.imported=0;},e=>{e.changes[0].claim.status='claimed';},e=>{e.actor='';}]){
   const s=setup();s.importNow();const rows=s.tables.get('RaffleJournal').rows,event=JSON.parse(rows[1][3]);change(event);rows[1][3]=JSON.stringify(event);assert.throws(()=>s.c.readRaffleClaims_(),/日誌/);
 }
});
test('fulfillment detail uses existing per-claim versioned preparation and refreshes totals without preparing siblings',()=>{
 const s=setup(2);s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,readyPrizeVenues:[]}]));s.importNow();const group=s.c.getRaffleFulfillment_(prep,{campaignId:'future'}).groups[0];
 const detail=s.c.getRaffleFulfillment_(prep,{campaignId:'future',groupId:group.id});assert.equal(detail.claims.length,2);const c=detail.claims[0];
 s.c.mutateRaffleClaim_(prep,{claimId:c.id,version:c.version,action:'prepare',venue:c.venue,requestId:'prep-from-summary-0001'});
 const refreshed=s.c.getRaffleFulfillment_(prep,{campaignId:'future'});assert.equal(refreshed.totals.waiting,1);assert.equal(refreshed.totals.ready,1);assert.equal(s.c.readRaffleClaims_().filter(c=>c.status==='waiting').length,1);
});
