const test=require('node:test'),assert=require('node:assert/strict');
const {setup:base,admin,campaign}=require('./helpers/raffle-mail-fixture');
function setup({draw=true,price=6000}={}){
 const s=base(0),c={...campaign,readyPrizeVenues:[{prizeId:'gift1',venue:'晴光'}],obSync:{dateFrom:'2027-01-01',dateTo:'2027-01-31',passIds:draw?['60']:[],fixedGifts:[{passId:'60',prizeId:'gift1',venue:'晴光'}]}};
 for(const [k,v] of Object.entries({RAFFLE_CAMPAIGNS_JSON:JSON.stringify([c]),RAFFLE_OB_SYNC_ENABLED:'true',RAFFLE_OB_SYNC_HANDOFF_future:'confirmed',RAFFLE_READY_MAIL_ENABLED:'true'}))s.props.set(k,v);
 s.rows[0].push('API購買時間','API課卡ID','API課卡名稱','API點數','API付款狀態','API付款方式','API付款參考編號','API使用者ID','API同步時間','同步來源','中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間');
 const prizes=[['獎項ID','獎項等級','獎品名稱','領獎方式'],['gift1','A','固定提袋','choose_venue']];
 s.c.SpreadsheetApp.openById=()=>({getSheetByName:n=>n==='抽獎名單'?s.sheet(s.rows):n==='獎項設定'?s.sheet(prizes):null});
 const purchases=[{id:900,price,paymentStatus:'paid',purchasedAt:'2027-01-02T00:00:00+08:00',paymentMethod:'Cash',user:{id:1,email:'student@example.com',firstName:'學生'},pass:{id:60,nameZhHant:'60點課卡'},visits:60}];
 let uuid=0;const messages=[];s.c.Utilities.getUuid=()=>String(++uuid).padStart(8,'0')+'-test';
 s.c.UrlFetchApp.fetch=(url,op)=>{if(op.method==='post'){messages.push(JSON.parse(op.payload));return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({recipientCount:1,messageIds:[101]})};}return{getResponseCode:()=>200,getContentText:()=>JSON.stringify(purchases)};};
 const preview=()=>s.c.previewRaffleObSync_(admin,'future');
 const sync=(p=preview(),id='gift-sync-request-01')=>s.c.confirmRaffleObSync_(admin,{campaignId:'future',previewToken:p.previewToken,requestId:id});
 return{...s,campaign:c,prizes,purchases,preview,sync,messages};
}
test('one paid purchase independently grants a raffle chance and fixed gift; repeat is idempotent',()=>{
 const s=setup(),p=s.preview();assert.equal(p.raffleCount,1);assert.equal(p.giftCount,1);assert.equal(p.newCount,2);assert.equal(s.writes(),0);
 const result=s.sync(p);assert.equal(result.inserted,2);assert.equal(result.giftInserted,1);assert.equal(s.rows.length,2);
 const claims=s.c.readRaffleClaims_();assert.equal(claims.length,1);assert.equal(claims[0].prizeName,'固定提袋');assert.equal(claims[0].venue,'晴光');assert.equal(claims[0].status,'ready');assert.equal(claims[0].giftSource.purchaseId,'900');
 assert.equal(s.preview().newCount,0);assert.equal(s.mails.length,0);
});
test('gift-only pass does not create verification code or invitation; zero price grants neither',()=>{
 const s=setup({draw:false});assert.equal(s.preview().raffleCount,0);s.sync();assert.equal(s.rows.length,1);assert.equal(s.c.readRaffleClaims_().length,1);assert.equal(s.c.previewRaffleInvitations_(admin,'future').candidateCount,0);
 for(const price of [0,null,'bad']){const z=setup({price});assert.equal(z.preview().newCount,0);assert.equal(z.writes(),0);}
});
test('a full raffle source still permits gift-only journal issuance',()=>{
 const s=setup({draw:false});for(let i=0;i<5000;i++)s.rows.push(s.rows[0].map(h=>h==='驗證碼'?'OLD'+i:h==='API購課ID'?String(10000+i):''));
 assert.equal(s.preview().giftCount,1);assert.equal(s.sync().giftInserted,1);assert.equal(s.rows.length,5001);
});
test('fixed gift uses existing ready notice pipeline for OB push and Email, once',()=>{
 const s=setup();s.sync();const p=s.c.previewRaffleReadyNotifications_(admin,'future');assert.equal(p.candidateCount,1);assert.match(p.previews[0].body,/固定提袋/);
 s.c.confirmRaffleReadyNotifications_(admin,{campaignId:'future',previewToken:p.previewToken,requestId:'gift-queue-request-01'});
 const op={campaignId:'future',previewToken:s.c.previewRaffleReadyMailSend_(admin,'future').previewToken,requestId:'gift-send-request-01'};
 assert.equal(s.c.sendRaffleReadyMailBatch_(admin,op).sent,1);assert.equal(s.mails.length,1);assert.equal(s.messages.length,1);assert.equal(s.messages[0].pushNotification,true);
 s.c.sendRaffleReadyMailBatch_(admin,op);assert.equal(s.mails.length,1);assert.equal(s.messages.length,1);
});
test('partial source append failure recovers only missing gift, without a second chance',()=>{
 const s=setup(),p=s.preview();s.fault('after');assert.throws(()=>s.sync(p),/uncertain/);assert.equal(s.rows.length,2);
 const next=s.preview();assert.equal(next.raffleCount,0);assert.equal(next.giftCount,1);s.sync(next,'gift-sync-recover-01');assert.equal(s.rows.length,2);assert.equal(s.c.readRaffleClaims_().length,1);
});
test('missing prize, duplicate gift rule, and stale prize name block issuance',()=>{
 const s=setup(),p=s.preview();s.prizes[1][2]='不同贈品';assert.throws(()=>s.sync(p),/變更/);assert.equal(s.writes(),0);
 s.prizes.pop();assert.throws(s.preview,/獎品|贈品/);
 const t=setup();t.campaign.obSync.fixedGifts.push({...t.campaign.obSync.fixedGifts[0]});assert.throws(()=>t.c.normalizeRaffleCampaign_(t.campaign),/重複/);
});
test('fixed gift source remains immutable across claim mutations and allows revoke/restore',()=>{
 const s=setup();s.sync();let claim=s.c.readRaffleClaims_()[0];
 s.c.mutateRaffleClaim_(admin,{claimId:claim.id,version:claim.version,action:'revoke',reason:'誤操作測試',requestId:'gift-revoke-request-01'});
 claim=s.c.readRaffleClaims_()[0];s.c.mutateRaffleClaim_(admin,{claimId:claim.id,version:claim.version,venue:'晴光',action:'restore',reason:'恢復',requestId:'gift-restore-request-01'});
 assert.equal(s.c.readRaffleClaims_()[0].status,'waiting');assert.equal(s.preview().giftCount,0);
 const row=s.tables.get('RaffleJournal').data.at(-1),event=JSON.parse(row[3]);event.changes[0].claim.giftSource.price=0;row[3]=JSON.stringify(event);assert.throws(()=>s.c.readRaffleClaims_(),/贈品|來源/);
});
