const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {setup,admin}=require('./helpers/raffle-mail-fixture');
const work=path.join(__dirname,'..');
function ui(){const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(work,'raffle.js'),'utf8'),c);return c.SherryRaffle;}
test('reconciliation guidance distinguishes accepted LINE, unknown LINE, fallback and legacy email',()=>{
 const f=ui().renderReconcileGuidance;
 assert.match(f({deliveryMode:'line-first',channels:{line:{status:'sent'}}}),/不需要.*OB.*Email/);
 assert.match(f({deliveryMode:'line-first',channels:{line:{status:'uncertain'}}}),/查回 LINE/);
 assert.doesNotMatch(f({deliveryMode:'line-first',channels:{line:{status:'uncertain'}}}),/兩個管道都已/);
 assert.match(f({deliveryMode:'line-first',channels:{line:{status:'unbound'}}}),/OB.*Email.*都/);
 assert.match(f({}),/Email/);
});
test('dashboard distinguishes idle tick from real source completion and missing receipt from zero exceptions',()=>{
 const data={ok:true,phase:'upcoming',startsAt:Date.parse('2026-11-15T00:00:00+08:00'),checkedAt:Date.parse('2026-10-31T10:00:00+08:00'),activityRepliesPaused:true,readyLineEnabled:true,readyTestOnly:false,imageTextEnabled:true,tasks:[{id:'sync',state:'idle',lastTickAt:1},{id:'identity',state:'missing',stale:true}],sources:{purchases:{lastCompletedAt:null,pending:0,blocked:0},classes:{lastCompletedAt:null,pending:0,blocked:0}},queues:{intakes:[{kind:'photo',state:'manual',count:2,oldestAt:1}],purchases:[],identity:[],identityDelivery:[],ready:[],line:[]},classroom:{lineFirst:true,testOnly:false,lastStockSyncAt:null,mail:{queued:0,uncertain:1}}};
 const s=ui().renderOperations(data);assert.match(s,/尚未開始/);assert.match(s,/活動回覆.*暫停/);assert.match(s,/尚無完成紀錄/);assert.match(s,/沒有排程回報/);assert.match(s,/照片/);assert.match(s,/人工/);assert.match(s,/待核對/);assert.doesNotMatch(s,/同步成功|全部正常/);
 assert.throws(()=>ui().renderOperations({ok:false}));
});
test('GAS operation bridge denies non-admin before outbound request and only returns aggregates',()=>{
 const s=setup();vm.runInContext(fs.readFileSync(path.join(work,'ActivityOperations.gs'),'utf8'),s.c);
 let calls=0;s.c.UrlFetchApp={fetch(){calls++;throw Error('offline')}};
 assert.throws(()=>s.c.getActivityOperations_({teacherName:'老師',managementCapabilities:['raffle_fulfillment']}),/權限/);assert.equal(calls,0);
 s.props.set('PRODUCTION_TASK_APP_SECRET','k'.repeat(40));s.c.ScriptApp={getScriptId:()=> '16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW'};
 assert.throws(()=>s.c.getActivityOperations_(admin),/暫時無法/);assert.equal(calls,1);assert.equal(s.mails.length,0);
});
test('general-ready setup changes only feature switches, is idempotent, and closes obsolete self-test',()=>{
 const s=setup();vm.runInContext(fs.readFileSync(path.join(work,'ActivityOperations.gs'),'utf8'),s.c);
 const p={getProperty:k=>s.props.get(k)||null,setProperties:o=>Object.entries(o).forEach(([k,v])=>s.props.set(k,v))};s.c.PropertiesService.getScriptProperties=()=>p;
 s.c.ScriptApp={getScriptId:()=> '16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW'};
 s.props.set('PRODUCTION_TASK_APP_SECRET','k'.repeat(40));s.props.set('UNRELATED','keep');
 s.c.enableGeneralReadyAndOperations20261031();const first=JSON.stringify([...s.props]);s.c.enableGeneralReadyAndOperations20261031();assert.equal(JSON.stringify([...s.props]),first);
 assert.equal(s.props.get('RAFFLE_READY_LINE_FIRST_ENABLED'),'true');assert.equal(s.props.get('RAFFLE_READY_LINE_FIRST_TEST_ONLY'),'false');assert.equal(s.props.get('UNRELATED'),'keep');assert.equal(s.c.raffleReadyLineTestAvailable_({teacherName:'冠蓉',managementCapabilities:['raffle_admin']}),false);assert.equal(s.mails.length,0);
});
