(function(global){
  'use strict';
  const safe=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,150}$/.test(v);
  const fingerprint=v=>typeof v==='string'&&/^[A-Za-z0-9+/]{43}=$/.test(v);
  const labels={photo:'聖誕打卡',referral:'新朋友推薦'},states={queued:'核對中',working:'核對中',manual:'待老師核對',review:'資料需確認',complete:'已完成',rejected:'未通過',superseded:'已有新版'};
  const confirmations={photo:'已在原 LINE 截圖確認符合活動的衣著／聖誕元素，且有 @sherryaerial 標註',trial:'已確認是活動期間內完成且未取消的體驗課',first_point_card:'已確認新朋友以前沒有買過 16／36／60／100 點課卡',card_type:'已核對這次購買的是符合活動的課卡'};
  const escape=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function createController({api,storage,actor,id=()=>global.crypto.randomUUID(),isActive=()=>true}){
    if(!['冠蓉','Tako'].includes(actor))throw Error('目前帳號未開放活動審核。');
    const key='sherry-task-review-pending:'+actor;let busy=false;
    const active=()=>{if(!isActive())throw Error('頁面或登入帳號已變更，這次沒有繼續送出。');};
    function pending(){
      let p;try{p=JSON.parse(storage.getItem(key)||'null');}catch{throw Error('審核操作紀錄無法讀取，請先聯繫管理員，勿重送。');}
      if(p&&(!['decide','refresh'].includes(p.action)||p.actor!==actor||!safe(p.id)||p.fingerprint!==null&&!fingerprint(p.fingerprint)||p.action==='decide'&&(!safe(p.decisionId)||!['approve','reject'].includes(p.decision)||!Array.isArray(p.confirm)||p.confirm.some(k=>!Object.hasOwn(confirmations,k)))))throw Error('審核操作紀錄不完整，請先核對，勿重送。');return p;
    }
    async function rpc(action,input){
      active();const r=await api('productionTaskApp',{reviewAction:action,operation:JSON.stringify(input),expectedActor:actor});active();
      if(!r||r.ok!==true||r.actor!==actor||r.sourceChecked!==true||typeof r.readOnly!=='boolean'||!['disabled','active'].includes(r.phase)||r.phase==='disabled'&&!r.readOnly)throw Error('尚未取得完整核對資料，不能視為沒有申請。');
      if(action==='list'&&(!Array.isArray(r.items)||r.items.length>20||r.items.some(v=>!v||!safe(v.id)||!['photo','referral'].includes(v.kind))||r.after!==null&&!safe(r.after)))throw Error('申請清單不完整，請重新查詢。');
      if(action!=='list'&&(!r.item||!safe(r.item.id)||!['photo','referral'].includes(r.item.kind)))throw Error('這筆申請資料不完整，請重新查詢。');return r;
    }
    const locked=async fn=>{if(busy)throw Error('前一筆操作仍在處理中。');busy=true;try{return await fn();}finally{busy=false;}};
    function outcome(op,r){
      const row=r.item;
      if(row.id!==op.id)throw Error('回覆的申請不符，請保留紀錄查詢。');
      if(op.action==='refresh'&&(row.fingerprint!==op.fingerprint||['queued','working'].includes(row.state))){storage.removeItem(key);return {kind:'refreshed',response:r};}
      if(op.action==='decide'&&row.review){
        if(row.review.decisionId===op.decisionId&&row.review.decision===op.decision){
          if(row.state==='complete'||row.state==='rejected'){storage.removeItem(key);return {kind:'complete',response:r};}
          return {kind:'pending',canRetry:r.readOnly===false&&row.canDecide===true,response:r};
        }
        storage.removeItem(key);return {kind:'conflict',response:r};
      }
      if(row.fingerprint!==op.fingerprint||row.state==='superseded'){storage.removeItem(key);return {kind:'superseded',response:r};}
      return {kind:'not_recorded',canRetry:r.readOnly===false&&(op.action==='decide'?row.canDecide===true:row.canRefresh===true),response:r};
    }
    const inspect=async op=>outcome(op,await rpc('status',{id:op.id}));
    async function send(op){
      const body=op.action==='decide'?{id:op.id,fingerprint:op.fingerprint,decision:op.decision,decisionId:op.decisionId,confirm:op.confirm}:{id:op.id,fingerprint:op.fingerprint};
      return outcome(op,await rpc(op.action,body));
    }
    async function start(row,action,decision,confirm=[]){
      return locked(async()=>{
        active();if(pending())throw Error('上一筆結果尚未確認，請先查詢原申請。');if(!row||!safe(row.id)||row.fingerprint!==null&&!fingerprint(row.fingerprint))throw Error('請重新讀取這筆申請。');
        const fresh=await rpc('read',{id:row.id}),current=fresh.item;
        if(fresh.readOnly||current.fingerprint!==row.fingerprint||(action==='decide'?current.canDecide!==true:current.canRefresh!==true))throw Error('目前為唯讀或申請已更新，請重新查看。');
        const resume=action==='decide'&&current.review;
        if(resume&&(decision!=='approve'||current.review.decision!=='approve'||current.review.actor!==({Tako:'45','冠蓉':'9'})[actor]||!safe(current.review.decisionId)))throw Error('這筆已有核對紀錄，請由原核准老師續處理。');
        if(resume)confirm=current.requiredConfirm;
        if(action==='decide'&&(!['approve','reject'].includes(decision)||decision==='approve'&&(!Array.isArray(current.requiredConfirm)||current.requiredConfirm.some(k=>!Object.hasOwn(confirmations,k)||!confirm.includes(k)))))throw Error('請先完成這筆申請的核對勾選。');
        const op={actor,action,id:current.id,fingerprint:current.fingerprint,...(action==='decide'?{decision,decisionId:resume?current.review.decisionId:id(),confirm:confirm.filter(k=>Object.hasOwn(confirmations,k))}:{})};
        storage.setItem(key,JSON.stringify(op));active();return send(op);
      });
    }
    return {pending,list:after=>rpc('list',after?{after}:{}),read:id=>rpc('read',{id}),decide:(row,decision,confirm)=>start(row,'decide',decision,confirm),refresh:row=>start(row,'refresh'),
      reconcile:()=>locked(async()=>{const p=pending();return p?inspect(p):{kind:'none'};}),
      retry:()=>locked(async()=>{const p=pending();if(!p)throw Error('沒有待核對的原操作。');const r=await inspect(p);if(!['not_recorded','pending'].includes(r.kind)||!r.canRetry)return r;active();return send(p);})};
  }
  const when=value=>Number.isSafeInteger(value)&&value>0?new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)):'待確認';
  function renderItems(items,{readOnly=true,query='',type='',state=''}={}){
    if(!Array.isArray(items)||items.length>500)throw Error('申請清單不完整。');
    const needle=String(query).trim().toLowerCase();
    return items.filter(r=>(!type||r.kind===type)&&(!state||r.state===state||state==='queued'&&r.state==='working')&&(!needle||[r.member?.studentName,r.member?.email,r.subject?.studentName,r.subject?.email].some(s=>String(s||'').toLowerCase().includes(needle)))).map(r=>{
      const e=r.evidence||{},p=e.purchase,trial=e.trial,proof=e.verifiedRows?.find(v=>v.bookingStatus==='active'&&v.classStatus==='active'),canDecide=!readOnly&&r.canDecide===true,resume=canDecide&&r.review?.decision==='approve';
      const findingLabels={yes:'看得見',no:'未看到',uncertain:'待確認'},findings=[['festiveClothing','活動衣著'],['christmasElements','聖誕元素'],['studioTag','教室標註']].map(([k,label])=>`<li>${label}：${Object.hasOwn(findingLabels,r.ai?.findings?.[k])?findingLabels[r.ai.findings[k]]:'待確認'}</li>`).join('');
      const evidence=r.kind==='photo'?`<p>${proof?'已核對同日有效預約：'+escape(when(proof.startsAt)):'同日預約仍待核對'}</p><ul>${findings}</ul><p>照片初判：${escape(r.ai?.reason||'請老師至學生原 LINE 對話核對截圖。')}</p>`:`<p>新朋友：${escape(r.subject?.studentName||'待核對')} · ${escape(r.subject?.email||'')}</p><p>購卡：${p?.paymentStatus==='paid'&&p?.price>0?'已付款，金額 '+escape(p.price):'付款／金額需確認'}</p><p>體驗課：${trial?.isTrial===true?'已確認':trial?.isTrial===false?'不符合':'需老師確認'}${trial?.endsAt?' · '+escape(when(trial.endsAt))+' 結束':''}</p><p>${Number.isSafeInteger(e.historyCount)?'已取得 '+e.historyCount+' 筆購卡紀錄。':''}${e.historyCoverageVerified===true?'已核對完整購卡歷史':'完整購卡歷史仍需老師核對'}</p>`;
      const checks=canDecide&&!resume?`<div class="ptasks-checks">${(r.requiredConfirm||[]).filter(k=>Object.hasOwn(confirmations,k)).map(k=>`<label><input type="checkbox" data-task-confirm="${escape(k)}"> <span>${escape(confirmations[k])}</span></label>`).join('')}</div>`:'';
      const actions=canDecide?`${checks}<div class="ptasks-actions"><button type="button" class="compact-button" data-task-decide="approve">${resume?'續處理已核准申請':'核准並加 '+(r.kind==='photo'?1:3)+' 顆星星'}</button>${resume?'':'<button type="button" class="compact-button" data-task-decide="reject">退回申請（不加星）</button>'}</div>`:'';
      return `<article class="ptasks-card" data-task-id="${escape(r.id)}"><div class="ptasks-row"><strong>${escape(labels[r.kind]||'活動申請')}</strong><span class="status-pill">${escape(states[r.state]||'狀態需確認')}</span></div><h4>${escape(r.member?.studentName||'會員待核對')}</h4><p class="item-meta">${escape(r.member?.email||'')} · ${escape(when(r.submittedAt))} 提交</p>${r.award?`<p>已發放 ${escape(r.award.stars)} 顆星星</p>`:''}<details><summary>查看核對紀錄</summary>${evidence}${r.kind==='photo'?'<p class="item-meta">需要人工確認時，請核對學生原 LINE 對話中的這張截圖；此處不會再次呼叫 AI。</p>':''}</details>${actions}${!readOnly&&r.canRefresh===true?'<button type="button" class="compact-button" data-task-refresh>重新核對 OB 資料</button>':''}${r.state==='manual'&&!canDecide?'<p class="item-meta">'+(r.review?.decision==='approve'?'已有核准紀錄；尚未完成的部分請由原核准老師續處理。':'目前僅供查看；資料或審核權限尚未就緒時不會加星。')+'</p>':''}</article>`;
    }).join('')||'<p class="state">目前載入的紀錄中，沒有符合條件的申請。</p>';
  }
  function mount(root,{api,actor,storage=global.localStorage}){
    let disposed=false,busy=false,records=[],after=null,readOnly=true,retryAllowed=false,serial=0,loaded=false,storageError='',draft=null;
    const controller=createController({api,actor,storage,isActive:()=>!disposed});
    root.dataset.productionTaskReview='';root.classList.add('admin-control');root.setAttribute('aria-label','活動申請審核');
    root.innerHTML=`<style>[data-production-task-review]{min-width:0;overflow-wrap:anywhere}[data-production-task-review] .ptasks-row,[data-production-task-review] .ptasks-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}[data-production-task-review] .ptasks-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;margin:16px 0}[data-production-task-review] label{display:flex;gap:8px;align-items:flex-start;min-width:0}[data-production-task-review] .ptasks-filters label{display:grid;gap:6px}[data-production-task-review] input:not([type=checkbox]),[data-production-task-review] select{width:100%;min-width:0;box-sizing:border-box}[data-production-task-review] input[type=checkbox]{width:18px;min-width:18px;height:18px;margin-top:3px}[data-production-task-review] .ptasks-card{border:1px solid #ded7cf;border-radius:14px;padding:18px;margin:14px 0;background:#fffefa}[data-production-task-review] h4{margin:12px 0 4px}[data-production-task-review] details{padding:10px 0}[data-production-task-review] summary{cursor:pointer;font-weight:600}[data-production-task-review] .ptasks-checks{display:grid;gap:12px;margin:14px 0}[data-production-task-review] .ptasks-actions{justify-content:flex-start;margin:12px 0}[data-production-task-review] button{max-width:100%;white-space:normal}</style><div class="ptasks-row"><h3>活動申請審核</h3><button type="button" class="compact-button" data-tasks-load>更新申請清單</button></div><p class="item-meta">系統先自動核對，需要老師確認的申請會列在這裡。沿用目前登入，不需要再輸入帳密。</p><p data-tasks-phase class="state">正在讀取活動申請…</p><p data-tasks-message role="status" aria-live="polite"></p><div class="ptasks-actions"><button type="button" class="compact-button" data-tasks-reconcile hidden>查詢上一筆結果</button><button type="button" class="compact-button" data-tasks-retry hidden>確認同筆重送</button></div><div class="ptasks-filters"><label>搜尋已載入紀錄<input data-tasks-search type="search" placeholder="學生姓名或 Email"></label><label>活動類別<select data-tasks-type><option value="">全部類別</option><option value="photo">聖誕打卡</option><option value="referral">新朋友推薦</option></select></label><label>處理狀態<select data-tasks-state><option value="">全部狀態</option><option value="manual">待老師核對</option><option value="review">資料需確認</option><option value="queued">核對中</option><option value="complete">已完成</option><option value="rejected">未通過</option></select></label></div><div data-tasks-list></div><button type="button" class="compact-button" data-tasks-more hidden>載入更多申請</button><p data-tasks-count class="item-meta"></p>`;
    const node=s=>root.querySelector(s),message=t=>{if(!disposed)node('[data-tasks-message]').textContent=t;};
    const peek=()=>{try{return controller.pending();}catch(e){storageError=e.message;return null;}};
    function paint(){
      if(disposed)return;const pending=peek();
      node('[data-tasks-list]').innerHTML=loaded?renderItems(records,{readOnly,query:node('[data-tasks-search]').value,type:node('[data-tasks-type]').value,state:node('[data-tasks-state]').value}):'<p class="state">尚未取得申請資料，請查看查詢狀態。</p>';
      if(draft){
        const card=[...root.querySelectorAll('[data-task-id]')].find(n=>n.dataset.taskId===draft.item.id);
        if(card){const resume=draft.item.review?.decision==='approve',title=draft.action==='refresh'?'確認重新核對':draft.decision==='reject'?'確認不通過':resume?'確認續處理':'確認核准',description=draft.action==='refresh'?'重新核對 OB 資料，不會再次呼叫照片 AI。':draft.decision==='reject'?'這份申請將留下不通過紀錄、不加星；結果不能直接覆寫，請核對學生後再送出。':resume?'只續處理這筆原已核准的紀錄，不會另建核准或重複加星。':'核准後將增加 '+(draft.item.kind==='photo'?1:3)+' 顆星星。';card.insertAdjacentHTML('beforeend',`<section data-tasks-confirmation role="group" aria-label="確認處理申請" style="border:1px solid #d2bda5;background:#fbf5eb;padding:14px;border-radius:10px;margin-top:14px"><strong>${escape(title)}</strong><p>${escape(draft.item.member?.studentName)} · ${escape(draft.item.member?.email)}</p><p>${escape(labels[draft.item.kind])} · ${escape(when(draft.item.submittedAt))} 提交</p><p>${escape(description)}</p><div class="ptasks-actions"><button type="button" class="compact-button" data-task-finalize>${escape(title)}</button><button type="button" class="compact-button" data-task-cancel>取消這次操作</button></div></section>`);card.querySelectorAll('[data-task-confirm]').forEach(n=>n.checked=draft.confirm.includes(n.dataset.taskConfirm));}else draft=null;
      }
      node('[data-tasks-count]').textContent=loaded?`目前載入 ${records.length} 筆${after?'；可繼續載入更多再搜尋。':'。'}`:'';
      node('[data-tasks-more]').hidden=!after;node('[data-tasks-reconcile]').hidden=!pending;node('[data-tasks-retry]').hidden=!pending||!retryAllowed;
      root.querySelectorAll('button,[data-task-confirm]').forEach(b=>b.disabled=busy||(!!pending||!!storageError||!!draft)&&b.matches('[data-task-decide],[data-task-refresh],[data-task-confirm]'));if(storageError)message(storageError);
    }
    function apply(r){readOnly=r.readOnly!==false;node('[data-tasks-phase]').textContent=readOnly?'管理者唯讀預覽：只顯示系統已儲存的紀錄，發星與通知尚未啟用。':'已讀取系統核對紀錄；請核對原始資料後再決定，操作紀錄會保留。';}
    async function load(more=false){
      draft=null;
      const ticket=++serial,r=await controller.list(more?after:null);if(disposed||ticket!==serial)return;apply(r);after=r.after;records=more?[...new Map([...records,...r.items].map(v=>[v.id,v])).values()]:r.items;if(records.length>500)throw Error('載入筆數已達上限，請重新查詢。');loaded=true;paint();
    }
    function result(r){
      retryAllowed=['not_recorded','pending'].includes(r.kind)&&r.canRetry===true;
      if(r.response){apply(r.response);const item=r.response.item;records=records.map(old=>old.id===item.id?item:old);}
      message({complete:'已核對完成，這筆申請不會重複處理。',refreshed:'已更新核對流程，請查看目前狀態；沒有再次呼叫 AI。',superseded:'學生已補傳或申請已更新，已停止舊操作，沒有重送。',conflict:'這筆已有其他處理紀錄，請核對更新後的內容；沒有重送。',pending:retryAllowed?'原核准已記錄，加星尚未完成；可按「確認同筆重送」續處理同一筆紀錄。':'已找到原核准紀錄，結果仍待確認，請稍後再查詢。',not_recorded:retryAllowed?'目前查無原操作完成紀錄；確認資料不變後，可按「確認同筆重送」。':'目前無法確認原操作完成，也未允許重送；請稍後再查詢。',none:''}[r.kind]||'請核對原申請狀態。');paint();
    }
    async function run(fn){if(busy||disposed)return;busy=true;paint();try{await fn();}catch(e){if(!disposed){retryAllowed=false;message((e.message||'目前無法查詢。')+(peek()?' 操作結果尚未確認，請先查詢上一筆結果，勿重複核准。':''));}}finally{busy=false;if(!disposed)paint();}}
    function click(event){
      const b=event.target.closest('button');if(!b||!root.contains(b)||busy)return;
      if(b.matches('[data-task-cancel]')){draft=null;message('已取消這次操作，沒有再送出。');paint();return;}
      if(b.matches('[data-task-finalize]')){const original=draft;if(!original)return;draft=null;return run(async()=>result(await (original.action==='refresh'?controller.refresh(original.item):controller.decide(original.item,original.decision,original.confirm))));}
      if(b.matches('[data-tasks-load]'))return run(()=>load());if(b.matches('[data-tasks-more]'))return run(()=>load(true));
      if(b.matches('[data-tasks-reconcile]'))return run(async()=>result(await controller.reconcile()));if(b.matches('[data-tasks-retry]'))return run(async()=>result(await controller.retry()));
      const card=b.closest('[data-task-id]'),item=records.find(r=>r.id===card?.dataset.taskId);if(!item)return;
      const selected=[...card.querySelectorAll('[data-task-confirm]:checked')].map(n=>n.dataset.taskConfirm);
      if(b.matches('[data-task-decide],[data-task-refresh]')){
        const action=b.matches('[data-task-refresh]')?'refresh':'decide',decision=b.dataset.taskDecide;
        if(readOnly||peek()||storageError)return;
        if(action==='decide'&&decision==='approve'&&!item.review&&(item.requiredConfirm||[]).some(k=>!selected.includes(k))){message('請先完成這筆申請的核對勾選。');return;}
        draft={item:{...item},action,decision,confirm:selected};paint();node('[data-tasks-confirmation]')?.scrollIntoView({block:'nearest'});
      }
    }
    const filter=e=>{if(!disposed&&e.target.matches('[data-tasks-search],[data-tasks-type],[data-tasks-state]')){draft=null;paint();}};root.addEventListener('click',click);root.addEventListener('input',filter);root.addEventListener('change',filter);
    run(async()=>{if(controller.pending())result(await controller.reconcile());await load();});
    return ()=>{disposed=true;serial++;root.removeEventListener('click',click);root.removeEventListener('input',filter);root.removeEventListener('change',filter);root.replaceChildren();};
  }
  const exported={createController,renderItems,mount};global.SherryProductionTasks=exported;if(typeof module!=='undefined'&&module.exports)module.exports=exported;
})(typeof window==='undefined'?globalThis:window);
