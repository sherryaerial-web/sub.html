(function(global){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=v=>v&&Number.isFinite(new Date(v).getTime())?new Date(v).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚待核對';
const states={waiting:'待備貨',ready:'已備妥',partial:'部分領取',claimed:'已領取',digital:'電子獎項',cancelled:'已取消',pending:'待處理',queued:'排程中',working:'核對中',manual:'待老師確認',review:'待核對',complete:'已處理',completed:'已完成',rejected:'未通過',superseded:'已被新申請取代',sent:'服務已接受',sending:'結果待確認',uncertain:'結果待確認',failed:'失敗待核對',excluded:'不符合資格',selected:'已選獎品',drawn:'已抽獎',recorded:'已建立',paid:'已付款',refunded:'已退款',unpaid:'未付款',awaiting_verification:'付款待驗證'};
const state=v=>Object.hasOwn(states,v)?states[v]:'待核對';
const button=(key,label)=>`<button type="button" class="compact-button" data-tool="${key}">${label}</button>`;
const field=(key,label,html)=>`<label>${label}${html||`<input class="text-input" data-field="${key}">`}</label>`;
const select=(key,label,values,value='')=>field(key,label,`<select class="admin-select" data-field="${key}"><option value="">全部</option>${values.map(v=>`<option ${v===value?'selected':''} value="${esc(v)}">${esc(v)}</option>`).join('')}</select>`);
const id=()=> 'tools_'+Date.now().toString(36)+'_'+crypto.randomUUID();
const drawStates = {
 ready:'已扣星，尚未抽獎', drawn:'已抽出，尚未選獎', selected:'已完成選獎',
 pending:'處理結果待確認', unknown:'需人工核對原結果', closed:'本次抽獎已關閉'
};
const drawState = key => Object.hasOwn(drawStates,key) ? drawStates[key] : '抽獎狀態待核對';
function recordedDrawState(key){
 if(key==='ready')return '已扣星，尚無抽獎完成紀錄';
 if(key==='drawn')return '已抽出，尚無選獎完成紀錄';
 return drawState(key);
}
const noticeJobs = {queued:'待寄',sending:'結果待確認',uncertain:'結果待確認',sent:'已送出或已核對',closed:'已結案'};
const noticeChannels = {not_sent:'尚未發送',sending:'結果待確認',sent:'服務已接受',uncertain:'結果待確認',skipped:'不需發送',unbound:'未綁定 LINE',rejected:'服務拒絕'};
function historySection(title,rows,render){
 const content=rows.length ? rows.map(render).join('') : '<p class="item-meta">本頁沒有紀錄。</p>';
 return `<section class="activity-history"><h4>${title}</h4>${content}</section>`;
}
function purchaseHistory(row){
 const payment=state(row.paymentStatus);
 const amount=row.price==null||row.price===''?'金額待核對':'$'+esc(row.price);
 const awarded=row.awarded===1||row.awarded===true;
 const reward=awarded ? `已加 ${row.stars} 星，已建立 ${row.balls} 顆按摩球的贈品紀錄` : state(row.state);
 const check=row.state==='review' ? '請用此購卡單號核對 OB 最新付款與退款紀錄，再核對活動獎勵。' : '';
 return `<p>${stamp(row.at)} · 購卡 #${esc(row.id)}<br>活動留存的付款狀態：${esc(payment)} · ${amount}<br>${esc(reward)}${check?'<br>'+check:''}</p>`;
}
function venueHistory(classes){
 const rooms=classes?.rooms;
 const complete=Array.isArray(rooms)&&rooms.length===4&&rooms.every(r=>r&&/^[ABCD]館$/.test(r.label)&&Number.isSafeInteger(r.count)&&r.count>=0)&&new Set(rooms.map(r=>r.label)).size===4;
 if(!complete)return '<p class="item-meta">四館課次尚待最新同步核對。</p>';
 const counts=rooms.map(r=>r.label+' '+r.count+' 堂'+(r.count<2?'（還差 '+(2-r.count)+' 堂）':'（已達標）'));
 const rounds=Number.isSafeInteger(classes.rounds)&&classes.rounds>=0?'已兌換 '+classes.rounds+' 輪 · ':'';
 return '<p>四館尚未兌換課次：'+counts.join('／')+'</p><p class="item-meta">'+rounds+'上課資料截至 '+stamp(classes.through)+'</p>';
}
function studentHistoryHTML(d,offset){
 const a=d.activity;
 const sections=[`<p><strong>${esc(d.email)}</strong> · 第 ${Math.floor(offset/50)+1} 頁</p>`];
 if(a.available){
  sections.push(`<p>可用星星 <b>${esc(a.balance)}</b> 顆</p>`,venueHistory(a.progress?.classes));
  const kinds={purchase:'購卡',redeem:'兌換抽獎',activity:'活動異動',photo:'限動打卡',referral:'新生推薦',venues:'四館集課'};
  sections.push(historySection('星星異動',a.stars,r=>`<p>${stamp(r.at)} · ${r.delta>0?'+':''}${esc(r.delta)} 顆 · ${esc(kinds[r.kind]||'活動異動')}</p>`));
  sections.push(historySection('購卡核對',a.purchases,purchaseHistory));
  if(a.progress?.purchases){
   sections.push('<p class="item-meta">購卡資料截至 '+stamp(a.progress.purchases.through)+(a.progress.purchases.stale?'，等待同步更新。':'')+'</p>');
  }else{
   sections.push('<p class="item-meta">購卡名單尚待確認最新同步時間。</p>');
  }
  sections.push(historySection('照片／推薦',a.reviews,r=>`<p>${stamp(r.at)} · ${r.kind==='photo'?'照片':'推薦人申請'} · ${esc(state(r.state))}</p>`));
  sections.push(historySection('抽獎進度',a.draws,r=>`<p>建立於 ${stamp(r.at)} · 最近記錄：${recordedDrawState(r.state)}</p>`));

 }else{
  const reasons={identity_not_verified:'尚無已驗證的 LINE／OB 配對，可先查看下方領獎紀錄。',identity_conflict:'身分配對不唯一，請先核對。'};
  sections.push('<p class="state">'+(Object.hasOwn(reasons,a.reason)?reasons[a.reason]:'活動端暫時無法讀取，請稍後查詢。')+'</p>');
 }
 sections.push(historySection('獎品與領取',d.claims,r=>r.floorCourse===true
  ? `<p><b>${esc(r.prizeName)}</b> · 無須選館<br>${r.status==='claimed'?'已發課卡':r.status==='cancelled'?'已撤銷':'待兌換'}</p>`
  : `<p><b>${esc(r.prizeName)}</b> · ${esc(r.venue)}<br>${esc(state(r.status))} · 已領 ${esc(r.claimed)}／${esc(r.total)} 件</p>`));
 if(d.claims.some(r=>r.floorCourse!==true&&(r.status==='ready'||r.status==='partial'))){
  sections.push('<p class="item-meta">交付前請到「學生領獎」按「查詢學生」，確認領取期限與目前可領件數。</p>');
 }
 const actions={import:'同步',prepare:'到館',collect:'領取','collect-balls':'合併領球','redeem-floor':'已發地板課卡','correct-floor':'更正地板課發卡',correct:'更正',revoke:'撤銷',restore:'恢復','resolve-source':'來源核對'};
 sections.push(historySection('領獎操作',d.events,r=>`<p>${stamp(r.at)} · ${esc(r.actor)} · ${esc(actions[r.action]||r.action)}${r.reason?' · '+esc(r.reason):''}</p>`));
 sections.push(historySection('通知紀錄',d.notifications,r=>{
  const channels=r.channels.map(c=>esc(({line:'LINE',ob:'OB',email:'Email'})[c.name]||c.name)+'：'+esc(noticeChannels[c.status]||'待核對'));
  return `<p>${stamp(r.at)} · ${r.kind==='ready'?'領獎通知':'抽獎通知'} · ${esc(noticeJobs[r.status]||'待核對')}${channels.length?'<br>'+channels.join(' · '):''}</p>`;
 }));
 sections.push('<div class="admin-item-actions">'+(offset?button('history-prev','上一頁'):'')+(d.nextOffset!==null?button('history-next','下一頁'):'')+'</div>');
 return sections.join('');
}
function labelsHTML(rows){return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>備貨姓名貼</title><style>@page{size:A4;margin:10mm}body{font:14px sans-serif;color:#292524;margin:0}.labels{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.label{border:1px dashed #aaa;padding:5mm;break-inside:avoid;overflow-wrap:anywhere}.label h2{font-size:20px;margin:0 0 3mm}.label p{margin:2mm 0}.meta{color:#666;font-size:12px}</style><div class="labels">${rows.map(r=>`<section class="label"><h2>${esc(r.studentName)}</h2><p>${esc(r.email)}</p><p><b>${esc(r.prizeName)}</b></p><p>${esc(r.quantity)} 件 · ${esc(r.venue)}</p><p class="meta">備貨標籤，實際交付仍須在系統登記</p></section>`).join('')}</div></html>`;}
async function runArrivalBatch(rows,send,batchId,alive=()=>true,onResult=()=>{}){
 const results=[];let stopped=false;
 for(let i=0;i<rows.length;i++){
  if(!alive()){stopped=true;break;}
  const row=rows[i];let outcome;
  try{const r=await send({action:'prepare',claimId:row.id,version:row.version,venue:row.venue,requestId:batchId+'_'+i});
   if(r.claimId!==row.id||r.version!==row.version+1||r.status!=='ready')throw Error('回應不完整');
   outcome={row,ready:true,notified:r.notification?.status==='sent'};
   if(!outcome.notified)stopped=true;
  }catch(e){outcome={row,ready:false,notified:false,unknown:true};stopped=true;}
  results.push(outcome);onResult(results);if(stopped)break;
 }
 return{results,stopped};
}
function mount(root,{api,campaignId,readOnly}){
 let disposed=false,busy=false,page=0,packing=null,packingFilters={},preview=null,arrivalReceipt=null,stock=null,draft=null,request=null,historyEmail='',historyOffset=0,historyNext=null,templates=[],incompleteOffset=0,incompleteNext=null;
 root.className='admin-control activity-tools';root.innerHTML=`<h3>備貨與活動管理</h3><p class="item-meta">店長常用工具。姓名貼含學生 Email，請僅用於備貨。</p><nav class="admin-item-actions" aria-label="活動管理工具">${button('packing','備貨／姓名貼')}${button('history','學生活動紀錄')}${button('incomplete','未完成抽獎')}${button('inventory','庫存提醒')}${button('templates','下次活動草稿')}</nav><div data-tool-status role="status" aria-live="polite"></div><div data-tool-body><p class="item-meta">選擇上方工具開始操作。</p></div>`;
 const body=root.querySelector('[data-tool-body]'),notice=root.querySelector('[data-tool-status]'),value=k=>body.querySelector(`[data-field="${k}"]`)?.value||'',selected=()=>packing.rows.filter((r,i)=>body.querySelector(`[data-pick="${i}"]`)?.checked);
 const filters=()=>({venue:value('venue'),prizeName:value('prize'),state:value('state')});
 const selectionsMatch=(a,b)=>Array.isArray(b)&&a.length===b.length&&a.every((row,i)=>
  row.id===b[i]?.id&&row.version===b[i].version&&row.venue===b[i].venue&&b[i].status==='waiting');
 const packingFiltersChanged=()=>Object.entries(filters()).some(([key,value])=>value!==(packingFilters[key]||''));
 async function run(fn){
  if(disposed||busy)return;
  busy=true;notice.textContent='處理中…';
  const controls=[...root.querySelectorAll('button,input,select')].filter(control=>!control.disabled);
  controls.forEach(control=>control.disabled=true);
  try{
   await fn();
   if(!disposed&&notice.textContent==='處理中…')notice.textContent='';
  }catch(e){
   if(!disposed)notice.textContent=e.message||'未完成，請更新清單核對。';
  }finally{
   busy=false;
   if(!disposed)controls.forEach(control=>control.disabled=false);
  }
 }
 function rowsHTML(rows,checks=false){return rows.map((r,i)=>`<article class="activity-tool-row">${checks?`<input type="checkbox" data-pick="${i}" aria-label="選擇 ${esc(r.studentName+' '+r.prizeName)}">`:''}<div><strong>${esc(r.studentName)}</strong><div class="item-meta">${esc(r.email)}</div><p>${esc(r.prizeName)} · ${esc(r.quantity)} 件<br>${esc(r.venue)} · ${esc(state(r.status))}</p></div></article>`).join('');}
 function paintArrivalReceipt(){
  const box=body.querySelector('[data-arrival-receipt]');
  if(!box||!arrivalReceipt)return;
  const {rows,results,finished}=arrivalReceipt;
  const remaining=rows.length-results.length;
  box.innerHTML='<h4>最近一批到館結果</h4><ul>'+rows.map((row,index)=>{
   const result=results[index];
   const status=result?.notified?'已到館，通知服務已接受':result?.ready?'已到館，通知需核對':
    result?'結果待確認，請查閱紀錄，勿重送':finished?'本批未送出':'等待處理';
   return `<li><strong>${esc(row.studentName)}</strong> · ${esc(row.prizeName)} · ${esc(row.venue)}<br>${status}</li>`;
  }).join('')+'</ul>'+(finished?`<p>共 ${rows.length} 筆，${remaining} 筆未送出。</p>`+
   button('packing-refresh','重新讀取備貨清單'):'');
 }
 async function loadPacking(offset=0,f={}){const d=await api('getActivityPacking',{campaignId,offset,...f});if(disposed)return;packing=d;page=offset;packingFilters=f;preview=null;
  body.innerHTML=`<h4>備貨／姓名貼</h4><div class="activity-tool-grid">${select('venue','領取館別',d.venues,f.venue)}${select('prize','獎品',d.prizes,f.prizeName)}${field('state','狀態',`<select class="admin-select" data-field="state"><option value="">待備貨與待領</option><option value="waiting" ${f.state==='waiting'?'selected':''}>待備貨</option><option value="ready" ${f.state==='ready'?'selected':''}>已到館</option><option value="partial" ${f.state==='partial'?'selected':''}>部分領取</option></select>`)}</div><div class="admin-item-actions">${button('filter','套用篩選')}${button('select-page','勾選本頁')}${readOnly?'':button('select-waiting','勾選本頁待備貨')}${button('clear','取消勾選')}${button('print','列印勾選姓名貼')}${readOnly?'':button('arrival-preview','核對勾選項目到館')}</div><p class="item-meta">共 ${d.total} 筆；第 ${Math.floor(offset/50)+1} 頁。姓名貼每筆一張；一次最多確認到館 10 筆。</p>${rowsHTML(d.rows,true)||'<p>目前沒有符合的待領獎品。</p>'}<div class="admin-item-actions">${offset?button('pack-prev','上一頁'):''}${d.nextOffset!==null?button('pack-next','下一頁'):''}</div><div data-arrival-preview></div><section data-arrival-receipt aria-live="polite"></section>`;
  paintArrivalReceipt();
 }
 async function history(offset=0,email=historyEmail){
  const d=await api('getActivityStudentHistory',{campaignId,email,offset});
  if(disposed)return;
  if(d.email!==email)throw Error('回傳的 Email 與查詢不符，請重新核對。');
  historyEmail=email;historyOffset=offset;historyNext=d.nextOffset;
  body.querySelector('[data-history-result]').innerHTML=studentHistoryHTML(d,offset);
 }
 async function incomplete(offset=0){const d=await api('getActivityIncompleteDraws',{campaignId,offset});if(disposed)return;incompleteOffset=offset;incompleteNext=d.nextOffset;
  body.innerHTML='<h4>未完成抽獎</h4><p class="item-meta">依最早扣星時間排列。此頁只供核對，不會扣星、抽獎或替學生選獎。請學生在官方 LINE 輸入「星星抽獎」，會優先接續原紀錄；結果待核對的項目請先查原交易。</p>'+d.rows.map(r=>`<article class="activity-tool-row"><div><strong>${esc(r.studentName)}</strong><p>${esc(r.email)}<br>${stamp(r.at)} · ${drawState(r.state)}</p><p class="item-meta">紀錄：${esc(r.operationId)}</p></div></article>`).join('')+(d.rows.length?'':'<p>目前沒有未完成的抽獎。</p>')+'<div class="admin-item-actions">'+(offset?button('incomplete-prev','上一頁'):'')+(d.nextOffset!==null?button('incomplete-next','下一頁'):'')+button('incomplete','重新查詢')+'</div>';
 }
 async function inventory(){const d=await api('getActivityInventory',{campaignId});if(disposed)return;stock=d;request=null;body.innerHTML=`<h4>庫存與提醒</h4><p class="item-meta">「可用」已扣除學生選走的獎品，不會再扣一次待領數。待領／已交付顯示已同步到教室系統的紀錄。</p><label><input type="checkbox" data-stock-enabled ${d.settings.enabled?'checked':''}> 低庫存時通知 Tako 的系統收件匣</label><p class="item-meta">門檻預設 5 件，可逐項修改。啟用後於備貨同步時檢查；同一段缺貨期間不重複通知，不傳學生 LINE。</p>${d.rows.map((r,i)=>`<article class="activity-tool-row"><div><strong>${esc(r.name)}</strong> ${r.low?'<span class="status-pill">低庫存</span>':''}<p>可用 <b>${r.available}</b>／總量 ${r.total} · 已配置 ${r.allocated}<br>已同步待領 ${r.reserved} · 已交付 ${r.claimed}${r.enabled?'':' · 獎項停用'}</p><label>提醒門檻 <input class="text-input" type="number" min="0" max="10000" value="${r.threshold}" data-threshold="${i}"></label></div></article>`).join('')}<div class="admin-item-actions">${readOnly?'':button('stock-save','儲存提醒設定')}${button('inventory','重新核對庫存')}</div>`;}
 async function drafts(){const d=await api('getActivityTemplates',{campaignId});if(disposed)return;templates=d.drafts;draft=null;request=null;body.innerHTML=`<h4>下次活動草稿</h4><p>複製獎品、機率與集星規則；日期、庫存、折扣碼與資料來源留待確認。草稿不會啟用，也不會帶入學生資料。</p>${field('draft-name','新活動名稱')}<div class="admin-item-actions">${button('draft-preview','預覽複製內容')}</div><div data-draft-preview></div><h4>已保存的草稿</h4>${templates.map((t,i)=>`<article class="activity-tool-row"><div><strong>${esc(t.draft.name)}</strong><p class="item-meta">${stamp(t.at)} · 停用草稿 · ${t.draft.prizes.length} 個獎項</p>${button('download-'+i,'下載完整草稿')}</div></article>`).join('')||'<p class="item-meta">尚未保存草稿。</p>'}`;}
 root.onclick=e=>{const b=e.target.closest('[data-tool]');if(!b||busy||disposed)return;const action=b.dataset.tool;
  if(['select-page','select-waiting','clear'].includes(action)){
   body.querySelectorAll('[data-pick]').forEach(c=>{
    c.checked=action==='select-page'||action==='select-waiting'&&packing.rows[Number(c.dataset.pick)].status==='waiting';
   });
   clearArrivalPreview();
   return;
  }
  if(['print','arrival-preview','pack-next','pack-prev','packing-refresh'].includes(action)&&packingFiltersChanged()){
   notice.textContent='篩選條件已變更，請先套用篩選。';
   return;
  }
  if(action==='print'){const rows=selected();if(!rows.length){notice.textContent='請先勾選要列印的項目。';return;}const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-10000px;width:800px;height:1000px';frame.title='備貨姓名貼';frame.onload=()=>{frame.contentWindow.focus();frame.contentWindow.print();setTimeout(()=>frame.remove(),60000);};frame.srcdoc=labelsHTML(rows);document.body.appendChild(frame);return;}
  if(action.startsWith('download-')){const t=templates[Number(action.split('-')[1])];if(!t)return;const url=URL.createObjectURL(new Blob([JSON.stringify(t.draft,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='activity-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
  run(async()=>{
   if(action==='packing')await loadPacking();
   else if(action==='packing-refresh')await loadPacking(0,packingFilters);
   else if(['filter','pack-next','pack-prev'].includes(action))await loadPacking(action==='filter'?0:action==='pack-next'?packing.nextOffset:Math.max(0,page-50),action==='filter'?filters():packingFilters);
   else if(action==='arrival-preview'){clearArrivalPreview();const rows=selected();if(rows.length<1||rows.length>10)throw Error('請選 1 至 10 筆已經送到教室的獎品。');if(rows.some(row=>row.status!=='waiting'))throw Error('到館登記只適用待備貨項目，請用「勾選本頁待備貨」重新選取。');const d=await api('previewActivityArrival',{operation:JSON.stringify({campaignId,items:rows.map(r=>({id:r.id,version:r.version,venue:r.venue}))})});if(disposed)return;
    if(packingFiltersChanged()||!selectionsMatch(rows,selected())||!selectionsMatch(rows,d?.rows))throw Error('勾選或備貨資料已變更，請重新核對。');
    preview={rows:d.rows,batchId:id()};body.querySelector('[data-arrival-preview]').innerHTML='<h4>確認以下獎品均已到館</h4>'+rowsHTML(d.rows)+'<p>確認後將逐筆登記到館並通知學生。結果不明時會停止剩餘項目。</p>'+button('arrival-send','確認到館並通知學生')+button('arrival-cancel','取消');}
   else if(action==='arrival-cancel'){preview=null;body.querySelector('[data-arrival-preview]').replaceChildren();}
   else if(action==='arrival-send'){
    if(!preview||packingFiltersChanged()||!selectionsMatch(preview.rows,selected()))throw Error('請重新核對選取項目。');
    const batch=preview;
    clearArrivalPreview();
    arrivalReceipt={rows:batch.rows,results:[],finished:false};
    paintArrivalReceipt();
    const outcome=await runArrivalBatch(batch.rows,
     op=>api('prepareActivityArrival',{operation:JSON.stringify({...op,campaignId})}),
     batch.batchId,()=>!disposed,results=>{
      if(disposed)return;
      arrivalReceipt.results=results;
      paintArrivalReceipt();
     });
    if(disposed)return;
    arrivalReceipt.finished=true;
    paintArrivalReceipt();
    notice.textContent=outcome.stopped?'本批已停止。請依逐筆結果核對備貨及通知紀錄。':'本批已處理。';
    body.querySelectorAll('[data-pick]').forEach(c=>c.checked=false);
   }
   else if(action==='incomplete')await incomplete();
   else if(action==='incomplete-next')await incomplete(incompleteNext);
   else if(action==='incomplete-prev')await incomplete(Math.max(0,incompleteOffset-50));
   else if(action==='history'){body.innerHTML='<h4>學生活動紀錄</h4>'+field('email','完整 OB Email','<input class="text-input" type="email" data-field="email" autocomplete="off" maxlength="100">')+button('history-search','查詢完整紀錄')+'<div data-history-result></div>';}
   else if(action==='history-search'){
    const input=body.querySelector('[data-field="email"]'),email=input.value.trim().toLowerCase();
    body.querySelector('[data-history-result]').textContent='';
    if(!email||input.validity.typeMismatch)throw Error('請輸入完整 OB Email。');
    await history(0,email);
   }
   else if(action==='history-next'||action==='history-prev'){
    if(value('email').trim().toLowerCase()!==historyEmail)throw Error('Email 已變更，請重新查詢。');
    await history(action==='history-next'?historyNext:Math.max(0,historyOffset-50));
   }
   else if(action==='inventory')await inventory();
   else if(action==='stock-save'){const thresholds={};stock.rows.forEach((r,i)=>{const el=body.querySelector(`[data-threshold="${i}"]`);if(!el.value||!el.checkValidity())throw Error('請填寫 0 至 10000 的整數門檻。');thresholds[r.id]=Number(el.value);});request??=id();await api('saveActivityInventory',{operation:JSON.stringify({campaignId,requestId:request,version:stock.settings.version,enabled:body.querySelector('[data-stock-enabled]').checked,thresholds})});await inventory();notice.textContent='提醒設定已保存。';}
   else if(action==='templates')await drafts();
   else if(action==='draft-preview'){const name=value('draft-name').trim(),d=await api('previewActivityTemplate',{campaignId,name});if(disposed)return;draft={...d,name};request=id();body.querySelector('[data-draft-preview]').innerHTML=`<div class="state"><b>${esc(name)}</b> · ${d.draft.prizes.length} 個獎項<br>停用草稿，全部庫存歸零；不搬學生或中獎紀錄。<br>${d.draft.rules.starsPerDraw} 星抽一次。<br>${d.draft.rules.purchaseRules.map(r=>r.points+' 點：'+r.stars+' 星／'+r.balls+' 球').join('；')}<p>待確認：${esc(d.draft.requiresConfirmation.join('、'))}</p>${readOnly?'':button('draft-save','確認保存停用草稿')}</div>`;}
   else if(action==='draft-save'){if(!draft)throw Error('請先預覽草稿。');await api('saveActivityTemplate',{operation:JSON.stringify({campaignId,name:draft.name,previewToken:draft.previewToken,requestId:request})});await drafts();notice.textContent='草稿已保存，尚未啟用。';}
  });
 };
 function clearArrivalPreview(){
  if(!preview)return;
  preview=null;
  body.querySelector('[data-arrival-preview]')?.replaceChildren();
 }
 const clearOnChange=e=>{
  if(e.target.matches('[data-pick],[data-field="venue"],[data-field="prize"],[data-field="state"]'))clearArrivalPreview();
 };
 const clearHistoryOnInput=e=>{
  if(e.target.matches('[data-field="email"]')&&value('email').trim().toLowerCase()!==historyEmail){
   body.querySelector('[data-history-result]').textContent='';
  }
 };
 root.addEventListener('change',clearOnChange);
 root.addEventListener('input',clearHistoryOnInput);
 return()=>{
  disposed=true;root.onclick=null;
  root.removeEventListener('change',clearOnChange);
  root.removeEventListener('input',clearHistoryOnInput);
  root.replaceChildren();
 };
}
global.SherryActivityTools={mount,labelsHTML,runArrivalBatch,studentHistoryHTML};
})(typeof window!=='undefined'?window:globalThis);
