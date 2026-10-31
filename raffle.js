(function (global) {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const statuses = { waiting: '待備貨', ready: '可領取', partial: '部分領取', claimed: '已領取', digital: '電子獎項', cancelled: '已撤銷／取消' };
  const status = value => statuses[value] || '狀態待核對';
  function renderBallInventory(data) {
    if(!data||data.readOnly!==true||data.canCollect!==false||typeof data.prizeName!=='string'||typeof data.catalogEnabled!=='boolean'||
       !['total','reserved','claimed','available'].every(k=>Number.isSafeInteger(data[k])&&data[k]>=0)||data.reserved+data.claimed+data.available!==data.total)throw Error('庫存資料尚未核對，請重新查詢。');
    return `<h3>${escape(data.prizeName)} · 庫存唯讀</h3><p>總量 ${data.total} 顆｜待領 ${data.reserved} 顆｜已領 ${data.claimed} 顆｜可用 ${data.available} 顆</p><p class="item-meta">${data.catalogEnabled?'目錄已啟用':'目錄尚未啟用'}。此處僅查詢，不會發放或登記領取；球不必選館。</p>`;
  }
  function renderPickupVenue(claim) {
    if (claim.venue === '教室現貨') return '<p class="item-meta">教室現貨直接領取，不必選館；請先核對學生與獎品。</p><input data-raffle-venue type="hidden" value="教室現貨">';
    return `<label>確認實際所在館別<select data-raffle-venue class="admin-select" required><option value="">請選擇</option><option value="${escape(claim.venue)}">${escape(claim.venue)}</option><option value="wrong-venue">其他館別（不可交付）</option></select></label>`;
  }
  function renderClaims(claims, campaigns, permissions = { readOnly: true }) {
    if (!claims.length) return '<div class="state">查無符合的領獎紀錄。請確認姓名或完整 Email。</div>';
    const groups = new Map();
    claims.forEach(claim => {
      const key = claim.studentKey;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(claim);
    });
    return [...groups.entries()].map(([key, items]) => `<article class="raffle-student admin-control" data-raffle-student="${escape(key)}">
      <h3>${escape(items[0].studentName)}</h3><p class="item-meta">${escape(permissions.canCorrect && items[0].email ? items[0].email : items[0].maskedEmail)} · 請核對學生身分，同名不代表同一人</p>
      ${items.map(item => `<div class="raffle-prize">
        <div><strong>${escape(item.prizeName)}</strong><span class="status-pill">${escape(status(item.status))}</span></div>
        <p class="item-meta">${escape((campaigns.find(c => c.id === item.campaignId) || {}).name || '')}｜${escape(item.venue || '非實體領取／待確認館別')}｜${escape(item.claimedQuantity || 0)}／${escape(item.quantity || 1)} 件已領</p>
        <p><strong>${['ready','partial'].includes(item.status) ? `尚可領取 ${escape(Number(item.quantity) - Number(item.claimedQuantity || 0))} 件` : item.status === 'waiting' ? '尚未備妥，請先等到館確認' : escape(status(item.status))}</strong> · 已領取 ${escape(item.claimedQuantity || 0)} 件</p>
        ${item.claimedAt ? `<p class="item-meta">領取：${escape(item.claimedAt)}｜經手：${escape(item.claimedBy)}</p>` : ''}
        ${item.pickupBlocked && ['waiting','ready','partial'].includes(item.status) ? `<p class="state error">已過領取期限／期限需核對：${escape(item.pickupDeadline)}；暫停備貨與交付，原紀錄保留。</p>` : ''}
        <div class="admin-item-actions">
          ${permissions.readyDeliveryCampaign===item.campaignId && !item.pickupBlocked && ['ready','partial'].includes(item.status) ? `<button type="button" class="compact-button" data-ready-delivery="${escape(item.id)}" data-campaign-id="${escape(item.campaignId)}">通知學生（限定測試）</button>` : ''}
          ${permissions.readyPreviewCampaign && permissions.readyPreviewCampaign===item.campaignId && !item.pickupBlocked && ['ready','partial'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-ready-preview="${escape(item.id)}" data-campaign-id="${escape(item.campaignId)}">預覽到館通知（不寄送）</button>` : ''}
          ${permissions.readOnly === false && !permissions.pickupBlocked && !item.pickupBlocked && ['ready','partial'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-action="collect" data-claim-id="${escape(item.id)}">確認已領取</button>` : ''}
          ${permissions.readOnly === false && !permissions.pickupBlocked && !item.pickupBlocked && permissions.canPrepare && item.status === 'waiting' ? `<button type="button" class="compact-button" data-raffle-action="prepare" data-claim-id="${escape(item.id)}">${permissions.canCorrect ? '確認到館並通知學生' : '確認到館'}</button>` : ''}
          ${permissions.readOnly === false && permissions.canCorrect && ['waiting','ready','partial'].includes(item.status) && Number(item.claimedQuantity) < Number(item.quantity) ? `<button type="button" class="compact-button" data-raffle-action="revoke" data-claim-id="${escape(item.id)}">撤銷未領部分</button>` : ''}
          ${permissions.readOnly === false && permissions.canCorrect && !item.pickupBlocked && item.status==='cancelled' && item.venue && Number(item.quantity)===1 && Number(item.claimedQuantity)===0 ? `<button type="button" class="compact-button" data-raffle-action="restore" data-claim-id="${escape(item.id)}">核對並恢復未領部分</button>` : ''}
          ${permissions.canCorrect && item.status==='cancelled' && Number(item.quantity)>1 ? '<p class="item-meta">舊式多件紀錄須人工核對；現有來源每資格一件，不提供自動恢復。</p>' : ''}
          ${permissions.readOnly === false && permissions.canCorrect && Number(item.claimedQuantity) > 0 && ['partial','claimed','ready'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-action="correct" data-claim-id="${escape(item.id)}">更正誤領</button>` : ''}
          ${permissions.canCorrect ? `<button type="button" class="compact-button" data-raffle-action="audit" data-claim-id="${escape(item.id)}">操作紀錄</button>` : ''}
        </div>
      </div>`).join('')}</article>`).join('');
  }
  function renderPreview(data) {
    const issues = data.errors || [];
    return `<div class="admin-control"><h3>核對結果 · 尚未同步</h3>
      <p>可新增 ${escape(data.additionCount || 0)} 筆 · 已存在 ${escape(data.duplicates || 0)} 筆 · 未選獎品 ${escape(data.pendingSelection || 0)} 筆</p>
      <p>需核對 ${escape(data.conflictCount || 0)} 筆 · 格式錯誤 ${escape(data.errorCount || 0)} 筆</p>
      <p class="item-meta">以下最多顯示 100 筆新增及各 100 筆問題。本次沒有寫入資料、扣庫存或寄信。</p>
      ${issues.map(issue => `<p class="state error">第 ${escape(issue.row)} 列：${escape(issue.message)}</p>`).join('')}
      ${(data.conflicts || []).map(issue=>`<div class="raffle-prize"><p class="state error">第 ${escape(issue.row)} 列：${escape(issue.message)}</p>${renderSourceComparison(issue)}${data.readOnly === false && data.previewToken && issue.resolvable === true ? `<button type="button" class="compact-button" data-raffle-resolve="${escape(issue.id)}">核對並套用此筆來源變更</button>` : ''}</div>`).join('')}
      ${(data.additions || []).map(item => `<div class="raffle-prize"><strong>${escape(item.studentName)}</strong><p>${escape(item.prizeName)}｜${escape(item.venue || '—')}｜${escape(status(item.status))}</p></div>`).join('')}
      ${data.readOnly === false && data.previewToken && data.batchCount > 0 && !data.errorCount && !data.conflictCount ? `<button type="button" class="compact-button" data-raffle-confirm-import>確認同步前 ${escape(data.batchCount)} 筆（不寄信）</button>` : ''}
    </div>`;
  }
  function renderSourceComparison(issue) {
    return [['原紀錄',issue.before],['來源現況',issue.after]].map(([label,item])=>item?`<p><strong>${label}</strong>：${escape(item.studentName)}｜${escape(item.maskedEmail || '')}<br>${escape(item.prizeName)}｜${escape(item.venue || '待確認館別')}｜${escape(status(item.status))}｜已領 ${escape(item.claimedQuantity || 0)}／${escape(item.quantity || 1)} 件</p>`:'').join('');
  }
  function renderReconcileGuidance(record) {
    if(record.deliveryMode==='line-first'){
      const state=record.channels?.line?.status;
      if(state==='sent')return 'LINE 已接受這筆通知，不需要再補寄 OB 或 Email。';
      if(['unbound','rejected'].includes(state))return 'LINE 未綁定或已明確拒絕，本筆改用備援；請核對 OB 與 Email 都已送出／收到，才可標記完成。';
      return '請先按「查回 LINE 結果（不重送）」。LINE 結果仍不明時，不可當作已送達，也不會補寄 OB 或 Email；尚未發送的管道不能人工標成成功。';
    }
    return record.channels?'本筆使用 OB＋Email，必須分別核對兩個管道都已送出／收到，才可標記完成。':'本筆是舊版 Email 通知，請核對 Email 寄送結果。';
  }
  function renderOperations(data) {
    if(data?.ok!==true||!data.sources||!data.queues||!Array.isArray(data.tasks))throw Error('狀態回應不完整，請更新查看。');
    const date=v=>Number.isFinite(v)&&v>0?new Date(v).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚無完成紀錄';
    const labels={sync:'購卡與上課同步',identity:'OB 身分驗證',line:'活動對話回覆',tasks:'照片與推薦審核'};
    const statuses={idle:'等待新資料',closed:'不在活動同步期間',paused:'依設定暫停',disabled:'未啟動',complete:'完成本次工作',completed:'完成本次工作',continuing:'分批處理中',processed:'已處理',reconciled:'已核對',waiting:'等待來源或額度',deferred:'稍後續處理',busy:'上一筆處理中',queued:'已排入',pending:'待處理',working:'處理中',accepted:'服務已接受',sent:'服務已接受',skipped:'略過',ready:'已備妥',reserved:'已保留',delivered:'已交付',awarded:'已入帳',retained:'已保存',ineligible:'不符合資格',manual:'待人工確認',review:'待核對',blocked:'需要檢查設定',stale:'資料需重新核對',unknown:'結果待核對',uncertain:'結果待核對',rejected:'已拒絕／需核對',failed:'失敗待處理',conflict:'資料衝突',exception:'執行異常',invalid_result:'回應異常',missing:'沒有排程回報',lookup:'查詢中',unavailable:'查詢未完成',unbound:'未綁定',sending:'結果待核對'};
    const source=(name,s)=>`<div><strong>${name}</strong><p>最近整批同步：${date(s.lastCompletedAt)}</p><p>處理中 ${escape(s.pending)} 批 · 待核對 ${escape(s.blocked)} 批${s.oldestPendingAt?' · 最早待處理 '+date(s.oldestPendingAt):''}</p></div>`;
    const queueNames={intakes:'活動申請',purchases:'購卡獎勵',purchaseIntakes:'購卡資格暫存',identity:'身分查詢',identityDelivery:'驗證通知',ready:'LINE 領獎通知',line:'活動回覆'};
    const queueRows=Object.entries(data.queues).flatMap(([key,rows])=>rows.filter(r=>r.count>0&&!['accepted','unbound','rejected'].includes(key==='ready'?r.state:'')).map(r=>`<li>${escape(r.kind==='photo'?'照片':r.kind==='referral'?'推薦':queueNames[key]||'待處理')} · ${escape(statuses[r.state]||'待核對')} ${escape(r.count)} 筆${r.oldestAt?' · 最早 '+date(r.oldestAt):''}</li>`));
    data.tasks.filter(t=>t.attention||t.stale).forEach(t=>queueRows.push(`<li>${escape(labels[t.id]||'排程')} · ${escape(t.stale?(t.lastTickAt?'超過 5 分鐘未回報，請檢查排程':'尚未收到排程回報'):statuses[t.state]||'需要核對')}</li>`));
    const mail=data.classroom?.mail;
    if(mail?.available===false)queueRows.push('<li>教室通知紀錄暫時無法讀取，請查寄信紀錄。</li>');
    else if(mail&&(mail.queued||mail.uncertain))queueRows.push(`<li>教室通知：待寄 ${escape(mail.queued)} 封 · 結果待核對 ${escape(mail.uncertain)} 封${mail.oldestPendingAt?' · 最早 '+date(mail.oldestPendingAt):''}</li>`);
    const general=data.readyLineEnabled&&!data.readyTestOnly&&data.classroom?.lineFirst&&!data.classroom?.testOnly;
    return `<p class="item-meta">${data.phase==='upcoming'?'活動尚未開始，資格自 '+date(data.startsAt)+' 起算。':data.phase==='ended'?'活動同步期間已結束。':'活動同步進行中。'} 活動回覆：${data.activityRepliesPaused?'暫停，等管理者通知開放':'已開放'}。</p>
      <div class="raffle-ops-grid">${source('購卡',data.sources.purchases)}${source('上課',data.sources.classes)}</div>
      <p class="item-meta">領獎通知：${general?'LINE 優先；未綁定或明確失敗才用 OB＋Email':'通知範圍／接線尚待核對'} · ${data.imageTextEnabled?'聖誕圖＋文字':'文字格式'}。結果不明先核對，不自動重寄。</p>
      ${queueRows.length?'<div class="state error"><strong>待處理與核對</strong><ul>'+queueRows.join('')+'</ul></div>':'<p>目前讀取的待辦清單沒有待處理項目。</p>'}
      <details><summary>查看排程與備貨提醒狀態</summary><p class="item-meta">排程回報不等於資料同步完成；購卡、上課以整批同步時間為準。</p>${data.tasks.map(t=>`<p><strong>${escape(labels[t.id]||'排程')}</strong> · ${escape(statuses[t.state]||'待核對')}${t.stale?' · 超過 5 分鐘未回報，需確認':''}${t.attention?' · 需留意':''}<br><span class="item-meta">最近排程回報：${t.lastTickAt?date(t.lastTickAt):'沒有排程回報'}${t.lastErrorAt?'；最近待核對：'+date(t.lastErrorAt):''}</span></p>`).join('')}<p class="item-meta">Tako 備貨提醒同步：${date(data.classroom?.lastStockSyncAt)}。活動開始後依排程處理。</p></details><p class="item-meta">讀取時間：${date(data.checkedAt)}（台北時間）</p>`;
  }
  function renderOverview(data) {
    const claimKeys=['waiting','ready','partial','claimed','digital','cancelled'];
    const unitKeys=['deliveredUnits','pendingUnits','blockedRecords','blockedUnits'];
    const mailKeys=['queued','sending','uncertain','sent','closed'];
    const valid=(object,keys)=>object && keys.every(k=>Number.isSafeInteger(object[k]) && object[k]>=0);
    if(!data || data.readOnly!==true || data.sourceChecked!==false || !data.campaignId || typeof data.campaignName!=='string' || !Number.isFinite(Date.parse(data.asOf)) ||
       !valid(data.claims,['total',...claimKeys,...unitKeys]) || claimKeys.reduce((n,k)=>n+data.claims[k],0)!==data.claims.total ||
       !['invitation','ready'].every(kind=>valid(data.mail?.[kind],['total','review',...mailKeys]) && mailKeys.reduce((n,k)=>n+data.mail[kind][k],0)===data.mail[kind].total && data.mail[kind].review===data.mail[kind].sending+data.mail[kind].uncertain)) throw Error('未收到完整活動總覽，請重新讀取；不能視為零筆。');
    const c=data.claims;
    return `<section class="admin-control"><h3>${escape(data.campaignName)}｜活動總覽</h3><p class="item-meta">讀取時間：${escape(data.asOf)}</p><p>只統計本系統已同步的紀錄，未核對來源是否有新增或異動；不是來源庫存，也不代表可以直接寄送。</p><p>已同步 ${escape(c.total)} 筆領獎紀錄 · 已交付 ${escape(c.deliveredUnits)} 件 · 尚未交付 ${escape(c.pendingUnits)} 件（含過期，不含電子／撤銷剩餘）</p>${c.blockedRecords ? `<p class="state error">${escape(c.blockedRecords)} 筆／${escape(c.blockedUnits)} 件已過期或期限需核對，不能直接交付；仍計入下方原狀態。</p>` : ''}</section>
      <section class="admin-control"><h3>領獎處理</h3>${claimKeys.map(k=>`<p>${escape(status(k))}：${escape(c[k])} 筆</p>`).join('')}<p class="item-meta">「部分領取」獨立計數；撤銷前已交付的件數仍保留。</p></section>
      ${[['invitation','抽獎邀請'],['ready','領獎通知']].map(([kind,label])=>{const m=data.mail[kind];return `<section class="admin-control"><h3>${label}｜共 ${escape(m.total)} 封</h3>${m.review ? `<p class="state error">${escape(m.review)} 封寄送中／結果待確認，請至「寄信紀錄」核對，勿自行重寄。</p>`:''}<p>待寄 ${escape(m.queued)} 封 · 已寄出 ${escape(m.sent)} 封 · 已停止／結案 ${escape(m.closed)} 封</p><p class="item-meta">已寄出不代表學生已收到；停止／結案不會自動重新排入。詳細核對依寄信紀錄為準。</p></section>`;}).join('')}`;
  }
  function renderFulfillment(data, campaigns) {
    if (!data || !data.totals || !data.excluded || !Array.isArray(data.groups) || !Array.isArray(data.claims) || !Number.isInteger(data.offset)) throw Error('未收到完整備貨清單。');
    const groupId = data.group?.id || '';
    const pages = `<div class="admin-item-actions">${data.offset > 0 ? `<button type="button" class="compact-button" data-raffle-fulfillment-page="${Math.max(0,data.offset-50)}" data-group-id="${escape(groupId)}">上一頁</button>` : ''}${data.hasMore ? `<button type="button" class="compact-button" data-raffle-fulfillment-page="${data.offset+50}" data-group-id="${escape(groupId)}">下一頁</button>` : ''}</div>`;
    const heading = `<div class="admin-control"><h3>獎品／館別備貨清單</h3><p>待備貨 ${escape(data.totals.waiting)} 件 · 已備妥未領 ${escape(data.totals.ready)} 件 · 已領取 ${escape(data.totals.claimed)} 件</p><p class="item-meta">以上是本活動已同步的領獎需求，不是來源庫存。電子獎 ${escape(data.excluded.digital)} 筆、已取消 ${escape(data.excluded.cancelled)} 筆不再備貨；取消前已交付的數量仍保留於已領取統計。</p>${data.pickupBlocked ? '<p class="state error">已超過領取截止時間或期限設定有誤，請管理員核對；不可直接交付。</p>' : ''}<p class="item-meta">每頁最多 50 ${data.group ? '筆學生紀錄' : '組'}，第 ${Math.floor(data.offset/50)+1} 頁。</p></div>`;
    if (data.group) return heading + `<div class="admin-control"><button type="button" class="compact-button" data-raffle-fulfillment-group="">返回備貨總覽</button><h3>${escape(data.group.prizeName)}｜${escape(data.group.venue || '待確認館別')}</h3><p>共 ${escape(data.totalClaims)} 筆；請逐筆核對實際到館的獎品，沒有整組一次標記。</p></div>` + renderClaims(data.claims,campaigns,data) + pages;
    return heading + (data.groups.map(g=>`<article class="admin-control"><h3>${escape(g.prizeName)}｜${escape(g.venue || '待確認館別')}</h3><p>待備貨 ${escape(g.waiting)} 件 · 已備妥未領 ${escape(g.ready)} 件 · 已領取 ${escape(g.claimed)} 件</p><p class="item-meta">${escape(g.claimCount)} 筆領獎紀錄</p><button type="button" class="compact-button" data-raffle-fulfillment-group="${escape(g.id)}">查看學生／逐筆到館</button></article>`).join('') || '<div class="state">目前沒有實體獎品備貨紀錄。</div>') + pages;
  }
  function renderMailPreview(data) {
    if (!data || data.dryRun !== true || typeof data.deliveryChecked !== 'boolean' || !Number.isInteger(data.candidateCount) || !Number.isInteger(data.skipped) || !Array.isArray(data.previews)) throw Error('未收到完整邀請信預覽，請確認後端版本或稍後再試。');
    const ready = data.kind === 'ready';
    return `<div class="admin-control"><h3>${ready ? '領獎通知預覽' : '邀請信預覽'} · 不會寄出</h3>
      <p class="state">${ready ? '已核對來源、領取狀態及本系統通知紀錄。只通知已備妥且尚有未領數量的獎品；排入待寄不會寄出，寄送前會再核對。' : data.deliveryChecked ? '已核對本系統待寄紀錄與來源表寄送標記；不代表已核對外部寄信結果。排入待寄不會寄出，請再至「寄送前確認」核對發送條件。' : '尚未核對寄信紀錄：以下僅依來源表預覽內容，不是可直接寄送的名單。此預覽不可發送。'}</p>
      <p>候選收件人 ${escape(data.candidateCount || 0)} 位 · ${ready ? '未備妥、已領完、非實體或已保留通知等排除' : '已排入、已使用、來源已寄或無購課 ID 等排除'} ${escape(data.skipped || 0)} 筆${ready ? '獎品' : '資格'}</p>
      <p class="item-meta">最多顯示前 20 封。${ready ? '同一 Email 本次可通知的獎品合併一封；各獎品列出館別與未領數量，不附驗證碼。' : '同一 Email 的多個驗證碼合併一封；驗證碼請勿轉傳。'}</p>
      ${data.deliveryChecked && data.sendEnabled === false && data.readOnly === false && data.previewToken && data.batchCount > 0 ? `<button type="button" class="compact-button" data-raffle-confirm-mail>確認前 ${escape(data.batchCount)} 封排入待寄（不寄出）</button>` : ''}
      ${(data.previews || []).map(item => `<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>收件人：${escape(item.email)}</strong><p>主旨：${escape(item.subject)}</p><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(item.body)}</div></article>`).join('') || `<p class="state">目前沒有符合條件的${ready ? '領獎通知' : '邀請信'}。</p>`}
    </div>`;
  }
  function renderMailRecords(data) {
    if (!data || !Number.isInteger(data.total) || !Array.isArray(data.records)) throw Error('未收到完整寄信紀錄。');
    let handoffHtml='';
    if(data.lineHandoff!==undefined){
      const h=data.lineHandoff,keys=['missing','sending','accepted','rejected','unknown'];
      if(!h||!Number.isSafeInteger(h.total)||h.total<0||h.lineDeliveryChecked!==false||!['ob','email'].every(c=>h[c]&&keys.every(k=>Number.isSafeInteger(h[c][k])&&h[c][k]>=0)&&keys.reduce((n,k)=>n+h[c][k],0)===h.total))throw Error('通知交接紀錄不完整，請重新核對。');
      if(h.total)handoffHtml=`<section class="admin-control" aria-label="LINE 通知交接"><h3>LINE 流程已保留 ${escape(h.total)} 筆獎品</h3><p>以下是本活動的交接與備援紀錄，不包含在舊流程信件數。已保留不代表已寄出；此頁尚未核對 LINE 發送結果，不能當作未發送或已送達。</p>${[['ob','OB'],['email','Email']].map(([key,label])=>`<p>${label} 備援：服務已接受 ${h[key].accepted} 筆、結果待確認 ${h[key].sending+h[key].unknown} 筆、明確拒絕 ${h[key].rejected} 筆、無發送紀錄 ${h[key].missing} 筆。</p>`).join('')}<p>無備援紀錄可能是未執行或不需備援，請勿據此重送。待確認項目須核對原通知紀錄；服務接受不代表學生已讀。</p></section>`;
    }
    const channelLabels = {not_sent:'尚未發送',sending:'結果待確認',sent:'服務已接受',uncertain:'結果待確認',skipped:'不需發送',unbound:'未綁定 LINE',rejected:'明確拒絕'};
    const labels = {queued:'待寄（尚未寄出）',sending:'寄送已保留／結果待確認',sent:'已送出／已核對',uncertain:'寄送結果待確認',closed:'結案（不重寄）'};
    const offset = Number.isInteger(data.offset) ? data.offset : 0;
    const pages = `<div class="admin-item-actions">${offset > 0 ? `<button type="button" class="compact-button" data-raffle-mail-page="${Math.max(0,offset-50)}">上一頁</button>` : ''}${data.hasMore === true ? `<button type="button" class="compact-button" data-raffle-mail-page="${offset+50}">下一頁</button>` : ''}</div>${handoffHtml}`;
    return `<div class="admin-control"><h3>寄信紀錄</h3><p class="state">待寄不等於已寄出；LINE／Email／OB 接受發送不代表收件人已收到或手機已跳提醒。結果待確認時不會自動重寄，請先核對執行紀錄或向收件人確認。</p><p>共 ${escape(data.total)} 封，待核對 ${escape(data.reviewCount || 0)} 封。待核對優先顯示，每頁最多 50 封，第 ${Math.floor(offset/50)+1} 頁。</p>${data.records.map(item => `<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>${escape(item.email)}</strong><p>${item.kind === 'ready' ? '領獎通知' : '抽獎邀請'}｜${escape(item.closedBeforeSend ? '停止待寄（未寄出，不重排）' : labels[item.status] || '狀態待核對')}｜${escape(item.qualificationCount)} 筆${item.kind === 'ready' ? '獎品' : '資格'}</p><p>${escape(item.createdAt)}｜${escape(item.actor)}</p>${item.channels ? `<p>${item.channels.line ? 'LINE：'+escape(channelLabels[item.channels.line.status] || '待核對')+' · ' : ''}Email：${escape(channelLabels[item.channels.email?.status] || '待核對')} · OB：${escape(channelLabels[item.channels.ob?.status] || '待核對')}${item.channels.ob?.status === 'sent' ? '（手機推播已要求）' : ''}</p>` : item.status === 'queued' ? '<p>發送管道：OB＋Email</p>' : '<p>舊版紀錄：僅 Email，沒有補發 OB。</p>'}${item.updatedAt ? `<p>更新：${escape(item.updatedAt)}｜${escape(item.updatedBy)}</p>` : ''}${item.reason ? `<p>核對理由：${escape(item.reason)}</p>` : ''}${data.canCloseQueued === true && item.status === 'queued' ? `<button type="button" class="compact-button" data-raffle-close-queued="${escape(item.id)}">停止這封待寄（不重排）</button>` : ''}${item.deliveryMode==='line-first' && ['sending','uncertain'].includes(item.status) ? `<button type="button" class="compact-button" data-ready-line-check="${escape(item.id)}">查回 LINE 結果（不重送）</button>` : ''}${data.canReconcile === true && ['sending','uncertain'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-reconcile="${escape(item.id)}">人工核對結果（不重寄）</button>` : ''}</article>`).join('') || '<p>本頁沒有寄信紀錄。</p>'}${pages}</div>`;
  }
  function renderMailSendPreview(data) {
    if (!data || data.dryRun !== true || typeof data.sendEnabled !== 'boolean' || !Number.isInteger(data.batchCount) || data.batchCount < 0 || data.batchCount > 5 || !Array.isArray(data.previews) || data.previews.length !== data.batchCount || !data.previewToken) throw Error('未收到完整寄送預覽。');
    const lineFirst = data.kind === 'ready' && data.deliveryMode === 'line-first' && Array.isArray(data.channels) && data.channels.join(',') === 'line,email,ob';
    const dual = (lineFirst || Array.isArray(data.channels) && data.channels.join(',') === 'email,ob') && data.obPush === true;
    const canSend = dual && data.sendEnabled && Number.isInteger(data.quota) && data.quota >= data.batchCount && data.batchCount > 0;
    return `<div class="admin-control"><h3>${data.kind === 'ready' ? '領獎通知 · ' : ''}寄送前確認 · 尚未寄出</h3><p class="state">${!dual ? '通知服務版本尚未更新，請重新載入後再試；目前不可發送。' : !data.sendEnabled ? escape(data.blockedReason || '正式通知未啟用，或尚未確認舊寄信程式已停用交接。') : `目前剩餘配額：${escape(data.quota)} 位收件人；本批 ${escape(data.batchCount)} 封。配額不足時整批停止。`}</p><p>${lineFirst ? '本次優先 LINE；未綁定或明確拒絕才使用 OB＋Email。逾時或結果不明會停止，請查回 LINE 結果，不會重送或立即轉寄。' : '本次同時發送 OB 站內訊息（開啟手機推播）＋Email；不發 LINE。'}只寄出已排入待寄、再次核對來源一致的信件；每次最多 5 封。匯入或預覽不會寄信。</p>${canSend ? `<button type="button" class="compact-button" data-raffle-confirm-send>核對後寄出這 ${escape(data.batchCount)} 封</button>` : ''}${data.previews.map(item=>`<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>收件人：${escape(item.email)}</strong><p>主旨：${escape(item.subject)}</p><div style="white-space:pre-wrap">${escape(item.body)}</div></article>`).join('') || '<p>目前沒有待寄信件。</p>'}</div>`;
  }
  function renderProductionReadiness(data) {
    if(!data||typeof data.draftValid!=='boolean'||data.canActivate!==false||data.liveVerified!==false||!Array.isArray(data.blockers)||!Array.isArray(data.pendingChecks)||data.draftValid!==(data.blockers.length===0))throw Error('未收到完整上線檢查結果，不能視為通過。');
    const labels={draft_unconfigured:'尚未設定正式活動草稿',disabled_production_draft_required:'正式草稿必須保持關閉並等待啟用確認',activity_window:'活動日期須為 2026/11/15 至 12/31',reward_rules:'星星與送球規則不符',resource_isolation:'正式與測試資料資源尚未確認分離',room_mapping:'四館對應缺漏或重複',pass_mapping:'60／100 點課卡對應缺漏或重複',ball_prize_mapping:'球的正式獎品對應缺漏',referral_history:'新生歷史尚無完整證據，須保留人工核對',resource_inventory:'正式資源清單實際核對',member_identity:'全店會員身分配對',prize_inventory_mapping:'正式獎品與庫存來源對應',inventory:'實際庫存與備貨確認',notification_handoff:'OB＋Email 通知交接',end_to_end_acceptance:'完整流程真人驗收',launch_approval:'正式啟用確認'};
    labels.evidence_source_unavailable='核對來源無法讀取或資料不完整；本次不採用舊結果，請管理者確認來源與版本。';
    const items=list=>list.map(code=>`<li>${escape(labels[code]||'未知檢查項目，待核對')}</li>`).join('');
    const evidenceLabels={identity_snapshot_missing_or_stale:'會員核對資料缺漏、不完整、來源不符或超過一天',identity_unconfirmed:'會員配對缺少有效確認紀錄',identity_conflict:'重複 LINE／OB 會員配對，需先釐清',inventory_snapshot_missing_or_stale:'庫存核對資料缺漏、不完整、來源不符或超過一天',prize_mapping_invalid:'獎品、館別或數量設定有誤',inventory_duplicate:'同獎品同館別庫存重複',inventory_shortage:'庫存不足，不能用其他獎品數量抵補',ball_mapping_missing:'缺少球的正式獎品對應',notification_handoff_unverified:'OB＋Email 通知交接紀錄尚未核實'};
    let evidenceHtml='<p>尚無會員、庫存與通知的核對資料。</p>';
    const sourceHtml=data.evidenceSource==='configured_sheet'?'<p>核對來源：指定試算表的保存資料。這不是即時 OB／LINE 查詢，也不會建立會員綁定。</p>':data.evidenceSource==='saved_snapshot'?'<p>核對來源：伺服器保存的資料快照，不是即時查詢。</p>':'';
    if(data.evidence){
      if(data.evidence.canActivate!==false||data.evidence.liveVerified!==false)throw Error('核對資料不能當成正式啟用許可。');
      evidenceHtml=[['identity','會員配對'],['fulfillment','獎品與庫存'],['notifications','通知交接']].map(([key,title])=>{
        const r=data.evidence[key];if(!r||typeof r.snapshotValid!=='boolean'||!Number.isSafeInteger(r.count)||r.count<0||!Array.isArray(r.issues)||r.snapshotValid!==(r.issues.length===0))throw Error('核對資料不完整。');
        return `<h4>${title}</h4><p>${r.snapshotValid?'保存資料檢查通過（不是即時驗證）':'待核對'}${r.count?' · '+r.count+' 筆':''}</p><ul>${r.issues.map(code=>`<li>${escape(evidenceLabels[code]||'未知核對問題，請人工確認')}</li>`).join('')}</ul>`;
      }).join('');
    }
    return `<section class="admin-control"><h3>聖誕活動上線檢查（唯讀）</h3><p>僅檢查伺服器保存的草稿，不代表已部署或正式上線；不發獎、不改庫存、不發通知。</p><h4>設定檢查</h4>${data.draftValid?'<p>草稿格式檢查通過，尚未核實線上設定。</p>':`<ul>${items(data.blockers)}</ul>`}${sourceHtml}${evidenceHtml}<h4>正式驗收待確認</h4><ul>${items(data.pendingChecks)}</ul><p>此處不能啟用正式活動。原抽獎活動設定與本次聖誕活動驗收不同。</p></section>`;
  }
  function renderCampaignSettings(data) {
    if (!data || !Array.isArray(data.campaigns) || typeof data.readOnly !== 'boolean' || typeof data.operationalEnabled !== 'boolean' || data.campaigns.some(i=>!i.campaign || !['draft','active','paused'].includes(i.status) || !Number.isInteger(i.version))) throw Error('未收到完整活動設定。');
    return `<h3>活動設定</h3><p class="state">${data.operationalEnabled ? '工作台已開放。' : '正式作業尚未開放。'}設定不會匯入、扣庫存或寄信。修改已啟用活動前須先暫停本系統的查詢、領取與寄信；不會停止外部學生抽獎網站，既有紀錄與來源綁定保留。</p>${data.readOnly ? '<p>目前為唯讀設定。</p>' : '<button type="button" class="compact-button" data-settings-new>新增活動草稿</button>'}${data.campaigns.map(i=>`<article class="admin-control" style="overflow-wrap:anywhere"><h4>${escape(i.campaign.name)} · ${{draft:'草稿',active:'已啟用',paused:'已暫停'}[i.status]}</h4><p>活動代碼：${escape(i.campaign.id)}｜版本 ${i.version}</p><p>來源：${escape(i.campaign.sourceSpreadsheetId)}</p>${!data.readOnly ? i.status==='active' ? `<button type="button" class="compact-button" data-settings-pause="${escape(i.campaign.id)}">暫停活動</button>` : `<button type="button" class="compact-button" data-settings-edit="${escape(i.campaign.id)}">編輯／核對啟用</button>` : ''}</article>`).join('') || '<p>尚無活動設定。</p>'}`;
  }
  function mountCampaignSettings(root, options) {
    let disposed=false, busy=false, pending=null, current=null, data=null, activation=null;
    const node=s=>root.querySelector(s), requestId=()=>global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : `raffle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    root.innerHTML='<p role="status">讀取活動設定…</p>';
    const message=text=>{if(!disposed) node('[data-settings-message]').textContent=text;};
    const list=()=>{root.innerHTML=`<button type="button" class="compact-button" data-production-check>查看聖誕活動上線缺項（唯讀）</button><div data-production-report role="status"></div><div data-settings-list>${renderCampaignSettings(data)}</div><div data-settings-editor></div><p role="status" data-settings-message></p>`;};
    const refresh=async()=>{const result=await options.api('getRaffleCampaignSettings',{});if(disposed)return;renderCampaignSettings(result);data=result;current=null;activation=null;list();};
    function edit(item) {
      current=item || {campaign:{id:'',name:'',sourceSpreadsheetId:'',websiteUrl:'',pickupDeadline:'',readyPrizeVenues:[]},version:0,status:'draft'};
      const c=current.campaign;activation=null;pending=null;
      node('[data-settings-editor]').innerHTML=`<form class="admin-control" data-settings-form><h4>${c.id?'編輯草稿':'新增活動草稿'}</h4>${[['id','活動代碼（英數、-、_）'],['name','活動名稱'],['sourceSpreadsheetId','來源 Google 試算表 ID'],['websiteUrl','學生抽獎網址（HTTPS）'],['pickupDeadline','領獎截止時間（可留空，例：2027-01-31T22:00+08:00）']].map(([key,label])=>`<label style="display:block">${label}<input style="width:100%;box-sizing:border-box" name="${key}" value="${escape(c[key]||'')}" ${key==='id'&&c.id?'readonly':''} ${key!=='pickupDeadline'?'required':''}></label>`).join('')}<label style="display:block">教室現貨（可留空；每行：獎項ID｜館別）<textarea style="width:100%;box-sizing:border-box" name="readyPrizeVenues" rows="3">${escape((c.readyPrizeVenues||[]).map(p=>p.prizeId+'｜'+p.venue).join('\n'))}</textarea></label><p class="item-meta">請填未來活動資料；本次不搬舊活動。館別需與來源表「領取館別」完全一致。</p><button class="compact-button" type="submit">儲存草稿（不啟用）</button>${current.version>0?'<button class="compact-button" type="button" data-settings-preview>核對來源並預覽啟用</button>':''}<div data-settings-activation></div></form>`;
      const ob=c.obSync||{};
      node('[data-settings-form]').insertAdjacentHTML('beforeend',`<label style="display:block">買指定課卡直接送（每行：OB課卡ID｜獎項ID｜領取館別）<textarea style="width:100%;box-sizing:border-box" name="fixedGifts" rows="3">${escape((ob.fixedGifts||[]).map(g=>[g.passId,g.prizeId,g.venue].join('｜')).join('\n'))}</textarea></label><p class="item-meta">每筆符合資格的購課，固定送每項贈品各 1 件，學生不能選。可同時給抽獎機會；只送贈品時，抽獎課卡 ID 留空。0 元／免費課卡不符合購課活動資格；金額缺漏不自動發放。贈品不扣抽獎池庫存，請另備活動贈品。</p>`);
      node('[data-settings-form]').insertAdjacentHTML('beforeend',`<fieldset style="margin-top:16px"><legend>OB 購課資格（未使用可全部留空）</legend><p>使用台灣日期、已付款及課卡 ID 判定，每筆購課一次抽獎。啟用前須確認舊同步已停用交接。</p><label style="display:block">購課開始日<input type="date" name="obDateFrom" value="${escape(ob.dateFrom||'')}"></label><label style="display:block">購課結束日（含當日）<input type="date" name="obDateTo" value="${escape(ob.dateTo||'')}"></label><label style="display:block">符合資格的 OB 課卡 ID（逗號分隔）<input name="obPassIds" value="${escape((ob.passIds||[]).join(','))}" placeholder="請填 OB 實際課卡 ID，不是點數"></label></fieldset>`);
      const settingsForm=node('[data-settings-form]'),saveButton=settingsForm.querySelector('[type="submit"]');
      const giftLabel=settingsForm.elements.namedItem('fixedGifts').parentElement,giftNote=giftLabel.nextElementSibling;
      [settingsForm.querySelector('fieldset'),giftLabel,giftNote].forEach(el=>settingsForm.insertBefore(el,saveButton));
      if(current.status==='paused') {
        const form=node('[data-settings-form]');form.querySelector('h4').textContent='修改暫停中的活動';
        form.elements.namedItem('sourceSpreadsheetId').readOnly=true;
        form.querySelector('[type="submit"]').textContent='儲存修改（保持暫停）';
        form.insertAdjacentHTML('afterbegin','<label style="display:block">修改／恢復原因<input name="maintenanceReason" maxlength="300" required></label><p>現貨設定不會回頭改動已同步的領獎狀態；已排入的信件若內容不同，寄送前核對會阻擋。</p>');
      }
      node('[data-settings-form]').querySelectorAll('input,textarea').forEach(el=>{el.classList.add('text-input');});
      node('[data-settings-form]').querySelectorAll('label').forEach(el=>{el.style.marginBottom='12px';});
      message('');
    }
    function campaignFromForm() {
      const form=node('[data-settings-form]'), c={};
      ['id','name','sourceSpreadsheetId','websiteUrl','pickupDeadline'].forEach(k=>{c[k]=form.elements.namedItem(k).value.trim();});
      const dateFrom=form.elements.namedItem('obDateFrom').value,dateTo=form.elements.namedItem('obDateTo').value,ids=form.elements.namedItem('obPassIds').value.trim();
      const giftText=form.elements.namedItem('fixedGifts').value.trim();
      c.readyPrizeVenues=form.elements.namedItem('readyPrizeVenues').value.split('\n').filter(l=>l.trim()).map(line=>{const parts=line.split('｜');if(parts.length!==2)throw Error('現貨請每行填「獎項ID｜館別」。');return{prizeId:parts[0].trim(),venue:parts[1].trim()};});
      if(dateFrom||dateTo||ids||giftText){
        if(!dateFrom||!dateTo||(!ids&&!giftText))throw Error('請填購課開始日、結束日，以及抽獎課卡或固定贈品設定。');
        c.obSync={dateFrom,dateTo,passIds:ids.split(/[,，\s]+/).filter(Boolean)};
        if(giftText)c.obSync.fixedGifts=giftText.split('\n').filter(l=>l.trim()).map(line=>{const parts=line.split('｜').map(p=>p.trim());if(parts.length!==3||parts.some(p=>!p))throw Error('固定贈品請每行填「OB課卡ID｜獎項ID｜領取館別」。');return{passId:parts[0],prizeId:parts[1],venue:parts[2]};});
      }
      return c;
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
      if(!result || result.campaignId!==p.campaignId || result.version!==p.operation.version+1 || result.status!==(p.action==='manageRaffleCampaign'?'paused':p.action==='saveRaffleCampaign'?'draft':'active'))throw Error('未收到完整儲存結果，請重試同一筆操作。');
      pending=null;await refresh();if(disposed)return;
      if(result.status!=='active')edit(data.campaigns.find(i=>i.campaign.id===result.campaignId));
      message(result.status==='active'?'已啟用活動設定；未匯入或寄信。請離開再進入領獎工作台，更新活動清單。':result.status==='paused'?'活動保持暫停，紀錄未刪除。修改後須重新核對來源並啟用。':'草稿已儲存，尚未啟用。');
    }
    const maintenanceReason=()=>{const reason=node('[name="maintenanceReason"]')?.value.trim();if(!reason)throw Error('請填寫修改／恢復原因。');return reason;};
    const submit=event=>{if(!event.target.matches('[data-settings-form]'))return;event.preventDefault();run(async()=>{const campaign=campaignFromForm();pending={action:current.status==='paused'?'manageRaffleCampaign':'saveRaffleCampaign',campaignId:campaign.id,operation:{campaign,version:current.version,requestId:requestId(),...(current.status==='paused'?{action:'update',campaignId:campaign.id,reason:maintenanceReason()}: {})}};await write();});};
    const input=()=>{activation=null;const box=node('[data-settings-activation]');if(box)box.replaceChildren();};
    const click=event=>{
      const button=event.target.closest('button');if(!button||busy)return;
      if(button.hasAttribute('data-production-check'))return run(async()=>{
        node('[data-production-report]').textContent='檢查中，請稍候…';
        try {const report=await options.api('getActivityProductionReadiness',{});if(!disposed)node('[data-production-report]').innerHTML=renderProductionReadiness(report);}
        catch(error){if(!disposed)node('[data-production-report]').textContent='無法取得完整檢查結果，不能視為通過。';throw error;}
      });
      if(button.hasAttribute('data-settings-new'))return edit(null);
      if(button.hasAttribute('data-settings-edit'))return edit(data.campaigns.find(i=>i.campaign.id===button.dataset.settingsEdit));
      if(button.hasAttribute('data-settings-pause'))return run(async()=>{
        const item=data.campaigns.find(i=>i.campaign.id===button.dataset.settingsPause);
        const reason=global.prompt('暫停本系統的查詢、領取及寄信（不影響外部抽獎網站），保留所有紀錄。請填寫原因：');
        if(reason===null)return;if(!reason.trim()||reason.length>300)throw Error('請填寫原因（最多 300 字）。');
        pending={action:'manageRaffleCampaign',campaignId:item.campaign.id,operation:{action:'pause',campaignId:item.campaign.id,version:item.version,reason:reason.trim(),requestId:requestId()}};await write();
      });
      if(button.hasAttribute('data-settings-retry'))return run(write);
      if(button.hasAttribute('data-settings-reload'))return run(async()=>{await refresh();if(disposed)return;pending=null;message('已重新讀取最新狀態，沒有重送；請核對草稿／已啟用狀態後再操作。');});
      if(button.hasAttribute('data-settings-preview'))return run(async()=>{
        if(JSON.stringify(campaignFromForm())!==JSON.stringify(current.campaign))throw Error('請先儲存變更，再核對來源。');
        const result=await options.api('previewRaffleCampaignActivation',{campaignId:current.campaign.id});if(disposed)return;
        if(!result || result.canActivate!==true || result.campaignId!==current.campaign.id || result.version!==current.version || !result.previewToken || !Number.isInteger(result.sourceRows) || !Number.isInteger(result.prizeCount))throw Error('未收到完整啟用核對結果。');
        activation=result;node('[data-settings-activation]').innerHTML=`<p>來源核對通過：${result.sourceRows} 筆名單、${result.prizeCount} 個獎品。尚未同步／寄信。</p><button type="button" class="compact-button" data-settings-activate>確認啟用此活動設定（不寄信）</button>`;message('');
      });
      if(button.hasAttribute('data-settings-activate')&&activation)return run(async()=>{
        const reason=current.status==='paused'?maintenanceReason():undefined;
        if(!global.confirm('確認啟用此活動設定？不會匯入名單或寄信；之後修改須先暫停。'))return;
        pending={action:'activateRaffleCampaign',campaignId:current.campaign.id,operation:{campaignId:current.campaign.id,version:current.version,previewToken:activation.previewToken,requestId:requestId(),...(reason?{reason}:{})}};await write();
      });
    };
    root.addEventListener('submit',submit);root.addEventListener('input',input);root.addEventListener('click',click);
    refresh().catch(e=>{if(!disposed)root.innerHTML=`<p class="state error">${escape(e.message||'活動設定讀取失敗。')}</p>`;});
    return()=>{disposed=true;root.removeEventListener('submit',submit);root.removeEventListener('input',input);root.removeEventListener('click',click);root.replaceChildren();};
  }
  function renderObSyncPreview(data) {
    if (!data || data.dryRun !== true || typeof data.readOnly !== 'boolean' || !data.campaignId || !data.previewToken || !Array.isArray(data.passIds) ||
        ['fetched','newCount','existing','skipped','batchCount','raffleCount','giftCount','excludedZeroPrice','needsReview'].some(k=>!Number.isInteger(data[k])||data[k]<0) || data.raffleCount+data.giftCount!==data.newCount || !Array.isArray(data.gifts) || !Array.isArray(data.reviewPurchases) || data.batchCount !== Math.min(25,data.newCount)) throw Error('未收到完整 OB 同步預覽，不能確認。');
    return `<h3>同步 OB 購課名單 · 尚未寫入</h3><p>購課期間（台灣時間）：${escape(data.dateFrom)} 至 ${escape(data.dateTo)}<br>抽獎課卡 ID：${data.passIds.map(escape).join('、')||'無（僅直接送）'}</p><p>讀取 ${data.fetched} 筆購課 · 抽獎資格 ${data.raffleCount} 筆 · 固定贈品 ${data.giftCount} 件 · 已同步 ${data.existing} 筆資格／贈品</p><p>排除 0 元／免費课卡 ${data.excludedZeroPrice} 筆 · 金額待核對 ${data.needsReview} 筆 · 不符合共 ${data.skipped} 筆購課</p>${data.reviewPurchases.map(p=>`<p class="state error">購課 ${escape(p.purchaseId)}：${escape(p.reason)}</p>`).join('')}${data.gifts.map(g=>`<p>直接送：${escape(g.studentName)}｜${escape(g.prizeName)}｜${escape(g.venue)}｜購課 ${escape(g.purchaseId)}</p>`).join('')}<p>抽獎資格才產生驗證碼；直接送會新增固定贈品領取紀錄，每項 1 件，不需學生選獎。兩者可同時取得、各自防止重複。只追加紀錄，不修改舊資料、不扣抽獎池庫存、不寄信。</p>${!data.readOnly && data.batchCount ? `<button type="button" class="compact-button" data-ob-confirm>確認新增 ${data.batchCount} 筆資格／贈品（不寄信）</button>` : '<p>目前沒有可寫入的新增資格，或寫入尚未啟用。</p>'}`;
  }
  function mountObSync(root, options, campaignId) {
    let disposed=false,busy=false,plan=null;
    root.innerHTML='<p role="status" data-ob-message></p><div data-ob-result></div><button type="button" class="compact-button" data-ob-preview>重新核對 OB（不寫入）</button>';
    const message=root.querySelector('[data-ob-message]'),result=root.querySelector('[data-ob-result]');
    const run=async(write)=>{
      if(disposed||busy)return;
      if(write && (!plan || !global.confirm(`確認新增 ${plan.batchCount} 筆資格／固定贈品？不會寄信或扣抽獎池庫存。`)))return;
      busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);message.textContent=write?'同步中，請勿重複操作…':'核對 OB 購課資料中…';
      try {
        if(write){
          const expected=plan.batchCount;
          const data=await options.api('confirmRaffleObSync',{operation:JSON.stringify({campaignId,previewToken:plan.previewToken,requestId:global.crypto.randomUUID()})});
          if(disposed)return;
          if(!data||data.campaignId!==campaignId||data.inserted!==expected||data.mailSent!==false||!Number.isInteger(data.remaining)||data.remaining<0||!Number.isInteger(data.raffleInserted)||!Number.isInteger(data.giftInserted)||data.raffleInserted<0||data.giftInserted<0||data.raffleInserted+data.giftInserted!==data.inserted)throw Error('未收到完整同步結果');
          plan=null;result.replaceChildren();message.textContent=`已新增 ${data.raffleInserted} 筆抽獎資格、${data.giftInserted} 件固定贈品，尚有 ${data.remaining} 筆；沒有寄信。可重新核對下一批；抽獎用「預覽邀請信」，贈品備妥後用「領獎通知」。`;
        }else{
          plan=null;result.replaceChildren();const data=await options.api('previewRaffleObSync',{campaignId});if(disposed)return;
          if(data?.campaignId!==campaignId)throw Error('OB 同步活動不符。');
          result.innerHTML=renderObSyncPreview(data);plan=data;message.textContent='';
        }
      }catch(error){if(!disposed){plan=null;result.replaceChildren();message.textContent=(error.message||'讀取失敗')+(write?'。尚未確認結果，請先重新核對 OB；已同步購課會自動排除，不要重複補建。':'');}}
      finally{busy=false;if(!disposed)root.querySelectorAll('button').forEach(b=>b.disabled=false);}
    };
    const click=e=>{if(e.target.closest('[data-ob-preview]'))run(false);if(e.target.closest('[data-ob-confirm]'))run(true);};
    root.addEventListener('click',click);run(false);
    return()=>{disposed=true;root.removeEventListener('click',click);root.replaceChildren();};
  }
  function createActivityGiftController({api,storage,actor,isActive=()=>true,id=()=>global.crypto.randomUUID()}) {
    const key='activity-gift-app-pending:'+actor;
    let busy=false;
    const pending=()=>{const raw=storage.getItem(key);return raw?JSON.parse(raw):null;};
    const terminal=r=>r&&['recorded','superseded'].includes(r.state);
    const finish=r=>{if(terminal(r))storage.removeItem(key);return r;};
    const send=async op=>{if(!isActive())throw Error('頁面已關閉，本次未繼續送出');const r=await api('mutateActivityGift',{operation:op,expectedActor:actor});if(!terminal(r))throw Error('結果尚未確認');return finish(r);};
    return {pending,
      async submit(input){if(busy||pending())throw Error('請先核對上一筆');busy=true;try{const op={...input,requestId:id()};storage.setItem(key,JSON.stringify(op));return await send(op);}finally{busy=false;}},
      async reconcile(){if(busy)throw Error('核對中');const op=pending();if(!op)return null;busy=true;try{return finish(await api('getActivityGiftOperation',{operation:op,expectedActor:actor}));}finally{busy=false;}},
      async retry(){if(busy)throw Error('核對中');const op=pending();if(!op)return null;busy=true;try{const r=await api('getActivityGiftOperation',{operation:op,expectedActor:actor});if(terminal(r))return finish(r);if(r.state!=='missing')throw Error('結果尚未確認');return await send(op);}finally{busy=false;}}
    };
  }

  function mountActivityGifts(root, options) {
    let disposed=false,busy=false,controller=null,controllerActor='',claims=[],readOnly=true;
    root.classList.add('raffle-gift-workspace');
    root.innerHTML='<h3>活動獎品（限定測試）</h3><p>沿用目前老師登入。僅測試紀錄，不發放正式獎品或通知。</p><button type="button" class="compact-button" data-gift-load>查看／更新測試獎品</button><label>搜尋學生<input class="text-input" data-gift-search placeholder="姓名或 Email"></label><label>篩選獎品<select class="text-input" data-gift-prize><option value="">全部獎品</option></select></label><p data-gift-message role="status" aria-live="polite"></p><div data-gift-recovery hidden><button type="button" class="compact-button" data-gift-check>核對上一筆</button><button type="button" class="compact-button" data-gift-retry>以原操作重試</button></div><div data-gift-claims></div>';
    const node=s=>root.querySelector(s),message=text=>{if(!disposed)node('[data-gift-message]').textContent=text;};
    const outcome=r=>r?.state==='recorded'?'已核對完成，不會重複領取。':r?.state==='superseded'?'資料已有更新；這筆未重複寫入，請依最新紀錄操作。':'未查到完成紀錄；可再次核對，或以原操作重試。';
    function render(){
      if(disposed)return;
      let pending=null;try{pending=controller&&controller.pending();}catch(_){message('無法讀取待核對紀錄，請勿繼續領取。');pending=true;}
      node('[data-gift-recovery]').hidden=!pending;
      root.querySelectorAll('button').forEach(b=>b.disabled=busy);
      node('[data-gift-retry]').disabled=busy||readOnly;
      const query=node('[data-gift-search]').value.trim().toLowerCase();
      const prize=node('[data-gift-prize]').value;
      const filtered=claims.filter(c=>(!prize||c.prizeName===prize)&&[c.studentName,c.email].some(v=>v.toLowerCase().includes(query)));
      const card=c=>{
        const remaining=c.quantity-c.claimedQuantity;
        const unit=c.directPickup?'顆':'件';
        const collectible=remaining>0&&(['ready','partial'].includes(c.status)||(c.directPickup&&c.status==='waiting'));
        const disabled=busy||pending||readOnly?' disabled':'';
        const button=(label,action,quantity)=>`<button type="button" class="compact-button" data-gift-id="${escape(c.id)}" data-gift-action="${action}" data-gift-quantity="${quantity||''}"${disabled}>${label}</button>`;
        return `<section class="admin-item"><strong>${escape(c.studentName)}</strong><p>${escape(c.email)} · ${escape(c.prizeName)}</p><p>${escape(c.directPickup?'教室現貨':c.venue)} · 已領 ${c.claimedQuantity}／共 ${c.quantity} ${unit} · 剩餘 ${remaining} ${unit}</p>${collectible?button('登記領取 1 '+unit+'（測試）','collect',1)+(remaining>=2?button('登記領取 2 '+unit+'（測試）','collect',2):''):''}${c.status==='waiting'&&!c.directPickup?button('標記已到館（測試）','prepare'):''}</section>`;
      };
      const outstanding=filtered.filter(c=>c.claimedQuantity<c.quantity),completed=filtered.filter(c=>c.claimedQuantity>=c.quantity);
      const historyOpen=!!node('[data-gift-history]')?.open;
      node('[data-gift-claims]').innerHTML='<h4>待領取 · '+outstanding.length+' 筆</h4><div class="raffle-gift-grid">'+(outstanding.map(card).join('')||'<p>目前沒有符合條件的待領獎品。</p>')+'</div>'+(completed.length?'<details data-gift-history'+(historyOpen?' open':'')+'><summary>已領完紀錄 · '+completed.length+' 筆</summary><div class="raffle-gift-grid">'+completed.map(card).join('')+'</div></details>':'');
    }
    async function load(){
      const data=await options.api('getActivityGiftWorkspace',{});if(disposed)return;
      if(data.testOnly!==true||!data.actor||!Array.isArray(data.claims))throw Error('測試資料無法確認');
      if(!controller||controllerActor!==data.actor){const actor=data.actor;controllerActor=actor;controller=createActivityGiftController({api:options.api,storage:global.localStorage,actor,isActive:()=>!disposed&&controllerActor===actor});}
      claims=data.claims;readOnly=data.readOnly!==false;
      const select=node('[data-gift-prize]'),selected=select.value,names=[...new Set(claims.map(c=>c.prizeName))];
      select.innerHTML='<option value="">全部獎品</option>'+names.map(name=>`<option value="${escape(name)}">${escape(name)}</option>`).join('');
      select.value=names.includes(selected)?selected:'';
    }
    async function run(fn){if(disposed||busy)return;busy=true;message('處理中，正在核對最新紀錄，請稍候，勿重複點擊。');render();try{await fn();}catch(e){message((e.message||'連線中斷')+'；若已送出，請先核對上一筆。');}finally{busy=false;render();}}
    node('[data-gift-load]').onclick=()=>run(async()=>{await load();if(disposed)return;if(controller.pending()){const r=await controller.reconcile();await load();message(outcome(r));}else message(readOnly?'目前僅可查看測試紀錄。':'請核對學生與顆數；這裡不可實際兌領。');});
    node('[data-gift-search]').oninput=render;
    node('[data-gift-prize]').onchange=render;
    node('[data-gift-check]').onclick=()=>run(async()=>{const r=await controller.reconcile();await load();message(outcome(r));});
    node('[data-gift-retry]').onclick=()=>run(async()=>{const r=await controller.retry();await load();message(outcome(r));});
    node('[data-gift-claims]').onclick=event=>{
      const b=event.target.closest('[data-gift-id]');if(!b||b.disabled||disposed||busy||readOnly)return;
      const c=claims.find(c=>c.id===b.dataset.giftId);if(!c)return;
      if(!global.confirm(`限定測試：${c.studentName}，${b.textContent}？不發放實物。`))return;
      run(async()=>{const op={action:b.dataset.giftAction,claimId:c.id,version:c.version};if(op.action==='collect')op.quantity=Number(b.dataset.giftQuantity);const r=await controller.submit(op);await load();message(outcome(r));});
    };
    return ()=>{disposed=true;root.replaceChildren();};
  }

  function mount(root, options) {
    let disposed = false, serial = 0, campaigns = [], workspace = {}, preview = null, mailPlan = null, sendPlan = null, mailRecordsData = null, fulfillmentView = null, pending = null;
    if(!document.getElementById('raffle-workspace-style')){
      const style=document.createElement('style');style.id='raffle-workspace-style';
      style.textContent='.raffle-ops-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}.raffle-ops-grid>div{padding:14px;border:1px solid #ddd3c8;border-radius:10px}.raffle-ops p{margin:10px 0}.raffle-ops details{margin-top:12px}.raffle-ops summary{cursor:pointer;font-weight:600}.raffle-ops li{margin:8px 0}.raffle-gift-workspace{padding:24px;margin-top:24px;border:1px solid #ddd3c8;border-radius:14px;background:#fffdf9}.raffle-gift-workspace>label{display:block;margin:16px 0 0}.raffle-gift-workspace h3{margin-top:0}.raffle-gift-workspace [data-gift-message]{padding:12px;background:#f5f1e9;border-radius:8px}.raffle-gift-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}.raffle-gift-grid .admin-item{border:1px solid #ddd3c8;border-radius:12px;padding:18px;overflow-wrap:anywhere}.raffle-gift-grid .compact-button{margin:4px 6px 4px 0}.raffle-tools,[data-gift-history]{border-top:1px solid #ddd3c8;margin-top:20px;padding-top:16px}.raffle-tools summary,[data-gift-history] summary{cursor:pointer;font-weight:600;padding:8px 0}.raffle-tools[open] summary,[data-gift-history][open] summary{margin-bottom:12px}';document.head.appendChild(style);
    }
    const admin = options.mode === 'admin';
    const node = selector => root.querySelector(selector);
    root.innerHTML = '<div class="state" role="status">載入領獎工作台…</div>';
    const initial = options.api('getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher' });
    let settingsCleanup=null,obCleanup=null,giftCleanup=null,taskCleanup=null,toolsCleanup=null;
    function giftPanel(data){
      if(admin&&data.productionTaskReviewEnabled===true&&['冠蓉','Tako'].includes(data.productionTaskActor)){
        const panel=document.createElement('section');root.appendChild(panel);
        try{if(!global.SherryProductionTasks)throw Error('活動審核畫面未載入，請重新整理。');taskCleanup=global.SherryProductionTasks.mount(panel,{...options,actor:data.productionTaskActor});}
        catch(e){panel.className='state error';panel.textContent=e.message||'活動審核暫時無法載入。';}
      }
      if(admin&&data.ballInventoryPreviewEnabled===true){
        const panel=document.createElement('section');panel.className='admin-control';
        panel.innerHTML='<button type="button" class="compact-button">查看球庫存（唯讀）</button><div aria-live="polite"></div>';root.appendChild(panel);
        const button=panel.querySelector('button'),body=panel.querySelector('div');
        button.addEventListener('click',async()=>{
          button.disabled=true;body.textContent='查詢中…';
          try{const r=await options.api('getRaffleBallInventory',{});if(!disposed)body.innerHTML=renderBallInventory(r);}
          catch(e){if(!disposed)body.textContent=e.message||'庫存讀取失敗，請重新查詢。';}
          finally{if(!disposed)button.disabled=false;}
        });
      }
if(data.activityGiftTestEnabled!==true)return;const panel=document.createElement('section');panel.dataset.activityGiftPanel='';root.appendChild(panel);giftCleanup=mountActivityGifts(panel,options);}
    function lineTestPanel(data) {
      if(!admin || data.readyLineTestAvailable!==true)return;
      const panel=document.createElement('details');panel.className='admin-control';panel.innerHTML='<summary>LINE 通知測試（僅你與 Tako）</summary><p>由目前登入的管理者寄給自己；不新增獎品、不扣庫存。先預覽，再確認寄送；一人本輪最多一次。</p><button type="button" class="compact-button" data-test-line-load>查看我的測試通知</button><div data-test-line-result role="status"></div>';
      root.appendChild(panel);let busy=false,actor=null;
      const box=panel.querySelector('[data-test-line-result]'),button=panel.querySelector('[data-test-line-load]');
      function show(d){if(!d||d.testOnly!==true||typeof d.actor!=='string'||typeof d.email!=='string'||typeof d.canSend!=='boolean')throw Error('測試回應不完整，請查回結果，不要重送。');actor=d.actor;const names={accepted:'LINE 已接受，請確認手機是否收到。',rejected:'LINE 明確拒絕，本輪測試沒有寄備援。',unbound:'查無已驗證 LINE 綁定，本輪測試沒有寄備援。',sending:'結果待查，請按查看，不要重送。',unknown:'結果待查，請按查看，不要重送。'};box.innerHTML='<p>'+escape(d.email)+'</p><p>'+escape(d.receipt?names[d.receipt.outcome]||'尚待核對':'尚未發送')+'</p>'+(d.canSend?'<button type="button" class="compact-button" data-test-line-send>確認寄給我一封測試 LINE</button>':'');}
      async function run(send){if(disposed||busy)return;busy=true;button.disabled=true;box.querySelectorAll('button').forEach(b=>b.disabled=true);try{const d=await options.api(send?'sendRaffleReadyLineTest':'getRaffleReadyLineTest',send?{expectedActor:actor}:{});if(!disposed)show(d);}catch(e){if(!disposed)box.textContent=(e.message||'連線中斷')+'；請按查看查回結果，不要重送。';}finally{busy=false;button.disabled=false;}}
      button.onclick=()=>run(false);box.onclick=e=>{if(e.target.closest('[data-test-line-send]'))run(true);};
    }
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
    const cleanup = () => { disposed = true; serial++; if(settingsCleanup)settingsCleanup(); if(obCleanup)obCleanup(); if(giftCleanup)giftCleanup(); if(taskCleanup)taskCleanup(); if(toolsCleanup)toolsCleanup(); root.replaceChildren(); };
    initial.then(data => {
      if (disposed) return;
      if (!data.enabled || !data.campaigns.length) {
        root.innerHTML = '<div class="state">領獎工作台尚未開放。未來活動設定完成後，會在這裡提供查詢；舊活動不會自動搬入。</div>';
        settingsButton();lineTestPanel(data);
        giftPanel(data);
        return;
      }
      campaigns = data.campaigns;
      workspace = data;
      if(campaigns.length!==1){
        root.innerHTML='<div class="state" role="status">本次活動尚未設定完成，請由管理者確認唯一活動後再操作。</div>';
        settingsButton();lineTestPanel(data);
        return;
      }
      const currentCampaign=campaigns[0];
      root.innerHTML = `<div class="state">${data.readOnly !== false ? '目前為核對預覽版：可查詢、核對來源，尚不能登記領取或寄信。' : '逐筆核對學生、獎品與館別後再交付。備貨、領取都有紀錄；匯入不會自動寄信。'}</div>
        <form class="admin-control raffle-search">
          <p class="item-meta">本次活動 · <strong>${escape(currentCampaign.name)}</strong></p>
          <label>學生姓名或完整 Email<input class="text-input" data-raffle-query maxlength="100" placeholder="姓名至少 2 個字，或輸入完整 Email" autocomplete="off"></label>
          <div class="admin-item-actions"><button type="submit" class="compact-button">查詢學生</button>${data.canPrepare ? '<button type="button" class="compact-button" data-raffle-fulfillment>獎品／館別備貨清單</button>' : ''}${admin ? '<button type="button" class="compact-button" data-raffle-preview>同步領獎資料</button><button type="button" class="compact-button" data-raffle-mail-preview>預覽邀請信（不寄出）</button><button type="button" class="compact-button" data-raffle-mail-send>寄送前確認</button><button type="button" class="compact-button" data-raffle-mail-records>寄信紀錄</button>' : ''}</div>
        </form><div data-raffle-notice aria-live="polite"></div><div data-raffle-result aria-live="polite"><div class="state">請先搜尋學生，不會列出全部名單。</div></div>
        <dialog data-raffle-dialog><form class="dialog-body raffle-search" data-raffle-operation-form><div data-raffle-dialog-body></div><div data-raffle-operation-error class="item-meta" role="alert"></div><div class="admin-item-actions"><button type="submit" class="compact-button" data-raffle-save>確認</button><button type="button" class="compact-button" data-raffle-cancel>取消</button></div></form></dialog>`;
      const form = node('form'), result = node('[data-raffle-result]');
      if(admin && global.SherryActivityTools){const toolsRoot=document.createElement('section');form.after(toolsRoot);toolsCleanup=global.SherryActivityTools.mount(toolsRoot,{api:options.api,campaignId:currentCampaign.id,readOnly:data.readOnly!==false});}
      if(admin){
        const panel=document.createElement('section');panel.className='admin-control raffle-ops';
        panel.innerHTML='<div class="admin-item-actions"><h3 style="flex:1;margin:0">同步與通知狀態</h3><button type="button" class="compact-button">更新狀態</button></div><div data-ops-content aria-live="polite">讀取執行紀錄中…</div>';
        form.before(panel);
        const button=panel.querySelector('button'),body=panel.querySelector('[data-ops-content]');
        const load=async()=>{button.disabled=true;body.textContent='讀取執行紀錄中…';try{const data=await options.api('getActivityOperations',{});if(!disposed)body.innerHTML=renderOperations(data);}catch(e){if(!disposed)body.textContent=e.message||'無法讀取狀態，請更新確認；這不代表沒有異常。';}finally{if(!disposed)button.disabled=false;}};
        button.onclick=load;load();
      }

      if(admin){
        form.querySelector('.admin-item-actions').insertAdjacentHTML('afterbegin','<button type="button" class="compact-button" data-raffle-ob-sync>同步 OB 購課名單</button>');
        node('[data-raffle-ob-sync]').addEventListener('click',()=>{
          const campaignId=currentCampaign.id;
          const dialog=document.createElement('dialog');dialog.style.cssText='width:min(680px,calc(100vw - 32px));max-height:85vh;overflow:auto;box-sizing:border-box';dialog.innerHTML='<button type="button" data-ob-close>關閉同步</button><div data-ob-content></div>';root.appendChild(dialog);
          const disposePanel=mountObSync(dialog.querySelector('[data-ob-content]'),options,campaignId);
          let closed=false;const close=()=>{if(closed)return;closed=true;disposePanel();dialog.remove();if(obCleanup===close)obCleanup=null;};
          obCleanup=close;dialog.querySelector('[data-ob-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',close);dialog.showModal();
        });
      }
      if(admin) form.querySelector('.admin-item-actions').insertAdjacentHTML('beforeend','<button type="button" class="compact-button" data-raffle-ready-preview>預覽領獎通知（不寄出）</button><button type="button" class="compact-button" data-raffle-ready-send>領獎通知寄送前確認</button>');
      if(admin) form.querySelector('.admin-item-actions').insertAdjacentHTML('afterbegin','<button type="button" class="compact-button" data-raffle-overview>活動總覽（唯讀）</button>');
      if(admin){
        const tools=document.createElement('details');tools.className='raffle-tools';
        tools.innerHTML='<summary>管理工具：同步資料與通知</summary><p class="item-meta">需要同步或寄送時再展開；通知仍須完成寄送前確認。</p><div class="admin-item-actions"></div>';
        const actions=tools.querySelector('div');
        ['ob-sync','preview','mail-preview','mail-send','mail-records','ready-preview','ready-send'].forEach(name=>{const button=node('[data-raffle-'+name+']');if(button)actions.appendChild(button);});
        form.appendChild(tools);
      }
      if(data.canPrepare){
        const guide=document.createElement('section');guide.className='admin-control';
        guide.innerHTML='<h3>店長：備貨、到館與通知</h3><p>學生選好需要送館的獎品後，Tako 會在 App 收到備貨提醒，附學生姓名、完整 Email、獎品與館別。</p><p>備貨送到後，開啟「獎品／館別備貨清單」→「查看學生／逐筆到館」→「確認到館並通知學生」。只處理這筆獎品；結果不明時先查寄信紀錄，不要重送。</p>';
        form.after(guide);
      }
      settingsButton();lineTestPanel(data);
      giftPanel(data);
      async function read(isPreview, offset = 0, groupId = '') {
        const overview = isPreview === 'overview';
        const readyMail = isPreview === 'ready' || isPreview === 'readySend';
        const mailPreview = isPreview === 'mail' || isPreview === 'ready';
        const mailRecords = isPreview === 'mailRecords';
        const mailSend = isPreview === 'mailSend' || isPreview === 'readySend';
        const fulfillment = isPreview === 'fulfillment';
        const campaignId = currentCampaign.id;
        const query = node('[data-raffle-query]').value.trim();
        if (!isPreview && query.length < 2) { result.innerHTML = '<div class="state">請輸入至少 2 個字的姓名或完整 Email。</div>'; return; }
        if (fulfillment && !campaignId) { result.innerHTML = '<div class="state">請先選擇一個活動，再查看備貨清單。</div>'; return; }
        const request = ++serial;
        form.querySelectorAll('button').forEach(b => { b.disabled = true; });
        result.innerHTML = '<div class="state" role="status">核對資料中…</div>';
        try {
          const data = await options.api(overview ? 'getRaffleOverview' : fulfillment ? 'getRaffleFulfillment' : mailSend ? (readyMail ? 'previewRaffleReadyMailSend' : 'previewRaffleMailSend') : mailRecords ? 'getRaffleMailRecords' : mailPreview ? (readyMail ? 'previewRaffleReadyNotifications' : 'previewRaffleInvitations') : isPreview ? 'previewRaffleImport' : 'getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher', campaignId, query, ...(mailRecords || fulfillment ? {offset} : {}), ...(fulfillment ? {groupId} : {}) });
          if (disposed || request !== serial) return;
          if (overview && data?.campaignId !== campaignId) throw Error('活動總覽與所選活動不符，請重新核對。');
          if ((mailPreview || mailSend) && (readyMail ? data?.kind !== 'ready' : data?.kind && data.kind !== 'invitation')) throw Error('寄信用途不符，請重新核對。');
          if (!isPreview && !data.enabled) { result.innerHTML = '<div class="state">工作台已暫停開放。</div>'; return; }
          mailPlan = mailPreview ? {...data,campaignId} : null;
          sendPlan = mailSend ? {...data,campaignId} : null;
          mailRecordsData = mailRecords ? {...data,campaignId} : null;
          fulfillmentView = fulfillment ? {offset,groupId} : null;
          if (fulfillment) workspace = data;
          if (overview || mailPreview || mailRecords || mailSend || fulfillment) preview = null;
          else if (isPreview) preview = { ...data, campaignId };
          else { workspace = data; preview = null; }
          result.innerHTML = overview ? renderOverview(data) : fulfillment ? renderFulfillment(data,campaigns) : mailSend ? renderMailSendPreview(data) : mailRecords ? renderMailRecords(data) : mailPreview ? renderMailPreview(data) : isPreview ? renderPreview(data) : renderClaims(data.claims || [], campaigns, data);
          if(mailRecords && data.canReopen===true) result.querySelectorAll('article').forEach((article,i)=>{
            const record=data.records[i];if(record?.status!=='closed'||record.closedBeforeSend!==true)return;
            const button=document.createElement('button');button.type='button';button.className='compact-button';button.dataset.raffleReopen=record.id;button.textContent='重新核對內容／排入待寄';article.appendChild(button);
          });
          if (!isPreview && (data.claims || []).length >= 50) result.insertAdjacentHTML('beforeend', '<p class="state">最多顯示 50 筆，請用完整 Email 縮小範圍。</p>');
        } catch (error) {
          if (!disposed && request === serial) result.innerHTML = `<div class="state error">${escape(error.message || '讀取失敗，請稍後重試。')}</div>`;
        } finally {
          if (!disposed && request === serial) form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        }
      }
      form.addEventListener('submit', event => { event.preventDefault(); read(false); });
      if (admin) node('[data-raffle-preview]').addEventListener('click', () => read(true));
      if (admin) node('[data-raffle-overview]').addEventListener('click', () => read('overview'));
      if (admin) node('[data-raffle-mail-preview]').addEventListener('click', () => read('mail'));
      if (admin) node('[data-raffle-mail-records]').addEventListener('click', () => read('mailRecords'));
      if (admin) node('[data-raffle-mail-send]').addEventListener('click', () => read('mailSend'));
      if (admin) node('[data-raffle-ready-preview]').addEventListener('click', () => read('ready'));
      if (admin) node('[data-raffle-ready-send]').addEventListener('click', () => read('readySend'));
      node('[data-raffle-fulfillment]')?.addEventListener('click', () => read('fulfillment'));
      const dialog = node('[data-raffle-dialog]'), opForm = node('[data-raffle-operation-form]');
      let selected = null, busy = false;
      const readyStates=new WeakMap();
      const readyCheckButton=()=>'<button type="button" class="compact-button" data-ready-delivery-check>查回結果（不重送）</button>';
      const readySummary=(box,data,state)=>{
        const n=data?.notice;
        if(data?.testOnly!==true||data.campaignId!==state.campaignId||!n||n.id!==state.noticeId||n.claimId!==state.claimId||n.readConfirmed!==false||!n.channels||['line','ob','email'].some(k=>!['pending','sending','accepted','rejected','unknown','skipped'].includes(n.channels[k])))throw Error('結果資料不完整，請查回結果，不要重送。');
        const names={pending:'待處理',sending:'處理中，請核對',accepted:'服務已接受',rejected:'服務拒絕',unknown:'結果未確認',skipped:'不需發送'};
        box.innerHTML=`<p>${n.status==='accepted'?'服務已接受通知，不代表學生已讀。':'通知尚待核對。'}</p><p>LINE：${names[n.channels.line]}<br>OB：${names[n.channels.ob]}<br>Email：${names[n.channels.email]}</p>${readyCheckButton()}${['line','ob','email'].includes(n.nextAction)?'<p>仍有後續通道待處理；請重新預覽後確認，不會自動發送。</p>':''}`;
      };
      const requestId = () => global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : `raffle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      node('[data-raffle-cancel]').addEventListener('click', () => { if (!busy) dialog.close(); });
      dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
      result.addEventListener('click', async event => {
        const lineCheck=event.target.closest('[data-ready-line-check]');
        if(lineCheck){if(busy)return;busy=true;lineCheck.disabled=true;const lineMessage=t=>{if(!disposed)node('[data-raffle-notice]').textContent=t;};lineMessage('查回 LINE 紀錄中，不會重新發送。');try{const r=await options.api('checkRaffleReadyLineResult',{campaignId:currentCampaign.id,jobId:lineCheck.dataset.readyLineCheck});lineMessage(r.reconciled?'已確認 LINE 接受，紀錄已更新；沒有重送。':'目前結果：'+({unknown:'仍待核對',not_found:'沒有找到傳送紀錄',rejected:'明確拒絕，請由管理者處理備援',unbound:'未綁定，請由管理者處理備援'}[r.outcome]||'待核對'));}catch(e){lineMessage(e.message);}finally{busy=false;lineCheck.disabled=false;}return;}
        const delivery=event.target.closest('[data-ready-delivery]'),deliverySend=event.target.closest('[data-ready-delivery-send]'),deliveryCheck=event.target.closest('[data-ready-delivery-check]');
        if(delivery||deliverySend||deliveryCheck){
          if(busy)return;
          const button=delivery||deliverySend||deliveryCheck,generation=serial;
          let box=delivery?delivery.parentElement.querySelector('[data-ready-delivery-box]'):button.closest('[data-ready-delivery-box]');
          if(!box&&delivery){box=document.createElement('div');box.dataset.readyDeliveryBox='';box.setAttribute('role','status');delivery.parentElement.appendChild(box);}
          if(!box)return;
          const state=delivery?{campaignId:delivery.dataset.campaignId,claimId:delivery.dataset.readyDelivery}:readyStates.get(box);
          if(!state)return;
          busy=true;button.disabled=true;box.textContent=delivery?'核對通知內容中…':'核對處理結果中…';
          try{
            if(delivery){
              readyStates.delete(box);
              const p=await options.api('previewRaffleReadyAppDelivery',{campaignId:state.campaignId,claimId:state.claimId});
              if(disposed||generation!==serial)return;
              if(p?.testOnly!==true||p.dryRun!==true||p.campaignId!==state.campaignId||p.claimId!==state.claimId||typeof p.sendEnabled!=='boolean'||typeof p.previewToken!=='string'||!p.previewToken||! /^[A-Za-z0-9_-]{1,100}$/.test(p.noticeId||'')||!Number.isSafeInteger(p.remaining)||p.remaining<1||!p.content||['prizeName','venue','pickupDeadline'].some(k=>typeof p.content[k]!=='string'))throw Error('預覽資料不完整，尚未發送。');
              if(typeof p.actor!=='string'||!p.actor)throw Error('無法確認目前老師，請重新登入。');
              Object.assign(state,{actor:p.actor,noticeId:p.noticeId,previewToken:p.previewToken,canSend:p.sendEnabled});readyStates.set(box,state);
              box.innerHTML=`<p><strong>限定測試，尚未發送</strong></p><p>${escape(p.content.prizeName)}｜${escape(p.content.venue)}｜尚可領 ${p.remaining} 件</p><p>領取期限：${escape(p.content.pickupDeadline||'待確認')}</p><p>${p.transport==='ob'?'本次發 OB 站內信＋手機推播與 Email，不發 LINE；各管道獨立記錄，已接受或結果不明均不重送。':'優先 LINE；只有明確拒絕或未綁定才使用備援，每次確認只處理一個通道。'}</p>${p.sendEnabled?'<button type="button" class="compact-button" data-ready-delivery-send>確認發送測試通知</button>':'<p>發送開關尚未開放。</p>'}${readyCheckButton()}`;
            }else{
              if(deliverySend&&!state.canSend)throw Error('請重新預覽後確認。');
              state.canSend=false;
              const action=deliverySend?'dispatchRaffleReadyAppDelivery':'reconcileRaffleReadyAppDelivery';
              const operation=deliverySend?{claimId:state.claimId,previewToken:state.previewToken}:{noticeId:state.noticeId};
              const data=await options.api(action,{expectedActor:state.actor,campaignId:state.campaignId,operation:JSON.stringify(operation)});
              if(disposed||generation!==serial)return;
              readySummary(box,data,state);
            }
          }catch(error){
            if(!disposed&&generation===serial){box.textContent=error.message||'結果尚未確認，請查回結果，不要重送。';if(state.noticeId)box.insertAdjacentHTML('beforeend',readyCheckButton());}
          }finally{busy=false;if(!disposed&&generation===serial&&delivery)delivery.disabled=false;}
          return;
        }
        const readyPreviewButton=event.target.closest('[data-raffle-ready-preview]');
        if(readyPreviewButton){
          if(busy)return;
          const claimId=readyPreviewButton.dataset.raffleReadyPreview,campaignId=readyPreviewButton.dataset.campaignId,generation=serial;
          busy=true;readyPreviewButton.disabled=true;
          let box=readyPreviewButton.parentElement.querySelector('[data-ready-app-preview]');
          if(!box){box=document.createElement('div');box.dataset.readyAppPreview='';box.setAttribute('role','status');readyPreviewButton.parentElement.appendChild(box);}
          box.textContent='核對獎品來源中…';
          try{
            const p=await options.api('previewRaffleReadyAppNotice',{campaignId,claimId});
            if(disposed||generation!==serial)return;
            if(!p||p.testOnly!==true||p.dryRun!==true||p.sendEnabled!==false||p.campaignId!==campaignId||p.claimId!==claimId||!Number.isSafeInteger(p.remaining)||p.remaining<1||[p.prizeName,p.venue,p.pickupDeadline].some(v=>typeof v!=='string')||typeof p.alreadyReserved!=='boolean')throw Error('預覽資料不完整，請重新核對。');
            box.innerHTML=`<p><strong>限定測試預覽，尚未寄送</strong></p><p>${escape(p.prizeName)}｜${escape(p.venue)}｜尚可領 ${p.remaining} 件</p><p>領取期限：${escape(p.pickupDeadline||'待確認')}</p><p>${p.alreadyReserved?'此筆已有通知保留紀錄，請先核對寄送結果，勿重送。':'本次只核對獎品資料；尚未核對 LINE 綁定與傳送結果。'}</p>`;
          }catch(error){if(!disposed&&generation===serial)box.textContent=error.message||'目前無法預覽，尚未寄送。';}
          finally{busy=false;if(!disposed&&generation===serial)readyPreviewButton.disabled=false;}
          return;
        }
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
        const reopenButton = event.target.closest('[data-raffle-reopen]');
        const resolveButton = event.target.closest('[data-raffle-resolve]');
        const button = event.target.closest('[data-raffle-action]');
        if (!importButton && !mailButton && !sendButton && !reconcileButton && !closeQueuedButton && !reopenButton && !resolveButton && !button) return;
        if (busy) return;
        pending = null;
        node('[data-raffle-operation-error]').textContent = '';
        node('[data-raffle-save]').hidden = false;
        node('[data-raffle-save]').disabled = false;
        if(reopenButton) {
          const record=mailRecordsData?.records.find(r=>r.id===reopenButton.dataset.raffleReopen),campaignId=mailRecordsData?.campaignId;
          if(!record || mailRecordsData.canReopen!==true || record.status!=='closed' || record.closedBeforeSend!==true)return;
          const generation=serial;busy=true;reopenButton.disabled=true;selected=null;
          try {
            const p=await options.api('previewRaffleMailReopen',{campaignId,jobId:record.id});
            if(disposed || generation!==serial)return;
            if(!p || p.campaignId!==campaignId || p.jobId!==record.id || p.email!==record.email || p.kind!==(record.kind||'invitation') || p.dryRun!==true || p.sendEnabled!==false || p.readOnly!==false || typeof p.previewToken!=='string' || !p.previewToken || !p.before || !p.after || [p.before.subject,p.before.body,p.after.subject,p.after.body].some(v=>typeof v!=='string'||!v.trim()))throw Error('未收到完整可重排預覽，或寫入尚未開放。');
            selected={action:'reopen',record,campaignId,preview:p};
            node('[data-raffle-dialog-body]').innerHTML=`<h3>核對新內容，重新排入待寄</h3><p>${escape(p.email)}</p><p>只更新這封從未開始寄送的信，維持原收件人與資格／獎品範圍。保留舊內容紀錄；這裡不會寄信。</p>${[['原內容',p.before],['新內容',p.after]].map(([label,c])=>`<h4>${label}：${escape(c.subject)}</h4><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(c.body)}</div>`).join('')}<label>重新排入理由<textarea data-raffle-mail-reason class="text-input" maxlength="300" required></textarea></label>`;
          } catch(error) {if(!disposed && generation===serial)node('[data-raffle-notice]').textContent=error.message;return;}
          finally {busy=false;if(!disposed)reopenButton.disabled=false;}
        } else if (resolveButton) {
          const conflict=preview?.conflicts?.find(item=>item.id===resolveButton.dataset.raffleResolve);
          if(preview?.readOnly !== false || !preview.previewToken || conflict?.resolvable !== true || !conflict.before || !conflict.after)return;
          selected={action:'resolve',conflict,preview};
          node('[data-raffle-dialog-body]').innerHTML=`<h3>核對並套用這一筆來源變更？</h3>${renderSourceComparison(conflict)}<p>只更新這筆尚未交付的獎品／館別，保留原紀錄。到館狀態依活動現貨設定重新核對。已排入的通知不會改寫或自動重寄，請另至寄信紀錄檢查；不修改來源、不扣庫存。</p><label>核對理由<textarea class="text-input" data-raffle-reason maxlength="300" required></textarea></label>`;
        } else if (sendButton) {
          if (!sendPlan || sendPlan.sendEnabled !== true || !sendPlan.batchCount) return;
          selected = {action:'send',preview:sendPlan};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確定現在寄出 ${escape(sendPlan.batchCount)} 封？</h3><p>用途：${sendPlan.kind === 'ready' ? '領獎通知' : '抽獎邀請'}。${sendPlan.deliveryMode === 'line-first' ? '這次確認會優先發送 LINE；未綁定或明確拒絕才改用 OB＋Email。' : '這次確認會真的發送 OB 站內訊息（開啟手機推播）＋Email。'}若結果不明會停止，不會自動重寄；請至寄信紀錄核對。</p>${sendPlan.previews.map(item=>`<p style="overflow-wrap:anywhere">${escape(item.email)}</p>`).join('')}`;
        } else if (closeQueuedButton) {
          const record=mailRecordsData?.records.find(item=>item.id===closeQueuedButton.dataset.raffleCloseQueued);
          if(!record || mailRecordsData.canCloseQueued!==true || record.status!=='queued')return;
          selected={action:'closeQueued',record,campaignId:mailRecordsData.campaignId};
          node('[data-raffle-dialog-body]').innerHTML=`<h3>停止這封待寄？</h3><p style="overflow-wrap:anywhere">${escape(record.email)}</p><p>用途：${record.kind==='ready'?'領獎通知':'抽獎邀請'}，涵蓋 ${escape(record.qualificationCount)} 筆${record.kind==='ready'?'獎品':'資格'}。</p><p>這是停止整封信，不是只取消其中一件。涵蓋的項目都不會自動重新排入；不代表已寄出，也不會取消學生的抽獎資格或領獎紀錄。</p><label>停止理由<textarea data-raffle-mail-reason class="text-input" maxlength="300" required></textarea></label>`;
        } else if (reconcileButton) {
          const record = mailRecordsData?.records.find(item=>item.id === reconcileButton.dataset.raffleReconcile);
          if (!record || mailRecordsData.canReconcile !== true || !['sending','uncertain'].includes(record.status)) return;
          selected = {action:'reconcile',record,campaignId:mailRecordsData.campaignId};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>人工核對寄信結果</h3><p style="overflow-wrap:anywhere">${escape(record.email)}</p><p>請先確認原寄送已結束。${escape(renderReconcileGuidance(record))}這裡只記錄核對結論，不會寄信，也不會釋放資格讓它重寄。</p><label>核對結論<select data-raffle-mail-status class="admin-select" required><option value="">請選擇</option><option value="sent">已確認寄出／收到</option><option value="closed">結案、不重寄（原因寫在下方）</option></select></label><label>核對依據／理由<textarea data-raffle-mail-reason class="text-input" maxlength="300" required></textarea></label>`;
        } else if (mailButton) {
          if (!mailPlan || mailPlan.readOnly !== false || !mailPlan.deliveryChecked || mailPlan.sendEnabled !== false) return;
          selected = {action:'queue',preview:mailPlan};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確認前 ${escape(mailPlan.batchCount)} 封排入待寄？</h3><p>用途：${mailPlan.kind === 'ready' ? '領獎通知' : '抽獎邀請'}。只保存待寄紀錄，不會寄信。後續發送仍須另行啟用；可至寄信紀錄停止整封待寄，停止後不會自動重排。</p>${mailPlan.previews.slice(0,mailPlan.batchCount).map(item=>`<p style="overflow-wrap:anywhere">${escape(item.email)}</p>`).join('')}`;
        } else if (importButton) {
          if (!preview || preview.readOnly !== false) return;
          selected = { action: 'import', preview };
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確認同步 ${escape(preview.batchCount)} 筆？</h3><p>只新增本次核對的領獎資料，不扣來源庫存、不寄信。剩餘資料需再次預覽。</p>`;
        } else {
          const claim = (workspace.claims || []).find(c => c.id === button.dataset.claimId);
          if (!claim) return;
          selected = { action: button.dataset.raffleAction, claim };
          const title = { collect:'確認交付獎品', prepare:workspace.canCorrect ? '確認到館並通知學生' : '確認到館', correct:'更正誤領', revoke:'撤銷未領部分', restore:'核對並恢復未領部分', audit:'操作紀錄' }[selected.action];
          const maximum = selected.action === 'correct' ? Number(claim.claimedQuantity) - 1 : Number(claim.quantity) - Number(claim.claimedQuantity);
          node('[data-raffle-dialog-body]').innerHTML = `<h3>${escape(title)}</h3><p><strong>${escape(claim.studentName)}</strong>｜${escape(claim.maskedEmail)}</p><p>${escape(claim.prizeName)}｜登記館別：${escape(claim.venue || '—')}</p>
            ${['collect','prepare','restore'].includes(selected.action) ? renderPickupVenue(claim) : ''}
            ${['collect','correct'].includes(selected.action) ? `<label>${selected.action === 'correct' ? '更正後已領數量' : '本次領取數量'}<input data-raffle-quantity class="text-input" type="number" min="${selected.action === 'correct' ? 0 : 1}" max="${escape(maximum)}" step="1" value="${selected.action === 'correct' ? 0 : 1}" required></label>` : ''}
            ${selected.action === 'revoke' ? `<p>停止剩餘 ${escape(maximum)} 件的交付，已領取 ${escape(claim.claimedQuantity)} 件及原紀錄會保留。恢復須由管理員重新核對；不會回補來源庫存、不寄信，也不撤銷學生其他獎品。</p>` : ''}
            ${selected.action === 'prepare' ? (workspace.canCorrect ? '<p>確認實物已放在指定館別後，會逐筆通知這位學生；沿用目前通知方式，結果不明不重送。</p>' : '<p>只登記實物已到館；學生通知請由管理者核對發送。</p>') : ''}
            ${selected.action === 'restore' ? '<p>重新核對來源與期限；保留原紀錄，不寄信、不增減來源庫存。恢復為待備貨，須重新標記到館後才能交付。</p>' : ''}
            ${['correct','revoke','restore'].includes(selected.action) ? '<label>操作理由<textarea class="text-input" data-raffle-reason maxlength="300" required></textarea></label>' : ''}`;
        }
        dialog.showModal();
        if (selected.action === 'audit') {
          node('[data-raffle-save]').hidden = true;
          const current = selected;
          try {
            const audit = await options.api('getRaffleAudit', {claimId:selected.claim.id});
            if (disposed || selected !== current || !dialog.open) return;
            node('[data-raffle-dialog-body]').insertAdjacentHTML('beforeend', (audit.events || []).map(item => `<div class="raffle-prize"><strong>${escape(({import:'匯入',prepare:'到館',collect:'領取',correct:'更正',revoke:'撤銷未領部分','resolve-source':'核對來源變更'})[item.action] || item.action)}</strong><p>${escape(item.at)}｜${escape(item.actor)}｜已領 ${escape(item.claimedQuantity)} 件</p><p>${escape(item.prizeName || '')}｜${escape(item.venue || '')}</p><p>${escape(item.reason || '')}</p></div>`).join(''));
          } catch(error) { if (!disposed && selected === current) node('[data-raffle-operation-error]').textContent = error.message; }
        }
      });
      opForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!selected || busy || selected.action === 'audit') return;
        if (!pending) {
          const operation = ['import','queue','send'].includes(selected.action)
            ? {campaignId:selected.preview.campaignId,previewToken:selected.preview.previewToken,requestId:requestId()}
            : selected.action === 'resolve' ? {campaignId:selected.preview.campaignId,claimId:selected.conflict.id,version:selected.conflict.before.version,previewToken:selected.preview.previewToken,reason:node('[data-raffle-reason]').value.trim(),requestId:requestId()}
            : ['reconcile','closeQueued','reopen'].includes(selected.action) ? {campaignId:selected.campaignId,jobId:selected.record.id,...(selected.action==='reconcile'?{status:node('[data-raffle-mail-status]').value}:{}),...(selected.action==='reopen'?{previewToken:selected.preview.previewToken}:{}),reason:node('[data-raffle-mail-reason]').value.trim(),requestId:requestId()}
            : {claimId:selected.claim.id,version:selected.claim.version,action:selected.action,venue:node('[data-raffle-venue]')?.value || '',quantity:node('[data-raffle-quantity]') ? Number(node('[data-raffle-quantity]').value) : undefined,reason:node('[data-raffle-reason]')?.value.trim() || '',requestId:requestId()};
          if (selected.action !== 'import' && ['collect','prepare','restore'].includes(selected.action) && operation.venue !== selected.claim.venue) { node('[data-raffle-operation-error]').textContent = '館別不一致，請勿交付。'; return; }
          if(['closeQueued','reopen'].includes(selected.action)&&!operation.reason){node('[data-raffle-operation-error]').textContent='請填寫操作理由。';return;}
          if(['resolve','revoke','restore'].includes(selected.action)&&!operation.reason){node('[data-raffle-operation-error]').textContent='請填寫操作理由。';return;}
          pending = {action:({reopen:'reopenRaffleMail',resolve:'resolveRaffleConflict',send:'sendRaffleMailBatch',reconcile:'reconcileRaffleMail',closeQueued:'closeRaffleQueuedMail',queue:'confirmRaffleInvitations',import:'confirmRaffleImport'})[selected.action] || 'mutateRaffleClaim',operation};
          if(selected.preview?.kind === 'ready' && ['send','queue'].includes(selected.action))pending.action=selected.action === 'send' ? 'sendRaffleReadyMailBatch' : 'confirmRaffleReadyNotifications';
        }
        busy = true;
        opForm.querySelectorAll('input,select,textarea,button').forEach(el => { el.disabled = true; });
        node('[data-raffle-operation-error]').textContent = '處理中，請勿重複操作…';
        try {
          const response = await options.api(pending.action, {operation:pending.operation});
          if (disposed) return;
          if(selected.action==='reopen'){
            if(!response || response.jobId!==selected.record.id || response.status!=='queued')throw Error('未收到完整重新排入結果。');
            node('[data-raffle-notice]').textContent='已保存新內容並重新排入待寄，沒有寄信；發送前仍須另外核對。';pending=null;dialog.close();await read('mailRecords');return;
          }
          if(selected.action==='restore' && (!response || response.claimId!==pending.operation.claimId || response.version!==pending.operation.version+1 || response.claimedQuantity!==Number(selected.claim.claimedQuantity) || response.status!==(Number(selected.claim.claimedQuantity)?'partial':'waiting')))throw Error('未收到完整恢復結果。');
          if(selected.action==='closeQueued'){
            if(!response || response.jobId!==selected.record.id || response.status!=='closed' || response.closedBeforeSend!==true)throw Error('未收到完整停止待寄結果。');
            node('[data-raffle-notice]').textContent='已停止這封待寄並保留理由；沒有寄信，也不會自動重新排入。';pending=null;dialog.close();await read('mailRecords');return;
          }
          if(['resolve','revoke'].includes(selected.action) && (!response || response.claimId !== pending.operation.claimId || response.version !== pending.operation.version+1 || (selected.action==='revoke' ? response.status !== 'cancelled' : !['waiting','ready'].includes(response.status))))throw Error('未收到完整領獎異動結果。');
          if (!response || (selected.action === 'send' ? !response.attemptId || !Number.isInteger(response.sent) || !Number.isInteger(response.pendingReview) || !Number.isInteger(response.total) : selected.action === 'reconcile' ? response.jobId !== selected.record.id || !['sent','closed'].includes(response.status) : selected.action === 'queue' ? !Number.isInteger(response.queued) : selected.action === 'import' ? !Number.isInteger(response.imported) : !response.claimId)) throw Error('沒有收到完整確認結果。');
          const imported = selected.action === 'import';
          const queued = selected.action === 'queue';
          const mailOperation = ['send','reconcile'].includes(selected.action);
          node('[data-raffle-notice]').innerHTML = `<div class="state">${selected.action === 'send' ? `本批 ${escape(response.total)} 封：已送出／核對 ${escape(response.sent)} 封，待確認 ${escape(response.pendingReview)} 封。待確認不會自動重寄；完成條件依該筆管道：LINE 已接受，或 OB＋Email 皆已接受／核對；仍不保證收件匣送達或手機跳提醒；各管道結果請看下方紀錄。` : selected.action === 'reconcile' ? '已保存核對結論與理由，沒有重寄。' : queued ? `已排入待寄 ${escape(response.queued)} 封，尚未寄出；可到寄信紀錄查看。` : imported ? `已同步 ${escape(response.imported)} 筆，剩餘 ${escape(response.remaining || 0)} 筆；沒有寄信。` : selected.action === 'prepare' ? (response.notification?.status === 'sent' ? '已登記到館，學生通知已送出。' : '已登記到館；通知尚未確認送出，請至寄信紀錄核對，勿重複操作。') : '這一筆已更新，已保留操作紀錄。'}</div>`;
          pending = null; dialog.close();
          if (fulfillmentView) await read('fulfillment', fulfillmentView.offset, fulfillmentView.groupId);
          else await read(mailOperation ? 'mailRecords' : queued ? (selected.preview?.kind === 'ready' ? 'ready' : 'mail') : imported || selected.action === 'resolve');
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
  global.SherryRaffle = { renderOperations, renderReconcileGuidance, renderPickupVenue, renderBallInventory, mount, mountActivityGifts, createActivityGiftController, mountObSync, renderObSyncPreview, mountCampaignSettings, renderCampaignSettings, renderProductionReadiness, renderClaims, renderPreview, renderMailPreview, renderMailRecords, renderMailSendPreview, renderFulfillment, renderOverview };
})(window);
