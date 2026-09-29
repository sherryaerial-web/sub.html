(function (global) {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const statuses = { waiting: '待備貨', ready: '可領取', partial: '部分領取', claimed: '已領取', digital: '電子獎項', cancelled: '已取消' };
  const status = value => statuses[value] || '狀態待核對';
  function renderClaims(claims, campaigns) {
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
    </div>`;
  }
  function mount(root, options) {
    let disposed = false, serial = 0, campaigns = [];
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
      root.innerHTML = `<div class="state">目前為核對預覽版：可查詢、核對來源，尚不能登記領取或寄信。</div>
        <form class="admin-control raffle-search">
          <label>活動<select class="admin-select" data-raffle-campaign>${admin ? '' : '<option value="">全部活動</option>'}${campaigns.map(c => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join('')}</select></label>
          <label>學生姓名或完整 Email<input class="text-input" data-raffle-query maxlength="100" placeholder="姓名至少 2 個字，或輸入完整 Email" autocomplete="off"></label>
          <div class="admin-item-actions"><button type="submit" class="compact-button">查詢學生</button>${admin ? '<button type="button" class="compact-button" data-raffle-preview>核對抽獎結果</button>' : ''}</div>
        </form><div data-raffle-result aria-live="polite"><div class="state">請先搜尋學生，不會列出全部名單。</div></div>`;
      const form = node('form'), result = node('[data-raffle-result]');
      async function read(preview) {
        const query = node('[data-raffle-query]').value.trim();
        if (!preview && query.length < 2) { result.innerHTML = '<div class="state">請輸入至少 2 個字的姓名或完整 Email。</div>'; return; }
        const request = ++serial;
        form.querySelectorAll('button').forEach(b => { b.disabled = true; });
        result.innerHTML = '<div class="state" role="status">核對資料中…</div>';
        try {
          const data = await options.api(preview ? 'previewRaffleImport' : 'getRaffleWorkspace', { mode: admin ? 'admin' : 'teacher', campaignId: node('[data-raffle-campaign]').value, query });
          if (disposed || request !== serial) return;
          if (!preview && !data.enabled) { result.innerHTML = '<div class="state">工作台已暫停開放。</div>'; return; }
          result.innerHTML = preview ? renderPreview(data) : renderClaims(data.claims || [], campaigns);
          if (!preview && (data.claims || []).length >= 50) result.insertAdjacentHTML('beforeend', '<p class="state">最多顯示 50 筆，請用完整 Email 縮小範圍。</p>');
        } catch (error) {
          if (!disposed && request === serial) result.innerHTML = `<div class="state error">${escape(error.message || '讀取失敗，請稍後重試。')}</div>`;
        } finally {
          if (!disposed && request === serial) form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        }
      }
      form.addEventListener('submit', event => { event.preventDefault(); read(false); });
      if (admin) node('[data-raffle-preview]').addEventListener('click', () => read(true));
      node('[data-raffle-campaign]').addEventListener('change', () => {
        serial++;
        form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        result.innerHTML = '<div class="state">活動已切換，請重新查詢或核對。</div>';
      });
    }).catch(error => {
      if (!disposed) root.innerHTML = `<div class="state error">${escape(error.message || '工作台載入失敗，請重新進入。')}</div>`;
    });
    return cleanup;
  }
  global.SherryRaffle = { mount, renderClaims, renderPreview };
})(window);
