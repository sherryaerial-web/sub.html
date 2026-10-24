const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup,admin}=require('./helpers/raffle-ready-fixture');
function reserved(){
 const s=setup(1);
 s.props.set('RAFFLE_READY_NOTIFICATION_OWNER','line');
 s.props.set('RAFFLE_READY_SOURCE_TEST_CAMPAIGN','future');
 s.props.set('RAFFLE_READY_LINE_RESERVE_ENABLED','true');
 const claimId=s.claims[0].id,source=s.c.getRaffleReadyLineSource_(admin,'future',claimId);
 s.c.reserveRaffleReadyLine_(admin,{campaignId:'future',claimId,previewToken:source.sourceToken,requestId:'app-record-reserve-001'});
 return s;
}
test('App records distinguish LINE ownership from zero legacy mail without claiming delivery',()=>{
 const s=reserved(),before=s.writes(),r=s.c.getRaffleMailRecords_(admin,'future',0);
 assert.equal(r.total,0);
 assert.deepEqual(JSON.parse(JSON.stringify(r.lineHandoff)),{total:1,lineDeliveryChecked:false,ob:{missing:1,sending:0,accepted:0,rejected:0,unknown:0},email:{missing:1,sending:0,accepted:0,rejected:0,unknown:0}});
 assert.equal(s.writes(),before);assert.equal(s.mails.length,0);
 assert.throws(()=>s.c.getRaffleMailRecords_({teacherName:'Student',managementCapabilities:[]},'future',0));
});
test('App LINE handoff summary is scoped and preserves uncertain fallback evidence',()=>{
 const s=reserved(),original=s.c.readRaffleMailState_,state=original();
 state.lineReservations[0].channels={ob:{status:'unknown'},email:{status:'sending'}};
 state.lineReservations.push({...state.lineReservations[0],campaignId:'another'});
 s.c.readRaffleMailState_=()=>state;
 const r=s.c.getRaffleMailRecords_(admin,'future',0);
 assert.equal(r.lineHandoff.total,1);assert.equal(r.lineHandoff.ob.unknown,1);assert.equal(r.lineHandoff.email.sending,1);
 state.lineReservations[0].channels.ob.status='invalid';
 assert.throws(()=>s.c.getRaffleMailRecords_(admin,'future',0));
});
test('App renderer shows handoff separately and never offers resend for handoff-only records',()=>{
 const s=reserved(),c={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../raffle.js'),'utf8'),c);
 const r=s.c.getRaffleMailRecords_(admin,'future',0),html=c.window.SherryRaffle.renderMailRecords(r);
 assert.match(html,/LINE 流程已保留/);assert.match(html,/尚未核對 LINE/);
 assert.doesNotMatch(html,/<button[^>]*data-raffle-(?:reconcile|confirm-send|reopen)/);
 const legacy={...r};delete legacy.lineHandoff;assert.match(c.window.SherryRaffle.renderMailRecords(legacy),/本頁沒有寄信紀錄/);
 r.lineHandoff={total:1};assert.throws(()=>c.window.SherryRaffle.renderMailRecords(r));
});
