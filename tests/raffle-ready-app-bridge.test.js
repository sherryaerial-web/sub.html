const test=require('node:test'),assert=require('node:assert/strict');
const {setup,admin}=require('./helpers/raffle-ready-fixture');
function bridge(){
 const s=setup(1),calls=[];
 s.props.set('RAFFLE_READY_APP_BRIDGE_ENABLED','true');
 s.props.set('RAFFLE_READY_APP_BRIDGE_SECRET','a'.repeat(40));
 s.props.set('RAFFLE_READY_SOURCE_TEST_CAMPAIGN','future');
 s.props.set('RAFFLE_READY_NOTIFICATION_OWNER','line');
 s.c.getPostParameters_=e=>e.parameter;s.c.createPostResponse_=(_p,r)=>r;
 s.c.requireSession_=token=>{if(token!=='fixture-session')throw Error('unauthorized');return admin;};
 s.c.UrlFetchApp={fetch:(url,options)=>{calls.push({url,options});return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({testOnly:true,noticeId:'notice-one',claimId:s.claims[0].id,content:{prizeName:'提袋',venue:'晴光',pickupDeadline:'2027-01-30'},remaining:1,previewToken:'preview-proof',sessionToken:'never-return-this'})};}};
 s.post=(overrides={})=>s.c.doPost({parameter:{action:'previewRaffleReadyAppDelivery',expectedActor:'店長',sessionToken:'fixture-session',campaignId:'future',claimId:s.claims[0].id,...overrides}});
 return {...s,calls};
}
test('native GAS preview forwards its authenticated session only to pinned test Worker and filters response',()=>{
 const s=bridge(),before=s.writes(),r=s.post();assert.equal(r.status,'success');
 assert.equal(s.calls.length,1);const call=s.calls[0];
 assert.equal(call.url,'https://sherry-activity-pilot.sherry-line-ai.workers.dev/internal/ready-app');
 assert.equal(call.options.followRedirects,false);
 assert.equal(JSON.parse(call.options.payload).sessionToken,'fixture-session');
 assert.equal(JSON.parse(call.options.payload).action,'preview');
 assert.equal(r.data.previewToken,'preview-proof');assert.equal(r.data.sessionToken,undefined);
 assert.equal(s.writes(),before);assert.equal(s.mails.length,0);
});
test('native preview refuses disabled bridge, foreign campaign and invalid session before network',()=>{
 const s=bridge();assert.notEqual(s.post({sessionToken:'wrong'}).status,'success');
 assert.notEqual(s.post({campaignId:'production'}).status,'success');
 s.props.set('RAFFLE_READY_APP_BRIDGE_ENABLED','false');assert.notEqual(s.post().status,'success');
 assert.equal(s.calls.length,0);
});
test('native preview does not retry network failure or expose exception details',()=>{
 const s=bridge();let attempts=0;s.c.UrlFetchApp.fetch=()=>{attempts++;throw Error('secret-sensitive-url');};
 const r=s.post();assert.notEqual(r.status,'success');assert.equal(attempts,1);
 assert.ok(!JSON.stringify(r).includes('secret-sensitive-url'));
});
test('native dispatch requires separate send gate and does not accept recipients or arbitrary content',()=>{
 const s=bridge();const operation=JSON.stringify({claimId:s.claims[0].id,previewToken:'preview-proof'});
 assert.notEqual(s.post({action:'dispatchRaffleReadyAppDelivery',operation}).status,'success');assert.equal(s.calls.length,0);
 s.props.set('RAFFLE_READY_APP_SEND_ENABLED','true');
 s.c.UrlFetchApp.fetch=(url,options)=>{s.calls.push({url,options});return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({testOnly:true,status:'recorded',notice:{id:'notice-one',claimId:s.claims[0].id,revision:2,status:'accepted',channels:{line:'accepted',ob:'skipped',email:'skipped'},nextAction:null,readConfirmed:false,email:'private@example.com'}})};};
 const r=s.post({action:'dispatchRaffleReadyAppDelivery',operation});assert.equal(r.status,'success');assert.equal(r.data.notice.channels.line,'accepted');assert.equal(r.data.notice.email,undefined);
 assert.equal(JSON.parse(s.calls[0].options.payload).action,'dispatch');
 assert.notEqual(s.post({action:'dispatchRaffleReadyAppDelivery',operation:JSON.stringify({claimId:s.claims[0].id,previewToken:'preview-proof',email:'another@example.com'})}).status,'success');assert.equal(s.calls.length,1);
 assert.notEqual(s.post({action:'dispatchRaffleReadyAppDelivery',operation,expectedActor:'Other'}).status,'success');assert.equal(s.calls.length,1);
});
test('native reconciliation stays available with sending off and does not validate mutable claim source',()=>{
 const s=bridge();s.rows[1][9]='其他館';
 s.c.UrlFetchApp.fetch=(url,options)=>{s.calls.push({url,options});return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({testOnly:true,notice:{id:'notice-one',claimId:s.claims[0].id,revision:2,status:'review',channels:{line:'unknown',ob:'pending',email:'pending'},nextAction:null,readConfirmed:false}})};};
 const r=s.post({action:'reconcileRaffleReadyAppDelivery',operation:JSON.stringify({noticeId:'notice-one'})});
 assert.equal(r.status,'success');assert.equal(r.data.notice.status,'review');assert.equal(s.calls.length,1);assert.equal(JSON.parse(s.calls[0].options.payload).action,'reconcile');
});
