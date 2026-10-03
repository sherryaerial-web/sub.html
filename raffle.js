(function (global) {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const statuses = { waiting: '待備貨', ready: '可領取', partial: '部分領取', claimed: '已領取', digital: '電子獎項', cancelled: '已撤銷／取消' };
  const status = value => statuses[value] || '狀態待核對';
  function renderClaims(claims, campaigns, permissions = { readOnly: true }) {
    if (!claims.length) return '<div class="state">查無符合的領獎紀錄。請確認姓名或完整 Email。</div>';
    const groups = new Map();
    claims.forEach(claim => {
      const key = claim.studentKey;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(claim);
    });
    return [...groups.entries()].map(([key, items]) => `<article class="raffle-student admin-control" data-raffle-student="${escape(key)}">
      <h3>${escape(items[0].studentName)}</h3><p class="item-meta">${escape(items[0].maskedEmail)} · 請核對學生身分，同名不代表同一人</p>
      ${items.map(item => `<div class="raffle-prize">
        <div><strong>${escape(item.prizeName)}</strong><span class="status-pill">${escape(status(item.status))}</span></div>
        <p class="item-meta">${escape((campaigns.find(c => c.id === item.campaignId) || {}).name || '')}｜${escape(item.venue || '非實體領取／待確認館別')}｜${escape(item.claimedQuantity || 0)}／${escape(item.quantity || 1)} 件已領</p>
        ${item.claimedAt ? `<p class="item-meta">領取：${escape(item.claimedAt)}｜經手：${escape(item.claimedBy)}</p>` : ''}
        ${item.pickupBlocked && ['waiting','ready','partial'].includes(item.status) ? `<p class="state error">已過領取期限／期限需核對：${escape(item.pickupDeadline)}；暫停備貨與交付，原紀錄保留。</p>` : ''}
        <div class="admin-item-actions">
          ${permissions.readOnly === false && !permissions.pickupBlocked && !item.pickupBlocked && ['ready','partial'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-action="collect" data-claim-id="${escape(item.id)}">確認已領取</button>` : ''}
          ${permissions.readOnly === false && !permissions.pickupBlocked && !item.pickupBlocked && permissions.canPrepare && item.status === 'waiting' ? `<button type="button" class="compact-button" data-raffle-action="prepare" data-claim-id="${escape(item.id)}">這一筆已備妥到館</button>` : ''}
          ${permissions.readOnly === false && permissions.canCorrect && ['waiting','ready','partial'].includes(item.status) && Number(item.claimedQuantity) < Number(item.quantity) ? `<button type="button" class="compact-button" data-raffle-action="revoke" data-claim-id="${escape(item.id)}">撤銷未領部分</button>` : ''}
          ${permissions.readOnly === false && permissions.canCorrect && Number(item.claimedQuantity) > 0 && ['partial','claimed','ready'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-action="correct" data-claim-id="${escape(item.id)}">更正誤領</button>` : ''}
          ${permissions.canCorrect ? `<button type="button" class="compact-button" data-raffle-action="audit" data-claim-id="${escape(item.id)}">操作紀錄</button>` : ''}
        </div>
      </div>`).join('')}</article>`).join('');
  }
  function renderPreview(data) {
    const issues = [...(data.conflicts || []), ...(data.errors || [])];
    return `<div class="admin-control"><h3>核對結果 · 尚未匯入</h3>
      <p>可新增 ${escape(data.additionCount || 0)} 筆 · 已存在 ${escape(data.duplicates || 0)} 筆 · 未選獎品 ${escape(data.pendingSelection || 0)} 筆</p>
      <p>需核對 ${escape(data.conflictCount || 0)} 筆 · 格式錯誤 ${escape(data.errorCount || 0)} 筆</p>
      <p class="item-meta">以下最多顯示 100 筆新增及各 100 筆問題。本次沒有寫入資料、扣庫存或寄信。</p>
      ${issues.map(issue => `<p class="state error">第 ${escape(issue.row)} 列：${escape(issue.message)}</p>`).join('')}
      ${(data.additions || []).map(item => `<div class="raffle-prize"><strong>${escape(item.studentName)}</strong><p>${escape(item.prizeName)}｜${escape(item.venue || '—')}｜${escape(status(item.status))}</p></div>`).join('')}
      ${data.readOnly === false && data.previewToken && data.batchCount > 0 && !data.errorCount && !data.conflictCount ? `<button type="button" class="compact-button" data-raffle-confirm-import>確認匯入前 ${escape(data.batchCount)} 筆（不寄信）</button>` : ''}
    </div>`;
  }
  function renderFulfillment(data, campaigns) {
    if (!data || !data.totals || !data.excluded || !Array.isArray(data.groups) || !Array.isArray(data.claims) || !Number.isInteger(data.offset)) throw Error('未收到完整備貨清單。');
    const groupId = data.group?.id || '';
    const pages = `<div class="admin-item-actions">${data.offset > 0 ? `<button type="button" class="compact-button" data-raffle-fulfillment-page="${Math.max(0,data.offset-50)}" data-group-id="${escape(groupId)}">上一頁</button>` : ''}${data.hasMore ? `<button type="button" class="compact-button" data-raffle-fulfillment-page="${data.offset+50}" data-group-id="${escape(groupId)}">下一頁</button>` : ''}</div>`;
    const heading = `<div class="admin-control"><h3>獎品／館別備貨清單</h3><p>待備貨 ${escape(data.totals.waiting)} 件 · 已備妥未領 ${escape(data.totals.ready)} 件 · 已領取 ${escape(data.totals.claimed)} 件</p><p class="item-meta">以上是本活動已匯入的領獎需求，不是來源庫存。電子獎 ${escape(data.excluded.digital)} 筆、已取消 ${escape(data.excluded.cancelled)} 筆不再備貨；取消前已交付的數量仍保留於已領取統計。</p>${data.pickupBlocked ? '<p class="state error">已超過領取截止時間或期限設定有誤，請管理員核對；不可直接交付。</p>' : ''}<p class="item-meta">每頁最多 50 ${data.group ? '筆學生紀錄' : '組'}，第 ${Math.floor(data.offset/50)+1} 頁。</p></div>`;
    if (data.group) return heading + `<div class="admin-control"><button type="button" class="compact-button" data-raffle-fulfillment-group="">返回備貨總覽</button><h3>${escape(data.group.prizeName)}｜${escape(data.group.venue || '待確認館別')}</h3><p>共 ${escape(data.totalClaims)} 筆；請逐筆核對實際到館的獎品，沒有整組一次標記。</p></div>` + renderClaims(data.claims,campaigns,data) + pages;
    return heading + (data.groups.map(g=>`<article class="admin-control"><h3>${escape(g.prizeName)}｜${escape(g.venue || '待確認館別')}</h3><p>待備貨 ${escape(g.waiting)} 件 · 已備妥未領 ${escape(g.ready)} 件 · 已領取 ${escape(g.claimed)} 件</p><p class="item-meta">${escape(g.claimCount)} 筆領獎紀錄</p><button type="button" class="compact-button" data-raffle-fulfillment-group="${escape(g.id)}">查看學生／逐筆到館</button></article>`).join('') || '<div class="state">目前沒有實體獎品備貨紀錄。</div>') + pages;
  }
  function renderMailPreview(data) {
    if (!data || data.dryRun !== true || typeof data.deliveryChecked !== 'boolean' || !Number.isInteger(data.candidateCount) || !Number.isInteger(data.skipped) || !Array.isArray(data.previews)) throw Error('未收到完整邀請信預覽，請確認後端版本或稍後再試。');
    const ready = data.kind === 'ready';
    return `<div class="admin-control"><h3>${ready ? '可領取通知預覽' : '邀請信預覽'} · 不會寄出</h3>
      <p class="state">${ready ? '已核對來源、領取狀態及本系統通知紀錄。只通知已備妥且尚有未領數量的獎品；排入待寄不會寄出，寄送前會再核對。' : data.deliveryChecked ? '已核對本系統待寄紀錄與來源表寄送標記；不代表已核對外部寄信結果。排入待寄不會寄出，請再至「寄送前確認」核對發送條件。' : '尚未核對寄信紀錄：以下僅依來源表預覽內容，不是可直接寄送的名單。此預覽不可發送。'}</p>
      <p>候選收件人 ${escape(data.candidateCount || 0)} 位 · ${ready ? '未備妥、已領完、非實體或已保留通知等排除' : '已排入、已使用、來源已寄或無購課 ID 等排除'} ${escape(data.skipped || 0)} 筆${ready ? '獎品' : '資格'}</p>
      <p class="item-meta">最多顯示前 20 封。${ready ? '同一 Email 本次可通知的獎品合併一封；各獎品列出館別與未領數量，不附驗證碼。' : '同一 Email 的多個驗證碼合併一封；驗證碼請勿轉傳。'}</p>
      ${data.deliveryChecked && data.sendEnabled === false && data.readOnly === false && data.previewToken && data.batchCount > 0 ? `<button type="button" class="compact-button" data-raffle-confirm-mail>確認前 ${escape(data.batchCount)} 封排入待寄（不寄出）</button>` : ''}
      ${(data.previews || []).map(item => `<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>收件人：${escape(item.email)}</strong><p>主旨：${escape(item.subject)}</p><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(item.body)}</div></article>`).join('') || `<p class="state">目前沒有符合條件的${ready ? '可領取通知' : '邀請信'}。</p>`}
    </div>`;
  }
  function renderMailRecords(data) {
    if (!data || !Number.isInteger(data.total) || !Array.isArray(data.records)) throw Error('未收到完整寄信紀錄。');
    const labels = {queued:'待寄（尚未寄出）',sending:'寄送已保留／結果待確認',sent:'已送出／已核對',uncertain:'寄送結果待確認',closed:'結案（不重寄）'};
    const offset = Number.isInteger(data.offset) ? data.offset : 0;
    const pages = `<div class="admin-item-actions">${offset > 0 ? `<button type="button" class="compact-button" data-raffle-mail-page="${Math.max(0,offset-50)}">上一頁</button>` : ''}${data.hasMore === true ? `<button type="button" class="compact-button" data-raffle-mail-page="${offset+50}">下一頁</button>` : ''}</div>`;
    return `<div class="admin-control"><h3>寄信紀錄</h3><p class="state">待寄不等於已寄出；Google 接受寄送不代表收件人已收到。結果待確認時不會自動重寄，請先核對執行紀錄或向收件人確認。</p><p>共 ${escape(data.total)} 封，待核對 ${escape(data.reviewCount || 0)} 封。待核對優先顯示，每頁最多 50 封，第 ${Math.floor(offset/50)+1} 頁。</p>${data.records.map(item => `<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>${escape(item.email)}</strong><p>${item.kind === 'ready' ? '可領取通知' : '抽獎邀請'}｜${escape(item.closedBeforeSend ? '停止待寄（未寄出，不重排）' : labels[item.status] || '狀態待核對')}｜${escape(item.qualificationCount)} 筆${item.kind === 'ready' ? '獎品' : '資格'}</p><p>${escape(item.createdAt)}｜${escape(item.actor)}</p>${item.updatedAt ? `<p>更新：${escape(item.updatedAt)}｜${escape(item.updatedBy)}</p>` : ''}${item.reason ? `<p>核對理由：${escape(item.reason)}</p>` : ''}${data.canCloseQueued === true && item.status === 'queued' ? `<button type="button" class="compact-button" data-raffle-close-queued="${escape(item.id)}">停止這封待寄（不重排）</button>` : ''}${data.canReconcile === true && ['sending','uncertain'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-reconcile="${escape(item.id)}">人工核對結果（不重寄）</button>` : ''}</article>`).join('') || '<p>本頁沒有寄信紀錄。</p>'}${pages}</div>`;
  }
  function renderMailSendPreview(data) {
    if (!data || data.dryRun !== true || typeof data.sendEnabled !== 'boolean' || !Number.isInteger(data.batchCount) || data.batchCount < 0 || data.batchCount > 5 || !Array.isArray(data.previews) || data.previews.length !== data.batchCount || !data.previewToken) throw Error('未收到完整寄送預覽。');
    const canSend = data.sendEnabled && Number.isInteger(data.quota) && data.quota >= data.batchCount && data.batchCount > 0;
    return `<div class="admin-control"><h3>${data.kind === 'ready' ? '可領取通知 · ' : ''}寄送前確認 · 尚未寄出</h3><p class="state">${!data.sendEnabled ? '正式寄信未啟用，或尚未確認舊寄信程式已停用交接。' : `目前剩餘配額：${escape(data.quota)} 位收件人；本批 ${escape(data.batchCount)} 封。配額不足時整批停止。`}</p><p>只寄出已排入待寄、再次核對來源一致的信件；每次最多 5 封。匯入或預覽不會寄信。</p>${canSend ? `<button type="button" class="compact-button" data-raffle-confirm-send>核對後寄出這 ${escape(data.batchCount)} 封</button>` : ''}${data.previews.map(item=>`<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>收件人：${escape(item.email)}</strong><p>主旨：${escape(item.subject)}</p><div style="white-space:pre-wrap">${escape(item.body)}</div></article>`).join('') || '<p>目前沒有待寄信件。</p>'}</div>`;
  }
  function renderCampaignSettings(data) {
    if (!data || !Array.isArray(data.campaigns) || typeof data.readOnly !== 'boolean' || typeof data.operationalEnabled !== 'boolean' || data.campaigns.some(i=>!i.campaign || !['draft','active'].includes(i.status) || !Number.isInteger(i.version))) throw Error('未收到完整活動設定。');
    return `<h3>活動設定</h3><p class="state">${data.operationalEnabled ? '工作台已開放。' : '正式作業尚未開放。'}草稿與啟用都不會匯入名單、扣庫存或寄信。已啟用活動此階段不可修改。</p>${data.readOnly ? '<p>目前為唯讀設定。</p>' : '<button type="button" class="compact-button" data-settings-new>新增活動草稿</button>'}${data.campaigns.map(i=>`<article class="admin-control" style="overflow-wrap:anywhere"><h4>${escape(i.campaign.name)} · ${i.status==='draft'?'草稿':'已啟用'}</h4><p>活動代碼：${escape(i.campaign.id)}｜版本 ${i.version}</p><p>來源：${escape(i.campaign.sourceSpreadsheetId)}</p>${!data.readOnly && i.status==='draft' ? `<button type="button" class="compact-button" data-settings-edit="${escape(i.campaign.id)}">編輯／核對啟用</button>` : ''}</article>`).join('') || '<p>尚無活動設定。</p>'}`;
  }
  function mountCampaignSettings(root, options) {
    let disposed=false, busy=false, pending=null, current=null, data=null, activation=null;
    const node=s=>root.querySelector(s), requestId=()=>global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : `raffle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    root.innerHTML='<p role="status">讀取活動設定…</p>';
    const message=text=>{if(!disposed) node('[data-settings-message]').textContent=text;};
    const list=()=>{root.innerHTML=`<div data-settings-list>${renderCampaignSettings(data)}</div><div data-settings-editor></div><p role="status" data-settings-message></p>`;};
    const refresh=async()=>{const result=await options.api('getRaffleCampaignSettings',{});if(disposed)return;renderCampaignSettings(result);data=result;current=null;activation=null;list();};
    function edit(item) {
      current=item || {campaign:{id:'',name:'',sourceSpreadsheetId:'',websiteUrl:'',pickupDeadline:'',readyPrizeVenues:[]},version:0,status:'draft'};
      const c=current.campaign;activation=null;pending=null;
      node('[data-settings-editor]').innerHTML=`<form class="admin-control" data-settings-form><h4>${c.id?'編輯草稿':'新增活動草稿'}</h4>${[['id','活動代碼（英數、-、_）'],['name','活動名稱'],['sourceSpreadsheetId','來源 Google 試算表 ID'],['websiteUrl','學生抽獎網址（HTTPS）'],['pickupDeadline','領獎截止時間（可留空，例：2027-01-31T22:00+08:00）']].map(([key,label])=>`<label style="display:block">${label}<input style="width:100%;box-sizing:border-box" name="${key}" value="${escape(c[key]||'')}" ${key==='id'&&c.id?'readonly':''} ${key!=='pickupDeadline'?'required':''}></label>`).join('')}<label style="display:block">教室現貨（可留空；每行：獎項ID｜館別）<textarea style="width:100%;box-sizing:border-box" name="readyPrizeVenues" rows="3">${escape((c.readyPrizeVenues||[]).map(p=>p.prizeId+'｜'+p.venue).join('\n'))}</textarea></label><p class="item-meta">請填未來活動資料；本次不搬舊活動。館別需與來源表「領取館別」完全一致。</p><button class="compact-button" type="submit">儲存草稿（不啟用）</button>${current.version>0?'<button class="compact-button" type="button" data-settings-preview>核對來源並預覽啟用</button>':''}<div data-settings-activation></div></form>`;
      node('[data-settings-form]').querySelectorAll('input,textarea').forEach(el=>{el.classList.add('text-input');});
      node('[data-settings-form]').querySelectorAll('label').forEach(el=>{el.style.marginBottom='12px';});
      message('');
    }
    function campaignFromForm() {
      const form=node('[data-settings-form]'), c={};
      ['id','name','sourceSpreadsheetId','websiteUrl','pickupDeadline'].forEach(k=>{c[k]=form.elements.namedItem(k).value.trim();});
      c.readyPrizeVenues=form.elements.namedItem('readyPrizeVenues').value.split('\n').filter(l=>l.trim()).map(line=>{const parts=line.split('｜');if(parts.length!==2)throw Error('現貨請每行填「獎項ID｜館別」。');return{prizeId:parts[0].trim(),venue:parts[1].trim()};});return c;
    }
    async function run(action) {
      if(busy)return;busy=true;
      root.querySelectorAll('button,input,textarea').forEach(e=>{e.disabled=true;});
      try{await action();}catch(error){if(!disposed){message(error.message||'操作失敗，請稍後再試。');if(pending){[['settingsRetry','重試同一筆操作'],['settingsReload','重新讀取最新狀態（不重送）']].forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.className='compact-button';b.dataset[key]='';b.textContent=label;node('[data-settings-message]').appendChild(b);});}}}
      finally{busy=false;if(!disposed)root.querySelectorAll('button,input,textarea').forEach(e=>{e.disabled=!!pending && !e.hasAttribute('data-settings-retry') && !e.hasAttribute('data-settings-reload');});}
    }
    async function write() {
      const p=pending,result=await options.api(p.action,{operation:JSON.stringify(p.operation)});
      if(disposed)return;
      if(!result || result.campaignId!==p.campaignId || result.version!==p.operation.version+1 || result.status!==(p.action==='saveRaffleCampaign'?'draft':'active'))throw Error('未收到完整儲存結果，請重試同一筆操作。');
      pending=null;await refresh();if(disposed)return;
      if(result.status==='draft')edit(data.campaigns.find(i=>i.campaign.id===result.campaignId));
      message(result.status==='active'?'已啟用活動設定；未匯入或寄信。請離開再進入領獎工作台，更新活動清單。':'草稿已儲存，尚未啟用。');
    }
    const submit=event=>{if(!event.target.matches('[data-settings-form]'))return;event.preventDefault();run(async()=>{const campaign=campaignFromForm();pending={action:'saveRaffleCampaign',campaignId:campaign.id,operation:{campaign,version:current.version,requestId:requestId()}};await write();});};
    const input=()=>{activation=null;const box=node('[data-settings-activation]');if(box)box.replaceChildren();};
    const click=event=>{
      const button=event.target.closest('button');if(!button||busy)return;
      if(button.hasAttribute('data-settings-new'))return edit(null);
      if(button.hasAttribute('data-settings-edit'))return edit(data.campaigns.find(i=>i.campaign.id===button.dataset.settingsEdit));
      if(button.hasAttribute('data-settings-retry'))return run(write);
      if(button.hasAttribute('data-settings-reload'))return run(async()=>{await refresh();if(disposed)return;pending=null;message('已重新讀取最新狀態，沒有重送；請核對草稿／已啟用狀態後再操作。');});
      if(button.hasAttribute('data-settings-preview'))return run(async()=>{
        if(JSON.stringify(campaignFromForm())!==JSON.stringify(current.campaign))throw Error('請先儲存變更，再核對來源。');
        const result=await options.api('previewRaffleCampaignActivation',{campaignId:current.campaign.id});if(disposed)return;
        if(!result || result.canActivate!==true || result.campaignId!==current.campaign.id || result.version!==current.version || !result.previewToken || !Number.isInteger(result.sourceRows) || !Number.isInteger(result.prizeCount))throw Error('未收到完整啟用核對結果。');
        activation=result;node('[data-settings-activation]').innerHTML=`<p>來源核對通過：${result.sourceRows} 筆名單、${result.prizeCount} 個獎品。尚未匯入／寄信。</p><button type="button" class="compact-button" data-settings-activate>確認啟用此活動設定（不寄信）</button>`;message('');
      });
      if(button.hasAttribute('data-settings-activate')&&activation)return run(async()=>{
        if(!global.confirm('確認啟用此活動設定？不會匯入名單或寄信；啟用後本階段不可編輯。'))return;
        pending={action:'activateRaffleCampaign',campaignId:current.campaign.id,operation:{campaignId:current.campaign.id,version:current.version,previewToken:activation.previewToken,requestId:requestId()}};await write();
      });
    };
    root.addEventListener('submit',submit);root.addEventListener('input',input);root.addEventListener('click',click);
    refresh().catch(e=>{if(!disposed)root.innerHTML=`<p class="state error">${escape(e.message||'活動設定讀取失敗。')}</p>`;});
    return()=>{disposed=true;root.removeEventListener('submit',submit);root.removeEventListener('input',input);root.removeEventListener('click',click);root.replaceChildren();};
  }
  function mount(root, options) {
    let disposed = false, serial = 0, campaigns = [], workspace = {}, preview = null, mailPlan = null, sendPlan = null, mailRecordsData = null, fulfillmentView = null, pending = null;
    const admin = options.mode === 'admin';
    const node = selector => root.querySelector(selector);
    root.innerHTML = '<div class="state" role="status">載入領獎工作台…</div>';
    const initial = options.api('getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher' });
    let settingsCleanup=null;
    function settingsButton() {
      if(!admin)return;
      const button=document.createElement('button');button.type='button';button.className='compact-button';button.textContent='活動設定／草稿';button.dataset.raffleSettings='';root.appendChild(button);
      button.addEventListener('click',()=>{
        const dialog=document.createElement('dialog');dialog.style.cssText='width:min(680px,calc(100vw - 32px));max-height:85vh;overflow:auto;box-sizing:border-box';dialog.innerHTML='<button type="button" data-settings-close>關閉設定</button><div data-settings-content></div>';root.appendChild(dialog);
        const disposePanel=mountCampaignSettings(dialog.querySelector('[data-settings-content]'),options);
        let closed=false;
        const close=()=>{if(closed)return;closed=true;disposePanel();dialog.remove();if(settingsCleanup===close)settingsCleanup=null;};
        settingsCleanup=close;
        dialog.querySelector('[data-settings-close]').onclick=close;
        dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',close);dialog.showModal();
      });
    }
    const cleanup = () => { disposed = true; serial++; if(settingsCleanup)settingsCleanup(); root.replaceChildren(); };
    initial.then(data => {
      if (disposed) return;
      if (!data.enabled || !data.campaigns.length) {
        root.innerHTML = '<div class="state">領獎工作台尚未開放。未來活動設定完成後，會在這裡提供查詢；舊活動不會自動搬入。</div>';
        settingsButton();
        return;
      }
      campaigns = data.campaigns;
      workspace = data;
      root.innerHTML = `<div class="state">${data.readOnly !== false ? '目前為核對預覽版：可查詢、核對來源，尚不能登記領取或寄信。' : '逐筆核對學生、獎品與館別後再交付。備貨、領取都有紀錄；匯入不會自動寄信。'}</div>
        <form class="admin-control raffle-search">
          <label>活動<select class="admin-select" data-raffle-campaign>${admin ? '' : '<option value="">全部活動</option>'}${campaigns.map(c => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join('')}</select></label>
          <label>學生姓名或完整 Email<input class="text-input" data-raffle-query maxlength="100" placeholder="姓名至少 2 個字，或輸入完整 Email" autocomplete="off"></label>
          <div class="admin-item-actions"><button type="submit" class="compact-button">查詢學生</button>${data.canPrepare ? '<button type="button" class="compact-button" data-raffle-fulfillment>獎品／館別備貨清單</button>' : ''}${admin ? '<button type="button" class="compact-button" data-raffle-preview>核對抽獎結果</button><button type="button" class="compact-button" data-raffle-mail-preview>預覽邀請信（不寄出）</button><button type="button" class="compact-button" data-raffle-mail-send>寄送前確認</button><button type="button" class="compact-button" data-raffle-mail-records>寄信紀錄</button>' : ''}</div>
        </form><div data-raffle-notice aria-live="polite"></div><div data-raffle-result aria-live="polite"><div class="state">請先搜尋學生，不會列出全部名單。</div></div>
        <dialog data-raffle-dialog><form class="dialog-body raffle-search" data-raffle-operation-form><div data-raffle-dialog-body></div><div data-raffle-operation-error class="item-meta" role="alert"></div><div class="admin-item-actions"><button type="submit" class="compact-button" data-raffle-save>確認</button><button type="button" class="compact-button" data-raffle-cancel>取消</button></div></form></dialog>`;
      const form = node('form'), result = node('[data-raffle-result]');
      if(admin) form.querySelector('.admin-item-actions').insertAdjacentHTML('beforeend','<button type="button" class="compact-button" data-raffle-ready-preview>預覽可領取通知（不寄出）</button><button type="button" class="compact-button" data-raffle-ready-send>可領取通知寄送前確認</button>');
      settingsButton();
      async function read(isPreview, offset = 0, groupId = '') {
        const readyMail = isPreview === 'ready' || isPreview === 'readySend';
        const mailPreview = isPreview === 'mail' || isPreview === 'ready';
        const mailRecords = isPreview === 'mailRecords';
        const mailSend = isPreview === 'mailSend' || isPreview === 'readySend';
        const fulfillment = isPreview === 'fulfillment';
        const campaignId = node('[data-raffle-campaign]').value;
        const query = node('[data-raffle-query]').value.trim();
        if (!isPreview && query.length < 2) { result.innerHTML = '<div class="state">請輸入至少 2 個字的姓名或完整 Email。</div>'; return; }
        if (fulfillment && !campaignId) { result.innerHTML = '<div class="state">請先選擇一個活動，再查看備貨清單。</div>'; return; }
        const request = ++serial;
        form.querySelectorAll('button').forEach(b => { b.disabled = true; });
        result.innerHTML = '<div class="state" role="status">核對資料中…</div>';
        try {
          const data = await options.api(fulfillment ? 'getRaffleFulfillment' : mailSend ? (readyMail ? 'previewRaffleReadyMailSend' : 'previewRaffleMailSend') : mailRecords ? 'getRaffleMailRecords' : mailPreview ? (readyMail ? 'previewRaffleReadyNotifications' : 'previewRaffleInvitations') : isPreview ? 'previewRaffleImport' : 'getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher', campaignId, query, ...(mailRecords || fulfillment ? {offset} : {}), ...(fulfillment ? {groupId} : {}) });
          if (disposed || request !== serial) return;
          if ((mailPreview || mailSend) && (readyMail ? data?.kind !== 'ready' : data?.kind && data.kind !== 'invitation')) throw Error('寄信用途不符，請重新核對。');
          if (!isPreview && !data.enabled) { result.innerHTML = '<div class="state">工作台已暫停開放。</div>'; return; }
          mailPlan = mailPreview ? {...data,campaignId} : null;
          sendPlan = mailSend ? {...data,campaignId} : null;
          mailRecordsData = mailRecords ? {...data,campaignId} : null;
          fulfillmentView = fulfillment ? {offset,groupId} : null;
          if (fulfillment) workspace = data;
          if (mailPreview || mailRecords || mailSend || fulfillment) preview = null;
          else if (isPreview) preview = { ...data, campaignId };
          else { workspace = data; preview = null; }
          result.innerHTML = fulfillment ? renderFulfillment(data,campaigns) : mailSend ? renderMailSendPreview(data) : mailRecords ? renderMailRecords(data) : mailPreview ? renderMailPreview(data) : isPreview ? renderPreview(data) : renderClaims(data.claims || [], campaigns, data);
          if (!isPreview && (data.claims || []).length >= 50) result.insertAdjacentHTML('beforeend', '<p class="state">最多顯示 50 筆，請用完整 Email 縮小範圍。</p>');
        } catch (error) {
          if (!disposed && request === serial) result.innerHTML = `<div class="state error">${escape(error.message || '讀取失敗，請稍後重試。')}</div>`;
        } finally {
          if (!disposed && request === serial) form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        }
      }
      form.addEventListener('submit', event => { event.preventDefault(); read(false); });
      if (admin) node('[data-raffle-preview]').addEventListener('click', () => read(true));
      if (admin) node('[data-raffle-mail-preview]').addEventListener('click', () => read('mail'));
      if (admin) node('[data-raffle-mail-records]').addEventListener('click', () => read('mailRecords'));
      if (admin) node('[data-raffle-mail-send]').addEventListener('click', () => read('mailSend'));
      if (admin) node('[data-raffle-ready-preview]').addEventListener('click', () => read('ready'));
      if (admin) node('[data-raffle-ready-send]').addEventListener('click', () => read('readySend'));
      node('[data-raffle-fulfillment]')?.addEventListener('click', () => read('fulfillment'));
      node('[data-raffle-campaign]').addEventListener('change', () => {
        serial++;
        preview = null;
        mailPlan = null;
        sendPlan = null;
        mailRecordsData = null;
        fulfillmentView = null;
        form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        result.innerHTML = '<div class="state">活動已切換，請重新查詢或核對。</div>';
      });
      const dialog = node('[data-raffle-dialog]'), opForm = node('[data-raffle-operation-form]');
      let selected = null, busy = false;
      const requestId = () => global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : `raffle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      node('[data-raffle-cancel]').addEventListener('click', () => { if (!busy) dialog.close(); });
      dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
      result.addEventListener('click', async event => {
        const groupButton = event.target.closest('[data-raffle-fulfillment-group]');
        const fulfillmentPage = event.target.closest('[data-raffle-fulfillment-page]');
        if (!busy && (groupButton || fulfillmentPage)) { read('fulfillment', fulfillmentPage ? Number(fulfillmentPage.dataset.raffleFulfillmentPage) : 0, groupButton ? groupButton.dataset.raffleFulfillmentGroup : fulfillmentPage.dataset.groupId); return; }
        const pageButton = event.target.closest('[data-raffle-mail-page]');
        if (pageButton && !busy) { read('mailRecords', Number(pageButton.dataset.raffleMailPage)); return; }
        const importButton = event.target.closest('[data-raffle-confirm-import]');
        const mailButton = event.target.closest('[data-raffle-confirm-mail]');
        const sendButton = event.target.closest('[data-raffle-confirm-send]');
        const reconcileButton = event.target.closest('[data-raffle-reconcile]');
        const closeQueuedButton = event.target.closest('[data-raffle-close-queued]');
        const button = event.target.closest('[data-raffle-action]');
        if (!importButton && !mailButton && !sendButton && !reconcileButton && !closeQueuedButton && !button) return;
        if (busy) return;
        pending = null;
        node('[data-raffle-operation-error]').textContent = '';
        node('[data-raffle-save]').hidden = false;
        node('[data-raffle-save]').disabled = false;
        if (sendButton) {
          if (!sendPlan || sendPlan.sendEnabled !== true || !sendPlan.batchCount) return;
          selected = {action:'send',preview:sendPlan};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確定現在寄出 ${escape(sendPlan.batchCount)} 封？</h3><p>用途：${sendPlan.kind === 'ready' ? '可領取通知' : '抽獎邀請'}。這次確認會真的寄信。若結果不明會停止，不會自動重寄；請至寄信紀錄核對。</p>${sendPlan.previews.map(item=>`<p style="overflow-wrap:anywhere">${escape(item.email)}</p>`).join('')}`;
        } else if (closeQueuedButton) {
          const record=mailRecordsData?.records.find(item=>item.id===closeQueuedButton.dataset.raffleCloseQueued);
          if(!record || mailRecordsData.canCloseQueued!==true || record.status!=='queued')return;
          selected={action:'closeQueued',record,campaignId:mailRecordsData.campaignId};
          node('[data-raffle-dialog-body]').innerHTML=`<h3>停止這封待寄？</h3><p style="overflow-wrap:anywhere">${escape(record.email)}</p><p>用途：${record.kind==='ready'?'可領取通知':'抽獎邀請'}，涵蓋 ${escape(record.qualificationCount)} 筆${record.kind==='ready'?'獎品':'資格'}。</p><p>這是停止整封信，不是只取消其中一件。涵蓋的項目都不會自動重新排入；不代表已寄出，也不會取消學生的抽獎資格或領獎紀錄。</p><label>停止理由<textarea data-raffle-mail-reason class="text-input" maxlength="300" required></textarea></label>`;
        } else if (reconcileButton) {
          const record = mailRecordsData?.records.find(item=>item.id === reconcileButton.dataset.raffleReconcile);
          if (!record || mailRecordsData.canReconcile !== true || !['sending','uncertain'].includes(record.status)) return;
          selected = {action:'reconcile',record,campaignId:mailRecordsData.campaignId};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>人工核對寄信結果</h3><p style="overflow-wrap:anywhere">${escape(record.email)}</p><p>請先確認原寄送已結束。這裡只記錄核對結論，不會寄信，也不會釋放資格讓它重寄。</p><label>核對結論<select data-raffle-mail-status class="admin-select" required><option value="">請選擇</option><option value="sent">已確認寄出／收到</option><option value="closed">結案、不重寄（原因寫在下方）</option></select></label><label>核對依據／理由<textarea data-raffle-mail-reason class="text-input" maxlength="300" required></textarea></label>`;
        } else if (mailButton) {
          if (!mailPlan || mailPlan.readOnly !== false || !mailPlan.deliveryChecked || mailPlan.sendEnabled !== false) return;
          selected = {action:'queue',preview:mailPlan};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確認前 ${escape(mailPlan.batchCount)} 封排入待寄？</h3><p>用途：${mailPlan.kind === 'ready' ? '可領取通知' : '抽獎邀請'}。只保存待寄紀錄，不會寄信。後續發送仍須另行啟用；可至寄信紀錄停止整封待寄，停止後不會自動重排。</p>${mailPlan.previews.slice(0,mailPlan.batchCount).map(item=>`<p style="overflow-wrap:anywhere">${escape(item.email)}</p>`).join('')}`;
        } else if (importButton) {
          if (!preview || preview.readOnly !== false) return;
          selected = { action: 'import', preview };
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確認匯入 ${escape(preview.batchCount)} 筆？</h3><p>只新增本次核對的領獎資料，不扣來源庫存、不寄信。剩餘資料需再次預覽。</p>`;
        } else {
          const claim = (workspace.claims || []).find(c => c.id === button.dataset.claimId);
          if (!claim) return;
          selected = { action: button.dataset.raffleAction, claim };
          const title = { collect:'確認交付獎品', prepare:'確認這一筆已到館', correct:'更正誤領', revoke:'撤銷未領部分', audit:'操作紀錄' }[selected.action];
          const maximum = selected.action === 'correct' ? Number(claim.claimedQuantity) - 1 : Number(claim.quantity) - Number(claim.claimedQuantity);
          node('[data-raffle-dialog-body]').innerHTML = `<h3>${escape(title)}</h3><p><strong>${escape(claim.studentName)}</strong>｜${escape(claim.maskedEmail)}</p><p>${escape(claim.prizeName)}｜登記館別：${escape(claim.venue || '—')}</p>
            ${['collect','prepare'].includes(selected.action) ? `<label>確認實際所在館別<select data-raffle-venue class="admin-select" required><option value="">請選擇</option><option value="${escape(claim.venue)}">${escape(claim.venue)}</option><option value="wrong-venue">其他館別（不可交付）</option></select></label>` : ''}
            ${['collect','correct'].includes(selected.action) ? `<label>${selected.action === 'correct' ? '更正後已領數量' : '本次領取數量'}<input data-raffle-quantity class="text-input" type="number" min="${selected.action === 'correct' ? 0 : 1}" max="${escape(maximum)}" step="1" value="${selected.action === 'correct' ? 0 : 1}" required></label>` : ''}
            ${selected.action === 'revoke' ? `<p>停止剩餘 ${escape(maximum)} 件的交付，已領取 ${escape(claim.claimedQuantity)} 件及原紀錄會保留。不能直接恢復；不會回補來源庫存、不寄信，也不撤銷學生其他獎品。</p>` : ''}
            ${['correct','revoke'].includes(selected.action) ? '<label>操作理由<textarea class="text-input" data-raffle-reason maxlength="300" required></textarea></label>' : ''}`;
        }
        dialog.showModal();
        if (selected.action === 'audit') {
          node('[data-raffle-save]').hidden = true;
          const current = selected;
          try {
            const audit = await options.api('getRaffleAudit', {claimId:selected.claim.id});
            if (disposed || selected !== current || !dialog.open) return;
            node('[data-raffle-dialog-body]').insertAdjacentHTML('beforeend', (audit.events || []).map(item => `<div class="raffle-prize"><strong>${escape(({import:'匯入',prepare:'到館',collect:'領取',correct:'更正',revoke:'撤銷未領部分','resolve-source':'核對來源變更'})[item.action] || item.action)}</strong><p>${escape(item.at)}｜${escape(item.actor)}｜已領 ${escape(item.claimedQuantity)} 件</p><p>${escape(item.reason || '')}</p></div>`).join(''));
          } catch(error) { if (!disposed && selected === current) node('[data-raffle-operation-error]').textContent = error.message; }
        }
      });
      opForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!selected || busy || selected.action === 'audit') return;
        if (!pending) {
          const operation = ['import','queue','send'].includes(selected.action)
            ? {campaignId:selected.preview.campaignId,previewToken:selected.preview.previewToken,requestId:requestId()}
            : ['reconcile','closeQueued'].includes(selected.action) ? {campaignId:selected.campaignId,jobId:selected.record.id,...(selected.action==='reconcile'?{status:node('[data-raffle-mail-status]').value}:{}),reason:node('[data-raffle-mail-reason]').value.trim(),requestId:requestId()}
            : {claimId:selected.claim.id,version:selected.claim.version,action:selected.action,venue:node('[data-raffle-venue]')?.value || '',quantity:node('[data-raffle-quantity]') ? Number(node('[data-raffle-quantity]').value) : undefined,reason:node('[data-raffle-reason]')?.value.trim() || '',requestId:requestId()};
          if (selected.action !== 'import' && ['collect','prepare'].includes(selected.action) && operation.venue !== selected.claim.venue) { node('[data-raffle-operation-error]').textContent = '館別不一致，請勿交付。'; return; }
          if(selected.action==='closeQueued'&&!operation.reason){node('[data-raffle-operation-error]').textContent='請填寫停止理由。';return;}
          pending = {action:({send:'sendRaffleMailBatch',reconcile:'reconcileRaffleMail',closeQueued:'closeRaffleQueuedMail',queue:'confirmRaffleInvitations',import:'confirmRaffleImport'})[selected.action] || 'mutateRaffleClaim',operation};
          if(selected.preview?.kind === 'ready' && ['send','queue'].includes(selected.action))pending.action=selected.action === 'send' ? 'sendRaffleReadyMailBatch' : 'confirmRaffleReadyNotifications';
        }
        busy = true;
        opForm.querySelectorAll('input,select,textarea,button').forEach(el => { el.disabled = true; });
        node('[data-raffle-operation-error]').textContent = '處理中，請勿重複操作…';
        try {
          const response = await options.api(pending.action, {operation:pending.operation});
          if (disposed) return;
          if(selected.action==='closeQueued'){
            if(!response || response.jobId!==selected.record.id || response.status!=='closed' || response.closedBeforeSend!==true)throw Error('未收到完整停止待寄結果。');
            node('[data-raffle-notice]').textContent='已停止這封待寄並保留理由；沒有寄信，也不會自動重新排入。';pending=null;dialog.close();await read('mailRecords');return;
          }
          if (!response || (selected.action === 'send' ? !response.attemptId || !Number.isInteger(response.sent) || !Number.isInteger(response.pendingReview) || !Number.isInteger(response.total) : selected.action === 'reconcile' ? response.jobId !== selected.record.id || !['sent','closed'].includes(response.status) : selected.action === 'queue' ? !Number.isInteger(response.queued) : selected.action === 'import' ? !Number.isInteger(response.imported) : !response.claimId)) throw Error('沒有收到完整確認結果。');
          const imported = selected.action === 'import';
          const queued = selected.action === 'queue';
          const mailOperation = ['send','reconcile'].includes(selected.action);
          node('[data-raffle-notice]').innerHTML = `<div class="state">${selected.action === 'send' ? `本批 ${escape(response.total)} 封：已送出／核對 ${escape(response.sent)} 封，待確認 ${escape(response.pendingReview)} 封。待確認不會自動重寄；已送出不保證收件匣送達。` : selected.action === 'reconcile' ? '已保存核對結論與理由，沒有重寄。' : queued ? `已排入待寄 ${escape(response.queued)} 封，尚未寄出；可到寄信紀錄查看。` : imported ? `已匯入 ${escape(response.imported)} 筆，剩餘 ${escape(response.remaining || 0)} 筆；沒有寄信。` : '這一筆已更新，已保留操作紀錄。'}</div>`;
          pending = null; dialog.close();
          if (fulfillmentView) await read('fulfillment', fulfillmentView.offset, fulfillmentView.groupId);
          else await read(mailOperation ? 'mailRecords' : queued ? (selected.preview?.kind === 'ready' ? 'ready' : 'mail') : imported);
        } catch (error) {
          if (!disposed) node('[data-raffle-operation-error]').textContent = `${error.message} 尚未確認完成，請勿重複操作。再次確認會使用同一筆操作識別；也可取消後到紀錄核對。`;
        } finally {
          busy = false;
          if (!disposed) {
            opForm.querySelectorAll('button').forEach(el => { el.disabled = false; });
            if (!pending) opForm.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = false; });
          }
        }
      });
    }).catch(error => {
      if (!disposed) root.innerHTML = `<div class="state error">${escape(error.message || '工作台載入失敗，請重新進入。')}</div>`;
    });
    return cleanup;
  }
  global.SherryRaffle = { mount, mountCampaignSettings, renderCampaignSettings, renderClaims, renderPreview, renderMailPreview, renderMailRecords, renderMailSendPreview, renderFulfillment };
})(window);
