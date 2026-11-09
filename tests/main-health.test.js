const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
const NOW = Date.parse('2026-11-09T14:00:00+08:00');
const admin = {teacherName:'冠蓉',role:'管理員',managementCapabilities:['course_admin','payroll_admin']};
const plain = value => JSON.parse(JSON.stringify(value));
const backupOperation = (suffix, at=NOW) => `main_backup_${at.toString(36)}_${suffix}`;

function fixture() {
  const properties = new Map();
  const c = {console,Date,JSON,Math,String,Number,Object,Array,RegExp,Error,
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
      computeDigest:(_algorithm,input)=>Array.from(crypto.createHash('sha256').update(input).digest()),
      base64Encode:bytes=>Buffer.from(bytes).toString('base64'),
      formatDate(date,_tz,pattern){
        const text=new Date(+date+8*3600000).toISOString();
        if(pattern==='yyyy/MM/dd')return text.slice(0,10).replaceAll('-','/');
        if(pattern==='yyyy-MM-dd')return text.slice(0,10);
        if(pattern==='HH:mm')return text.slice(11,16);
        return text.slice(0,19).replace('T',' ');
      }},
    Session:{getScriptTimeZone:()=> 'Asia/Taipei'},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../Code.gs'),'utf8'),c);
  c.currentTimeMs_=()=>NOW;
  c.getScriptProperties_=()=>({getProperty:key=>properties.get(key)||null,setProperty:(key,value)=>properties.set(key,value)});
  c.withScriptLock_=fn=>fn();
  return {c,properties};
}

test('health telemetry records real success, partial results and exceptions without replacing original outcomes',()=>{
  const {c,properties}=fixture();
  const result={count:4};
  assert.equal(c.runMainObservedOperation_('course_sync',()=>result),result);
  let state=JSON.parse(properties.get('MAIN_HEALTH_course_sync'));
  assert.equal(state.status,'healthy');assert.equal(state.lastSuccessMs,NOW);
  c.currentTimeMs_=()=>NOW+60000;
  assert.deepEqual(plain(c.runMainObservedOperation_('course_sync',()=>({failedCount:1}))),{failedCount:1});
  state=JSON.parse(properties.get('MAIN_HEALTH_course_sync'));
  assert.equal(state.status,'warning');assert.equal(state.lastSuccessMs,NOW);
  const error=new Error('OB HTTP 503');
  assert.throws(()=>c.runMainObservedOperation_('course_sync',()=>{throw error;}),value=>value===error);
  state=JSON.parse(properties.get('MAIN_HEALTH_course_sync'));
  assert.equal(state.status,'failed');assert.equal(state.lastSuccessMs,NOW);assert.match(state.error,/503/);
  c.getScriptProperties_=()=>({getProperty(){throw Error('metadata down');}});
  assert.equal(c.runMainObservedOperation_('course_sync',()=>result),result);
});

test('existing scheduler, course sync, practice and invoice executions are observed without adding triggers',()=>{
  const {c}=fixture(),observed=[];
  const runPractice=c.runHourlyPracticeReconciliationIfDue_;
  c.runMainObservedOperation_=(key,fn)=>{observed.push(key);return fn();};
  c.drainCourseClosureLineCopySafely_=()=>{};c.monitorCourseClosureLineDeliverySafely_=()=>{};
  c.runScheduledNotifications_=()=>({sentCount:0,failedCount:0});
  c.runMonthlyDiscountRecommendationScheduler_=()=>({skipped:true});
  c.runHourlyPracticeReconciliationIfDue_=()=>({skipped:true});
  c.SpreadsheetApp={getActiveSpreadsheet:()=>({})};
  c.ensureCourseClosureStructureUnlocked_=()=>{};c.requireSheet_=()=>({});
  c.getCourseClosureSettingsUnlocked_=()=>({automatic:false});
  assert.equal(c.runCourseClosureScheduler().reason,'manual');
  c.reconcileRentalWaitlist_=()=>({});c.runScheduledPracticeReconciliation=()=>({});
  c.runHourlyPracticeReconciliationIfDue_=runPractice;
  c.runHourlyPracticeReconciliationIfDue_();
  c.syncInvoicePurchasesForActor_=()=>({count:1});c.runScheduledInvoiceSync();
  assert.ok(observed.includes('scheduler'));assert.ok(observed.includes('practice_reconciliation'));assert.ok(observed.includes('invoice_sync'));
  const source=fs.readFileSync(path.join(__dirname,'../Code.gs'),'utf8');
  const start=source.indexOf('function syncCourseListFromApiForSession_(');
  const end=source.indexOf('\nfunction ',start+20);
  assert.match(source.slice(start,end),/runMainObservedOperation_\('course_sync'/);
});

test('health telemetry never releases an already-held business lock or overwrites a newer run failure',()=>{
  const {c,properties}=fixture();let released=0;
  c.LockService={getScriptLock:()=>({hasLock:()=>true,releaseLock(){released++;}})};
  assert.equal(c.runMainObservedOperation_('scheduler',()=>3),3);
  assert.equal(released,0);assert.equal(properties.size,0);
  c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};
  c.runMainObservedOperation_('scheduler',()=>{
    c.currentTimeMs_=()=>NOW+1000;
    c.runMainObservedOperation_('scheduler',()=>({failedCount:1}));
    return {};
  });
  assert.equal(JSON.parse(properties.get('MAIN_HEALTH_scheduler')).status,'warning');
});

test('numeric failures, rate-limit pauses and snapshot fallbacks never count as healthy sync success',()=>{
  const {c,properties}=fixture();
  for(const result of [{failed:1},{courseSource:'snapshot'},
    {status:'paused',reason:'rate_limited'},{rentals:{stoppedByRateLimit:true}}]) {
    c.runMainObservedOperation_('practice_reconciliation',()=>result);
    const state=JSON.parse(properties.get('MAIN_HEALTH_practice_reconciliation'));
    assert.equal(state.status,'warning');assert.equal(state.lastSuccessMs,0);
  }
});

test('health distinguishes absent, stale, running, failed and future evidence with no Sheet writes',()=>{
  const {c,properties}=fixture();
  c.getMainNotificationTracking_=()=>[];
  const ss={getSheetByName:()=>null,insertSheet(){assert.fail('dashboard cannot create tables');}};
  let health=c.getMainSystemHealth_(admin,ss,[]);
  assert.equal(health.checks.find(item=>item.key==='scheduler').status,'unknown');
  assert.equal(health.backup.status,'not_configured');
  for(const [key,state]of Object.entries({
    scheduler:{status:'healthy',lastAttemptMs:NOW-20*60000,lastSuccessMs:NOW-20*60000},
    course_sync:{status:'failed',lastAttemptMs:NOW-60000,lastSuccessMs:NOW-3600000,error:'連線失敗'},
    practice_reconciliation:{status:'running',lastAttemptMs:NOW-1000},
    invoice_sync:{status:'healthy',lastAttemptMs:NOW+3600000,lastSuccessMs:NOW+3600000}
  }))properties.set('MAIN_HEALTH_'+key,JSON.stringify(state));
  health=c.getMainSystemHealth_(admin,ss,[]);
  const byKey=Object.fromEntries(health.checks.map(item=>[item.key,item]));
  assert.equal(byKey.scheduler.status,'stale');assert.equal(byKey.course_sync.status,'failed');
  assert.equal(byKey.practice_reconciliation.status,'running');assert.equal(byKey.invoice_sync.status,'unknown');
  assert.ok(byKey.course_sync.lastSuccessAt);assert.equal(properties.size,4);
  assert.throws(()=>c.getMainSystemHealth_({teacherName:'甲',role:'老師',managementCapabilities:[]},ss,[]),/權限/);
});

test('notification backlog counts exact channel evidence and never treats inbox unread as push failure',()=>{
  const {c,properties}=fixture();
  c.getMainNotificationTracking_=()=>[
    {inbox:{read:0,recipients:4},push:{status:'accepted'}},
    {push:{status:'unknown'}},{push:{status:'failed'}},{push:{status:'not_sent'}}
  ];
  properties.set('CLOSURE_LINE_PENDING',JSON.stringify({status:'pending',targetDate:'2026/11/10'}));
  const health=c.getMainSystemHealth_(admin,{getSheetByName:()=>({})},[]);
  assert.equal(health.notifications.queued,1);assert.equal(health.notifications.failed,2);
  assert.equal(health.notifications.unknown,1);assert.match(health.notifications.detail,/100/);
});

test('accepted LINE delivery clears the current queue count and corrupt queue evidence is not healthy',()=>{
  const {c,properties}=fixture();c.getMainNotificationTracking_=()=>[];
  const ss={getSheetByName:()=>({})};
  properties.set('CLOSURE_LINE_PENDING',JSON.stringify({status:'queued',payload:{targetDate:'2026/11/10'},expires:NOW+3600000}));
  properties.set('MAIN_LINE_DELIVERY_STATUS',JSON.stringify({status:'accepted',targetDate:'2026/11/10'}));
  assert.equal(c.getMainSystemHealth_(admin,ss,[]).notifications.queued,0);
  properties.set('CLOSURE_LINE_PENDING','invalid JSON');
  assert.equal(c.getMainSystemHealth_(admin,ss,[]).notifications.status,'unknown');
});

function books(c,options={}) {
  const copies=[];
  const data=[{name:'CourseList',values:[['ID','點數'],['c1',2]],formulas:[['',''],['','']]},
    {name:'薪資',hidden:true,values:[['姓名','金額'],['Josty Lin',1000]],formulas:[['',''],['','=500*2']]}];
  function book(id,rows=data) {
    return {getId:()=>id,getName:()=> '主系統',getSheetByName:()=>null,
      getSheets:()=>rows.map(sheet=>({getName:()=>sheet.name,isSheetHidden:()=>!!sheet.hidden,
        getDataRange:()=>({getValues:()=>sheet.values,getFormulas:()=>sheet.formulas,
          getNumRows:()=>sheet.values.length,getNumColumns:()=>sheet.values[0].length})})),
      copy(name){
        copies.push({from:id,name});
        if(options.throwAt===copies.length)throw Error('copy timeout');
        const next=JSON.parse(JSON.stringify(rows));
        if(options.mismatchAt===copies.length)next[0].values[1][1]=9;
        if(options.formulaMismatchAt===copies.length)next[1].formulas[1][1]='=250*4';
        return book(options.sameIdAt===copies.length ? id : 'copy'+copies.length,next);
      },
      setValues(){assert.fail('source cannot be modified');},deleteSheet(){assert.fail('no deletion');}
    };
  }
  const source=book('production');
  c.SpreadsheetApp={getActiveSpreadsheet:()=>source};
  return {source,copies,book};
}

test('backup creates and verifies separate backup plus restore-rehearsal copies, preserves formulas and is idempotent',()=>{
  const {c,properties}=fixture();const {copies}=books(c);
  const first=c.createMainBackup_(admin,backupOperation('operation-0001'));
  assert.equal(first.status,'verified');assert.equal(first.backupId,'copy1');assert.equal(first.rehearsalId,'copy2');
  assert.equal(first.sheetCount,2);assert.equal(first.cellCount,8);assert.ok(first.lastSuccessAt);
  assert.deepEqual(copies.map(item=>item.from),['production','copy1']);
  assert.equal(c.createMainBackup_(admin,backupOperation('operation-0001')).status,'verified');assert.equal(copies.length,2);
  assert.throws(()=>c.createMainBackup_(admin,backupOperation('operation-0002')),/今天|當日/);
  assert.equal(properties.size,1);
  assert.ok(!JSON.stringify(first).includes('Josty Lin'));assert.ok(!JSON.stringify(first).includes('=500'));
});

test('slow backup copies do not hold the business mutation lock',()=>{
  const {c}=fixture();const {source}=books(c);let locked=false;
  c.withScriptLock_=fn=>{assert.equal(locked,false);locked=true;try{return fn();}finally{locked=false;}};
  const copy=source.copy;
  source.copy=function(name){assert.equal(locked,false,'backup copy must not block course closure');return copy.call(this,name);};
  assert.equal(c.createMainBackup_(admin,backupOperation('operation-0001')).status,'verified');
});

test('backup baseline is read under the business lock so it cannot capture half of an application transaction',()=>{
  const {c}=fixture();const {source}=books(c);let locked=false;
  c.withScriptLock_=fn=>{assert.equal(locked,false);locked=true;try{return fn();}finally{locked=false;}};
  const getSheets=source.getSheets;
  source.getSheets=()=>{assert.equal(locked,true,'baseline must not race multi-table mutations');return getSheets();};
  assert.equal(c.createMainBackup_(admin,backupOperation('operation-0001')).status,'verified');
});

test('backup requires true admin plus both capabilities and rejects impersonation before any copy',()=>{
  const {c}=fixture();const {copies}=books(c);
  for(const session of [
    {...admin,role:'老師'}, {...admin,managementCapabilities:['course_admin']},
    {...admin,impersonatedBy:'甲'}, {...admin,readOnly:true}
  ])assert.throws(()=>c.createMainBackup_(session,backupOperation('operation-0001')),/權限|本人|唯讀|管理員/);
  assert.throws(()=>c.createMainBackup_(admin,'short'),/編號|格式/);assert.equal(copies.length,0);
});

test('backup detects data/formula mismatches and source-ID reuse rather than claiming a successful rehearsal',()=>{
  for(const options of [{mismatchAt:1},{formulaMismatchAt:2},{sameIdAt:1},{sameIdAt:2}]) {
    const {c}=fixture();const {copies}=books(c,options);
    const result=c.createMainBackup_(admin,backupOperation('operation-0001'));
    assert.notEqual(result.status,'verified');assert.equal(result.lastSuccessAt,'');assert.ok(result.error);
    assert.ok(copies.length<=2);
  }
});

test('unknown copy outcome is retained and is not copied again, even with a new operation ID',()=>{
  const {c}=fixture();const {copies}=books(c,{throwAt:1});
  const result=c.createMainBackup_(admin,backupOperation('operation-0001'));
  assert.equal(result.status,'unknown');assert.equal(copies.length,1);
  assert.equal(c.createMainBackup_(admin,backupOperation('operation-0001')).status,'unknown');
  assert.throws(()=>c.createMainBackup_(admin,backupOperation('operation-0002')),/待確認|不明/);
  assert.equal(copies.length,1);
});

test('health redacts backup file IDs for course-only users and never returns cell content or credentials',()=>{
  const {c}=fixture();books(c);c.createMainBackup_(admin,backupOperation('operation-0001'));
  c.getMainNotificationTracking_=()=>[];
  const ss={getSheetByName:()=>null};
  const health=c.getMainSystemHealth_({...admin,role:'老師',managementCapabilities:['course_admin']},ss,[]);
  assert.equal(health.backupAllowed,false);assert.equal(health.backup.backupId,undefined);
  assert.equal(health.backup.rehearsalId,undefined);assert.equal(health.backup.status,'verified');
});

test('a pre-copy read failure permits an explicit new attempt without allowing unknown-copy retries',()=>{
  const {c}=fixture();const {source,copies}=books(c);const getSheets=source.getSheets;
  source.getSheets=()=>{throw Error('temporary read failure');};
  const failed=c.createMainBackup_(admin,backupOperation('operation-0001'));
  assert.equal(failed.status,'failed');assert.equal(failed.retryable,true);assert.equal(copies.length,0);
  source.getSheets=getSheets;
  assert.equal(c.createMainBackup_(admin,backupOperation('operation-0002')).status,'verified');assert.equal(copies.length,2);
});

test('replaying a retired backup ID on a later day cannot create more copies',()=>{
  const {c}=fixture();const {copies}=books(c);let now=NOW;c.currentTimeMs_=()=>now;
  const firstId=backupOperation('operation-0001',now);
  assert.equal(c.createMainBackup_(admin,firstId).status,'verified');
  now+=86400000;
  assert.equal(c.createMainBackup_(admin,backupOperation('operation-0002',now)).status,'verified');
  now+=86400000;
  assert.throws(()=>c.createMainBackup_(admin,firstId),/過期|跨日|當日/);assert.equal(copies.length,4);
});
