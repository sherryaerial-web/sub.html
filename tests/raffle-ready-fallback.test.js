const test=require('node:test'),assert=require('node:assert/strict');
const {setup,admin}=require('./helpers/raffle-ready-fixture');
function fixture(){
 const s=setup(1);for(const [k,v] of Object.entries({RAFFLE_READY_NOTIFICATION_OWNER:'line',RAFFLE_READY_SOURCE_TEST_CAMPAIGN:'future',RAFFLE_READY_LINE_RESERVE_ENABLED:'true',RAFFLE_READY_FALLBACK_TEST_ENABLED:'true',RAFFLE_READY_LINE_TEST_EMAILS_JSON:'["student0@example.com"]'}))s.props.set(k,v);
 const secret='fixture-bridge-secret-'.repeat(3);s.props.set('RAFFLE_READY_FALLBACK_SECRET',secret);
 const claimId=s.claims[0].id,source=s.c.getRaffleReadyLineSource_(admin,'future',claimId);
 const r=s.c.reserveRaffleReadyLine_(admin,{campaignId:'future',claimId,previewToken:source.sourceToken,requestId:'fallback-reserve-0001'});
 const op=channel=>({campaignId:'future',claimId,reservationId:r.reservationId,channel,requestId:'fallback-send-'+channel+'-001'}),calls=[];
 const started=channel=>assert.equal(s.c.readRaffleMailState_().lineReservations[0].channels[channel].status,'sending');
 s.c.MailApp={getRemainingDailyQuota:()=>10,sendEmail:message=>{started('email');calls.push({channel:'email',...message});}};
 s.c.UrlFetchApp={fetch:(url,options)=>{started('ob');calls.push({channel:'ob',url,...JSON.parse(options.payload)});return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({recipientCount:1,messageIds:[101]})};}};
 return {...s,op,calls,secret,send:channel=>s.c.sendRaffleReadyFallback_(admin,op(channel),secret)};
}
test('fallback uses trusted recipient and stores independent channel starts before provider',()=>{
 const s=fixture();assert.equal(typeof s.c.sendRaffleReadyFallback_,'function');
 for(const channel of ['ob','email']){assert.equal(s.send(channel).outcome,'accepted');assert.equal(s.send(channel).outcome,'accepted');}
 assert.equal(s.calls.length,2);assert.equal(s.calls[0].email,'student0@example.com');assert.equal(s.calls[0].pushNotification,true);assert.match(s.calls[0].message,/限定測試/);assert.match(s.calls[0].message,/晴光/);
 assert.equal(s.calls[1].to,'student0@example.com');assert.match(s.calls[1].subject,/限定測試/);assert.match(s.calls[1].body,/請勿直接回覆/);
});
test('fallback gates arbitrary recipient, stale source, unapproved accounts and quota before send',()=>{
 for(const change of [s=>s.props.delete('RAFFLE_READY_FALLBACK_TEST_ENABLED'),s=>s.props.set('RAFFLE_READY_LINE_TEST_EMAILS_JSON','[]'),s=>s.props.set('RAFFLE_READY_LINE_TEST_EMAILS_JSON','["other@example.com"]'),s=>s.rows[1][9]='其他館',s=>s.props.set('RAFFLE_WRITES_ENABLED','false')]){
  const s=fixture();change(s);assert.throws(()=>s.send('email'));assert.equal(s.calls.length,0);
 }
 const s=fixture();assert.throws(()=>s.c.sendRaffleReadyFallback_(admin,{...s.op('email'),to:'other@example.com'},s.secret));
 s.send('ob');s.c.MailApp.getRemainingDailyQuota=()=>0;assert.equal(s.send('email').outcome,'rejected');assert.equal(s.calls.length,1);
});
test('fallback transport timeout is held and new request ID cannot trigger retry',()=>{
 const s=fixture();s.send('ob');let count=0;s.c.MailApp.sendEmail=()=>{count++;throw Error('timeout');};
 assert.equal(s.send('email').outcome,'unknown');assert.equal(s.c.sendRaffleReadyFallback_(admin,{...s.op('email'),requestId:'another-attempt-001'},s.secret).outcome,'unknown');assert.equal(count,1);
});
test('fallback lost start or completion flush never permits a duplicate provider call',()=>{
 for(const offset of [1,2]){
  const s=fixture();s.send('ob');s.fault('after',offset);assert.throws(()=>s.send('email'));
  const before=s.calls.length;s.send('email');assert.equal(s.calls.length,before);assert.equal(before,offset===1?1:2);
 }
});
test('GAS POST registers protected reservation/fallback actions, not public unauthenticated handlers',()=>{
 const s=fixture();s.c.getPostParameters_=e=>e.parameter;s.c.createPostResponse_=(_p,r)=>r;s.c.requireSession_=token=>{if(token!=='fixture')throw Error('unauthorized');return admin;};
 const post=(action,operation,sessionToken='fixture')=>s.c.doPost({parameter:{action,sessionToken,bridgeSecret:s.secret,operation:JSON.stringify(operation)}});
 assert.equal(post('reserveRaffleReadyLine',{campaignId:'future',claimId:s.claims[0].id,requestId:'fallback-reserve-0001',previewToken:'recheck'}).status,'success');
 assert.equal(post('sendRaffleReadyFallback',s.op('email'),'wrong').status,'error');assert.equal(s.calls.length,0);
 assert.equal(post('sendRaffleReadyFallback',s.op('ob')).status,'success');assert.equal(s.calls.length,1);
});
test('direct GAS fallback cannot bypass Worker authorization or an uncertain OB channel',()=>{
 const s=fixture();s.props.set('RAFFLE_READY_FALLBACK_SECRET','fixture-bridge-secret-'.repeat(3));
 assert.throws(()=>s.c.sendRaffleReadyFallback_(admin,s.op('ob')));
 assert.equal(s.calls.length,0);
 const send=channel=>s.c.sendRaffleReadyFallback_(admin,s.op(channel),s.props.get('RAFFLE_READY_FALLBACK_SECRET'));
 assert.equal(send('email').outcome,'unknown');assert.equal(s.calls.length,0);
 s.c.UrlFetchApp.fetch=()=>{s.calls.push({channel:'ob'});throw Error('timeout');};
 assert.equal(send('ob').outcome,'unknown');assert.equal(send('email').outcome,'unknown');
 assert.deepEqual(s.calls.map(x=>x.channel),['ob']);
});
