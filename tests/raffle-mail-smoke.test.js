const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup({quota=1,sendFails=false,finishFails=false}={}){
 const values=new Map(),sent=[];let locked=false;
 const c={PropertiesService:{getScriptProperties:()=>({getProperty:k=>values.get(k)||null,setProperty:(k,v)=>{assert.ok(locked);if(finishFails&&JSON.parse(v).status==='accepted')throw Error('state write failed');values.set(k,v);}})},LockService:{getScriptLock:()=>({waitLock:()=>{assert.equal(locked,false);locked=true;},releaseLock:()=>{locked=false;}})},MailApp:{getRemainingDailyQuota:()=>quota,sendEmail:message=>{assert.ok(locked);assert.equal(JSON.parse([...values.values()][0]).status,'sending');sent.push(message);if(sendFails)throw Error('transport uncertain');}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../scripts/raffle-mail-smoke.gs'),'utf8'),c);
 return {c,values,sent};
}
test('approved smoke sends only one clearly labelled mail to fixed recipient and repeated run does not send',()=>{
 const s=setup();assert.equal(s.c.getApprovedSmokeTestStatus().status,'not_started');assert.equal(s.c.sendApprovedSmokeTest().status,'accepted');
 assert.equal(s.sent.length,1);assert.equal(s.sent[0].to,'m605330912@icloud.com');assert.match(s.sent[0].subject,/非抽獎通知/);assert.match(s.sent[0].body,/目前沒有抽獎活動/);assert.equal(s.sent[0].cc,undefined);assert.equal(s.sent[0].bcc,undefined);
 assert.equal(s.c.sendApprovedSmokeTest().status,'accepted');assert.equal(s.sent.length,1);
});
test('no quota leaves test unsent and unreserved',()=>{const s=setup({quota:0});assert.throws(()=>s.c.sendApprovedSmokeTest(),/配額/);assert.equal(s.sent.length,0);assert.equal(s.values.size,0);});
test('send uncertainty and post-send state failure never trigger another email',()=>{
 for(const options of [{sendFails:true},{finishFails:true}]){const s=setup(options);assert.throws(()=>s.c.sendApprovedSmokeTest(),/不明/);assert.equal(s.c.getApprovedSmokeTestStatus().status,'uncertain');assert.equal(s.c.sendApprovedSmokeTest().status,'uncertain');assert.equal(s.sent.length,1);}
});
test('corrupt state stops instead of assuming never sent',()=>{const s=setup();s.values.set('SHERRY_APPROVED_MAIL_SMOKE_20261003','bad');assert.throws(()=>s.c.sendApprovedSmokeTest(),/紀錄/);assert.equal(s.sent.length,0);});
