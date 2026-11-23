const test = require('node:test');
const assert = require('node:assert/strict');
const {setup,admin,campaign} = require('./helpers/raffle-mail-fixture');

function fixture() {
  const s=setup(), c=s.c;
  const config={...campaign,id:'christmas-2026',sourceSpreadsheetId:'1Sdi96hIru-Vag8hFl6bEo6xMhpjgVkro75dH1PNvpRM'};
  s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([config]));
  s.props.set('RAFFLE_FIXED_GIFT_STOCK_JSON',JSON.stringify({ownerScriptId:'fixture-script',items:[{campaignId:config.id,prizeId:'GIFT-BALL-2026',total:297}]}));
  c.ScriptApp={getScriptId:()=> 'fixture-script'};
  c.readRaffleBallCatalog_=()=>({sheetId:config.sourceSpreadsheetId,enabled:true,prizeId:'GIFT-BALL-2026',total:297});
  const floor={id:'floor-fixture',campaignId:config.id,email:'a@example.test',studentName:'示範',prizeId:'D賞-028',prizeName:'免費地板課任選一堂',venue:'',quantity:1,claimedQuantity:0,status:'waiting',sourceFingerprint:'floor-source'};
  const ball=(id,qty,email='a@example.test')=>c.raffleFixedGiftClaim_(config,{id,passId:qty===2?'51':'50',price:999,purchasedAt:'2026-11-20T12:00:00+08:00',email,name:'示範'},{prizeId:'GIFT-BALL-2026',prizeName:'購卡贈送球',venue:'教室現貨',quantity:qty});
  const balls=[ball('9001',2),ball('9002',2),ball('9003',1,'other@example.test')];
  // Existing production awards reach the journal as versioned imports.
  const claims=[floor,...balls].map(x=>({...x,version:1}));
  s.tables.set('RaffleJournal',s.sheet([['requestId','requestHash','createdAt','eventJson'],['fixture-import-123','a'.repeat(64),'2026-11-22T00:00:00Z',JSON.stringify({actor:'fixture',action:'import',reason:'',result:{imported:4,remaining:0},changes:claims.map(claim=>({beforeVersion:null,claim}))})]]));
  return {...s,floor:claims[0],balls:claims.slice(1),setDeadline:d=>{s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...config,pickupDeadline:d}]));}};
}
const refs=claims=>claims.map(({id,version})=>({id,version}));
test('group pickup records actual quantity once in the same journal row and preserves each purchase',()=>{
 const s=fixture(),{c,balls}=s;
 const op={action:'collect-balls',items:refs(balls.slice(0,2)),quantity:3,requestId:'group-pickup-00001'};
 const r=c.mutateRaffleClaim_(admin,op);
 assert.equal(r.quantity,3);assert.equal(r.items.length,2);
 assert.equal(s.tables.get('RaffleJournal').data.length,3);
 const actual=c.readRaffleClaims_().filter(x=>x.email==='a@example.test'&&x.prizeId==='GIFT-BALL-2026');
 assert.deepEqual(Array.from(actual.map(x=>x.claimedQuantity)).sort(),[1,2]);
 assert.ok(actual.every(x=>x.giftSource&&x.version===2));
 assert.equal(c.readRaffleClaims_().find(x=>x.id===balls[2].id).claimedQuantity,0);
 assert.deepEqual(c.mutateRaffleClaim_(admin,op),r);
 assert.equal(s.tables.get('RaffleJournal').data.length,3);
});
test('group pickup rejects mismatched students, stale or incomplete groups and expired awards',()=>{
 const s=fixture(),{c,balls}=s;
 const op={action:'collect-balls',items:refs(balls.slice(0,2)),quantity:3,requestId:'group-pickup-00002'};
 for(const items of [refs([balls[0],balls[2]]),refs([balls[0]]),refs([balls[0],balls[0]]),[op.items[0],{...op.items[1],version:0}]])
  assert.throws(()=>c.mutateRaffleClaim_(admin,{...op,items}));
 assert.throws(()=>c.mutateRaffleClaim_(admin,{...op,quantity:5}));
 s.setDeadline('2000-01-01T00:00:00+08:00');
 assert.throws(()=>c.mutateRaffleClaim_(admin,op),/期限|截止/);
 assert.equal(s.writes(),0);
});
test('floor course records an already issued card without a venue and keeps a reversible audit',()=>{
 const s=fixture(),{c,floor}=s,op={action:'redeem-floor',venue:'',claimId:floor.id,version:1,requestId:'floor-redeem-00001'};
 assert.throws(()=>c.mutateRaffleClaim_({teacherName:'老師'},op));
 assert.throws(()=>c.mutateRaffleClaim_(admin,{...op,action:'prepare',venue:'晴光'}));
 assert.throws(()=>c.mutateRaffleClaim_(admin,{...op,venue:'晴光'}));
 assert.equal(c.rafflePublicClaim_(floor).floorCourse,true);
 const r=c.mutateRaffleClaim_(admin,op);
 assert.equal(r.status,'claimed');assert.equal(r.claimedQuantity,1);
 assert.equal(c.readRaffleClaims_().find(x=>x.id===floor.id).venue,'');
 assert.deepEqual(c.mutateRaffleClaim_(admin,op),r);
 assert.throws(()=>c.mutateRaffleClaim_(admin,{...op,requestId:'floor-redeem-00002',version:2}));
 const undo=c.mutateRaffleClaim_(admin,{...op,requestId:'floor-undo-0000001',version:2,action:'correct-floor',reason:'課卡未送出'});
 assert.equal(undo.status,'waiting');assert.equal(undo.claimedQuantity,0);
 assert.equal(c.getRaffleAudit_(admin,floor.id).events.at(-1).action,'correct-floor');
});

test('ball groups stay complete when the student name changed or a page boundary falls between records',()=>{
 const s=fixture(),{c,balls}=s;
 const [first,second,other]=balls;
 const alias={...second,studentName:'曾用姓名'};
 const fillers=Array.from({length:55},(_,i)=>({...s.floor,id:'f-'+i,studentName:'示範同名',email:'f'+i+'@example.test'}));
 const all=[...fillers.slice(0,49),first,...fillers.slice(49),alias,other];
 const results=c.filterRaffleTeacherClaims_(all,'示範同名');
 assert.equal(results.length,50);
 const page=c.filterRaffleTeacherClaims_(all,'示範');
 assert.equal(page.length,51);
 assert.ok(page.some(x=>x.id===alias.id));
 assert.ok(!page.some(x=>x.id===other.id));
 const exact=c.filterRaffleTeacherClaims_(all,'a@example.test');
 assert.deepEqual(Array.from(exact.map(x=>x.id)),[first.id,alias.id]);
});

test('floor course redemptions have their own overview count and no physical delivery units',()=>{
 const {c,floor}=fixture();
 const o=c.buildRaffleOverview_({id:floor.campaignId,name:'活動'},[floor],[],new Date().toISOString());
 assert.equal(o.claims.waiting,0);
 assert.equal(o.claims.pendingUnits,0);
 assert.equal(o.floorCourses.pending,1);
});
