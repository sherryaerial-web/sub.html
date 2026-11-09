const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const NOW = Date.parse('2026-11-09T21:00:00+08:00');
function fixture() {
  const cache = new Map();
  const c = { console, Date, JSON, Math, String, Number, Object, Array, RegExp, Error,
    Utilities: { formatDate(d, tz, pattern) {
      const s = new Date(+d + 8 * 3600000).toISOString();
      return pattern === 'yyyy/MM/dd' ? s.slice(0,10).replaceAll('-', '/') :
        pattern === 'yyyy-MM-dd' ? s.slice(0,10) : pattern === 'HH:mm' ? s.slice(11,16) : s.slice(0,19).replace('T',' ');
    } },
    Session: { getScriptTimeZone: () => 'Asia/Taipei' },
    CacheService: { getScriptCache: () => ({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v)}) }
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../Code.gs'), 'utf8'), c);
  c.currentTimeMs_ = () => NOW;
  return { c, cache };
}
const plain = v => JSON.parse(JSON.stringify(v));
const course = (overrides = {}) => ({ calendarId:'53872', date:'2026/11/10', time:'12:00',
  courseName:'D－柔軟度開發〈優惠〉', teacherName:'番茄', points:2, enrollmentCount:1, cancelled:false, ...overrides });

test('main rule catalogue uses the actual evaluator and does not expose payroll amounts', () => {
  const {c}=fixture(); const catalog=c.getMainRuleCatalogue_();
  assert.ok(catalog.version); assert.ok(catalog.history.length);
  assert.equal(catalog.rules.find(r=>r.key==='discount-two-point-floor').minimumEnrollment,3);
  assert.equal(catalog.rules.find(r=>r.key==='discount-original-minimum').minimumEnrollment,2);
  assert.equal(catalog.rules.find(r=>r.key==='pair').minimumEnrollment,4);
  assert.equal(catalog.rules.find(r=>r.key==='venue-rental-excluded').minimumEnrollment,null);
  assert.ok(!JSON.stringify(catalog).includes('薪項設定'));
});

test('Xiaomei public classes use two students from Nov9 regardless of points, discounts or duet name', () => {
  const {c}=fixture();
  for (const teacherName of ['小美','Josty Lin']) {
    for (const courseName of ['A－空環','D－柔軟度開發〈優惠〉','A－空瑜〈優惠〉','A－雙人特別課']) {
      for (const points of [2,4]) {
        const data=course({teacherName,courseName,points,date:'2026/11/09'});
        const rule=c.getCourseClosureRule_(data,'23:40');
        assert.equal(rule.minimumEnrollment,2,`${teacherName} ${courseName} ${points}`);
        assert.equal(rule.ruleKey,'xiaomei-two-students-20261109');
        assert.equal(rule.eligible,true);
        assert.equal(c.getCourseClosureRule_({...data,enrollmentCount:2},'23:40').eligible,false);
      }
    }
  }
  assert.equal(c.getCourseClosureRule_(course({teacherName:'舊 OB 名稱',canonicalTeacherName:'Josty Lin'}),'23:40').minimumEnrollment,2);
  assert.equal(c.getCourseClosureRule_(course({teacherName:'小美',date:'2026-11-09'}),'23:40').minimumEnrollment,2);
});

test('Xiaomei effective-date rule preserves historical thresholds, exclusions, data guards and zero-only early closure', () => {
  const {c}=fixture();
  assert.equal(c.getCourseClosureRule_(course({teacherName:'小美',date:'2026/11/08'}),'23:40').minimumEnrollment,3);
  assert.equal(c.getCourseClosureRule_(course({teacherName:'小美',date:'2026/11/08',courseName:'A－雙人特別課'}),'23:40').minimumEnrollment,4);
  assert.equal(c.getCourseClosureRule_(course({teacherName:'Jina'}),'23:40').minimumEnrollment,3);
  assert.equal(c.getCourseClosureRule_(course({teacherName:'小美助手'}),'23:40').minimumEnrollment,3);
  for(const name of ['A－場地租借','A－私人包班']) assert.equal(c.getCourseClosureRule_(course({teacherName:'小美',courseName:name}),'23:40').minimumEnrollment,null);
  for(const input of [{points:null},{date:'2026/02/30'},{date:'錯誤日期'},{identityError:'身分衝突'}]) {
    const rule=c.getCourseClosureRule_(course({teacherName:'小美',...input}),'23:40');
    assert.equal(rule.manualReview,true); assert.equal(rule.eligible,false);
  }
  assert.equal(c.getCourseClosureRule_(course({teacherName:'小美'}),'22:30').eligible,false);
  assert.equal(c.getCourseClosureRule_(course({teacherName:'小美',enrollmentCount:0}),'22:30').eligible,true);
  const catalogue=c.getMainRuleCatalogue_();
  assert.equal(catalogue.rules.find(rule=>rule.key==='xiaomei-two-students-20261109').minimumEnrollment,2);
  assert.ok(catalogue.history.some(item=>/小美/.test(item.change)&&/2 人/.test(item.change)));
});

test('closure normalization blocks ambiguous effective instructors regardless of order but preserves an explicit single substitute',()=>{
  const {c}=fixture();
  const raw={id:12,classTime:'2026-11-09T12:00:00+08:00',class:{id:1,name:'A－空環'},points:4,customersAttending:2};
  for(const instructors of [[{id:1,name:'Jina'},{id:2,name:'小美'}],[{id:2,name:'小美'},{id:1,name:'Jina'}]]) {
    const detail=c.normalizeClosureCalendarDetail_({...raw,instructors});
    const rule=c.getCourseClosureRule_(detail,'23:40');
    assert.equal(rule.manualReview,true);assert.equal(rule.eligible,false);
    for(const links of [{names:{},conflicts:{}},{names:{'1':'Jina','2':'Josty Lin'},conflicts:{}}]) {
      const mapped=c.applyMainClosureIdentity_({...detail},links);
      const applied=c.getCourseClosureRule_(mapped,'23:40');
      assert.equal(applied.manualReview,true);assert.equal(applied.eligible,false);
    }
  }
  const substituted=c.normalizeClosureCalendarDetail_({...raw,instructors:[{id:1,name:'Jina'},{id:2,name:'小美',isSubstitute:true}]});
  assert.equal(c.getCourseClosureRule_(substituted,'23:40').minimumEnrollment,2);
});

test('closure assessment shows exact rule, shortage and prior real-course rule impacts, not enrollment-only changes', () => {
  const {c}=fixture();
  const before={items:[{calendarId:'53872',minimumEnrollment:2,ruleKey:'discount-original-minimum'}]};
  const result=c.buildCourseClosureAssessment_('2026/11/10',[course(),course({calendarId:'2',enrollmentCount:2}),
    course({calendarId:'3',enrollmentCount:3}),course({calendarId:'0',enrollmentCount:0})],before);
  assert.deepEqual([ '53872','2','3','0' ].map(id=>result.items.find(i=>i.calendarId===id).shortage),[2,1,0,3]);
  assert.equal(result.items.find(i=>i.calendarId==='53872').decision,'未達門檻');
  assert.equal(result.items.find(i=>i.calendarId==='3').decision,'人數已足');
  assert.equal(result.impacts.length,1);
  assert.equal(result.impacts[0].beforeMinimum,2);
  assert.equal(result.impacts[0].afterMinimum,3);
  assert.equal(c.buildCourseClosureAssessment_('2026/11/10',[course()],null).baselineAvailable,false);
});

test('source status treats unknown, mixed, old and future snapshots conservatively', () => {
  const {c}=fixture();
  assert.equal(c.buildMainDataStatus_([],8,'course_snapshot').status,'unknown');
  assert.equal(c.buildMainDataStatus_([['2026-11-09 22:00:00']],0,'course_snapshot').status,'unknown');
  const status=c.buildMainDataStatus_([['2026-11-09 20:50:00'],['2026-11-09 17:00:00']],0,'course_snapshot');
  assert.equal(status.status,'stale'); assert.equal(status.mixed,true);
  assert.equal(status.oldestAt,'2026-11-09 17:00:00');
  assert.equal(c.buildMainDataStatus_([['']],0,'payroll_snapshot').status,'unknown');
});

test('closure background assessment is read-only, cached and marks previous data stale after safe read failure', () => {
  const {c}=fixture();let reads=0;
  c.getTomorrowDate_=()=> '2026/11/10'; c.getScriptProperties_=()=>({getProperty:()=> 'token'});
  c.fetchCalendarPages_=()=>{reads++;return [course()];}; c.normalizeClosureCalendarDetail_=v=>v;
  c.cancelObCalendarItem_=()=>assert.fail('read-only assessment cannot cancel');
  const first=c.getCourseClosureAssessment_(); assert.equal(first.dataStatus.status,'live');
  assert.equal(c.getCourseClosureAssessment_().dataStatus.status,'cached');assert.equal(reads,1);
  c.currentTimeMs_=()=> NOW+301000;
  c.fetchCalendarPages_=()=>{reads++;throw Error('HTTP 503');};
  const failed=c.getCourseClosureAssessment_();
  assert.equal(failed.dataStatus.status,'stale');assert.equal(failed.items.length,1);
  assert.equal(failed.verified,false);assert.equal(reads,3);
  assert.equal(c.getCourseClosureAssessment_().verified,false);assert.equal(reads,3,'failed checks retain the bounded retry cooldown');
});

test('a changed rule version invalidates a fresh assessment while retaining its real-course impact baseline',()=>{
  const {c,cache}=fixture();let reads=0;
  cache.set('main_closure_assessment_20261110',JSON.stringify({targetDate:'2026/11/10',ruleVersion:'old-version',
    checkedAtMs:NOW,observedAt:'2026-11-09 20:59:00',verified:true,dataStatus:{status:'live'},
    items:[{calendarId:'53872',minimumEnrollment:3,ruleKey:'teacher-or-two-points',ruleLabel:'原門檻'}]}));
  c.getTomorrowDate_=()=> '2026/11/10';c.getScriptProperties_=()=>({getProperty:()=> 'token'});
  c.fetchCalendarPages_=()=>{reads++;return [course({teacherName:'小美'})];};c.normalizeClosureCalendarDetail_=v=>v;
  const result=c.getCourseClosureAssessment_();
  assert.equal(reads,1);assert.equal(result.items[0].minimumEnrollment,2);
  assert.equal(result.impacts[0].beforeMinimum,3);assert.equal(result.impacts[0].afterMinimum,2);
});

test('safe read retries are bounded and do not retry authentication, rate-limit or arbitrary writes', () => {
  const {c}=fixture();let n=0;
  assert.equal(c.readMainObSafely_(()=>{if(++n===1)throw Error('HTTP 503');return 4;}),4);
  assert.equal(n,2);
  for(const message of ['HTTP 401','HTTP 403','HTTP 429']) {
    n=0;assert.throws(()=>c.readMainObSafely_(()=>{n++;throw Error(message);}),Error);assert.equal(n,1);
  }
});

function line(version,id,teacher,amount,overrides={}) {
  const row=['2026-11',id,version,'cal1',teacher,'2026/11/10','12:00','柔軟度','鐘點',2,3000,'鐘點','每小時1000',amount,0,'','草稿','2026-11-09 21:00:00'];
  for(const [key,value]of Object.entries(overrides))row[Number(key)]=value;
  return row;
}
function summary(version,teacher,total,overrides={}) {
  const row=['2026-11',teacher,total,0,0,0,total,0,version,'草稿','','2026-11-09 21:00:00',0,'','','',0,'',''];
  for(const [key,value]of Object.entries(overrides))row[Number(key)]=value;
  return row;
}
test('payroll difference compares semantic course/teacher keys and captures same-total input changes and transfers', () => {
  const {c}=fixture();
  const rows=[line('v1','old-id','甲',1000),line('v2','new-id','甲',1000,{9:3,12:'每小時1000，新規則'})];
  const sums=[summary('v1','甲',1000),summary('v2','甲',1000)];
  const result=c.buildPayrollVersionDiff_('2026-11','v2',rows,sums);
  assert.equal(result.baselineVersion,'v1');assert.equal(result.items.length,1);
  assert.equal(result.items[0].delta,0);assert.match(result.items[0].reason,/出席人數/);assert.match(result.items[0].reason,/計薪規則/);
  const transferred=c.buildPayrollVersionDiff_('2026-11','v2',[line('v1','1','甲',1000),line('v2','2','乙',1000)],
    [summary('v1','甲',1000),summary('v2','乙',1000)]);
  assert.deepEqual(plain(transferred.items.map(i=>i.change).sort()),['新增','移除']);
  assert.equal(c.buildPayrollVersionDiff_('2026-11','v2',[line('v2','2','乙',1000)],[summary('v2','乙',1000)]).baselineAvailable,false);
});

test('payroll difference includes deduction and bonus differences and never mixes months', () => {
  const {c}=fixture();
  const sums=[summary('v1','甲',1000),summary('v2','甲',950,{16:100,4:50}), ['2026-10','甲',1,0,0,0,1,0,'other']];
  const result=c.buildPayrollVersionDiff_('2026-11','v2',[],sums);
  assert.equal(result.totalDelta,-50);assert.match(result.teachers[0].reason,/單月扣款/);assert.match(result.teachers[0].reason,/獎金/);
});

test('closure core retries only reads, isolates an unverifiable course and still cancels a healthy course once', () => {
  const {c}=fixture();let reads=0, cancelled=0;const logs=[];
  c.PropertiesService={getScriptProperties:()=>({getProperty:()=> 'token'})};
  c.withScriptLock_=fn=>fn();c.SpreadsheetApp={getActiveSpreadsheet:()=>({getSheetByName:()=>null})};
  c.ensureCourseClosureStructureUnlocked_=()=>{};c.requireSheet_=()=>({});c.assertHeaders_=()=>{};
  c.getProcessedClosureKeysUnlocked_=()=>({});c.closureStudentNoticeEnabled_=()=>false;
  c.fetchCalendarPages_=()=>[course(),course({calendarId:'good'})];c.normalizeClosureCalendarDetail_=v=>v;
  c.fetchCalendarDetail_=(_token,id)=>{reads++;if(id==='53872')throw Error('HTTP 503');return course({calendarId:id});};
  c.cancelObCalendarItem_=()=>{cancelled++;return {cancelled:true};};
  c.appendCourseClosureLogUnlocked_=(...args)=>logs.push(args);c.recordMonthlyDiscountClosureObservationsUnlocked_=()=>{};
  const result=c.executeNextDayClosuresCore_('系統','23:40','2026/11/10');
  assert.equal(reads,3);assert.equal(cancelled,1);assert.equal(result.failedCount,1);assert.equal(result.cancelledCount,1);
  assert.equal(logs.length,2);
});

test('unverifiable closure notices include affected course and manual review reason', () => {
  const {c}=fixture();let msg;
  c.getActiveCourseAdminNames_=()=>['冠蓉'];c.buildAppViewUrl_=()=> 'app';
  c.sendPushOnceSafely_=(_key,_names,message)=>{msg=message;return {};};
  c.notifyCourseClosureResult_({targetDate:'2026/11/10',stage:'23:40',manualReviewCount:1,items:[
    {calendarId:'53872',time:'12:00',courseName:'柔軟度',result:'待人工確認',error:'缺少點數'}]});
  assert.match(msg.heading,/待核對/);assert.match(msg.content,/53872/);assert.match(msg.content,/缺少點數/);
});

test('assurance UI adds disclosures and provenance, not a new approval or mutation route', () => {
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const name of ['renderMainDataStatus','renderMainRuleCatalogue','renderClosureAssessment','renderPayrollComparison']) {
    assert.match(html,new RegExp('function '+name+'\\('));
  }
  assert.match(html,/renderMainDataStatus\(data\.dataStatus\)/);
  assert.match(html,/renderPayrollComparison\(data\.comparison\)/);
  assert.doesNotMatch(html,/data-admin-action="(?:approve-assessment|confirm-preview|approve-rules)"/);
});

test('closure guidance defers to the actual priority catalogue rather than a blanket two-point threshold', () => {
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.includes('23:40：依上方規則的最低人數核對'));
  assert.ok(!html.includes('Jina／小美／卡拉／2 點課 2 人以下'));
});
