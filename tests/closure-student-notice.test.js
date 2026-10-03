const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(){
 const props=new Map([['OMCEAN_API_TOKEN','fixture'],['COURSE_CLOSURE_STUDENT_OB_ENABLED','true']]);
 const detail={calendarId:'123',date:'2027/01/02',time:'14:00',courseName:'A－空瑜',enrollmentCount:1,cancelled:false,noticeAttendees:[{user:{id:9},cancelPenalty:false}]};
 const events=[],logs=[],messages=[];let locked=false,fail='',failSave=false;
 const store={getProperty:k=>props.get(k)||null,getProperties:()=>Object.fromEntries(props),deleteProperty:k=>{assert.ok(locked);props.delete(k);},setProperty:(k,v)=>{assert.ok(locked);if(failSave&&JSON.parse(v).status==='sent')throw Error('storage failure');props.set(k,v);return store;}};
 const c={console,PropertiesService:{getScriptProperties:()=>store},LockService:{getScriptLock:()=>({waitLock:()=>{locked=true;},releaseLock:()=>{locked=false;}})},SpreadsheetApp:{getActiveSpreadsheet:()=>({})},UrlFetchApp:{fetch:(url,opt)=>{assert.ok(locked);assert.equal(url,'https://api.omceanbooking.com/v1/messages/group');const payload=JSON.parse(opt.payload);assert.equal(JSON.parse(props.get('CLOSURE_STUDENT_OB_123')).status,'sending');assert.ok(events.includes('cancel'));messages.push(payload);events.push('send');if(fail==='send')throw Error('timeout');return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({recipientCount:payload.customerIds.length,messageIds:payload.customerIds.map((_,i)=>100+i)})};}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);
 c.ensureCourseClosureStructureUnlocked_=()=>{};c.requireSheet_=()=>({});c.assertHeaders_=()=>{};c.getProcessedClosureKeysUnlocked_=()=>Object.fromEntries(logs.filter(x=>x[5]==='已取消').map(x=>[x[3].calendarId,true]));
 c.fetchCalendarPages_=()=>detail.cancelled?[]:[{}];c.normalizeClosureCalendarDetail_=()=>({...detail});c.fetchCalendarDetail_=()=>({...detail});
 c.getCourseClosureRule_=d=>({eligible:!d.cancelled,onlyEmpty:false});c.recordMonthlyDiscountClosureObservationsUnlocked_=()=>{};
 c.appendCourseClosureLogUnlocked_=(...args)=>logs.push(args);
 c.cancelObCalendarItem_=(_t,_id,reason)=>{events.push('cancel');if(fail==='cancel')throw Error('cancel failed');detail.cancelled=true;detail.publicNotes=reason;return{cancelled:true};};
 const run=()=>c.executeNextDayClosuresCore_('管理員','23:40','2027/01/02');
 return {c,props,detail,messages,events,run,fail:v=>fail=v,failSave:()=>failSave=true};
}
test('successful closure sends explicit reason after cancellation, scrubs recipients, and never resends',()=>{
 const f=fixture();const r=f.run();assert.equal(r.cancelledCount,1);assert.equal(f.messages.length,1);
 assert.deepEqual(f.messages[0].customerIds,[9]);assert.equal(f.messages[0].pushNotification,true);assert.equal(f.messages[0].lineNotification,false);assert.match(f.messages[0].message,/2027\/01\/02.*14:00.*A－空瑜.*人數不足/);
 const state=JSON.parse(f.props.get('CLOSURE_STUDENT_OB_123'));assert.equal(state.status,'sent');assert.equal(state.customerIds,undefined);assert.equal(state.message,undefined);assert.equal(state.count,1);
 f.run();assert.equal(f.messages.length,1);
});
test('failed cancellation never sends; later confirmed cancellation resumes from snapshot',()=>{
 const f=fixture();f.fail('cancel');assert.equal(f.run().failedCount,1);assert.equal(f.messages.length,0);
 f.detail.cancelled=true;f.detail.publicNotes=f.c.buildCourseClosureReason_(f.detail);f.fail('');f.run();assert.equal(f.messages.length,1);
});
test('unknown delivery is retained for review, never retried, and does not mark closure failed',()=>{
 const f=fixture();f.fail('send');const r=f.run();assert.equal(r.cancelledCount,1);assert.equal(r.failedCount,0);assert.equal(r.studentNoticeWarnings.length,1);
 assert.equal(JSON.parse(f.props.get('CLOSURE_STUDENT_OB_123')).status,'uncertain');assert.deepEqual(JSON.parse(f.props.get('CLOSURE_STUDENT_OB_123')).customerIds,[9]);
 f.run();assert.equal(f.messages.length,1);
});
test('success persistence failure stays sending and cannot resend',()=>{
 const f=fixture();f.failSave();const r=f.run();assert.equal(r.failedCount,0);assert.equal(r.studentNoticeWarnings.length,1);f.run();assert.equal(f.messages.length,1);
});
test('only booked students are notified; duplicates collapse, penalty cancellations and waiting list excluded',()=>{
 const f=fixture();f.detail.noticeAttendees=[{user:{id:9},cancelPenalty:false},{user:{id:9},cancelPenalty:false},{user:{id:10},cancelPenalty:true}];f.detail.enrollmentCount=2;f.run();assert.deepEqual(f.messages[0].customerIds,[9]);
});
test('empty class and disabled feature keep closure behavior with no message or snapshot',()=>{
 const f=fixture();f.detail.enrollmentCount=0;f.detail.noticeAttendees=[];assert.equal(f.run().cancelledCount,1);assert.equal(f.messages.length,0);assert.equal(f.props.has('CLOSURE_STUDENT_OB_123'),false);
 const g=fixture();g.props.delete('COURSE_CLOSURE_STUDENT_OB_ENABLED');assert.equal(g.run().cancelledCount,1);assert.equal(g.messages.length,0);
});
test('missing or invalid roster stops before cancel rather than losing recipients',()=>{
 for(const attendees of [undefined,[{user:{id:0},cancelPenalty:false}],[{user:{id:9}}]]){const f=fixture();f.detail.noticeAttendees=attendees;assert.equal(f.run().failedCount,1);assert.deepEqual(f.events,[]);}
});
test('a student who cancels after failed closure does not receive stale reason notice',()=>{
 const f=fixture();f.fail('cancel');f.run();f.fail('');f.detail.enrollmentCount=0;f.detail.noticeAttendees=[];f.run();assert.equal(f.messages.length,0);assert.equal(f.props.has('CLOSURE_STUDENT_OB_123'),false);
});
test('manual cancellation with another reason is not mistaken for our interrupted closure',()=>{
 const f=fixture();f.fail('cancel');f.run();f.detail.cancelled=true;f.detail.publicNotes='老師身體不適';f.fail('');const r=f.run();assert.equal(f.messages.length,0);assert.equal(r.studentNoticeWarnings.length,1);
});
test('student-notice review alert has a different dedupe key from successful closure',()=>{
 const f=fixture(),keys=[];f.c.getActiveCourseAdminNames_=()=>['管理員'];f.c.buildAppViewUrl_=()=>'/';f.c.sendPushOnceSafely_=(key,_teachers,message)=>{keys.push(key);return message;};
 const result={targetDate:'2027/01/02',stage:'23:40',cancelledCount:1,items:[]};f.c.notifyCourseClosureResult_(result);
 const message=f.c.notifyCourseClosureResult_({...result,studentNoticeWarnings:['課程 123：發送結果待核對']});assert.notEqual(keys[0],keys[1]);assert.match(message.content,/發送結果待核對/);
});
test('resuming a saved cancelled state rechecks live status and reason before sending',()=>{
 for(const closed of [false,true]){
  const f=fixture();f.fail('cancel');f.run();const key='CLOSURE_STUDENT_OB_123',item=JSON.parse(f.props.get(key));item.status='cancelled';f.props.set(key,JSON.stringify(item));
  f.detail.cancelled=closed;f.detail.publicNotes='管理員更改了取消原因';f.c.fetchCalendarPages_=()=>[];
  const r=f.run();assert.equal(f.messages.length,0);assert.equal(r.studentNoticeWarnings.length,1);assert.equal(JSON.parse(f.props.get(key)).status,'cancelled');
 }
});
