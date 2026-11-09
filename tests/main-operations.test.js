const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function fixture() {
  const now=Date.parse('2026-11-09T12:00:00+08:00');
  const c={console,Date,JSON,Math,String,Number,Object,Array,RegExp,Error,
    Session:{getScriptTimeZone:()=> 'Asia/Taipei'},
    Utilities:{formatDate(d,_tz,p){const s=new Date(+d+28800000).toISOString();return p==='yyyy/MM/dd'?s.slice(0,10).replaceAll('-','/'):p==='HH:mm'?s.slice(11,16):s.slice(0,19).replace('T',' ');}}};
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../Code.gs'),'utf8'),c);
  c.currentTimeMs_=()=>now;return c;
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('task ordering prioritizes overdue followups and near classes with stable target links',()=>{
  const c=fixture();
  const tasks=c.buildMainTaskQueue_([
    {key:'a',targetId:'a',date:'2026/11/10',time:'12:00',courseName:'明天課',resolved:false,tab:'exceptions',tracking:{}},
    {key:'b',targetId:'b',date:'2026/11/20',time:'12:00',courseName:'追蹤課',resolved:false,tab:'obWork',tracking:{followAt:'2026-11-09 10:00:00',owner:'Tako'}},
    {key:'c',targetId:'c',date:'2026/11/09',time:'13:00',courseName:'今日課',resolved:false,tab:'obWork',tracking:{}},
    {key:'d',resolved:true,tracking:{status:'已結案'}}
  ]);
  assert.deepEqual(plain(tasks.map(t=>t.key)),['b','c','a']);assert.equal(tasks[0].urgency,'已逾期');
  assert.equal(tasks[0].owner,'Tako');assert.equal(tasks[1].urgency,'即將上課');assert.equal(tasks[0].tab,'obWork');
});
test('notification tracking correlates exact message ids, preserves unknown historical delivery and separates read from push accepted',()=>{
  const c=fixture();
  const result=c.buildMainNotificationTracking_([
    ['m1','event1','管理','提醒','text','','1','2026-11-09 10:00:00','系統'],
    ['m2','event2','管理','提醒','text','','2','2026-11-09 10:01:00','系統']],
    [['r','m1','Tako','已讀','2026-11-09 10:05:00',''],['r2','m1','冠蓉','未讀','','']],
    [['2026-11-09 10:00:00','系統','通知傳送結果','m1','','accepted',JSON.stringify({eventKey:'event1',status:'accepted',detail:'提供者已接受'})]],null);
  const one=result.find(r=>r.eventKey==='event1'),two=result.find(r=>r.eventKey==='event2');
  assert.equal(one.inbox.read,1);assert.equal(one.inbox.recipients,2);assert.equal(one.push.status,'accepted');
  assert.equal(two.push.status,'unknown');assert.equal(one.line.status,'not_applicable');
});
test('course history links replacement course ids and hides every payroll event from course-only admins',()=>{
  const c=fixture();
  c.assertCapabilitySession_=()=> '冠蓉';c.getSessionManagementCapabilities_=s=>s.managementCapabilities;
  const leave=Array(31).fill('');Object.assign(leave,{0:'2026-11-01 10:00:00',1:'甲',2:'2026/11/10',3:'12:00',4:'空環',5:'已領取',6:'乙',9:'uuid',10:'123',15:'已核對',20:'456'});
  const sources={};
  sources['請假代課紀錄']=[leave];sources['CourseList']=[['2026/11/10','12:00','空環','乙','456']];
  sources['操作紀錄']=[['2026-11-02 10:00:00','冠蓉','領取代課','uuid','待領取','已領取','']];
  sources['薪資明細']=[['2026-11','l','v','456','乙','2026/11/10','12:00','空環','鐘點',2,0,'','1000',1000,0,'','草稿','2026-11-09 12:00:00']];
  c.readMainOptionalRows_=(_ss,name)=>sources[name]||[];c.SpreadsheetApp={getActiveSpreadsheet:()=>({})};
  const limited=c.getMainCourseHistory_({managementCapabilities:['course_admin']},'123');
  assert.deepEqual(plain(limited.calendarIds.sort()),['123','456']);assert.ok(limited.events.some(e=>e.type==='代課'));
  assert.ok(!JSON.stringify(limited).includes('1000'));assert.equal(limited.payrollVisible,false);
  const full=c.getMainCourseHistory_({managementCapabilities:['course_admin','payroll_admin']},'123');
  assert.ok(full.events.some(e=>e.type==='薪資'));assert.equal(full.payrollVisible,true);
  assert.throws(()=>c.getMainCourseHistory_({managementCapabilities:['course_admin']},'12|456'),/編號/);
});
test('identity mapping is exact-id only and conflicting active ids cannot silently change a rule',()=>{
  const c=fixture();
  const links=c.buildMainTeacherIdentityMap_([
    ['88','Josty Lin','小美','啟用','2026-11-09 10:00:00','冠蓉',1],
    ['99','Jina','甲','啟用','','',1],['99','卡拉','乙','啟用','','',1]]);
  const mapped=c.applyMainClosureIdentity_({teacherId:'88',teacherName:'新暱稱'},links);
  assert.equal(mapped.canonicalTeacherName,'Josty Lin');
  assert.equal(c.applyMainClosureIdentity_({teacherId:'none',teacherName:'Josty'},links).canonicalTeacherName,'');
  assert.ok(c.applyMainClosureIdentity_({teacherId:'99',teacherName:'甲'},links).identityError);
});

test('push evidence records provider acceptance separately from unknown outcome using the inbox message ID',()=>{
  const c=fixture(),events=[];
  c.persistInboxNotificationSafely_=()=>({saved:true,messageId:'message-exact'});
  c.appendNotificationAuditSafely_=e=>events.push(e);
  c.sendPushNotificationSafely_=()=>({attempted:true,accepted:true,messageId:'provider-id'});
  c.sendPushAfterMutationSafely_(['Tako'],{eventKey:'course-event',heading:'通知',content:'內容'});
  assert.equal(events.length,1);assert.equal(events[0].targetId,'message-exact');
  assert.equal(JSON.parse(events[0].reason).status,'accepted');
  c.sendPushNotificationSafely_=()=>({attempted:true,accepted:false,error:'timeout'});
  c.sendPushAfterMutationSafely_(['Tako'],{eventKey:'course-event',heading:'通知',content:'內容'});
  assert.equal(JSON.parse(events[1].reason).status,'unknown');
});

test('course history never includes identity, security or payroll audit payloads for course-only staff',()=>{
  const c=fixture();c.assertCapabilitySession_=()=> '冠蓉';c.getSessionManagementCapabilities_=()=>['course_admin'];
  c.SpreadsheetApp={getActiveSpreadsheet:()=>({})};
  c.readMainOptionalRows_=(_ss,name)=>name==='操作紀錄' ? [
    ['2026-11-09','冠蓉','老師身分對照','123','','private-name','sensitive'],
    ['2026-11-09','冠蓉','薪資確認','123','','1000','sensitive']
  ] : [];
  const result=c.getMainCourseHistory_({},'123');assert.equal(result.events.length,0);
});
