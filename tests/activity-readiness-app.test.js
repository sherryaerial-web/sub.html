const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup,admin}=require('./helpers/raffle-mail-fixture');
test('readiness is admin-only and never exposes stored draft or writes data',()=>{
 const s=setup(0);assert.equal(typeof s.c.getActivityProductionReadiness_,'function');
 s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',JSON.stringify({secret:'private-test-value'}));
 assert.throws(()=>s.c.getActivityProductionReadiness_({teacherName:'老師',managementCapabilities:[]}));
 const r=s.c.getActivityProductionReadiness_(admin);
 assert.equal(r.draftValid,false);assert.equal(r.canActivate,false);assert.equal(r.liveVerified,false);
 assert.ok(r.blockers.length>0);assert.ok(!JSON.stringify(r).includes('private-test-value'));assert.equal(s.writes(),0);assert.equal(s.mails.length,0);
 assert.equal(r.evidence.identity.snapshotValid,false);
 assert.equal(r.evidence.fulfillment.snapshotValid,false);
 assert.equal(r.evidence.notifications.snapshotValid,false);
});
test('missing and malformed server drafts explicitly remain unconfigured',()=>{
 const s=setup(0);assert.equal(typeof s.c.getActivityProductionReadiness_,'function');
 for(const raw of ['', '{broken']){s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',raw);const r=s.c.getActivityProductionReadiness_(admin);assert.ok(r.blockers.includes('draft_unconfigured'));assert.equal(r.canActivate,false);}
});
test('valid server draft only clears format blockers and still requires live acceptance',()=>{
 const s=setup(0),draft={environment:'production',enabled:false,requiresLaunchConfirmation:true,startsAt:Date.parse('2026-11-15T00:00:00+08:00'),endsAt:Date.parse('2027-01-01T00:00:00+08:00'),starsPerDraw:3,purchaseRules:[{points:60,stars:2,balls:1},{points:100,stars:3,balls:2}],resources:{production:{database:'prod-db',sheet:'prod-sheet',gas:'prod-gas'},test:{database:'test-db',sheet:'test-sheet',gas:'test-gas'}},roomIds:['1','2','3','4'],passRules:[{passId:'60',points:60},{passId:'100',points:100}],ballPrizeId:'ball',referralMode:'manual'};
 s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',JSON.stringify(draft));let r=s.c.getActivityProductionReadiness_(admin);
 assert.equal(r.draftValid,true);assert.equal(r.canActivate,false);assert.ok(r.pendingChecks.length>0);
 assert.ok(!JSON.stringify(r).includes('prod-sheet'));
 const now=Date.now();draft.id='christmas-2026';draft.version=1;
 s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',JSON.stringify(draft));
 const header=sourceId=>({environment:'production',campaignId:draft.id,version:1,sourceId,complete:true,checkedAt:now,total:1});
 const evidence={identity:{...header('prod-db'),records:[{memberId:'9',lineId:'U'+'a'.repeat(32),confirmedBy:'private-manager',confirmedAt:now}]},fulfillment:{...header('prod-sheet'),records:[{prizeId:'ball',venue:'',directPickup:true,available:2,required:1}],notifications:{channels:['ob','email'],pushNotification:true,systemFooter:true,oldSenderStopped:true,idempotencyVerified:true,recoveryVerified:true,verifiedBy:'private-manager',verifiedAt:now}}};
 s.props.set('ACTIVITY_PRODUCTION_EVIDENCE_JSON',JSON.stringify(evidence));r=s.c.getActivityProductionReadiness_(admin);
 assert.equal(r.evidence.identity.snapshotValid,true);assert.equal(r.evidence.fulfillment.snapshotValid,true);assert.equal(r.evidence.notifications.snapshotValid,true);
 assert.equal(r.liveVerified,false);assert.equal(r.canActivate,false);assert.ok(!JSON.stringify(r).includes('private-manager'));assert.ok(!JSON.stringify(r).includes('U'+'a'.repeat(32)));
 draft.resources.production.sheet='test-sheet';s.props.set('ACTIVITY_PRODUCTION_DRAFT_JSON',JSON.stringify(draft));r=s.c.getActivityProductionReadiness_(admin);assert.ok(r.blockers.includes('resource_isolation'));assert.equal(r.draftValid,false);
 assert.equal(r.evidence.fulfillment.snapshotValid,false);assert.equal(s.writes(),0);
});
test('readiness UI separates configuration from live acceptance and cannot render an activation action',()=>{
 const window={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../raffle.js'),'utf8'),{window});
 assert.equal(typeof window.SherryRaffle.renderProductionReadiness,'function');
 const render=window.SherryRaffle.renderProductionReadiness;
 const html=render({draftValid:false,canActivate:false,liveVerified:false,blockers:['resource_isolation','unknown'],pendingChecks:['member_identity','inventory']});
 assert.match(html,/正式.*測試/);assert.match(html,/會員/);assert.match(html,/庫存/);assert.match(html,/待核對/);assert.doesNotMatch(html,/<button/);
 assert.throws(()=>render({draftValid:true,canActivate:true,liveVerified:true,blockers:[],pendingChecks:[]}));
 const evidence={canActivate:false,liveVerified:false,identity:{snapshotValid:false,count:2,issues:['identity_conflict']},fulfillment:{snapshotValid:false,count:1,issues:['inventory_shortage']},notifications:{snapshotValid:false,count:0,issues:['notification_handoff_unverified']}};
 const extended=render({draftValid:false,canActivate:false,liveVerified:false,blockers:['draft_unconfigured'],pendingChecks:['member_identity'],evidence});
 assert.match(extended,/重複.*配對/);assert.match(extended,/庫存不足/);assert.match(extended,/通知.*交接/);assert.doesNotMatch(extended,/<button/);
 const failedSource=render({draftValid:false,canActivate:false,liveVerified:false,blockers:['evidence_source_unavailable'],pendingChecks:[],evidenceSource:'configured_sheet'});
 assert.match(failedSource,/核對來源無法讀取或資料不完整/);
 assert.match(failedSource,/指定試算表/);
 assert.doesNotMatch(failedSource,/檢查通過/);
});
