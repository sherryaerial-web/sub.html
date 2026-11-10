const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const domain = () => require('../personal-appearance');
const session = {owner:'Teacher A',token:'token-a',acting:false,verified:true};
const preference = (id = 'original', revision = 0) => {
  const p = domain().palettes.find(p => p.id === id);
  return {schemaVersion:1,mode:'preset',presetId:id,primary:p.primary,secondary:p.secondary,revision,updatedAt:revision ? '2026-11-10T00:00:00.000Z' : ''};
};
function deferred() { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b;}); return {promise,resolve,reject}; }
function fixture(request = async () => ({available:true,preference:preference()}), storage) {
  const calls=[], changes=[], cache=new Map();
  const c=domain().createController({request:(...args)=>{calls.push(args);return request(...args);},
    storage:storage || {getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)},onChange:s=>changes.push(s)});
  c.setSession(session);
  return {c,calls,changes,cache};
}
const luminance = hex => {
  const channels=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return channels.reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

test('UMD exports the exact public API without accessing blocked browser storage',()=>{
  const browser={};Object.defineProperty(browser,'localStorage',{get(){throw Error('denied');}});
  vm.runInNewContext(fs.readFileSync(require.resolve('../personal-appearance'),'utf8'),{window:browser});
  assert.deepEqual(Object.keys(browser.SherryPersonalAppearance).sort(),['createController','defaultPreference','palettes','themeTokens']);
  assert.doesNotThrow(()=>browser.SherryPersonalAppearance.createController({request:async()=>({})}));
});
test('six exact palettes and independent default objects',()=>{
  assert.deepEqual(domain().palettes.map(({id,primary,secondary})=>[id,primary,secondary]),[
    ['original','#786c64','#eee0dc'],['rose','#857377','#e9dcdf'],['sage','#717a70','#dfe5dd'],
    ['blue','#707c83','#dfe5e8'],['lilac','#7b7482','#e5dfe9'],['stone','#737675','#e2e5e3']]);
  const p=domain().defaultPreference();assert.deepEqual(p,preference());p.primary='#000000';assert.equal(domain().defaultPreference().primary,'#786c64');
});
test('original source tokens and semantic separation',()=>{
  const t=domain().themeTokens(preference());
  for(const [key,value] of Object.entries({'--ink':'#403936','--surface':'#fffdf9','--page':'#f3f0eb','--appearance-nav':'#ebe5dd','--line':'#d8d0c7','--sea-800':'#665851','--appearance-edge':'#ad8175'})) assert.equal(t[key],value);
  for(const key of ['--muted','--subtle','--line-strong','--soft','--sea-700','--sea-600','--aqua-100','--aqua-50']) assert.match(t[key],/^#[\da-f]{6}$/i);
  assert.ok(!Object.keys(t).some(k=>/coral|amber|green|error|success|warning/.test(k)));
});
for(const color of ['#ffffff','#000000','#ff0000','#00ff00','#0000ff','#777777']) {
  test(`custom ${color} remains exact with readable text and foregrounds`,()=>{
    const t=domain().themeTokens({...preference('blue'),mode:'custom',primary:color,secondary:color});
    assert.equal(t['--appearance-primary'],color);assert.equal(t['--appearance-secondary'],color);
    assert.ok(contrast(t['--appearance-on-primary'],color)>=4.5);assert.ok(contrast(t['--appearance-on-secondary'],color)>=4.5);
    for(const bg of ['--surface','--page','--soft','--appearance-nav','--aqua-50','--aqua-100']) {
      for(const fg of ['--ink','--muted','--subtle','--sea-700','--sea-800']) assert.ok(contrast(t[fg],t[bg])>=4.5,`${fg} on ${bg}`);
    }
  });
}
test('unverified sessions do not load or expose cached account colors; load is explicit',async()=>{
  const f=fixture();assert.equal(f.calls.length,0);
  assert.equal(f.c.setSession({...session,verified:false}) instanceof Promise,false);
  await f.c.load();await f.c.open();assert.equal(f.calls.length,0);assert.equal(f.c.snapshot().isOpen,false);
  f.c.setSession(session);await f.c.load();assert.equal(f.calls.length,1);assert.deepEqual(f.calls[0],['getPersonalAppearance',{sessionToken:'token-a'}]);
});
test('open is immediate; edits preview only; cancel/reset are reversible and snapshots are isolated',async()=>{
  const f=fixture();const opening=f.c.open();assert.equal(f.c.snapshot().isOpen,true);await opening;
  f.c.setPreset('rose');assert.equal(f.c.snapshot().status,'dirty');assert.equal(f.c.snapshot().preference.presetId,'original');
  f.c.setColor('primary','#ABCDEF');assert.equal(f.c.snapshot().draft.mode,'custom');assert.equal(f.c.snapshot().draft.primary,'#abcdef');assert.equal(f.c.snapshot().draft.presetId,'rose');
  f.c.snapshot().draft.primary='#111111';assert.equal(f.c.snapshot().draft.primary,'#abcdef');
  f.c.reset();assert.equal(f.c.snapshot().draft.presetId,'original');f.c.cancel();assert.equal(f.c.snapshot().draft,null);
  assert.equal(f.calls.filter(c=>c[0]==='savePersonalAppearance').length,0);assert.ok(f.changes.length>=5);
  assert.deepEqual(Object.keys(f.c.snapshot()).sort(),['busy','canSave','draft','isOpen','message','needsReconciliation','preference','status']);
});
test('invalid UI input does not change the draft',async()=>{
  const {c}=fixture();await c.open();const before=c.snapshot().draft;
  for(const value of ['#fff','red','url(x)','#000000;',' #ffffff']) c.setColor('primary',value);
  c.setColor('owner','#ffffff');c.setPreset('unknown');assert.deepEqual(c.snapshot().draft,before);
});
test('load cannot overwrite an edited draft or silently grant a newer base revision',async()=>{
  const d=deferred(),f=fixture(()=>d.promise);const opening=f.c.open();f.c.setPreset('rose');
  assert.equal(f.c.snapshot().canSave,false);d.resolve({available:true,preference:preference('blue',3)});await opening;
  assert.equal(f.c.snapshot().draft.presetId,'rose');assert.equal(f.c.snapshot().draft.revision,0);assert.equal(f.c.snapshot().preference.revision,3);
});
test('latest load wins and stale loads cannot roll back a completed save',async()=>{
  const a=deferred(),b=deferred();let reads=0;
  const f=fixture(action=>action==='getPersonalAppearance'?(++reads===1?a.promise:b.promise):Promise.resolve({saved:true,preference:preference('rose',2)}));
  const p=f.c.open(),q=f.c.load();b.resolve({available:true,preference:preference('blue',1)});await q;
  f.c.setPreset('rose');await f.c.save();a.resolve({available:true,preference:preference()});await p;
  assert.equal(f.c.snapshot().preference.presetId,'rose');assert.equal(f.c.snapshot().preference.revision,2);
});
for(const change of [{owner:'Teacher B',token:'b'},{token:'new-token'},{verified:false},{owner:'',token:'',verified:false}]) {
  test(`session change ${JSON.stringify(change)} ignores old reads and save completion`,async()=>{
    const read=deferred(),f=fixture(()=>read.promise),p=f.c.open();f.c.setSession({...session,...change});
    read.resolve({available:true,preference:preference('blue',4)});await p;assert.equal(f.c.snapshot().preference.presetId,'original');
    const write=deferred(),g=fixture(action=>action==='getPersonalAppearance'?Promise.resolve({available:true,preference:preference()}):write.promise);
    await g.c.open();g.c.setPreset('rose');const saving=g.c.save();g.c.setSession({...session,...change});
    write.resolve({saved:true,preference:preference('rose',1)});await saving;
    assert.equal(g.c.snapshot().preference.presetId,'original');assert.equal(g.cache.size,0);assert.equal(g.c.snapshot().busy,false);
  });
}
test('acting mode retains manager preference but discards preview and disables editing',async()=>{
  const f=fixture(async()=>({available:true,preference:preference('blue',1)}));await f.c.open();f.c.setPreset('rose');
  f.c.setSession({...session,acting:'Teacher B'});assert.equal(f.c.snapshot().preference.presetId,'blue');assert.equal(f.c.snapshot().isOpen,false);
  await f.c.open();f.c.setPreset('stone');await f.c.save();assert.equal(f.calls.length,1);assert.equal(f.c.snapshot().canSave,false);
});
test('save double clicks share one request; closing does not cancel server completion',async()=>{
  const d=deferred(),f=fixture(action=>action==='getPersonalAppearance'?Promise.resolve({available:true,preference:preference()}):d.promise);
  await f.c.open();f.c.setPreset('rose');const a=f.c.save(),b=f.c.save();assert.equal(f.c.snapshot().busy,true);
  f.c.cancel();assert.equal(f.c.snapshot().busy,true);assert.match(f.c.snapshot().message,/確認|儲存/);
  assert.equal(f.calls.filter(c=>c[0]==='savePersonalAppearance').length,1);
  const params=f.calls.at(-1)[1];assert.equal(params.expectedRevision,0);assert.equal(params.sessionToken,'token-a');assert.equal(JSON.parse(params.preference).presetId,'rose');assert.ok(!('owner' in params));
  d.resolve({saved:true,preference:preference('rose',1)});await Promise.all([a,b]);assert.equal(f.c.snapshot().preference.presetId,'rose');assert.equal(f.c.snapshot().isOpen,false);assert.equal(f.cache.size,1);
});
test('reopen or acting switch during save reconciles same-session completion without resurrecting preview',async()=>{
  for(const acting of [false,true]) {
    const d=deferred(),f=fixture(action=>action==='getPersonalAppearance'?Promise.resolve({available:true,preference:preference()}):d.promise);
    await f.c.open();f.c.setPreset('sage');const p=f.c.save();f.c.cancel();
    if(acting) f.c.setSession({...session,acting:true});else await f.c.open();
    f.c.setPreset('blue');d.resolve({saved:true,preference:preference('sage',1)});await p;
    assert.equal(f.c.snapshot().preference.presetId,'sage');assert.equal(f.c.snapshot().isOpen,!acting);
    if(!acting) assert.equal(f.c.snapshot().draft.presetId,'sage');
  }
});
test('conflict preserves draft and requires explicit reload before saving',async()=>{
  let value=preference();const f=fixture(async action=>action==='getPersonalAppearance'?{available:true,preference:value}:{saved:false,reason:'conflict',current:preference('blue',2)});
  await f.c.open();f.c.setPreset('rose');await f.c.save();assert.equal(f.c.snapshot().status,'conflict');assert.equal(f.c.snapshot().draft.presetId,'rose');assert.equal(f.c.snapshot().canSave,false);
  value=preference('blue',2);await f.c.load();assert.equal(f.c.snapshot().draft.presetId,'blue');assert.equal(f.c.snapshot().draft.revision,2);
});
test('unknown save preserves exact request for tracked reconciliation, with no automatic retry',async()=>{
  let writes=0;const f=fixture(async action=>{
    if(action==='getPersonalAppearance') return {available:true,preference:preference()};
    if(++writes===1) throw Error('操作結果待確認，已保留確認編號');
    return {saved:true,preference:preference('rose',1)};
  });
  await f.c.open();f.c.setPreset('rose');await f.c.save();assert.equal(f.c.snapshot().status,'uncertain');assert.equal(f.cache.size,0);
  const params=f.calls.at(-1)[1];f.c.setPreset('blue');f.c.cancel();await f.c.open();await f.c.load();assert.equal(writes,1);
  await f.c.save();assert.deepEqual(f.calls.at(-1)[1],params);assert.equal(writes,2);assert.equal(f.c.snapshot().status,'saved');
});
test('known rejection is not uncertain and cache is not overwritten',async()=>{
  const f=fixture(async action=>action==='getPersonalAppearance'?{available:true,preference:preference()}:{saved:false,reason:'invalid_preference'});
  await f.c.open();f.c.setPreset('rose');await f.c.save();assert.equal(f.c.snapshot().status,'error');assert.equal(f.c.snapshot().draft.presetId,'rose');assert.equal(f.cache.size,0);
});
test('blocked cache is harmless; transport storage refusal is surfaced without bypass',async()=>{
  let writes=0;const f=fixture(async action=>{
    if(action==='getPersonalAppearance') return {available:true,preference:preference()};
    writes++;throw Error('無法保存操作確認編號，本次尚未送出。');
  },{getItem(){throw Error('SecurityError');},setItem(){throw Error('QuotaExceededError');}});
  await f.c.open();f.c.setPreset('rose');await f.c.save();assert.equal(writes,1);assert.equal(f.c.snapshot().status,'error');assert.match(f.c.snapshot().message,/尚未送出|無法/);
});
test('offline uses only validated account cache and blocks save until server revision is known',async()=>{
  const cache=new Map(),storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
  const online=fixture(async action=>action==='getPersonalAppearance'?{available:true,preference:preference()}:{saved:true,preference:preference('rose',1)},storage);
  await online.c.open();online.c.setPreset('rose');await online.c.save();
  const offline=fixture(async()=>{throw Error('offline');},storage);await offline.c.open();assert.equal(offline.c.snapshot().preference.presetId,'rose');assert.equal(offline.c.snapshot().canSave,false);
  offline.c.setSession({...session,owner:'Teacher B',token:'b'});assert.equal(offline.c.snapshot().preference.presetId,'original');
  for(const key of cache.keys()) cache.set(key,'{"schemaVersion":99}');
  const broken=fixture(async()=>({available:false,reason:'corrupt'}),storage);await broken.c.open();assert.equal(broken.c.snapshot().preference.presetId,'original');assert.equal(broken.c.snapshot().status,'error');
});
test('invalid response is never saved or cached as confirmed',async()=>{
  const f=fixture(async action=>action==='getPersonalAppearance'?{available:true,preference:preference()}:{saved:true,preference:{...preference('rose',1),schemaVersion:99}});
  await f.c.open();f.c.setPreset('rose');await f.c.save();assert.equal(f.c.snapshot().status,'uncertain');assert.equal(f.cache.size,0);assert.equal(f.c.snapshot().preference.revision,0);
});

test('storage failure after delivery must not unlock a different request or claim the write was canceled',async()=>{
  let writes=0;const f=fixture(async action=>{
    if(action==='getPersonalAppearance') return {available:true,preference:preference()};
    if(++writes===1) throw Error('無法保存操作確認編號，本次尚未送出。');
    return {saved:true,preference:preference('rose',1)};
  });
  await f.c.open();f.c.setPreset('rose');await f.c.save();const params=f.calls.at(-1)[1];
  f.c.setPreset('blue');assert.equal(f.c.snapshot().draft.presetId,'rose');
  f.c.cancel();await f.c.open();await f.c.save();assert.deepEqual(f.calls.at(-1)[1],params);
});
test('explicit transport reconciliation acknowledgment requires reload before a new save',async()=>{
  let writes=0;const f=fixture(async action=>{
    if(action==='getPersonalAppearance') return {available:true,preference:preference('blue',2)};
    if(++writes===1) throw Error('操作結果待確認');
    throw Error('已解除舊操作的確認紀錄，本次未送出。請依已核對的結果進行下一筆操作。');
  });
  await f.c.open();f.c.setPreset('rose');await f.c.save();await f.c.save();
  assert.equal(f.c.snapshot().canSave,false);await f.c.load();assert.equal(f.c.snapshot().draft.presetId,'blue');assert.equal(f.c.snapshot().status,'ready');
});
test('conflict reload intent survives an offline reload and then adopts the current revision',async()=>{
  let reads=0;const f=fixture(async action=>{
    if(action==='savePersonalAppearance') return {saved:false,reason:'conflict',current:preference('blue',2)};
    if(++reads===2) throw Error('offline');
    return {available:true,preference:reads===1?preference():preference('blue',2)};
  });
  await f.c.open();f.c.setPreset('rose');await f.c.save();await f.c.load();assert.equal(f.c.snapshot().canSave,false);
  await f.c.load();assert.equal(f.c.snapshot().draft.presetId,'blue');assert.equal(f.c.snapshot().draft.revision,2);
});
test('all preset and custom base surfaces keep normal text readable',()=>{
  for(const palette of domain().palettes) for(const color of [null,'#ffffff','#000000','#00ff00']) {
    const p=color?{...preference(palette.id),mode:'custom',primary:color,secondary:color}:preference(palette.id);
    const t=domain().themeTokens(p);
    for(const bg of ['--surface','--page','--soft','--appearance-nav','--aqua-100','--aqua-50'])
      for(const fg of ['--ink','--muted','--subtle','--sea-700','--sea-800']) assert.ok(contrast(t[fg],t[bg])>=4.5,`${palette.id} ${fg} on ${bg}`);
  }
});

test('all approved mock neutral palettes are exposed and preserved in preset/custom themes',()=>{
  const neutralKeys=['surface','page','nav','ink','muted','line','edge','strong'];
  const approved={
    original:['#fffdf9','#f3f0eb','#ebe5dd','#403936','#776f68','#d8d0c7','#ad8175','#665851'],
    rose:['#fdfaf9','#f3efee','#eae3e2','#443d3f','#756b6d','#d9ced0','#b59b9f','#6e5b61'],
    sage:['#fcfcf8','#f0f1eb','#e5e8df','#3c433c','#6b7369','#cfd5cb','#a1ad9c','#596753'],
    blue:['#fafbfc','#eef1f2','#e3e8eb','#3d4246','#6a7379','#cdd5d9','#9aaeb7','#53656f'],
    lilac:['#fcfafc','#f1eef3','#e8e2ea','#423e46','#726b77','#d5ceda','#ac9eb6','#65586e'],
    stone:['#fbfbf9','#f0f1ee','#e6e7e3','#3e4140','#6e736f','#d1d5d1','#a3aca6','#59635c']
  };
  for(const palette of domain().palettes) {
    assert.deepEqual(neutralKeys.map(k=>palette[k]),approved[palette.id]);
    for(const mode of ['preset','custom']) {
      const p={...preference(palette.id),mode};if(mode==='custom'){p.primary='#ffffff';p.secondary='#000000';}
      const t=domain().themeTokens(p);
      for(const [token,key] of Object.entries({'--surface':'surface','--page':'page','--appearance-nav':'nav','--ink':'ink','--line':'line','--appearance-edge':'edge','--sea-800':'strong'})) assert.equal(t[token],palette[key]);
    }
  }
  const original=domain().themeTokens(preference());
  assert.equal(original['--appearance-on-primary'],'#fffdf9');assert.equal(original['--appearance-on-secondary'],'#665851');
});
test('an edit made during explicit conflict reload survives its late completion',async()=>{
  const d=deferred();let reads=0;const f=fixture(async action=>{
    if(action==='savePersonalAppearance') return {saved:false,reason:'conflict',current:preference('blue',2)};
    return ++reads===1?{available:true,preference:preference()}:d.promise;
  });
  await f.c.open();f.c.setPreset('rose');await f.c.save();const reload=f.c.load();f.c.setPreset('sage');
  d.resolve({available:true,preference:preference('blue',2)});await reload;
  assert.equal(f.c.snapshot().draft.presetId,'sage');assert.equal(f.c.snapshot().preference.presetId,'blue');
});
test('an old failed save cannot clear a newer session save or its confirmed cache',async()=>{
  const old=deferred(),recent=deferred();let writes=0;
  const f=fixture(action=>action==='getPersonalAppearance'?Promise.resolve({available:true,preference:preference()}):++writes===1?old.promise:recent.promise);
  await f.c.open();f.c.setPreset('rose');const a=f.c.save();f.c.setSession({...session,token:'new-token'});
  await f.c.open();f.c.setPreset('blue');const b=f.c.save();old.reject(Error('late unknown delivery'));await a;
  assert.equal(f.c.snapshot().busy,true);assert.equal(f.c.snapshot().status,'saving');
  recent.resolve({saved:true,preference:preference('blue',1)});await b;
  assert.equal(f.c.snapshot().preference.presetId,'blue');assert.equal(f.c.snapshot().status,'saved');assert.equal(JSON.parse([...f.cache.values()][0]).presetId,'blue');
});
test('a superseded failed read cannot undo the latest ready draft',async()=>{
  const old=deferred();let reads=0;const f=fixture(()=>++reads===1?old.promise:Promise.resolve({available:true,preference:preference('blue',2)}));
  const first=f.c.open();await f.c.load();const notifications=f.changes.length;old.reject(Error('late offline'));await first;
  assert.equal(f.c.snapshot().status,'ready');assert.equal(f.c.snapshot().draft.presetId,'blue');assert.equal(f.changes.length,notifications);
});
