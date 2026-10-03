const test=require('node:test'),assert=require('node:assert/strict');
const {setup,admin,campaign}=require('./helpers/raffle-mail-fixture');
const fields=['id','campaignId','email','studentName','prizeId','prizeName','venue','quantity','claimedQuantity','status','claimedAt','claimedBy','sourceFingerprint'];
const claim=(id,status,quantity=1,claimedQuantity=0)=>({id,campaignId:'future',email:'private@example.com',studentName:'私密學生',prizeId:'p1',prizeName:'獎品',venue:'晴光',quantity,claimedQuantity,status});
test('overview counts records separately from units and retains revoked delivered units',()=>{
 const s=setup();const claims=[claim('a','waiting',2),claim('b','ready',2),claim('c','partial',3,1),claim('d','claimed',1,1),claim('e','digital'),claim('f','cancelled',3,1),{...claim('x','ready',9),campaignId:'other'}];
 const r=s.c.buildRaffleOverview_({...campaign,pickupDeadline:'2000-01-01T00:00:00Z'},claims,[],'2027-01-01T00:00:00Z');
 assert.equal(r.claims.total,6);for(const status of ['waiting','ready','partial','claimed','digital','cancelled'])assert.equal(r.claims[status],1);
 assert.equal(r.claims.deliveredUnits,3);assert.equal(r.claims.pendingUnits,6);assert.equal(r.claims.blockedRecords,3);assert.equal(r.claims.blockedUnits,6);
 assert.ok(!JSON.stringify(r).includes('private@example.com'));assert.ok(!JSON.stringify(r).includes('私密學生'));assert.ok(!JSON.stringify(r).includes('sourceFingerprint'));
 const open=s.c.buildRaffleOverview_(campaign,claims,[],'2027-01-01T00:00:00Z');assert.equal(open.claims.blockedRecords,0);assert.equal(open.claims.total,6);
});
test('overview separates mail purposes and counts sending as needing verification not delivered',()=>{
 const s=setup(),jobs=['queued','sending','uncertain','sent','closed'].map(status=>({campaignId:'future',status,kind:'invitation',email:'secret@example.com'}));
 jobs.push({campaignId:'future',kind:'ready',status:'queued'},{campaignId:'other',kind:'ready',status:'sent'});
 const r=s.c.buildRaffleOverview_(campaign,[],jobs,'2027-01-01T00:00:00Z');
 assert.equal(r.mail.invitation.total,5);assert.equal(r.mail.invitation.review,2);assert.equal(r.mail.invitation.sent,1);assert.equal(r.mail.invitation.closed,1);assert.equal(r.mail.ready.total,1);assert.equal(r.mail.ready.sent,0);
 assert.ok(!JSON.stringify(r).includes('secret@example.com'));
});
test('overview is admin only, refuses disabled/unconfigured before reading tables, never reads source or writes',()=>{
 const s=setup();let reads=0;const active=s.c.SpreadsheetApp.getActiveSpreadsheet;
 s.c.SpreadsheetApp.getActiveSpreadsheet=()=>{reads++;return active();};
 for(const session of [{teacherName:'老師',managementCapabilities:[]},{teacherName:'Tako',managementCapabilities:['raffle_fulfillment']}])assert.throws(()=>s.c.getRaffleOverview_(session,'future'),/權限/);
 assert.equal(reads,0);assert.throws(()=>s.c.getRaffleOverview_(admin,'other'));assert.equal(reads,0);
 s.props.set('RAFFLE_ENABLED','false');assert.throws(()=>s.c.getRaffleOverview_(admin,'future'));assert.equal(reads,0);s.props.set('RAFFLE_ENABLED','true');
 s.queue();s.tables.set('RaffleClaims',s.sheet([fields,fields.map(k=>claim('a','ready')[k]??'')]));const writes=s.writes(),before=JSON.stringify([...s.tables.values()].map(t=>t.data));
 s.c.SpreadsheetApp.openById=()=>assert.fail('overview must not read source or inventory');
 const r=s.c.getRaffleOverview_(admin,'future');assert.equal(r.readOnly,true);assert.equal(r.sourceChecked,false);assert.equal(r.claims.ready,1);assert.equal(r.mail.invitation.queued,1);
 assert.equal(s.writes(),writes);assert.equal(s.mails.length,0);assert.equal(JSON.stringify([...s.tables.values()].map(t=>t.data)),before);
 s.props.set('RAFFLE_WRITES_ENABLED','false');assert.equal(s.c.getRaffleOverview_(admin,'future').claims.ready,1);
});
test('overview rejects malformed states and journals instead of showing false zero counts',()=>{
 const s=setup();for(const bad of [claim('a','unknown'),claim('b','ready',2,1),claim('c','partial',1,1),claim('d','claimed',2,1),claim('e','waiting',Number.MAX_SAFE_INTEGER+1)])assert.throws(()=>s.c.buildRaffleOverview_(campaign,[bad],[],'2027-01-01T00:00:00Z'));
 assert.throws(()=>s.c.buildRaffleOverview_(campaign,[],[{campaignId:'future',status:'lost'}],'2027-01-01T00:00:00Z'));
 s.queue();s.tables.get('RaffleMailJournal').data[1][4]='broken';assert.throws(()=>s.c.getRaffleOverview_(admin,'future'),/紀錄/);
});
