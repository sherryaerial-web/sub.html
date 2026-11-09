(function(root) {
  'use strict';

  const escape = value => String(value == null ? '' : value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const list = value => Array.isArray(value) ? value : [];
  const value = input => input == null || input === '' ? '未取得' : String(input);
  const number = input => input == null || input === '' || !Number.isFinite(Number(input))
    ? '未取得' : Number(input).toLocaleString('zh-TW');
  const delta = input => input == null || input === '' || !Number.isFinite(Number(input))
    ? '未取得' : `${Number(input) > 0 ? '+' : ''}${number(input)}`;
  const state = (message, error = false) => `<div class="main-state${error ? ' is-error' : ''}" role="status">${escape(message)}</div>`;
  const errorText = data => data && (data.error || (data.status === 'error' && (data.message || '資料讀取失敗')));
  const meta = text => `<div class="main-meta">${escape(text)}</div>`;
  const disclosure = (title, body) => `<details class="main-disclosure"><summary>${escape(title)}</summary><div class="main-disclosure-body">${body}</div></details>`;
  const table = (title, headers, rows) => `<div class="main-table-scroll" role="region" aria-label="${escape(title)}" tabindex="0"><table class="main-table"><caption class="sr-only">${escape(title)}</caption><thead><tr>${headers.map(header => `<th scope="col">${escape(header)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  const row = cells => `<tr>${cells.map(cell => `<td>${escape(value(cell))}</td>`).join('')}</tr>`;
  const versionValid = version => (typeof version === 'number' || (typeof version === 'string' && /^\d+$/.test(version))) && Number.isSafeInteger(Number(version)) && Number(version) >= 0;
  const closed = tracking => ['closed', '已結案', '結案'].includes(tracking && tracking.status);
  const actionButton = (action, icon, label, disabled = false, attributes = '') => `<button type="button" class="compact-button" data-main-action="${escape(action)}" ${disabled ? 'disabled' : ''} ${attributes}><i data-lucide="${escape(icon)}"></i>${escape(label)}</button>`;

  function validQueryDate(input) {
    if (typeof input !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(input)) return false;
    const date = new Date(`${input}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === input;
  }

  function normalizeQueryPreferences(input, currentMonth = new Date().toISOString().slice(0, 7)) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const practice = source.practice && typeof source.practice === 'object' && !Array.isArray(source.practice) ? source.practice : {};
    const cleaned = {
      dateFrom: validQueryDate(practice.dateFrom) ? practice.dateFrom : '',
      dateTo: validQueryDate(practice.dateTo) ? practice.dateTo : '',
      room: ['', 'A', 'B', 'C', 'D'].includes(practice.room) ? practice.room : '',
      status: ['', '已成立', '候補', '已取消', '衝突取消'].includes(practice.status) ? practice.status : '',
      teacherName: typeof practice.teacherName === 'string' && practice.teacherName.length <= 100 && !/[\x00-\x1f]/.test(practice.teacherName) ? practice.teacherName.trim() : ''
    };
    if (cleaned.dateFrom && cleaned.dateTo && cleaned.dateFrom > cleaned.dateTo) { cleaned.dateFrom = ''; cleaned.dateTo = ''; }
    const anchor = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(currentMonth) || ['2026-01', '2026', '01'];
    const maximum = `${Number(anchor[1]) + 1}-${anchor[2]}`;
    const month = typeof source.payrollMonth === 'string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(source.payrollMonth)
      && source.payrollMonth <= maximum ? source.payrollMonth : '';
    return { practice: cleaned, payrollMonth: month };
  }

  function createQueryPreferences(storage) {
    const key = account => typeof account === 'string' && account.trim() && account.length <= 200
      ? `sherry-main-query-v1:${encodeURIComponent(account.trim())}` : '';
    return {
      read(account, currentMonth) {
        try {
          const raw = key(account) && storage && storage.getItem(key(account));
          const data = raw && raw.length <= 8192 ? JSON.parse(raw) : null;
          return normalizeQueryPreferences(data && data.version === 1 ? data : null, currentMonth);
        } catch (_) { return normalizeQueryPreferences(null, currentMonth); }
      },
      save(account, input, currentMonth) {
        try {
          if (!key(account) || !storage) return false;
          storage.setItem(key(account), JSON.stringify({ version: 1, ...normalizeQueryPreferences(input, currentMonth) }));
          return true;
        } catch (_) { return false; }
      }
    };
  }

  function paginate(items, requestedPage, requestedSize = 20) {
    const data = list(items);
    const size = Number.isSafeInteger(requestedSize) ? Math.max(1, Math.min(50, requestedSize)) : 20;
    const pages = Math.max(1, Math.ceil(data.length / size));
    const page = Number.isSafeInteger(Number(requestedPage)) ? Math.max(1, Math.min(pages, Number(requestedPage))) : 1;
    const start = (page - 1) * size;
    return { items: data.slice(start, start + size), page, pages, total: data.length, start, size };
  }

  function renderPager(key, page) {
    if (page.pages <= 1) return '';
    const button = (target, icon, label, disabled) => `<button type="button" class="compact-button main-page-button" data-main-action="page-list" data-main-page-key="${escape(key)}" data-main-page="${target}" title="${label}" aria-label="${label}" ${disabled ? 'disabled' : ''}><i data-lucide="${icon}"></i></button>`;
    return `<nav class="main-pagination" aria-label="清單分頁">${button(page.page - 1, 'chevron-left', '上一頁', page.page === 1)}<span>${page.start + 1}-${page.start + page.items.length} / ${page.total} 筆｜${page.page} / ${page.pages} 頁</span>${button(page.page + 1, 'chevron-right', '下一頁', page.page === page.pages)}</nav>`;
  }

  function renderPagedList(key, items, renderItem, options = {}) {
    const page = paginate(items, options.pages && options.pages[key], options.pageSize);
    return `<div data-main-list="${escape(key)}">${page.items.map(renderItem).join('') || state(options.emptyText || '目前沒有紀錄。')}${renderPager(key, page)}</div>`;
  }

  function isBackupVerified(backup) {
    return Boolean(backup && backup.status === 'verified' && backup.operationId && backup.backupId && backup.rehearsalId && backup.lastSuccessAt);
  }

  function isBackupPending(backup) {
    return Boolean(backup && ['pending', 'running', 'copying', 'verifying', 'preparing', 'copying_backup', 'verifying_backup', 'copying_rehearsal', 'verifying_rehearsal', 'unknown', 'uncertain'].includes(backup.status));
  }

  function isBackupDailyLimit(backup, checkedAt) {
    if (backup && backup.status === 'failed' && backup.retryable === true) return false;
    const created = String(backup && backup.createdAt || '').slice(0, 10);
    return validQueryDate(created) && created === String(checkedAt || '').slice(0, 10);
  }

  function renderSystemHealth(health, options = {}) {
    if (!health || errorText(health)) return `<section class="main-section"><h3>系統健康</h3>${state(errorText(health) || '系統健康資料尚未取得。', true)}</section>`;
    const labels = { success: '最近執行成功', ok: '最近執行成功', healthy: '最近執行成功', stale: '成功紀錄已過期',
      warning: '執行警示', failed: '執行失敗', error: '執行失敗', running: '執行中', pending: '待執行', unknown: '未知' };
    const checks = list(health.checks).map(check => {
      const status = ['success', 'ok', 'healthy'].includes(check.status) && !check.lastSuccessAt ? 'unknown' : check.status;
      return row([check.label || check.key, labels[status] || '未知', `最近嘗試：${check.lastAttemptAt || '未取得'}\n最近成功：${check.lastSuccessAt || '尚無成功紀錄'}`,
        [check.detail, check.error].filter(Boolean).join('\n') || '未取得']);
    });
    const notifications = health.notifications || {};
    const notificationStatus = { unknown: '未知', stale: '資料已過期', queued: '仍有佇列', failed: '有失敗紀錄', warning: '有待核對紀錄', healthy: '已取得統計', ok: '已取得統計', success: '已取得統計' }[notifications.status] || '未知';
    const notificationCount = count => !notifications.status || ['unknown', 'stale'].includes(notifications.status) ? '未取得' : number(count);
    const backup = health.backup || {};
    const backupLabels = { missing: '尚無備份紀錄', not_configured: '尚無備份紀錄', verified: '備份與還原演練已驗證', failed: '備份失敗，未完成驗證',
      unverified: '備份未驗證', stale: '備份紀錄已過期', unknown: '備份結果未知', uncertain: '備份結果待確認', running: '備份處理中', pending: '備份待處理' };
    const processing = ['preparing', 'copying_backup', 'verifying_backup', 'copying_rehearsal', 'verifying_rehearsal'].includes(backup.status);
    const backupLabel = backup.status === 'verified' && (!backup.lastSuccessAt || (options.fullAdmin && !isBackupVerified(backup)))
      ? '備份證據未完成核對，未驗證' : processing ? '備份處理中，尚未完成驗證' : backupLabels[backup.status] || '備份狀態未知';
    const request = options.backupRequest;
    const dailyLimit = isBackupDailyLimit(backup, health.checkedAt);
    return `<section class="main-section main-health"><div class="main-section-head"><h3>系統健康</h3>${actionButton('refresh-operations', 'refresh-cw', '更新資料')}</div>
      ${meta(`檢查時間：${health.checkedAt || '未取得'}`)}
      ${checks.length ? table('執行健康紀錄', ['項目', '狀態', '執行時間', '細節／錯誤'], checks) : state('執行健康紀錄未取得。', true)}
      <h4>通知佇列</h4>${meta(`狀態：${notificationStatus}｜佇列：${notificationCount(notifications.queued)}｜失敗：${notificationCount(notifications.failed)}｜未知：${notificationCount(notifications.unknown)}`)}${notifications.detail ? meta(notifications.detail) : ''}
      <div class="main-backup"><h4>資料備份與還原演練</h4><strong>${escape(backupLabel)}</strong>
      ${meta(`最近成功：${backup.lastSuccessAt || '未取得'}｜工作表：${number(backup.sheetCount)}｜儲存格：${number(backup.cellCount)}`)}
      ${meta(`操作編號：${backup.operationId || '未取得'}`)}
      ${options.fullAdmin ? meta(`備份 ID：${backup.backupId || '未取得'}｜演練 ID：${backup.rehearsalId || '未取得'}`) : ''}
      ${backup.error ? state(backup.error, true) : ''}
      ${dailyLimit ? meta('本日已執行備份，不重複建立副本。') : ''}
      <div id="main-backup-request-status" role="status">${request ? state(request.status === 'pending' ? '備份處理中，請勿重複送出。' : `備份結果待確認，請更新資料核對；不會自動重送。操作編號：${request.operationId}`, true) : ''}</div>
      ${health.backupAllowed === true && options.fullAdmin === true ? `<div class="admin-item-actions">${actionButton('create-backup', 'database-backup', '建立備份與還原演練', Boolean(request) || isBackupPending(backup) || dailyLimit)}</div>` : ''}</div></section>`;
  }

  function renderDataStatus(status) {
    const data = status || {};
    const sources = { course_snapshot: '課表同步快照', payroll_snapshot: '薪資來源快照', ob_live: 'OB 課程核對' };
    const labels = { snapshot: '同步快照，非即時資料', live: 'OB 即時核對', cached: '近期核對快取，非本次即時讀取',
      stale: '資料已過期', unknown: '來源時間未知', unavailable: '資料無法取得', error: '來源讀取失敗' };
    const warnings = { stale: '上次資料僅供參考。', unknown: '來源時間未取得，不能視為即時資料。',
      unavailable: '來源未取得，不能據此判定目前狀態。', error: '來源讀取失敗，不能據此判定目前狀態。' };
    const kind = Object.prototype.hasOwnProperty.call(labels, data.status) ? data.status : 'unknown';
    const warning = data.warning || errorText(data) || warnings[kind];
    return `<div class="main-data-status${warnings[kind] ? ' is-warning' : ''}" role="status">
      <strong>${escape(sources[data.source] || '資料來源未取得')}</strong><span>${escape(labels[kind])}</span>
      <span>最近成功：${escape(data.lastSuccessAt || '未取得')}</span>
      ${data.mixed ? `<span>不同同步時間｜最早：${escape(data.oldestAt || '未取得')}</span>` : ''}
      ${warning ? `<span class="main-source-warning">${escape(warning)}</span>` : ''}
    </div>`;
  }

  function renderRuleCatalogue(catalogue) {
    const salary = Boolean(catalogue && (catalogue.month || catalogue.policies));
    const title = salary ? '薪資規則與生效月份' : '關課規則與修訂紀錄';
    if (!catalogue || errorText(catalogue) || !Array.isArray(catalogue.rules)) {
      return disclosure(title, state(errorText(catalogue) || '規則資料尚未取得。', true));
    }
    let body;
    if (salary) {
      body = meta(`月份：${value(catalogue.month)}｜生效、截止月份均包含該月。`);
      body += catalogue.rules.length ? table(title,
        ['老師', '課程條件', '計費類型', '人數門檻', '金額', '生效月份', '截止月份', '本月狀態'],
        catalogue.rules.map(rule => row([rule.teacherName || '共用', rule.courseKeyword || '不限課程',
          rule.billingType, rule.threshold, number(rule.amount), rule.effectiveMonth || '未限定',
          rule.throughMonth || '未限定', rule.appliesThisMonth === true ? '本月適用' : rule.appliesThisMonth === false ? '本月不適用' : '適用狀態未取得'])))
        : state('目前沒有薪項規則。');
      body += list(catalogue.policies).map(meta).join('');
    } else {
      body = meta(`版本：${value(catalogue.version)}｜更新：${value(catalogue.updatedAt)}`);
      body += list(catalogue.stages).map(meta).join('');
      body += catalogue.rules.length ? table(title, ['優先序', '適用條件', '最低人數', '規則'],
        catalogue.rules.map(rule => row([rule.priority, rule.condition,
          rule.minimumEnrollment == null ? '不納入關課' : `${number(rule.minimumEnrollment)} 人`, rule.label])))
        : state('目前沒有關課規則。');
      body += list(catalogue.notes).map(meta).join('');
      body += list(catalogue.history).length ? `<h4>修訂紀錄</h4>${list(catalogue.history).map(item => meta(`${value(item.date)}｜${value(item.change)}`)).join('')}` : '';
    }
    return disclosure(title, body);
  }

  function renderClosureAssessment(assessment) {
    const title = '明日課程判定與規則影響';
    if (!assessment || errorText(assessment)) return disclosure(title, state(errorText(assessment) || '關課背景檢查資料尚未取得。', true));
    const verified = assessment.verified === true;
    let body = meta(`目標日期：${value(assessment.targetDate)}｜規則版本：${value(assessment.ruleVersion)}`)
      + renderDataStatus(assessment.dataStatus);
    if (!verified) body += state('OB 背景檢查未成功，未取得即時結論；上次資料僅供參考，不會據此關課。', true);
    if (assessment.baselineAvailable !== true) body += state('尚無前次檢查基準，無法比較規則影響。');
    else {
      body += meta(`比較基準：${value(assessment.baselineAt)}`);
      body += list(assessment.impacts).length ? table('規則影響', ['課程', 'OB Calendar ID', '原門檻', '新門檻', '原規則', '新規則'],
        assessment.impacts.map(item => row([`${item.time || ''} ${item.courseName || ''}`, item.calendarId,
          item.beforeMinimum == null ? '不納入關課' : item.beforeMinimum,
          item.afterMinimum == null ? '不納入關課' : item.afterMinimum, item.beforeRule, item.afterRule])))
        : verified ? state('與前次基準相比，沒有規則門檻變更。') : '';
    }
    body += list(assessment.items).length ? table(verified ? '課程判定' : '上次課程資料，僅供參考',
      ['時間／課程', '老師', 'OB Calendar ID', '點數', '目前人數', '最低人數', '缺額', '判定', '規則／原因'],
      assessment.items.map(item => row([`${item.time || ''} ${item.courseName || ''}`, item.teacherName, item.calendarId,
        item.points, item.enrollmentCount, item.minimumEnrollment == null ? '不納入關課' : item.minimumEnrollment,
        item.shortage, item.decision, [item.ruleLabel, item.reason].filter(Boolean).join('｜')])))
      : verified ? state('目標日期沒有課程判定資料。') : '';
    return disclosure(title, body);
  }

  function renderPayrollComparison(comparison) {
    const title = '薪資前版差異';
    if (!comparison || errorText(comparison)) return disclosure(title, state(errorText(comparison) || '薪資差異資料尚未取得。', true));
    let body = meta(`目前版本：${value(comparison.version)}`);
    if (comparison.baselineAvailable !== true) return disclosure(title, body + state('尚無前一版薪資可比較，無法判定差異。'));
    body += meta(`前一版：${value(comparison.baselineVersion)}｜總額差額：${delta(comparison.totalDelta)}`);
    body += list(comparison.teachers).length ? `<h4>老師總額</h4>${table('老師薪資差異', ['老師', '前版', '本版', '差額', '原因'],
      comparison.teachers.map(item => row([item.teacherName, number(item.beforeAmount), number(item.afterAmount), delta(item.delta), item.reason])))}`
      : state('老師總額沒有差異。');
    body += list(comparison.items).length ? `<h4>課程明細</h4>${table('課程薪資差異', ['日期／時間', '課程／老師', 'OB Calendar ID', '前版', '本版', '差額', '變更原因'],
      comparison.items.map(item => row([`${item.date || ''} ${item.time || ''}`, `${item.courseName || ''}｜${item.teacherName || ''}`,
        item.calendarId, number(item.beforeAmount), number(item.afterAmount), delta(item.delta), [item.change, item.reason].filter(Boolean).join('｜')])))}`
      : state('課程明細沒有差異。');
    return disclosure(title, body);
  }

  function renderTasks(tasks, error, options = {}) {
    if (error) return state(`待辦資料無法取得：${error}`, true);
    if (!Array.isArray(tasks)) return state('待辦資料尚未取得。', true);
    const rank = urgency => ({ critical: 0, urgent: 0, high: 1, overdue: 0, normal: 2, low: 3,
      '緊急': 0, '逾期': 0, '已逾期': 0, '即將上課': 1, '待處理': 2, '高': 1, '一般': 2 })[urgency] ?? (typeof urgency === 'number' ? urgency : 2);
    const due = item => String(item.followAt || `${item.date || '9999/99/99'} ${item.time || '23:59'}`).replaceAll('/', '-');
    const sorted = tasks.slice().sort((a, b) => rank(a.urgency) - rank(b.urgency)
      || due(a).localeCompare(due(b)) || String(a.key).localeCompare(String(b.key)));
    if (!sorted.length) return state('目前沒有待辦事項。');
    const page = paginate(sorted, options.pages && options.pages['operations-tasks']);
    return `<div data-main-list="operations-tasks"><ul class="main-tasks">${page.items.map(item => `<li><div><strong>${escape(item.label || '待處理事項')}</strong> <span class="status-pill">${escape(item.urgency || '待處理')}</span>
      ${meta(`${[item.date, item.time].filter(Boolean).join(' ') || '日期未取得'}｜對象 ID：${value(item.targetId)}｜負責：${item.owner || '未承接'}`)}
      ${item.followAt ? meta(`追蹤：${item.followAt}`) : ''}</div>
      <button type="button" class="compact-button" data-admin-go-tab="${escape(item.tab || 'mainOperations')}" data-main-target-id="${escape(item.targetId || '')}"><i data-lucide="arrow-right"></i>前往</button></li>`).join('')}</ul>${renderPager('operations-tasks', page)}</div>`;
  }

  function renderException(item, options = {}) {
    const tracking = item.tracking || {};
    const valid = versionValid(tracking.version);
    const mine = tracking.owner === options.teacherName && Boolean(options.teacherName);
    const unowned = !tracking.owner;
    const done = closed(tracking);
    const write = options.writes && options.writes[`exception:${item.key}`];
    const disabled = Boolean(write || options.readOnly);
    const versionField = `<input type="hidden" name="expectedVersion" value="${escape(tracking.version)}">`;
    const fields = mine && !done && valid ? `<label class="main-field"><span>備註</span><textarea name="note" class="text-input" rows="2" maxlength="1000" ${disabled ? 'disabled' : ''}>${escape(tracking.note || '')}</textarea></label>
      <label class="main-field"><span>下次追蹤</span><input type="datetime-local" class="text-input" name="followAt" value="${escape(String(tracking.followAt || '').replace(' ', 'T').slice(0, 16))}" ${disabled ? 'disabled' : ''}></label>` : '';
    let actions = '';
    if (valid && !options.readOnly) {
      if (unowned && !done) actions = actionButton('claim-exception', 'user-check', '由我承接', disabled);
      if (mine && !done) actions = actionButton('save-exception', 'save', '儲存追蹤', disabled)
        + actionButton('release-exception', 'user-minus', '釋出承接', disabled)
        + (item.resolved === true ? actionButton('close-exception', 'check-check', '結案', disabled) : '');
      if (mine && done) actions = actionButton('reopen-exception', 'rotate-ccw', '重新開案', disabled);
    }
    const warning = !valid ? state('版本資料未取得，暫不能修改。', true)
      : write ? state(write.status === 'pending' ? '操作處理中，請勿重複送出。' : '操作結果待確認，請先更新資料核對；不會自動重送。', true) : '';
    const content = `<header><h4>${escape(item.date || '')} ${escape(item.time || '')}｜${escape(item.courseName || item.kind || '追蹤案件')}</h4><span class="status-pill">${escape(done ? '已結案' : '追蹤中')}</span></header>
      ${meta(`${value(item.kind)}｜${value(item.teacherName)}｜${value(item.verificationStatus)}｜來源異常${item.resolved === true ? '已排除' : '未解決'}`)}
      ${meta(`案件：${value(item.key)}｜對象 ID：${value(item.targetId)}`)}
      ${meta(`負責：${tracking.owner || '未承接'}｜版本：${valid ? tracking.version : '未取得'}｜下次追蹤：${tracking.followAt || '未設定'}`)}
      ${meta(`備註：${tracking.note || '尚無備註'}`)}
      ${tracking.updatedAt || tracking.updatedBy ? meta(`更新：${tracking.updatedAt || '未取得'}｜${tracking.updatedBy || '未取得'}`) : ''}
      ${warning}${fields}${actions ? `<div class="admin-item-actions">${actions}</div>` : ''}`;
    return `<article class="main-case">${actions ? `<form data-main-case-form data-case-key="${escape(item.key)}">${versionField}${content}</form>` : content}</article>`;
  }

  function renderIdentity(identity, options) {
    const valid = versionValid(identity.version);
    const write = options.writes && options.writes[`identity:${identity.instructorId}`];
    const conflict = /重複/.test(identity.status || '');
    const disabled = Boolean(options.readOnly || write || !valid || conflict);
    const attrs = disabled ? 'disabled' : '';
    const active = ['active', 'linked', '啟用', '已連結', '已確認', 'verified'].includes(identity.status);
    const choices = list(options.teachers).map(name => `<option value="${escape(name)}">${escape(name)}</option>`).join('');
    const form = options.readOnly ? '' : `<form data-main-identity-form data-instructor-id="${escape(identity.instructorId)}">
      <input type="hidden" name="expectedVersion" value="${escape(identity.version)}">
      <label class="main-field"><span>正式帳號老師</span><select name="teacherName" class="admin-select" required ${attrs}><option value="">選擇帳號老師</option>${choices}</select></label>
      <div class="admin-item-actions"><button type="submit" class="compact-button" data-main-action="link-identity" ${attrs}><i data-lucide="link"></i>儲存連結</button>
      ${active && identity.teacherName ? `<button type="submit" class="compact-button" data-main-action="unlink-identity" formnovalidate ${attrs}><i data-lucide="unlink"></i>解除連結</button>` : ''}</div></form>`;
    return `<tr><td>${escape(value(identity.instructorId))}${list(identity.obNames).map(meta).join('')}</td>
      <td>${escape(identity.teacherName || '未連結')}${meta(`狀態：${value(identity.status)}｜版本：${valid ? identity.version : '未取得'}`)}${meta(`確認：${identity.verifiedAt || '未取得'}`)}</td>
      <td>${!valid ? state('版本資料未取得，暫不能修改。', true) : ''}${conflict ? state('老師對照重複，待核對；暫不能修改。', true) : ''}${write ? state(write.status === 'pending' ? '操作處理中。' : '操作結果待確認，請先更新資料核對；不會自動重送。', true) : ''}${form}</td></tr>`;
  }

  function noticeStatus(channel) {
    const labels = { unknown: '未知', uncertain: '結果待確認', accepted: '服務已接受（送達未確認）',
      read: '已讀', unread: '未讀', recorded: '已建立紀錄', stored: '已建立紀錄',
      sent: '已送出（送達未確認）', delivered: '已送達（依回報）', pending: '待處理', queued: '排隊中',
      failed: '失敗', rejected: '服務拒絕', skipped: '未發送', not_sent: '未發送', not_configured: '未設定',
      not_applicable: '不適用', expired: '已過期（結果未確認）', '已建立': '已建立紀錄', '無收件紀錄': '無收件紀錄' };
    return !channel || !labels[channel.status] ? `未知${channel && channel.status ? `（${channel.status}）` : ''}` : labels[channel.status];
  }

  function renderNotices(notices, options = {}) {
    if (!Array.isArray(notices)) return state('通知追蹤資料尚未取得。', true);
    if (!notices.length) return state('目前沒有通知追蹤紀錄。');
    const count = data => Array.isArray(data) ? data.length : number(data);
    const page = paginate(notices, options.pages && options.pages['operations-notices']);
    return `<div data-main-list="operations-notices">${table('通知追蹤', ['通知／關聯對象', '收件匣', '推播', 'LINE'], page.items.map(item => {
      const inbox = item.inbox || {};
      return row([`${value(item.title)}\n${value(item.eventKey)}\n${value(item.createdAt)}\n對象 ID：${value(item.relatedId)}`,
        `${noticeStatus(item.inbox)}\n收件：${count(inbox.recipients)}｜已讀：${count(inbox.read)}`,
        `${noticeStatus(item.push)}${item.push && item.push.detail ? `\n${item.push.detail}` : ''}`,
        `${noticeStatus(item.line)}${item.line && item.line.detail ? `\n${item.line.detail}` : ''}`]);
    }))}${renderPager('operations-notices', page)}</div>`;
  }

  function renderHistory(history, options = {}) {
    if (!history) return '';
    if (errorText(history)) return state(errorText(history), true);
    const canSeePay = history.payrollVisible === true && options.payrollAdmin === true;
    const events = list(history.events).filter(item => canSeePay || !/payroll|salary|薪資|薪項|扣款|計薪/i.test(item.type || ''))
      .slice().sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
    const page = paginate(events, options.pages && options.pages['operations-history']);
    return `<div data-main-list="operations-history">` + meta(`OB Calendar ID：${list(history.calendarIds).join('、') || '未取得'}`)
      + (history.truncated === true ? state('僅顯示最近 500 筆履歷紀錄。') : '')
      + (events.length ? `<ol class="main-history" start="${page.start + 1}">${page.items.map(item => `<li><div class="main-meta"><time>${escape(value(item.time))}</time>｜${escape(item.actor || '未記錄執行者')}｜${escape(value(item.type))}</div>
        <strong>${escape(value(item.title))}</strong><div class="main-history-detail">${escape(value(item.detail))}</div></li>`).join('')}</ol>` : state('目前沒有履歷紀錄。')) + renderPager('operations-history', page) + '</div>';
  }

  function renderOperationsList(key, operations, options = {}) {
    const data = operations || {};
    if (key === 'operations-history') return renderHistory(options.history, options);
    if (key === 'operations-tasks') return renderTasks(data.tasks, errorText(data), options);
    if (key === 'operations-notices') return renderNotices(errorText(data) ? null : data.notificationTracking, options);
    if (key === 'operations-cases') {
      return !errorText(data) && Array.isArray(data.exceptions)
        ? renderPagedList(key, data.exceptions, item => renderException(item, options), { ...options, emptyText: '目前沒有異常追蹤案件。' })
        : state('異常追蹤資料尚未取得。', true);
    }
    if (key === 'operations-identities') {
      if (errorText(data) || !Array.isArray(data.identities)) return state('老師身分對照資料尚未取得。', true);
      const page = paginate(data.identities, options.pages && options.pages[key]);
      return `<div data-main-list="${key}">${page.total ? table('老師身分對照', ['OB Instructor ID／名稱', '帳號連結', '身分連結'], page.items.map(identity => renderIdentity(identity, options))) : state('目前沒有老師身分對照資料。')}${renderPager(key, page)}</div>`;
    }
    return '';
  }

  function renderOperations(operations, options = {}) {
    const data = operations || {};
    const diagnosticError = errorText(operations);
    const history = `<section class="main-section"><h3>課程履歷</h3><form id="main-course-history-form" class="main-search" data-main-form="history">
      <label class="main-field"><span>OB Calendar ID</span><input type="search" name="calendarId" class="text-input" required value="${escape(options.calendarId || '')}" autocomplete="off"></label>
      <button type="submit" class="compact-button" data-main-action="search-history"><i data-lucide="search"></i>查詢</button></form>
      <div id="main-course-history-results" aria-live="polite">${options.historyLoading ? state('查詢履歷中...') : renderHistory(options.history, options)}</div></section>`;
    const cases = renderOperationsList('operations-cases', data, options);
    const identities = renderOperationsList('operations-identities', data, options);
    return `<div class="main-operations">${renderSystemHealth(data.systemHealth, options)}${history}
      <section class="main-section"><div class="main-section-head"><h3>異常追蹤</h3>${actionButton('refresh-operations', 'refresh-cw', '更新資料')}</div>${errorText(operations) ? state(errorText(operations), true) : ''}${cases}</section>
      <section class="main-section"><h3>老師身分對照</h3>${identities}</section>
      <section class="main-section"><h3>通知追蹤</h3>${renderNotices(diagnosticError ? null : data.notificationTracking, options)}</section></div>`;
  }

  const api = { renderDataStatus, renderRuleCatalogue, renderClosureAssessment, renderPayrollComparison,
    renderTasks, renderException, renderOperations, renderOperationsList, renderHistory, versionValid, closed,
    normalizeQueryPreferences, createQueryPreferences, paginate, renderPager, renderPagedList,
    renderSystemHealth, isBackupVerified, isBackupPending, isBackupDailyLimit };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SherryMainAssurance = api;
})(typeof window !== 'undefined' ? window : globalThis);
