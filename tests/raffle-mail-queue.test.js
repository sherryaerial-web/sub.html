const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const admin={teacherName:'店長',managementCapabilities:['raffle_admin']},teacher={teacherName:'老師',managementCapabilities:[]};
const campaign={id:'future',name:'新活動',sourceSpreadsheetId:'future-source-1234567890',websiteUrl:'https://example.com/raffle'};
const headers=['OB email名稱','OB名字','驗證碼','API購課ID','是否已使用(Yes/空白)','寄送e-mail(Yes/空格)','寄送日期'];
function setup(count=1){
 const props=new Map([['RAFFLE_ENABLED','true'],['RAFFLE_WRITES_ENABLED','true'],['RAFFLE_MAIL_QUEUE_ENABLED','true'],['RAFFLE_CAMPAIGNS_JSON',JSON.stringify([campaign])]]);
 const rows=[headers,...Array.from({length:count},(_,i)=>['student'+i+'@example.com','學生','CODE-'+i,'purchase-'+i,'','',''])],tables=new Map(),pending=[];
 let locked=false,writes=0,timeout=false,flushFail=false;
 const sheet=data=>({data,getLastRow:()=>data.length,getLastColumn:()=>Math.max(0,...data.map(r=>r.length)),getMaxRows:()=>10000,getRange:(r,c,n=1,m=1)=>({getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>String(data[r-1+i]?.[c-1+j]??''))),setValues:values=>{assert.ok(locked);writes++;pending.push(()=>values.forEach((line,i)=>{data[r-1+i]||=[];line.forEach((v,j)=>{data[r-1+i][c-1+j]=v;});}));if(timeout&&r>1){timeout=false;throw Error('timeout');}}})});
 const book={getSheetByName:n=>tables.get(n)||null,insertSheet:n=>{assert.ok(locked);assert.equal(n,'RaffleMailJournal');const s=sheet([]);tables.set(n,s);return s;}};
 const c={Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()]},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null})},LockService:{getScriptLock:()=>({waitLock:()=>{assert.equal(locked,false);locked=true;},releaseLock:()=>{assert.equal(pending.length,0);locked=false;}})},SpreadsheetApp:{getActiveSpreadsheet:()=>book,openById:id=>{assert.equal(id,campaign.sourceSpreadsheetId);return{getSheetByName:n=>{assert.equal(n,'抽獎名單');return sheet(rows);}};},flush:()=>{assert.ok(locked);pending.splice(0).forEach(f=>f());if(flushFail){flushFail=false;throw Error('flush uncertain');}}},MailApp:{sendEmail:()=>assert.fail('must never send')}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);
 const preview=()=>c.previewRaffleInvitations_(admin,'future');
 const operation=()=>({campaignId:'future',previewToken:preview().previewToken,requestId:'request-queue-00001'});
 return{c,props,rows,tables,preview,operation,writes:()=>writes,timeout:()=>{timeout=true;},flushFail:()=>{flushFail=true;}};
}
test('explicit queue reserves at most five emails and preserves source; new preview excludes reservations',()=>{
 const s=setup(7),before=JSON.stringify(s.rows),p=s.preview();assert.equal(p.deliveryChecked,true);assert.equal(p.sendEnabled,false);assert.equal(p.batchCount,5);assert.equal(s.writes(),0);
 const op=s.operation(),r=s.c.confirmRaffleInvitations_(admin,op);assert.equal(r.queued,5);assert.equal(r.remaining,2);assert.equal(s.c.readRaffleMailState_().jobs.length,5);assert.equal(s.preview().candidateCount,2);assert.equal(JSON.stringify(s.rows),before);
 assert.equal(s.c.confirmRaffleInvitations_(admin,op).queued,5);assert.equal(s.tables.get('RaffleMailJournal').data.length,2);
});
test('new qualifications for existing email never requeue earlier codes',()=>{
 const s=setup();s.c.confirmRaffleInvitations_(admin,s.operation());s.rows.push(['student0@example.com','學生','NEW-CODE','purchase-2','','','']);
 const p=s.preview();assert.equal(p.candidateCount,1);assert.match(p.previews[0].body,/NEW-CODE/);assert.doesNotMatch(p.previews[0].body,/CODE-0/);
});
test('all write gates and admin authorization protect queue before writes',()=>{
 for(const gate of ['RAFFLE_ENABLED','RAFFLE_WRITES_ENABLED','RAFFLE_MAIL_QUEUE_ENABLED']){const s=setup(),op=s.operation();s.props.set(gate,'false');assert.throws(()=>s.c.confirmRaffleInvitations_(admin,op),/啟用/);assert.equal(s.writes(),0);}
 const s=setup();assert.throws(()=>s.c.confirmRaffleInvitations_(teacher,s.operation()),/權限/);assert.throws(()=>s.c.getRaffleMailRecords_(teacher,'future'),/權限/);assert.equal(s.writes(),0);
});
test('stale source/configuration and concurrent second request are rejected',()=>{
 for(const change of [s=>{s.rows[1][0]='changed@example.com';},s=>s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,name:'changed'}]))]){const s=setup(),op=s.operation();change(s);assert.throws(()=>s.c.confirmRaffleInvitations_(admin,op),/變更/);assert.equal(s.writes(),0);}
 const s=setup(),op=s.operation();s.c.confirmRaffleInvitations_(admin,op);assert.throws(()=>s.c.confirmRaffleInvitations_(admin,{...op,requestId:'request-queue-00002'}),/變更/);
});
test('write and flush uncertainty retry same identity without creating more jobs',()=>{
 for(const fault of ['timeout','flushFail']){const s=setup(),op=s.operation();s[fault]();assert.throws(()=>s.c.confirmRaffleInvitations_(admin,op),/timeout|uncertain/);const before=s.writes();assert.equal(s.c.confirmRaffleInvitations_(admin,op).queued,1);assert.equal(s.writes(),before);assert.equal(s.c.readRaffleMailState_().jobs.length,1);}
});
test('reused request with different actor/payload and formula IDs cannot write',()=>{
 const s=setup(),op=s.operation();s.c.confirmRaffleInvitations_(admin,op);const before=s.writes();
 assert.throws(()=>s.c.confirmRaffleInvitations_({...admin,teacherName:'另一位'},op),/識別/);assert.throws(()=>s.c.confirmRaffleInvitations_(admin,{...op,previewToken:'other'}),/識別/);
 assert.throws(()=>s.c.confirmRaffleInvitations_(admin,{...op,requestId:'=FORMULA()'}),/識別/);assert.equal(s.writes(),before);
});
test('malformed journal and duplicate row fail closed; metadata contains no codes or body',()=>{
 const s=setup();s.c.confirmRaffleInvitations_(admin,s.operation());const p=s.c.getRaffleMailRecords_(admin,'future');assert.equal(p.total,1);assert.equal(p.records[0].status,'queued');assert.equal(p.records[0].actor,'店長');assert.ok(!JSON.stringify(p).includes('CODE-0'));assert.ok(!JSON.stringify(p).includes('body'));
 const data=s.tables.get('RaffleMailJournal').data;data.push(data[1].slice());assert.throws(()=>s.c.readRaffleMailState_(),/紀錄/);data.pop();data[1][4]='{}';assert.throws(()=>s.c.readRaffleMailState_(),/紀錄/);
});
test('empty candidate and overlong content never create a queue table',()=>{
 const s=setup();s.rows[1][5]='Yes';assert.throws(()=>s.c.confirmRaffleInvitations_(admin,s.operation()),/沒有/);assert.equal(s.writes(),0);
 const big=setup();big.rows[1][2]='X'.repeat(46000);assert.throws(()=>big.c.confirmRaffleInvitations_(admin,big.operation()),/過長/);assert.equal(big.writes(),0);
});
