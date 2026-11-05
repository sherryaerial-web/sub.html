const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function ui(){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../raffle.js'),'utf8'),c);return c.window.SherryRaffle;}
function data(){return{ok:true,sources:{purchases:{pending:0,blocked:0},classes:{pending:0,blocked:0}},queues:{intakes:[{kind:'photo',state:'manual',count:1,oldestAt:3000}],ready:[{state:'unknown',count:1,oldestAt:1000},{state:'accepted',count:2,oldestAt:1}]},tasks:[],classroom:{mail:{available:true,queued:1,uncertain:0,oldestPendingAt:2000}}};}
test('pending groups sort oldest first, undated last, with safe destinations and escaped content',()=>{
 const d=data();d.queues.identity=[{state:'unavailable',count:1}];d.tasks=[{id:'sync',stale:true}];
 const html=ui().renderOperations(d);
 assert.ok(html.indexOf('data-ops-key="ready:')<html.indexOf('data-ops-key="mail"'));
 assert.ok(html.indexOf('data-ops-key="mail"')<html.indexOf('data-ops-key="intakes:'));
 assert.ok(html.indexOf('data-ops-key="intakes:')<html.indexOf('data-ops-key="identity:'));
 assert.doesNotMatch(html,/data-ops-key="ready:accepted/);
 assert.match(html,/data-ops-go="mail"/);assert.match(html,/data-ops-go="tasks"/);assert.match(html,/data-ops-go="schedule"/);
 assert.match(html,/時間未提供/);
 d.queues.intakes[0].state='<img src=x>';assert.doesNotMatch(ui().renderOperations(d),/<img/);
});
test('batch problems are included and malformed status cannot look like empty healthy queues',()=>{
 const d=data();d.sources.classes={pending:1,blocked:2,oldestPendingAt:500};
 assert.match(ui().renderOperations(d),/data-ops-key="source:classes"/);
 d.queues.intakes=null;assert.throws(()=>ui().renderOperations(d),/完整/);
});
function clock(read){
 let time=0,visible=true,listener,id=0;const timers=new Map(),frames=[],states=[];
 const c=ui().createOperationsRefresh({read,onData:d=>frames.push(d),onStatus:s=>states.push(s),now:()=>time,isVisible:()=>visible,subscribe:fn=>{listener=fn;return()=>listener=null;},schedule:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},cancel:id=>timers.delete(id)});
 return{c,frames,states,timers,advance:ms=>time+=ms,visibility:v=>{visible=v;listener?.();},tick:async()=>{const [id,t]=timers.entries().next().value;timers.delete(id);time+=t.ms;await t.fn();},hasListener:()=>!!listener};
}
test('one read at a time, next poll only after settlement, disposal ignores late result',async()=>{
 let calls=0,resolve;const f=clock(()=>{calls++;return new Promise(r=>resolve=r);});
 const p=f.c.refresh();await f.c.refresh();assert.equal(calls,1);assert.equal(f.timers.size,0);
 resolve({ok:true});await p;assert.equal(f.frames.length,1);assert.equal([...f.timers.values()][0].ms,60000);
 const next=f.c.refresh();f.c.dispose();resolve({ok:true});await next;assert.equal(f.frames.length,1);assert.equal(f.timers.size,0);assert.equal(f.hasListener(),false);
});
test('hidden tabs pause, fast foreground switches do not reread, overdue foreground refreshes once',async()=>{
 let calls=0;const f=clock(async()=>++calls);await f.c.refresh();f.visibility(false);assert.equal(f.timers.size,0);
 f.advance(10000);f.visibility(true);assert.equal(calls,1);assert.equal([...f.timers.values()][0].ms,50000);
 f.visibility(false);f.advance(60000);f.visibility(true);await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);f.c.dispose();
});
test('failures preserve last success, back off, and recovery returns to one minute',async()=>{
 let fail=false,calls=0;const f=clock(async()=>{calls++;if(fail)throw Error('offline');return calls;});await f.c.refresh();fail=true;await f.tick();
 assert.deepEqual(f.frames,[1]);assert.equal(f.states.at(-1),'error');assert.equal([...f.timers.values()][0].ms,120000);
 await f.tick();assert.equal([...f.timers.values()][0].ms,240000);await f.tick();assert.equal([...f.timers.values()][0].ms,300000);
 fail=false;await f.tick();assert.equal(f.frames.at(-1),5);assert.equal([...f.timers.values()][0].ms,60000);f.c.dispose();
});
test('initial hidden mount does not read and invalid render follows failure path',async()=>{
 const f=clock(async()=>1);f.visibility(false);await f.c.refresh();assert.equal(f.frames.length,0);f.visibility(true);await new Promise(resolve=>setImmediate(resolve));assert.equal(f.frames.length,1);f.c.dispose();
 let state;const c=ui().createOperationsRefresh({read:async()=>({}),onData:()=>{throw Error('invalid');},onStatus:s=>state=s,isVisible:()=>true,subscribe:()=>()=>{},schedule:()=>1,cancel:()=>{},now:()=>1});await c.refresh();assert.equal(state,'error');c.dispose();
});
