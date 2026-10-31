const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../raffle.js'),'utf8');
const claims=[{id:'ball',studentName:'Ivy',email:'ivy@example.test',prizeId:'ball',prizeName:'球',quantity:2,claimedQuantity:0,status:'waiting',directPickup:true,version:1},{id:'bag',studentName:'Ivy',email:'ivy@example.test',prizeId:'bag',prizeName:'提袋',quantity:1,claimedQuantity:0,status:'waiting',directPickup:false,venue:'A館',version:1}];
function panel(api){
  const nodes=new Map(),storage=new Map();
  const root={innerHTML:'',classList:{add(){}},querySelector(s){if(!nodes.has(s))nodes.set(s,{value:'',textContent:'',innerHTML:'',hidden:false,disabled:false});return nodes.get(s);},querySelectorAll(){return[];},replaceChildren(){}};
  const window={confirm:()=>true,crypto:{randomUUID:()=> 'test-request-12345'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
  vm.runInNewContext(source,{window});window.SherryRaffle.mountActivityGifts(root,{api});return{root,n:s=>root.querySelector(s)};
}
const workspace=()=>({testOnly:true,actor:'Tako',readOnly:false,claims});
test('loading shows progress immediately instead of leaving the previous instruction',async()=>{
  let resolve;const p=panel(()=>new Promise(r=>resolve=r));const loading=p.n('[data-gift-load]').onclick();
  assert.match(p.n('[data-gift-message]').textContent,/載入|處理中/);resolve(workspace());await loading;
  assert.doesNotMatch(p.n('[data-gift-message]').textContent,/處理中/);
});
test('prize filter combines with student search and explicitly reports no matches',async()=>{
  const p=panel(async()=>workspace());await p.n('[data-gift-load]').onclick();
  assert.match(p.n('[data-gift-prize]').innerHTML,/球/);assert.match(p.n('[data-gift-prize]').innerHTML,/提袋/);
  p.n('[data-gift-prize]').value='提袋';p.n('[data-gift-prize]').onchange();
  assert.match(p.n('[data-gift-claims]').innerHTML,/提袋/);assert.doesNotMatch(p.n('[data-gift-claims]').innerHTML,/data-gift-id="ball"/);
  p.n('[data-gift-search]').value='nobody';p.n('[data-gift-search]').oninput();assert.match(p.n('[data-gift-claims]').innerHTML,/查無|沒有符合條件/);
});
test('remaining quantities and non-ball units are distinct without enabling unavailable prizes',async()=>{
  const p=panel(async()=>workspace());await p.n('[data-gift-load]').onclick();const html=p.n('[data-gift-claims]').innerHTML;
  assert.match(html,/剩餘 2 顆/);assert.match(html,/剩餘 1 件/);assert.match(html,/標記已到館/);
});
test('pending collection shows progress and repeated clicks cannot send another mutation',async()=>{
  let finish,writes=0;
  const p=panel(async action=>{if(action==='getActivityGiftWorkspace')return workspace();writes++;return new Promise(r=>finish=r);});
  await p.n('[data-gift-load]').onclick();
  const event={target:{closest:()=>({disabled:false,dataset:{giftId:'ball',giftAction:'collect',giftQuantity:'1'},textContent:'登記領取 1 顆'})}};
  p.n('[data-gift-claims]').onclick(event);p.n('[data-gift-claims]').onclick(event);
  assert.equal(writes,1);assert.match(p.n('[data-gift-message]').textContent,/處理中/);
  assert.match(p.n('[data-gift-claims]').innerHTML,/disabled/);
  finish({state:'recorded'});await new Promise(r=>setImmediate(r));
  assert.match(p.n('[data-gift-message]').textContent,/已核對完成/);
});
