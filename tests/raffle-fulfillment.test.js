const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const prep={teacherName:'Tako',managementCapabilities:['raffle_fulfillment']},admin={teacherName:'店長',managementCapabilities:['raffle_admin']};
const campaign={id:'future',name:'未來活動',sourceSpreadsheetId:'future-source-1234567890'};
const keys=['id','campaignId','email','studentName','prizeId','prizeName','venue','quantity','claimedQuantity','status','claimedAt','claimedBy','sourceFingerprint'];
const claim=(id,patch={})=>({id,campaignId:'future',email:id+'@example.com',studentName:'同名學生',prizeId:'p1',prizeName:'提袋',venue:'晴光',quantity:1,claimedQuantity:0,status:'waiting',sourceFingerprint:'secret',...patch});
test('revoked remaining quantity does not remove already delivered units from totals',()=>{
 const s=setup([claim('a',{quantity:3,claimedQuantity:1,status:'cancelled'})]);
 const r=s.c.getRaffleFulfillment_(prep,{campaignId:'future'});assert.equal(r.totals.claimed,1);assert.equal(r.totals.waiting,0);assert.equal(r.totals.ready,0);
});
function setup(claims){
 const props=new Map([['RAFFLE_ENABLED','true'],['RAFFLE_WRITES_ENABLED','true'],['RAFFLE_CAMPAIGNS_JSON',JSON.stringify([campaign])]]);let reads=0;
 const rows=[keys,...claims.map(c=>keys.map(k=>String(c[k]??'')))];
 const c={Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null})},SpreadsheetApp:{getActiveSpreadsheet:()=>{reads++;return{getSheetByName:n=>n==='RaffleClaims'?{getLastRow:()=>rows.length,getLastColumn:()=>keys.length,getRange:()=>({getDisplayValues:()=>rows})}:null};},openById:()=>assert.fail('must not read source stock')},MailApp:{sendEmail:()=>assert.fail('must not send')}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);return{c,props,rows,reads:()=>reads};
}
test('summary counts units including partial collection, separates venues and excludes electronic/cancelled',()=>{
 const s=setup([claim('a',{quantity:3}),claim('b',{status:'ready',quantity:2}),claim('c',{status:'partial',quantity:4,claimedQuantity:1}),claim('d',{status:'claimed',claimedQuantity:1}),claim('e',{venue:'劍潭'}),claim('f',{status:'digital'}),claim('g',{status:'cancelled'}),claim('h',{campaignId:'other',quantity:9})]);
 const r=s.c.getRaffleFulfillment_(prep,{campaignId:'future'});assert.equal(r.totalGroups,2);assert.equal(r.totals.waiting,4);assert.equal(r.totals.ready,5);assert.equal(r.totals.claimed,2);assert.equal(r.excluded.digital,1);assert.equal(r.excluded.cancelled,1);
 const group=r.groups.find(g=>g.venue==='晴光');assert.equal(group.claimCount,4);assert.equal(group.waiting,3);assert.equal(group.ready,5);assert.equal(group.claimed,2);assert.ok(!JSON.stringify(r).includes('@example.com'));assert.ok(!JSON.stringify(r).includes('secret'));assert.ok(!JSON.stringify(r).includes('同名學生'));
 const detail=s.c.getRaffleFulfillment_(prep,{campaignId:'future',groupId:group.id});assert.equal(detail.claims.length,4);assert.notEqual(detail.claims[0].studentKey,detail.claims[1].studentKey);assert.ok(!JSON.stringify(detail).includes('a@example.com'));assert.ok(!JSON.stringify(detail).includes('sourceFingerprint'));assert.equal(detail.canPrepare,true);assert.equal(detail.canCorrect,false);
});
test('authority, disabled and unconfigured campaign fail before reading claim data',()=>{
 const s=setup([]);assert.throws(()=>s.c.getRaffleFulfillment_({teacherName:'老師',managementCapabilities:[]},{campaignId:'future'}),/權限/);assert.equal(s.reads(),0);
 assert.throws(()=>s.c.getRaffleFulfillment_(admin,{campaignId:'other'}),/活動/);assert.equal(s.reads(),0);
 s.props.set('RAFFLE_ENABLED','false');assert.throws(()=>s.c.getRaffleFulfillment_(prep,{campaignId:'future'}),/啟用/);assert.equal(s.reads(),0);
});
test('group and detail pagination never truncate underlying totals',()=>{
 const s=setup(Array.from({length:55},(_,i)=>claim('id'+i,{prizeId:'p'+i,prizeName:'獎品'+i})));
 const first=s.c.getRaffleFulfillment_(prep,{campaignId:'future'}),last=s.c.getRaffleFulfillment_(prep,{campaignId:'future',offset:50});assert.equal(first.groups.length,50);assert.equal(first.hasMore,true);assert.equal(last.groups.length,5);assert.equal(last.hasMore,false);assert.equal(last.totals.waiting,55);
 const d=setup(Array.from({length:55},(_,i)=>claim('id'+i)));const group=d.c.getRaffleFulfillment_(prep,{campaignId:'future'}).groups[0];
 const a=d.c.getRaffleFulfillment_(prep,{campaignId:'future',groupId:group.id}),b=d.c.getRaffleFulfillment_(prep,{campaignId:'future',groupId:group.id,offset:50});assert.equal(a.claims.length,50);assert.equal(a.totalClaims,55);assert.equal(b.claims.length,5);assert.equal(new Set([...a.claims,...b.claims].map(c=>c.id)).size,55);
 assert.throws(()=>s.c.getRaffleFulfillment_(prep,{campaignId:'future',offset:-1}),/分頁/);assert.throws(()=>s.c.getRaffleFulfillment_(prep,{campaignId:'future',groupId:'unknown'}),/群組/);
});
test('read-only and expired campaign expose accurate warning and no writable detail controls',()=>{
 const s=setup([claim('a')]);s.props.set('RAFFLE_WRITES_ENABLED','false');s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,pickupDeadline:'2020-01-01T00:00:00+08:00'}]));
 const r=s.c.getRaffleFulfillment_(admin,{campaignId:'future'});assert.equal(r.readOnly,true);assert.equal(r.pickupBlocked,true);assert.equal(r.canCorrect,true);
});
test('inconsistent quantities or prize identities fail rather than display incorrect preparation totals',()=>{
 for(const claims of [[claim('a',{quantity:2,claimedQuantity:1,status:'waiting'})],[claim('a'),claim('b',{prizeName:'不同獎品'})]]){const s=setup(claims);assert.throws(()=>s.c.getRaffleFulfillment_(prep,{campaignId:'future'}),/資料|數量|獎品/);}
});
