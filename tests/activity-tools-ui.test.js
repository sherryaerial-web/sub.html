const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function api(){const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('raffle-tools.js','utf8'),c);return c.SherryActivityTools;}
test('arrival stops at unknown outcome and never calls remaining rows or retries',async()=>{const m=api(),calls=[];const rows=[{id:'one',version:1,venue:'A'},{id:'two',version:0,venue:'A'},{id:'three',version:0,venue:'A'}];const out=await m.runArrivalBatch(rows,async op=>{calls.push(op);if(op.claimId==='two')throw Error('timeout');return{claimId:'one',version:2,status:'ready',notification:{status:'sent'}}},'batch-12345678',()=>true);assert.equal(calls.length,2);assert.equal(out.stopped,true);assert.equal(out.results.length,2);assert.match(calls[0].requestId,/batch-12345678/);});
test('wrong claim and uncertain notification both stop; labels escape student text',async()=>{const m=api();for(const r of [{claimId:'other',version:1,status:'ready',notification:{status:'sent'}},{claimId:'one',version:1,status:'ready',notification:{status:'needs_review'}}]){const out=await m.runArrivalBatch([{id:'one',version:0,venue:'A'},{id:'two',version:0,venue:'A'}],async()=>r,'batch-12345678',()=>true);assert.equal(out.stopped,true);assert.equal(out.results.length,1);}assert.doesNotMatch(m.labelsHTML([{studentName:'<img onerror=alert(1)>',email:'a@example.com',prizeName:'帽T',quantity:2,venue:'A'}]),/<img onerror/);});

function historyData(activity = {}) {
  return {
    email: 'test@example.test', nextOffset: null, claims: [], events: [], notifications: [],
    activity: { available: true, balance: 0, progress: {}, purchases: [], stars: [], reviews: [], draws: [], ...activity }
  };
}

test('student history distinguishes a draw ticket, prize selection and physical pickup', () => {
  const d = historyData({ draws: ['ready', 'drawn', 'selected', 'pending', 'unknown', 'future'].map(state => ({ state })) });
  d.claims.push({ prizeName: '<提袋>', venue: 'A館', status: 'ready', claimed: 0, total: 1 });
  const html = api().studentHistoryHTML(d, 0);
  for (const phrase of ['已扣星，尚無抽獎完成紀錄', '已抽出，尚無選獎完成紀錄', '已完成選獎', '處理結果待確認', '需人工核對原結果', '抽獎狀態待核對', '已備妥', '已領 0／1 件', '交付前請到「學生領獎」按「查詢學生」', '&lt;提袋&gt;']) assert.ok(html.includes(phrase), phrase);
  assert.doesNotMatch(html, /尚未抽獎|尚未選獎|直接領取|<提袋>/);
});

test('historical payment, recorded reward and channel results keep separate meanings', () => {
  const d = historyData({ purchases: [
    {id:'p1', price:16200, state:'review', paymentStatus:'awaiting_verification', awarded:0},
    {id:'p2', stars:2, balls:1, state:'pending', paymentStatus:'paid', awarded:1}
  ], progress: {purchases:{through:1795147149000,stale:true}} });
  d.notifications.push({kind:'ready',status:'uncertain',channels:[{name:'line',status:'unbound'},{name:'email',status:'sent'}]});
  const html = api().studentHistoryHTML(d, 0);
  assert.match(html, /購卡 #p1[^<]*<br>活動留存的付款狀態：付款待驗證/);
  assert.match(html, /請用此購卡單號核對 OB 最新付款與退款紀錄/);
  assert.match(html, /已加 2 星，已建立 1 顆按摩球的贈品紀錄/);
  assert.match(html, /購卡資料截至 .*等待同步更新/);
  assert.match(html, /領獎通知 · 結果待確認<br>LINE：未綁定 LINE · Email：服務已接受/);
  assert.doesNotMatch(html, /已領取 1 顆|已收件/);
});

test('four-venue totals show a verified zero, missing classes never become zero', () => {
  const rooms=['A館','B館','C館','D館'].map((label,count)=>({label,count}));
  const classes={rooms,rounds:1,through:1795147149000};
  const render=classes=>api().studentHistoryHTML(historyData({progress:{classes}}),0);
  const html=render(classes);
  for(const phrase of ['A館 0 堂（還差 2 堂）','B館 1 堂（還差 1 堂）','C館 2 堂（已達標）','D館 3 堂（已達標）','已兌換 1 輪','上課資料截至']) assert.ok(html.includes(phrase),phrase);
  for (const invalid of [null,{}, {...classes,rooms:[...rooms.slice(0,3),rooms[0]]}, {...classes,rooms:[...rooms.slice(0,3),{label:'D館',count:null}]}]) {
    const partial=render(invalid);
    assert.match(partial,/四館課次尚待/);
    assert.doesNotMatch(partial,/還差|已兌換|NaN/);
  }
});

test('local claim history remains available when the activity identity is unverified', () => {
  const d=historyData();
  d.activity={available:false,reason:'identity_not_verified'};
  d.claims.push({prizeName:'提袋',status:'claimed',venue:'A館',claimed:1,total:1});
  const html=api().studentHistoryHTML(d,50);
  assert.match(html,/尚無已驗證/);
  assert.match(html,/提袋.*已領 1／1 件/);
  assert.match(html,/data-tool="history-prev"/);
  assert.doesNotMatch(html,/可用星星|data-tool="history-next"/);
});
