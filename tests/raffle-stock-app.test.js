const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup,admin,campaign}=require('./helpers/raffle-ready-fixture');
function env(n=2,sameEmail=false){const s=setup(n,sameEmail);vm.runInContext(fs.readFileSync('RaffleStockInbox.gs','utf8'),s.c);vm.runInContext(fs.readFileSync('ActivityTools.gs','utf8'),s.c);return s;}
test('prepared notice queues and sends exactly one claim, never other queued awards',()=>{
 const s=env(3,true);s.c.confirmRaffleReadyNotifications_(admin,{campaignId:'future',previewToken:s.c.previewRaffleReadyNotifications_(admin,'future').previewToken,requestId:'other-queue-00001'});
 // An existing multi-item batch is never silently sent by preparing a single claim.
 const r=s.c.raffleNotifyPreparedClaim_(admin,s.claims[0].id);assert.equal(r.status,'needs_review');assert.equal(s.mails.length,0);
 const x=env(2);const r2=x.c.raffleNotifyPreparedClaim_(admin,x.claims[1].id);assert.equal(r2.status,'sent');assert.equal(x.mails.length,1);assert.equal(x.mails[0].to,'student1@example.com');
 assert.equal(x.c.raffleNotifyPreparedClaim_(admin,x.claims[1].id).status,'sent');assert.equal(x.mails.length,1);
});
test('uncertain delivery never resends; disabled or nonadmin cannot send',()=>{
 const s=env(1);s.fault('transport');assert.equal(s.c.raffleNotifyPreparedClaim_(admin,s.claims[0].id).status,'needs_review');assert.equal(s.c.raffleNotifyPreparedClaim_(admin,s.claims[0].id).status,'needs_review');assert.equal(s.mails.length,1);
 const d=env(1);d.props.delete('RAFFLE_READY_MAIL_ENABLED');assert.equal(d.c.raffleNotifyPreparedClaim_(admin,d.claims[0].id).status,'disabled');assert.equal(d.mails.length,0);
 assert.throws(()=>env(1).c.raffleNotifyPreparedClaim_({teacherName:'Other',managementCapabilities:[]},'x'));
});
test('student email is only exposed to raffle admins on preparation details',()=>{
 const s=env(1);const group=s.c.getRaffleFulfillment_(admin,{campaignId:'future'}).groups[0];
 assert.equal(s.c.getRaffleFulfillment_(admin,{campaignId:'future',groupId:group.id}).claims[0].email,'student0@example.com');
 const t={teacherName:'Teacher',managementCapabilities:['raffle_fulfillment']};assert.equal(s.c.getRaffleFulfillment_(t,{campaignId:'future',groupId:group.id}).claims[0].email,undefined);
});
test('App stock reminder is Tako-only, includes email, and pushes once',()=>{
 const s=env(1),seen=new Set(),msgs=[],push=[];s.c.persistInboxNotification_=(to,m)=>{msgs.push({to,m});const dupe=seen.has(m.eventKey);seen.add(m.eventKey);return{saved:true,duplicate:dupe,appendedRecipients:dupe?0:1};};s.c.sendPushNotificationSafely_=(to,m)=>{push.push(to);throw Error('push timeout');};
 const c={...s.claims[0],status:'waiting'};s.c.raffleStockAppNotice_(c);s.c.raffleStockAppNotice_(c);
 assert.equal(msgs[0].to[0],'Tako');assert.equal(msgs[0].to.length,1);assert.match(msgs[0].m.content,/student0@example.com/);assert.equal(push.length,1);
});
test('stock reminder rejects unselected, ready, electronic, cancelled and invalid email',()=>{
 const s=env(1);let writes=0;s.c.persistInboxNotification_=()=>{writes++;};for(const change of [{status:'ready'},{status:'digital'},{status:'cancelled'},{venue:''},{email:'bad'},{claimedQuantity:1}])assert.throws(()=>s.c.raffleStockAppNotice_({...s.claims[0],status:'waiting',...change}));assert.equal(writes,0);
});
test('scheduled source sync imports once, alerts only pending deliveries, and advances past old receipts',()=>{
 const s=env(2);s.tables.delete('RaffleClaims');s.tables.set('RaffleJournal',s.sheet([]));
 const base=s.c.SpreadsheetApp.openById;s.c.SpreadsheetApp.openById=()=>base(campaign.sourceSpreadsheetId);
 s.c.getRaffleConfiguration_=()=>({enabled:true,campaigns:[{...campaign,sourceSpreadsheetId:'1Sdi96hIru-Vag8hFl6bEo6xMhpjgVkro75dH1PNvpRM'}]});
 s.c.ScriptApp={getScriptId:()=> '16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW'};
 s.c.Date=class extends Date{constructor(...a){super(...(a.length?a:['2026-11-20T00:00:00Z']));}static now(){return Date.parse('2026-11-20T00:00:00Z');}};
 s.c.PropertiesService.getScriptProperties=()=>({getProperty:k=>s.props.get(k)||null,setProperty:(k,v)=>s.props.set(k,v)});
 s.props.set('RAFFLE_STOCK_APP_ENABLED','true');let notices=0;s.c.raffleStockAppNotice_=()=>{notices++;return{saved:true,duplicate:false};};
 assert.equal(s.c.runRaffleStockAppSync().newNotices,2);assert.equal(s.c.runRaffleStockAppSync().newNotices,0);assert.equal(notices,2);assert.equal(s.c.readRaffleClaims_().length,2);
 s.rows.push([...s.rows[1]]);s.rows[3][0]='new@example.com';s.rows[3][2]='CODE-NEW';assert.equal(s.c.runRaffleStockAppSync().newNotices,1);assert.equal(s.c.readRaffleClaims_().length,3);
 s.rows[3][9]='wrong';assert.throws(()=>s.c.runRaffleStockAppSync(),/衝突/);assert.equal(notices,3);
});
test('prepare result is preserved when notification fails; repeated operation stays idempotent',()=>{
 const s=env(1);s.seeds[1][9]='waiting';s.tables.set('RaffleJournal',s.sheet([]));
 const claim=s.c.readRaffleClaims_()[0],op={action:'prepare',claimId:claim.id,version:0,venue:claim.venue,requestId:'prepare-notify-0001'};
 s.c.raffleNotifyPreparedClaim_=()=>{throw Error('transport timeout');};
 const a=s.c.mutateRaffleClaimAndNotify_(admin,op),b=s.c.mutateRaffleClaimAndNotify_(admin,op);
 assert.equal(a.status,'ready');assert.equal(b.version,a.version);assert.equal(a.notification.status,'needs_review');assert.equal(s.c.readRaffleState_().events.length,1);
});
