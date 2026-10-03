const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const admin={teacherName:'管理員',managementCapabilities:['raffle_admin']};
const campaign={id:'future',name:'未來活動',sourceSpreadsheetId:'future-source-1234567890',websiteUrl:'https://example.com/raffle',obSync:{dateFrom:'2027-01-01',dateTo:'2027-01-31',passIds:['60','100']}};
const headers=['OB email名稱','OB名字','驗證碼','是否已使用(Yes/空白)','寄送e-mail(Yes/空格)','寄送日期','API購課ID','API購買時間','API課卡ID','API課卡名稱','API點數','API付款狀態','API付款方式','API付款參考編號','API使用者ID','API同步時間','同步來源','人工備註'];
const purchase=(id,patch={})=>({id,price:6000,purchasedAt:'2027-01-01T00:00:00+08:00',paymentStatus:'paid',paymentMethod:'Credit Card',paymentReferenceId:'RN'+id,visits:60,user:{id:1,email:'student@example.com',lastName:'王',firstName:'小明'},pass:{id:60,nameZhHant:'60點課卡'},...patch});
function setup(items=[purchase(1),purchase(2)]){
 let locked=false,writes=0,fail=false,calls=0,uuid=0;
 const rows=[headers.slice()],props=new Map([['RAFFLE_ENABLED','true'],['RAFFLE_WRITES_ENABLED','true'],['RAFFLE_OB_SYNC_ENABLED','true'],['RAFFLE_OB_SYNC_HANDOFF_future','confirmed'],['OMCEAN_API_TOKEN','fake-token'],['RAFFLE_CAMPAIGNS_JSON',JSON.stringify([campaign])]]);
 const sheet={getLastRow:()=>rows.length,getLastColumn:()=>headers.length,getMaxRows:()=>10000,getRange:(r,col,n=1,m=1)=>({getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>String(rows[r+i-1]?.[col+j-1]??''))),setValues:values=>{assert.ok(locked);assert.ok(r>1);writes++;values.forEach((v,i)=>{rows[r+i-1]=v.slice();});if(fail){fail=false;throw Error('uncertain');}}})};
const c={console,Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],getUuid:()=>`${String(++uuid).padStart(8,'0')}-abcd-1234-5678-000000000000`},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null})},LockService:{getScriptLock:()=>({waitLock:()=>{assert.ok(!locked);locked=true;},releaseLock:()=>{locked=false;}})},SpreadsheetApp:{openById:id=>{assert.equal(id,campaign.sourceSpreadsheetId);return{getSheetByName:n=>{assert.equal(n,'抽獎名單');return sheet;}};},flush:()=>{}},UrlFetchApp:{fetch:(url,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer fake-token');const q=new URL(url);assert.equal(q.searchParams.get('date_from'),'2027-01-01 00:00:00');assert.equal(q.searchParams.get('date_to'),'2027-02-01 00:00:00');return{getResponseCode:()=>200,getContentText:()=>JSON.stringify(items.slice(Number(q.searchParams.get('start')),Number(q.searchParams.get('start'))+100))};}},MailApp:{sendEmail:()=>assert.fail('must not send')}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),c);
 const preview=()=>c.previewRaffleObSync_(admin,'future');
 const confirm=p=>c.confirmRaffleObSync_(admin,{campaignId:'future',previewToken:p.previewToken,requestId:'ob-sync-request-0001'});
 return{c,props,rows,items,preview,confirm,writes:()=>writes,calls:()=>calls,fail:()=>fail=true};
}
test('OB sync preview is read only, one chance per purchase, repeated sync preserves manual cells and codes',()=>{
 const s=setup();s.rows.push(headers.map(h=>h==='人工備註'?'保留人工內容':''));
 const p=s.preview();assert.equal(p.newCount,2);assert.equal(s.writes(),0);assert.equal(p.batchCount,2);assert.ok(!JSON.stringify(p).includes('fake-token'));
 const r=s.confirm(p);assert.equal(r.inserted,2);assert.equal(s.rows[1][17],'保留人工內容');
 const a=s.rows[2],b=s.rows[3];assert.equal(a[0],'student@example.com');assert.equal(b[0],a[0]);assert.notEqual(a[2],b[2]);assert.equal(a[6],'1');assert.equal(b[6],'2');assert.equal(a[3],'');assert.equal(a[4],'');assert.equal(a[5],'');
 const snapshot=JSON.stringify(s.rows);assert.equal(s.preview().newCount,0);assert.equal(JSON.stringify(s.rows),snapshot);
});
test('date boundaries, explicit pass IDs and paid status determine eligibility, not points or email grouping',()=>{
 const s=setup([purchase(1),purchase(2,{purchasedAt:'2027-01-31 23:59:59'}),purchase(3,{purchasedAt:'2026-12-31T15:59:59Z'}),purchase(4,{purchasedAt:'2027-01-31T16:00:00Z'}),purchase(5,{paymentStatus:'unpaid'}),purchase(6,{pass:{id:999,nameZhHant:'60點課卡'}})]);
 const p=s.preview();assert.equal(p.newCount,2);assert.equal(p.skipped,4);
});
test('zero price and Free cards cannot earn rewards even when paid; unknown price stays review-only',()=>{
 const s=setup([purchase(1),purchase(2,{price:0}),purchase(3,{price:'0.00'}),purchase(4,{price:null}),purchase(5,{price:undefined}),purchase(6,{price:'garbage'}),purchase(7,{paymentMethod:'Free'}),purchase(8,{price:-1}),purchase(9,{price:'12.50'})]);
 const p=s.preview();assert.equal(p.newCount,2);assert.equal(p.excludedZeroPrice,3);assert.equal(p.needsReview,4);
 assert.deepEqual(Array.from(p.reviewPurchases,x=>x.purchaseId),['4','5','6','8']);
 s.confirm(p);assert.deepEqual(s.rows.slice(1).map(r=>r[6]),['1','9']);
});
test('price changes after preview invalidate confirmation without writing',()=>{
 const s=setup(),p=s.preview();s.items[0].price=0;assert.throws(()=>s.confirm(p),/變更/);assert.equal(s.writes(),0);
});
test('unauthorized, disabled, missing handoff and missing rules block before API or source writes',()=>{
 const s=setup();assert.throws(()=>s.c.previewRaffleObSync_({teacherName:'老師',managementCapabilities:[]},'future'),/權限/);assert.equal(s.calls(),0);
 s.props.delete('RAFFLE_OB_SYNC_ENABLED');assert.throws(s.preview,/啟用/);assert.equal(s.calls(),0);
 s.props.set('RAFFLE_OB_SYNC_ENABLED','true');s.props.delete('RAFFLE_OB_SYNC_HANDOFF_future');assert.throws(s.preview,/交接/);assert.equal(s.calls(),0);
 s.props.set('RAFFLE_OB_SYNC_HANDOFF_future','confirmed');s.props.set('RAFFLE_CAMPAIGNS_JSON',JSON.stringify([{...campaign,obSync:null}]));assert.throws(s.preview,/購課|設定/);assert.equal(s.writes(),0);
});
test('stale source or changed OB data cannot be confirmed; uncertain append can be re-previewed without duplicate',()=>{
 const s=setup(),p=s.preview();s.items[0].user={...s.items[0].user,email:'changed@example.com'};assert.throws(()=>s.confirm(p),/變更/);assert.equal(s.writes(),0);
 const q=s.preview();s.fail();assert.throws(()=>s.confirm(q),/uncertain/);assert.equal(s.rows.length,3);assert.equal(s.preview().newCount,0);assert.equal(s.rows.length,3);
});
test('missing columns and corrupt duplicate source IDs block; bad candidate email never writes',()=>{
 for(const mutate of [s=>s.rows[0][6]='wrong',s=>{const row=headers.map(h=>h==='API購課ID'?'1':h==='驗證碼'?'OLD':'');s.rows.push(row,row.slice());},s=>s.items[0].user.email='bad']){const s=setup();mutate(s);assert.throws(s.preview);assert.equal(s.writes(),0);}
});
test('pagination is complete, bounded and confirmation appends at most 25 without mailing',()=>{
 const s=setup(Array.from({length:105},(_,i)=>purchase(i+1)));const p=s.preview();assert.equal(p.newCount,105);assert.equal(p.batchCount,25);assert.equal(s.calls(),2);assert.equal(s.confirm(p).inserted,25);assert.equal(s.preview().newCount,80);
});
test('campaign OB config survives normalization and invalid dates, IDs and partial settings reject',()=>{
 const s=setup();assert.deepEqual(JSON.parse(JSON.stringify(s.c.normalizeRaffleCampaign_(campaign).obSync)),campaign.obSync);
 for(const obSync of [{...campaign.obSync,dateFrom:'2027-02-30'},{...campaign.obSync,dateTo:'2026-01-01'},{...campaign.obSync,passIds:[]},{...campaign.obSync,passIds:['x']},{dateFrom:'2027-01-01'}])assert.throws(()=>s.c.normalizeRaffleCampaign_({...campaign,obSync}));
});
test('the API upper bound includes the last fractional second; local filter excludes next midnight',()=>{
 const s=setup([purchase(1,{purchasedAt:'2027-01-31T23:59:59.999+08:00'}),purchase(2,{purchasedAt:'2027-02-01T00:00:00+08:00'})]);
 s.c.UrlFetchApp.fetch=url=>{const q=new URL(url);assert.equal(q.searchParams.get('date_to'),'2027-02-01 00:00:00');return {getResponseCode:()=>200,getContentText:()=>JSON.stringify(s.items)};};
 assert.equal(s.preview().newCount,1);
});
test('missing write gate and stale human notes cannot be overwritten',()=>{const s=setup(),p=s.preview();s.props.delete('RAFFLE_WRITES_ENABLED');assert.throws(()=>s.confirm(p),/寫入/);s.props.set('RAFFLE_WRITES_ENABLED','true');s.rows.push(headers.map(h=>h==='人工備註'?'人工作業':''));assert.throws(()=>s.confirm(p),/變更/);assert.equal(s.writes(),0);});
test('duplicate API pages and excessive scans fail without a partial success',()=>{const s=setup(Array.from({length:101},()=>purchase(1)));assert.throws(s.preview,/重複/);assert.equal(s.writes(),0);const t=setup(Array.from({length:2000},(_,i)=>purchase(i+1)));assert.throws(t.preview,/2000/);assert.equal(t.writes(),0);});
