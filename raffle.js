(function (global) {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const statuses = { waiting: '待備貨', ready: '可領取', partial: '部分領取', claimed: '已領取', digital: '電子獎項', cancelled: '已取消' };
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
        <div class="admin-item-actions">
          ${permissions.readOnly === false && ['ready','partial'].includes(item.status) ? `<button type="button" class="compact-button" data-raffle-action="collect" data-claim-id="${escape(item.id)}">確認已領取</button>` : ''}
          ${permissions.readOnly === false && permissions.canPrepare && item.status === 'waiting' ? `<button type="button" class="compact-button" data-raffle-action="prepare" data-claim-id="${escape(item.id)}">這一筆已備妥到館</button>` : ''}
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
  function renderMailPreview(data) {
    if (!data || data.dryRun !== true || typeof data.deliveryChecked !== 'boolean' || !Number.isInteger(data.candidateCount) || !Number.isInteger(data.skipped) || !Array.isArray(data.previews)) throw Error('未收到完整邀請信預覽，請確認後端版本或稍後再試。');
    return `<div class="admin-control"><h3>邀請信預覽 · 不會寄出</h3>
      <p class="state">${data.deliveryChecked ? '已核對本系統待寄紀錄與來源表寄送標記；不代表已核對外部寄信結果。排入待寄不會寄出，正式發送功能尚未開放。' : '尚未核對寄信紀錄：以下僅依來源表預覽內容，不是可直接寄送的名單。正式發送功能尚未開放。'}</p>
      <p>候選收件人 ${escape(data.candidateCount || 0)} 位 · 已排入、已使用、來源已寄或無購課 ID 等排除 ${escape(data.skipped || 0)} 筆資格</p>
      <p class="item-meta">最多顯示前 20 封。同一 Email 的多個驗證碼合併一封；驗證碼請勿轉傳。</p>
      ${data.deliveryChecked && data.sendEnabled === false && data.readOnly === false && data.previewToken && data.batchCount > 0 ? `<button type="button" class="compact-button" data-raffle-confirm-mail>確認前 ${escape(data.batchCount)} 封排入待寄（不寄出）</button>` : ''}
      ${(data.previews || []).map(item => `<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>收件人：${escape(item.email)}</strong><p>主旨：${escape(item.subject)}</p><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(item.body)}</div></article>`).join('') || '<p class="state">來源表目前沒有符合條件的邀請信。</p>'}
    </div>`;
  }
  function renderMailRecords(data) {
    if (!data || !Number.isInteger(data.total) || !Array.isArray(data.records)) throw Error('未收到完整寄信紀錄。');
    return `<div class="admin-control"><h3>寄信紀錄</h3><p class="state">待寄不等於已寄出。目前尚未啟用發送。</p><p>共 ${escape(data.total)} 封，顯示最近 50 封。</p>${data.records.map(item => `<article class="raffle-prize" style="overflow-wrap:anywhere"><strong>${escape(item.email)}</strong><p>${item.status === 'queued' ? '待寄（尚未寄出）' : '狀態待核對'}｜${escape(item.qualificationCount)} 筆資格</p><p>${escape(item.createdAt)}｜${escape(item.actor)}</p></article>`).join('') || '<p>尚無寄信紀錄。</p>'}</div>`;
  }
  function mount(root, options) {
    let disposed = false, serial = 0, campaigns = [], workspace = {}, preview = null, mailPlan = null, pending = null;
    const admin = options.mode === 'admin';
    const node = selector => root.querySelector(selector);
    root.innerHTML = '<div class="state" role="status">載入領獎工作台…</div>';
    const initial = options.api('getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher' });
    const cleanup = () => { disposed = true; serial++; root.replaceChildren(); };
    initial.then(data => {
      if (disposed) return;
      if (!data.enabled || !data.campaigns.length) {
        root.innerHTML = '<div class="state">領獎工作台尚未開放。未來活動設定完成後，會在這裡提供查詢；舊活動不會自動搬入。</div>';
        return;
      }
      campaigns = data.campaigns;
      workspace = data;
      root.innerHTML = `<div class="state">${data.readOnly !== false ? '目前為核對預覽版：可查詢、核對來源，尚不能登記領取或寄信。' : '逐筆核對學生、獎品與館別後再交付。備貨、領取都有紀錄；匯入不會自動寄信。'}</div>
        <form class="admin-control raffle-search">
          <label>活動<select class="admin-select" data-raffle-campaign>${admin ? '' : '<option value="">全部活動</option>'}${campaigns.map(c => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join('')}</select></label>
          <label>學生姓名或完整 Email<input class="text-input" data-raffle-query maxlength="100" placeholder="姓名至少 2 個字，或輸入完整 Email" autocomplete="off"></label>
          <div class="admin-item-actions"><button type="submit" class="compact-button">查詢學生</button>${admin ? '<button type="button" class="compact-button" data-raffle-preview>核對抽獎結果</button><button type="button" class="compact-button" data-raffle-mail-preview>預覽邀請信（不寄出）</button><button type="button" class="compact-button" data-raffle-mail-records>寄信紀錄</button>' : ''}</div>
        </form><div data-raffle-notice aria-live="polite"></div><div data-raffle-result aria-live="polite"><div class="state">請先搜尋學生，不會列出全部名單。</div></div>
        <dialog data-raffle-dialog><form class="dialog-body raffle-search" data-raffle-operation-form><div data-raffle-dialog-body></div><div data-raffle-operation-error class="item-meta" role="alert"></div><div class="admin-item-actions"><button type="submit" class="compact-button" data-raffle-save>確認</button><button type="button" class="compact-button" data-raffle-cancel>取消</button></div></form></dialog>`;
      const form = node('form'), result = node('[data-raffle-result]');
      async function read(isPreview) {
        const mailPreview = isPreview === 'mail';
        const mailRecords = isPreview === 'mailRecords';
        const campaignId = node('[data-raffle-campaign]').value;
        const query = node('[data-raffle-query]').value.trim();
        if (!isPreview && query.length < 2) { result.innerHTML = '<div class="state">請輸入至少 2 個字的姓名或完整 Email。</div>'; return; }
        const request = ++serial;
        form.querySelectorAll('button').forEach(b => { b.disabled = true; });
        result.innerHTML = '<div class="state" role="status">核對資料中…</div>';
        try {
          const data = await options.api(mailRecords ? 'getRaffleMailRecords' : mailPreview ? 'previewRaffleInvitations' : isPreview ? 'previewRaffleImport' : 'getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher', campaignId, query });
          if (disposed || request !== serial) return;
          if (!isPreview && !data.enabled) { result.innerHTML = '<div class="state">工作台已暫停開放。</div>'; return; }
          mailPlan = mailPreview ? {...data,campaignId} : null;
          if (mailPreview || mailRecords) preview = null;
          else if (isPreview) preview = { ...data, campaignId };
          else { workspace = data; preview = null; }
          result.innerHTML = mailRecords ? renderMailRecords(data) : mailPreview ? renderMailPreview(data) : isPreview ? renderPreview(data) : renderClaims(data.claims || [], campaigns, data);
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
      node('[data-raffle-campaign]').addEventListener('change', () => {
        serial++;
        preview = null;
        mailPlan = null;
        form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        result.innerHTML = '<div class="state">活動已切換，請重新查詢或核對。</div>';
      });
      const dialog = node('[data-raffle-dialog]'), opForm = node('[data-raffle-operation-form]');
      let selected = null, busy = false;
      const requestId = () => global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : `raffle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      node('[data-raffle-cancel]').addEventListener('click', () => { if (!busy) dialog.close(); });
      dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
      result.addEventListener('click', async event => {
        const importButton = event.target.closest('[data-raffle-confirm-import]');
        const mailButton = event.target.closest('[data-raffle-confirm-mail]');
        const button = event.target.closest('[data-raffle-action]');
        if (!importButton && !mailButton && !button) return;
        if (busy) return;
        pending = null;
        node('[data-raffle-operation-error]').textContent = '';
        node('[data-raffle-save]').hidden = false;
        node('[data-raffle-save]').disabled = false;
        if (mailButton) {
          if (!mailPlan || mailPlan.readOnly !== false || !mailPlan.deliveryChecked || mailPlan.sendEnabled !== false) return;
          selected = {action:'queue',preview:mailPlan};
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確認前 ${escape(mailPlan.batchCount)} 封排入待寄？</h3><p>只保存待寄紀錄，不會寄信。後續發送仍須另行啟用；目前不能在此取消待寄。</p>${mailPlan.previews.slice(0,mailPlan.batchCount).map(item=>`<p style="overflow-wrap:anywhere">${escape(item.email)}</p>`).join('')}`;
        } else if (importButton) {
          if (!preview || preview.readOnly !== false) return;
          selected = { action: 'import', preview };
          node('[data-raffle-dialog-body]').innerHTML = `<h3>確認匯入 ${escape(preview.batchCount)} 筆？</h3><p>只新增本次核對的領獎資料，不扣來源庫存、不寄信。剩餘資料需再次預覽。</p>`;
        } else {
          const claim = (workspace.claims || []).find(c => c.id === button.dataset.claimId);
          if (!claim) return;
          selected = { action: button.dataset.raffleAction, claim };
          const title = { collect:'確認交付獎品', prepare:'確認這一筆已到館', correct:'更正誤領', audit:'操作紀錄' }[selected.action];
          const maximum = selected.action === 'correct' ? Number(claim.claimedQuantity) - 1 : Number(claim.quantity) - Number(claim.claimedQuantity);
          node('[data-raffle-dialog-body]').innerHTML = `<h3>${escape(title)}</h3><p><strong>${escape(claim.studentName)}</strong>｜${escape(claim.maskedEmail)}</p><p>${escape(claim.prizeName)}｜登記館別：${escape(claim.venue || '—')}</p>
            ${['collect','prepare'].includes(selected.action) ? `<label>確認實際所在館別<select data-raffle-venue class="admin-select" required><option value="">請選擇</option><option value="${escape(claim.venue)}">${escape(claim.venue)}</option><option value="wrong-venue">其他館別（不可交付）</option></select></label>` : ''}
            ${['collect','correct'].includes(selected.action) ? `<label>${selected.action === 'correct' ? '更正後已領數量' : '本次領取數量'}<input data-raffle-quantity class="text-input" type="number" min="${selected.action === 'correct' ? 0 : 1}" max="${escape(maximum)}" step="1" value="${selected.action === 'correct' ? 0 : 1}" required></label>` : ''}
            ${selected.action === 'correct' ? '<label>更正理由<textarea class="text-input" data-raffle-reason maxlength="300" required></textarea></label>' : ''}`;
        }
        dialog.showModal();
        if (selected.action === 'audit') {
          node('[data-raffle-save]').hidden = true;
          const current = selected;
          try {
            const audit = await options.api('getRaffleAudit', {claimId:selected.claim.id});
            if (disposed || selected !== current || !dialog.open) return;
            node('[data-raffle-dialog-body]').insertAdjacentHTML('beforeend', (audit.events || []).map(item => `<div class="raffle-prize"><strong>${escape(({import:'匯入',prepare:'到館',collect:'領取',correct:'更正'})[item.action] || item.action)}</strong><p>${escape(item.at)}｜${escape(item.actor)}｜已領 ${escape(item.claimedQuantity)} 件</p><p>${escape(item.reason || '')}</p></div>`).join(''));
          } catch(error) { if (!disposed && selected === current) node('[data-raffle-operation-error]').textContent = error.message; }
        }
      });
      opForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!selected || busy || selected.action === 'audit') return;
        if (!pending) {
          const operation = ['import','queue'].includes(selected.action)
            ? {campaignId:selected.preview.campaignId,previewToken:selected.preview.previewToken,requestId:requestId()}
            : {claimId:selected.claim.id,version:selected.claim.version,action:selected.action,venue:node('[data-raffle-venue]')?.value || '',quantity:node('[data-raffle-quantity]') ? Number(node('[data-raffle-quantity]').value) : undefined,reason:node('[data-raffle-reason]')?.value.trim() || '',requestId:requestId()};
          if (selected.action !== 'import' && ['collect','prepare'].includes(selected.action) && operation.venue !== selected.claim.venue) { node('[data-raffle-operation-error]').textContent = '館別不一致，請勿交付。'; return; }
          pending = {action:selected.action === 'queue' ? 'confirmRaffleInvitations' : selected.action === 'import' ? 'confirmRaffleImport' : 'mutateRaffleClaim',operation};
        }
        busy = true;
        opForm.querySelectorAll('input,select,textarea,button').forEach(el => { el.disabled = true; });
        node('[data-raffle-operation-error]').textContent = '處理中，請勿重複交付…';
        try {
          const response = await options.api(pending.action, {operation:pending.operation});
          if (disposed) return;
          if (!response || (selected.action === 'queue' ? !Number.isInteger(response.queued) : selected.action === 'import' ? !Number.isInteger(response.imported) : !response.claimId)) throw Error('沒有收到完整確認結果。');
          const imported = selected.action === 'import';
          const queued = selected.action === 'queue';
          node('[data-raffle-notice]').innerHTML = `<div class="state">${queued ? `已排入待寄 ${escape(response.queued)} 封，尚未寄出；可到寄信紀錄查看。` : imported ? `已匯入 ${escape(response.imported)} 筆，剩餘 ${escape(response.remaining || 0)} 筆；沒有寄信。` : '這一筆已更新，已保留操作紀錄。'}</div>`;
          pending = null; dialog.close();
          await read(queued ? 'mail' : imported);
        } catch (error) {
          if (!disposed) node('[data-raffle-operation-error]').textContent = `${error.message} 尚未確認完成，請勿重複交付。再次確認會使用同一筆操作識別；也可取消後重新查詢核對。`;
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
  global.SherryRaffle = { mount, renderClaims, renderPreview, renderMailPreview, renderMailRecords };
})(window);
