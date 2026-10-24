const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup,admin}=require('./helpers/raffle-ready-fixture');
test('native App preview revalidates source and excludes recipient and sending credentials',()=>{
 const s=setup(1);s.props.set('RAFFLE_READY_NOTIFICATION_OWNER','line');s.props.set('RAFFLE_READY_SOURCE_TEST_CAMPAIGN','future');
 assert.equal(typeof s.c.previewRaffleReadyAppNotice_,'function');
 const before=s.writes(),r=s.c.previewRaffleReadyAppNotice_(admin,'future',s.claims[0].id);
 assert.equal(r.dryRun,true);assert.equal(r.sendEnabled,false);assert.equal(r.remaining,1);assert.equal(r.prizeName,'提袋');
 for(const key of ['email','sourceToken','sourceFingerprint','reservationId'])assert.equal(r[key],undefined);
 assert.equal(s.writes(),before);assert.equal(s.mails.length,0);
 assert.throws(()=>s.c.previewRaffleReadyAppNotice_({teacherName:'Student',managementCapabilities:[]},'future',s.claims[0].id));
 s.rows[1][9]='其他館';assert.throws(()=>s.c.previewRaffleReadyAppNotice_(admin,'future',s.claims[0].id));
});
test('native preview button requires matching test campaign and unblocked ready claim',()=>{
 const c={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../raffle.js'),'utf8'),c);
 const api=c.window.SherryRaffle,claim={id:'a',campaignId:'future',studentKey:'s',status:'ready',quantity:1,claimedQuantity:0};
 assert.match(api.renderClaims([claim],[],{readyPreviewCampaign:'future'}),/data-raffle-ready-preview/);
 for(const change of [{campaignId:'other'},{status:'claimed'},{pickupBlocked:true}])assert.doesNotMatch(api.renderClaims([{...claim,...change}],[],{readyPreviewCampaign:'future'}),/data-raffle-ready-preview/);
 assert.doesNotMatch(api.renderClaims([claim],[],{}),/data-raffle-ready-preview/);
});
