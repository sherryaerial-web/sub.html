const test=require('node:test'),assert=require('node:assert/strict');
const {setup,admin}=require('./helpers/raffle-mail-fixture');
function fixture(count=1){
 const s=setup(0),now=Date.now(),sourceId='formal-evidence-sheet-123456',snapshot='snapshot-20261018';let reads=0,opened=0,change=false;
 const draft={id:'christmas-2026',version:1,environment:'production',enabled:false,requiresLaunchConfirmation:true,startsAt:Date.parse('2026-11-15T00:00:00+08:00'),endsAt:Date.parse('2027-01-01T00:00:00+08:00'),starsPerDraw:3,purchaseRules:[{points:60,stars:2,balls:1},{points:100,stars:3,balls:2}],resources:{production:{database:'formal-db',sheet:sourceId,gas:'formal-gas'},test:{database:'pilot-db',sheet:'pilot-sheet',gas:'pilot-gas'}},roomIds:['1','2','3','4'],passRules:[{passId:'60',points:60},{passId:'100',points:100}],ballPrizeId:'ball',referralMode:'manual',evidenceSource:{spreadsheetId:sourceId}};
 const tables={
  ActivityEvidenceManifest:[['snapshotId','environment','campaignId','version','checkedAt','complete','identitySourceId','identityCount','inventoryCount'],[snapshot,'production',draft.id,'1',String(now),'true','formal-db',String(count),'1']],
  ActivityIdentityEvidence:[['snapshotId','memberId','lineId','confirmedBy','confirmedAt'],...Array.from({length:count},(_,i)=>[snapshot,String(i+1),'U'+i.toString(16).padStart(32,'0'),'reviewer',String(now)])],
  ActivityInventoryEvidence:[['snapshotId','prizeId','venue','directPickup','available','required'],[snapshot,'ball','','true','5','3']],
  ActivityNotificationEvidence:[['snapshotId','channels','pushNotification','systemFooter','oldSenderStopped','idempotencyVerified','recoveryVerified','verifiedBy','verifiedAt'],[snapshot,'ob,email','true','true','true','true','true','reviewer',String(now)]]
 };
 tables.ActivityEvidenceManifest[0].push('identityHash','inventoryHash','notificationHash');
 tables.ActivityEvidenceManifest[1].push(...['ActivityIdentityEvidence','ActivityInventoryEvidence','ActivityNotificationEvidence'].map(name=>s.c.raffleHash_(JSON.stringify(tables[name]))));
 s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',JSON.stringify(draft));
 s.c.SpreadsheetApp.openById=id=>{opened++;assert.equal(id,sourceId);return{getSheetByName:name=>tables[name]?{getLastRow:()=>tables[name].length,getLastColumn:()=>tables[name][0].length,getRange:(row,col,n,m)=>({getDisplayValues:()=>{assert.ok(n<=200);reads++;const result=tables[name].slice(row-1,row-1+n).map(r=>r.slice(col-1,col-1+m));if(change&&name==='ActivityIdentityEvidence')tables.ActivityEvidenceManifest[1][0]='changed';return result;}})}:null};};
 return{...s,draft,tables,reads:()=>reads,opened:()=>opened,change:()=>change=true};
}
test('configured evidence source is read in bounded pages and returns only aggregate audit',()=>{
 const s=fixture(401),r=s.c.getActivityProductionReadiness_(admin);
 assert.ok(s.opened()>0);assert.equal(r.evidence.identity.count,401);assert.equal(r.evidence.identity.snapshotValid,true);assert.equal(r.evidence.fulfillment.snapshotValid,true);assert.equal(r.canActivate,false);assert.equal(r.liveVerified,false);
 assert.ok(!JSON.stringify(r).includes('reviewer'));assert.equal(s.writes(),0);assert.equal(s.mails.length,0);
});
test('changed generation cannot produce a mixed passing snapshot',()=>{
 const s=fixture();s.change();const r=s.c.getActivityProductionReadiness_(admin);assert.ok(r.blockers.includes('evidence_source_unavailable'));assert.equal(r.evidence.identity.snapshotValid,false);
});
test('missing columns, partial rows, changed contents and wrong-generation records fail closed',()=>{
 for(const kind of ['header','count','snapshot','missing','contents']){const s=fixture();if(kind==='header')s.tables.ActivityIdentityEvidence[0][1]='other';if(kind==='count')s.tables.ActivityEvidenceManifest[1][7]='2';if(kind==='snapshot')s.tables.ActivityInventoryEvidence[1][0]='older';if(kind==='missing')delete s.tables.ActivityNotificationEvidence;if(kind==='contents')s.tables.ActivityInventoryEvidence[1][4]='1000';const r=s.c.getActivityProductionReadiness_(admin);assert.ok(r.blockers.includes('evidence_source_unavailable'));}
});
test('source failure never falls back to an old passing property snapshot or reveals exception details',()=>{
 const s=fixture();s.props.set('ACTIVITY_PRODUCTION_EVIDENCE_JSON','{"private":"old"}');s.c.SpreadsheetApp.openById=()=>{throw Error('secret path or key');};const r=s.c.getActivityProductionReadiness_(admin);assert.ok(r.blockers.includes('evidence_source_unavailable'));assert.ok(!JSON.stringify(r).includes('secret'));assert.equal(r.evidence.identity.snapshotValid,false);
});
test('unauthorized and cross-environment sources are rejected before spreadsheet reads',()=>{
 const s=fixture();assert.throws(()=>s.c.getActivityProductionReadiness_({teacherName:'teacher',managementCapabilities:[]}));assert.equal(s.opened(),0);
 s.draft.evidenceSource.spreadsheetId='pilot-sheet';s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',JSON.stringify(s.draft));const r=s.c.getActivityProductionReadiness_(admin);assert.ok(r.blockers.includes('evidence_source_unavailable'));assert.equal(s.opened(),0);
});
