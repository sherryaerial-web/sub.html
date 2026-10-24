const assert=require('node:assert/strict');
const {setup:base,admin,campaign}=require('./raffle-mail-fixture');
function setup(count=2,sameEmail=false){
 const s=base(count);s.props.set('RAFFLE_READY_MAIL_ENABLED','true');
 s.rows[0].push('中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間');s.rows.slice(1).forEach((r,i)=>{if(sameEmail)r[0]='same@example.com';r[4]='Yes';r.push('A','提袋',i%2?'劍潭':'晴光','choose_venue','2027-01-01');});
 const prizes=[['獎項ID','獎項等級','獎品名稱','領獎方式'],['p1','A','提袋','choose_venue']];
 s.c.SpreadsheetApp.openById=id=>{assert.equal(id,campaign.sourceSpreadsheetId);return{getSheetByName:n=>n==='抽獎名單'?s.sheet(s.rows):n==='獎項設定'?s.sheet(prizes):null};};
 const claims=s.c.buildRaffleImportPreview_(campaign,s.rows,prizes,[]).additions.map(c=>({...c,status:'ready'}));
 const headers=['id','campaignId','email','studentName','prizeId','prizeName','venue','quantity','claimedQuantity','status','claimedAt','claimedBy','sourceFingerprint'];
 const seeds=[headers,...claims.map(c=>headers.map(k=>c[k]??''))];s.tables.set('RaffleClaims',s.sheet(seeds));
 return{...s,claims,seeds,prizes,queueReady:(id='ready-queue-00001')=>s.c.confirmRaffleReadyNotifications_(admin,{campaignId:'future',previewToken:s.c.previewRaffleReadyNotifications_(admin,'future').previewToken,requestId:id}),sendOp:()=>({campaignId:'future',previewToken:s.c.previewRaffleReadyMailSend_(admin,'future').previewToken,requestId:'ready-send-00001'})};
}
module.exports={setup,admin,campaign};
