(function(root) {
  'use strict';
  function createAdminTransport(options) {
    const fetchImpl = options.fetch || root.fetch.bind(root);
    const storage = options.storage || root.localStorage;
    const crypto = options.crypto || root.crypto;
    const notice = options.onStatus || function() {};
    const account = () => options.getSessionOwner && options.getSessionOwner();
    const confirmReconciled = options.confirmReconciled || (() => false);
    const storageKey = 'sherry-admin-pending-v1';
    const active = new Map(), pendingCalls = new Map();
    let needsHealth = false, healthPromise = null, resumePromise = null;
    const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const readRecords = () => {
      const value = JSON.parse(storage.getItem(storageKey) || '[]');
      if (!Array.isArray(value)) throw Error('送出紀錄無法讀取，請先聯繫管理員確認，勿重送。');
      return value;
    };
    const saveRecords = records => {
      const value = JSON.stringify(records);
      storage.setItem(storageKey, value);
      if (storage.getItem(storageKey) !== value) throw Error('無法保存操作確認編號，本次尚未送出。');
    };
    const removeRecord = id => saveRecords(readRecords().filter(r => r.id !== id));
    function unwrap(payload) {
      if (!payload || payload.status !== 'success') throw Error(payload && payload.message || '操作結果待確認，請勿重複送出。');
      return payload.data;
    }
    async function post(action, params, timeout) {
      const body = new URLSearchParams({ action });
      Object.entries(params).forEach(([key, value]) => body.set(key, typeof value === 'string' ? value : JSON.stringify(value)));
      const controller = new AbortController();
      let timer;
      try {
        return await Promise.race([
          fetchImpl(options.url, { method:'POST', body:body.toString(), credentials:'omit', redirect:'follow',
            headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, signal:controller.signal })
            .then(async response => { if (!response.ok) throw Error('連線未確認'); return response.json(); }),
          new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error('連線逾時')); }, options.timeoutMs || timeout); })
        ]);
      } finally { clearTimeout(timer); }
    }
    async function ensureHealth(token) {
      if (!needsHealth || !token) return;
      if (!healthPromise) healthPromise = post('getSession', {sessionToken:token}, 15000)
        .then(payload => { unwrap(payload); needsHealth = false; })
        .catch(() => { throw Error('連線或登入狀態尚未恢復，本次尚未送出；已填內容保留，請確認網路與登入狀態後再試。'); })
        .finally(() => { healthPromise = null; });
      return healthPromise;
    }
    async function status(record, token) {
      return unwrap(await post('getAdminOperationStatus', {sessionToken:token,clientOperationId:record.id}, 15000));
    }
    function statusMessage(state) {
      if (state === 'completed') return '上次送出已取得處理結果，請更新清單查看成功或待確認項目；不要重複送出。';
      if (state === 'running') return '操作仍在處理中，請稍後再確認；不要重複送出。';
      if (state === 'not_received') return '尚未確認系統收到這次操作，內容已保留；再次按送出會沿用原編號確認，避免重複操作。';
      return '操作結果待確認，可能已完成部分內容，請勿重送；請先查閱清單或聯繫管理員。';
    }
    function consume(record, result) {
      if (result && result.state === 'completed' && result.payload && result.payload.status === 'success') {
        removeRecord(record.id);
        return unwrap(result.payload);
      }
      const message = result && result.payload && result.payload.message
        ? result.payload.message + '（操作結果待確認，請先查閱清單，勿直接重送。）'
        : statusMessage(result && result.state);
      throw Error(message);
    }
    function acknowledge(record) {
      if (confirmReconciled('上次操作的完整回覆已無法取得。請先取消此視窗，查閱清單核對實際結果。\n\n只有已核對完成，且確定之後的新操作不會重複登記或開立，才按確定解除此確認紀錄。這次不會重新送出。')) {
        removeRecord(record.id);
        throw Error('已解除舊操作的確認紀錄，本次未送出。請依已核對的結果進行下一筆操作。');
      }
      throw Error(statusMessage('uncertain'));
    }
    async function recover(record, token) {
      let result;
      try { result = await status(record, token); }
      catch (_) { throw Error(statusMessage('uncertain')); }
      return consume(record, result);
    }
    function call(action, params) {
      const key = JSON.stringify([action, Object.keys(params || {}).sort().map(k => [k,params[k]])]);
      if (pendingCalls.has(key)) return pendingCalls.get(key);
      const promise = executeCall(action, params).finally(() => pendingCalls.delete(key));
      pendingCalls.set(key, promise);
      return promise;
    }
    async function executeCall(action, params) {
      params = params || {};
      const token = params.sessionToken || '';
      const write = !!token && !/^(get|preview|export)/.test(action) && action !== 'logout';
      if (needsHealth) await ensureHealth(token);
      if (!write) return unwrap(await post(action, params, 45000));
      if (!account()) throw Error('無法確認操作帳號，本次尚未送出，請重新登入。');
      const owner = await digest(account());
      const canonical = Object.keys(params).filter(key => key !== 'sessionToken').sort().map(key => [key, params[key]]);
      const signature = await digest(JSON.stringify([owner, action, canonical]));
      if (active.has(signature)) return active.get(signature).promise;
      // Reserve the in-page slot before any await; rapid double clicks share one write.
      let resolveRecovered;
      const recovered = new Promise(resolve => { resolveRecovered = resolve; });
      const slot = { resolveRecovered };
      active.set(signature, slot);
      slot.promise = (async () => {
        let record = readRecords().find(r => r.owner === owner && r.signature === signature);
        if (record) {
          if (Date.now() - parseInt(record.id.split('_')[0], 36) > 86400000) return acknowledge(record);
          let prior;
          try { prior = await status(record, token); } catch (_) { throw Error(statusMessage('uncertain')); }
          if (prior.state === 'completed' && !prior.payload) return acknowledge(record);
          if (prior.state === 'uncertain') return acknowledge(record);
          if (prior.state !== 'not_received') return consume(record, prior);
          // Explicit user retry only, SAME operation ID: a late first request cannot execute twice.
        } else {
          const records = readRecords();
          if (records.length >= 100) throw Error('待確認操作過多，本次尚未送出，請聯繫管理員。');
          record = {id:Date.now().toString(36)+'_'+crypto.randomUUID(),owner,signature,action};
          saveRecords(records.concat(record));
        }
        let payload;
        try {
          payload = await Promise.race([post(action, {...params,clientOperationId:record.id},
            ['issueInvoiceBatch','syncInvoicePurchases','executeNextDayClosures','closeMissingObCancellations','closeUnclaimedSubstituteCourses'].includes(action) ? 180000 : 45000), recovered]);
        } catch (_) { return recover(record, token); }
        if (payload && payload.status === 'success') { removeRecord(record.id); return payload.data; }
        if (payload && payload.status === 'pending') return consume(record, payload.data);
        // A handler error may follow partial writes. Preserve the ID instead of allowing blind replay.
        throw Error((payload && payload.message || '操作結果待確認') + '；已保留確認編號，請先核對結果。');
      })().finally(() => active.delete(signature));
      return slot.promise;
    }
    async function resume() {
      needsHealth = true;
      if (resumePromise) return resumePromise;
      resumePromise = (async () => {
        const token = options.getSessionToken && options.getSessionToken();
        if (!token) return;
        try {
          await ensureHealth(token);
          if (!account()) return;
          const owner = await digest(account());
          const records = readRecords().filter(r => r.owner === owner);
          for (const record of records) {
            let result;
            try { result = await status(record, token); } catch (_) { result = {state:'uncertain'}; }
            const slot = active.get(record.signature);
            if (slot && result.state === 'completed' && result.payload) slot.resolveRecovered(result.payload);
            else notice(statusMessage(result.state), result.state);
          }
        } catch (error) { notice(error.message, 'uncertain'); }
      })().finally(() => { resumePromise = null; });
      return resumePromise;
    }
    return {call,resume};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {createAdminTransport};
  else root.SherryAdminTransport = {createAdminTransport};
})(typeof window !== 'undefined' ? window : globalThis);
