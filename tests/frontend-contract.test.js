const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function createFrontendRuntime(fixtures = {}, options = {}) {
  const elements = new Map();
  const requestActions = [];
  const submittedForms = [];
  const windowListeners = new Map();
  const bodyChildren = [];
  let claimSubmitted = false;
  let requestCounter = 0;
  const localStorage = options.localStorage || {
    getItem() { return ''; },
    setItem() {},
    removeItem() {},
  };
  const getElement = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: id === 'claim-submit' ? '確認領取勾選課程' : '',
        className: '',
        dataset: {},
        disabled: false,
        hidden: false,
        value: '',
        addEventListener() {},
        focus() {},
        setAttribute() {},
        removeAttribute() {},
        classList: { add() {}, remove() {}, toggle() {} },
      });
    }
    return elements.get(id);
  };
  const claimControls = {
    '.claim-checkbox': { checked: true, dataset: { substituteId: 'leave-c' } },
    'input[type="radio"]:checked': { value: 'original' },
    '.claim-editor': { hidden: false },
    '.claim-fields': { hidden: true },
    '.claim-adjustment-panel': { hidden: true },
    '.special-course-panel': { hidden: true },
    '.claim-course-type': { value: '' },
    '.claim-difficulty-select': { value: '' },
    '.claim-difficulty-field': { hidden: false },
    '.claim-custom-course-field': { hidden: true },
    '.claim-custom-course-name': { value: '' },
    '.claim-custom-difficulty': { value: '' },
    '.claim-start-delay': { value: '0' },
    '.claim-delay-summary': { textContent: '', dataset: {}, hidden: false },
    '.new-course-name': { value: '' },
    '.claim-note': { value: '' },
  };
  const claimCard = {
    dataset: { claimCardId: 'leave:leave-c' },
    querySelector(selector) { return claimControls[selector] || null; },
    querySelectorAll() { return []; },
    scrollIntoView() {},
  };
  const checkedClaim = {
    dataset: { substituteId: 'leave-c' },
    checked: true,
    closest() { return claimCard; },
  };
  const emitWindowEvent = (type, event) => {
    (windowListeners.get(type) || []).slice().forEach((listener) => listener(event));
  };
  const document = {
    getElementById: getElement,
    querySelectorAll(selector) {
      if (selector === '.claim-checkbox:checked') return [checkedClaim];
      return [];
    },
    querySelector(selector) {
      return null;
    },
    createElement(tagName) {
      const element = {
        tagName: String(tagName).toUpperCase(),
        children: [],
        dataset: {},
        style: {},
        hidden: false,
        name: '',
        value: '',
        type: '',
        method: '',
        action: '',
        target: '',
        parentNode: null,
        appendChild(child) {
          child.parentNode = this;
          this.children.push(child);
          return child;
        },
        setAttribute(name, value) { this[name] = value; },
        remove() {
          if (!this.parentNode) return;
          const index = this.parentNode.children.indexOf(this);
          if (index >= 0) this.parentNode.children.splice(index, 1);
          this.parentNode = null;
        },
      };
      if (element.tagName === 'IFRAME') element.contentWindow = {};
      if (element.tagName === 'FORM') {
        element.submit = function() {
          const fields = Object.fromEntries(this.children.map((child) => [child.name, child.value]));
          const targetFrame = bodyChildren.find((child) => child.tagName === 'IFRAME' && child.name === this.target);
          submittedForms.push({
            action: this.action,
            method: this.method,
            enctype: this.enctype,
            target: this.target,
            fields,
            frameWindow: targetFrame && targetFrame.contentWindow,
          });
          const action = fields.action;
          requestActions.push(action);
          if (action === 'claimSubstitute') claimSubmitted = true;
          if (options.autoRelay === false) return;

          if ((options.errorActions || []).includes(action)) {
            Promise.resolve().then(() => {
              emitWindowEvent('message', {
                origin: 'https://script.googleusercontent.com',
                source: targetFrame.contentWindow,
                data: {
                  source: 'sherry-gas-relay',
                  requestId: fields.requestId,
                  payload: {
                    status: 'error',
                    message: (options.errorMessages || {})[action] || `${action} 載入失敗`,
                  },
                },
              });
            });
            return;
          }

          let data;
          if (action === 'getClaimPageData' && claimSubmitted) {
            data = Promise.resolve(
              options.postClaimAvailable === undefined ? [] : options.postClaimAvailable,
            ).then((items) => ({
              state: options.postClaimState || 'active',
              items,
              options: fixtures.getClaimOptions || { capabilities: [], classes: [] },
            }));
          } else if (action === 'getAvailableSubstitutes' && claimSubmitted) {
            data = options.postClaimAvailable === undefined ? [] : options.postClaimAvailable;
          } else if (action === 'getClaimPageData' && !Object.prototype.hasOwnProperty.call(fixtures, action)) {
            data = {
              items: fixtures.getAvailableSubstitutes || [],
              options: fixtures.getClaimOptions || { capabilities: [], classes: [] },
            };
          } else if (Object.prototype.hasOwnProperty.call(fixtures, action)) {
            data = fixtures[action];
          } else {
            const authenticatedReads = new Set([
              'getAvailableSubstitutes', 'getClaimOptions', 'getClaimPageData', 'getMySubs',
              'getMyCourses', 'getMyLeaves', 'getAdminDashboard', 'recordInvitationFirstView',
            ]);
            data = authenticatedReads.has(action) ? [] : { count: 1 };
          }
          Promise.resolve(data).then((resolvedData) => {
            emitWindowEvent('message', {
              origin: 'https://script.googleusercontent.com',
              source: targetFrame.contentWindow,
              data: {
                source: 'sherry-gas-relay',
                requestId: fields.requestId,
                payload: { status: 'success', data: resolvedData },
              },
            });
          });
        };
      }
      return element;
    },
    body: {
      children: bodyChildren,
      appendChild(child) {
        child.parentNode = this;
        bodyChildren.push(child);
        return child;
      },
    },
  };
  const responseFor = (url, request = {}) => {
    const isPost = request.method === 'POST';
    const action = isPost
      ? new URLSearchParams(request.body || '').get('action')
      : new URL(url).searchParams.get('action');
    requestActions.push(action);
    if (isPost && action === 'claimSubstitute') claimSubmitted = true;
    if (isPost && action === 'getAvailableSubstitutes' && claimSubmitted) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', data: [] }),
        url,
      });
    }
    const authenticatedReads = new Set([
      'getAvailableSubstitutes', 'getClaimOptions', 'getClaimPageData', 'getMySubs',
      'getMyCourses', 'getMyLeaves', 'getAdminDashboard', 'recordInvitationFirstView',
    ]);
    const data = isPost && !authenticatedReads.has(action)
      ? { count: 1 }
      : (fixtures[action] || []);
    const payload = { status: 'success', data };
    return Promise.resolve({ ok: true, status: 200, json: async () => payload, url });
  };
  const context = {
    console,
    document,
    fetch: responseFor,
    URL,
    URLSearchParams,
    CSS: { escape: (value) => String(value) },
    window: {
      localStorage,
      scrollTo() {},
      crypto: {
        randomUUID: () => {
          requestCounter += 1;
          return requestCounter === 1 ? 'test-request-uuid' : `test-request-uuid-${requestCounter}`;
        },
      },
      setTimeout,
      clearTimeout,
      addEventListener(type, listener) {
        if (!windowListeners.has(type)) windowListeners.set(type, []);
        windowListeners.get(type).push(listener);
      },
      removeEventListener(type, listener) {
        const listeners = windowListeners.get(type) || [];
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      },
    },
  };
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.createContext(context);
  vm.runInContext(script, context, { filename: 'index.html' });
  return {
    context,
    elements,
    getElement,
    claimCard,
    claimControls,
    requestActions,
    submittedForms,
    emitWindowEvent,
  };
}

function createOrdinaryClaimConstraintCard({ substituteId, checked, handling, delay }) {
  const classes = new Set();
  const editor = { hidden: !checked };
  const warning = { hidden: true, textContent: '' };
  const summary = { dataset: { blocked: 'false' }, textContent: '' };
  const radio = { value: handling };
  const delayControl = { value: String(delay) };
  const fields = { hidden: handling !== 'existing' };
  const adjustmentPanel = { hidden: handling !== 'existing' };
  let card;
  const checkbox = {
    checked,
    disabled: false,
    title: '',
    dataset: { substituteId, slotKey: `leave:${substituteId}` },
    closest(selector) { return selector === '.claim-card' ? card : null; },
    removeAttribute(name) {
      if (name === 'title') this.title = '';
    },
  };
  const controls = {
    '.claim-checkbox': checkbox,
    '.claim-editor': editor,
    '.special-slot-warning': warning,
    '.claim-delay-summary': summary,
    'input[type="radio"]:checked': radio,
    '.claim-start-delay': delayControl,
    '.claim-fields': fields,
    '.claim-adjustment-panel': adjustmentPanel,
    '.claim-course-type': { value: '__ORIGINAL__' },
    '.claim-difficulty-field': { hidden: true },
  };
  card = {
    querySelector(selector) { return controls[selector] || null; },
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
    },
  };
  return { card, checkbox, editor, warning, summary, radio, delay: delayControl, classes };
}

test('keeps API secrets out of the public frontend', () => {
  assert.doesNotMatch(html, /eyJ[a-zA-Z0-9_-]+\./);
  assert.doesNotMatch(html, /Authorization\s*:\s*['"]Bearer/i);
  assert.doesNotMatch(html, /OMCEAN_API_TOKEN/);
});

test('does not use no-cors blind success writes', () => {
  assert.doesNotMatch(html, /mode\s*:\s*['"]no-cors['"]/);
  assert.match(html, /status\s*!==\s*['"]success['"]/);
});

test('submits structured claim adjustments by UUID', () => {
  assert.match(html, /代課編號/);
  assert.match(html, /substituteId/);
  assert.match(html, /handlingType/);
  assert.match(html, /actualClassId/);
  assert.match(html, /actualCourseName/);
  assert.match(html, /category/);
  assert.match(html, /difficulty/);
  assert.match(html, /note/);
});

test('keeps the three required workflows and mobile viewport', () => {
  assert.match(html, /name=['"]viewport['"]/);
  assert.match(html, /請假登記/);
  assert.match(html, /尋找與領取代課/);
  assert.match(html, /查看我的代課紀錄/);
});

test('shows backend errors instead of always claiming success', () => {
  assert.match(html, /throw new Error\(payload\.message/);
  assert.match(html, /catch\s*\(error\)/);
});

test('keeps dashboard rendering alive when the optional icon library throws', () => {
  const { context } = createFrontendRuntime();
  context.console = { warn() {} };
  context.window.lucide = {
    createIcons() {
      throw new SyntaxError('The string did not match the expected pattern.');
    },
  };

  assert.doesNotThrow(() => context.refreshIcons());
});

test('does not present unloaded admin counts as real zero values', () => {
  assert.doesNotMatch(html, /data-admin-count="[^"]+">0<\/span>/);
  assert.match(html, /function setAdminCountsUnavailable\(\)/);
});

test('locks the leave pause button until the mutation and dashboard refresh finish', async () => {
  let finishPauseRequest;
  const pauseRequest = new Promise((resolve) => {
    finishPauseRequest = () => resolve({ paused: true });
  });
  const { context, getElement } = createFrontendRuntime({
    pauseLeaves: pauseRequest,
    getAdminDashboard: {
      leavePaused: true,
      pendingInvitations: [],
      activeInvitees: [],
      obWork: [],
      changeRequests: [],
      exceptions: [],
      completed: [],
      teachers: [],
      replacementOptions: [],
    },
  });

  const pending = context.toggleAdminLeavePause();
  assert.equal(getElement('admin-leave-pause').disabled, true);
  finishPauseRequest();
  await pending;
  assert.equal(getElement('admin-leave-pause').disabled, false);
});

test('provides teacher login and sends credentials through form-encoded POST', async () => {
  assert.match(html, /id=["']login-form["']/);
  assert.match(html, /id=["']login-teacher["']/);
  assert.match(html, /id=["']login-pin["']/);
  assert.match(html, /callPostApi\(["']login["']/);
  const { context, submittedForms } = createFrontendRuntime({
    login: { teacherName: '老師甲', role: '老師', managementCapabilities: [] },
  });

  await context.callPostApi('login', { teacherName: '老師甲', pin: '1234' });

  assert.equal(submittedForms[0].method.toUpperCase(), 'POST');
  assert.equal(submittedForms[0].enctype, 'application/x-www-form-urlencoded');
  assert.equal(submittedForms[0].fields.teacherName, '老師甲');
  assert.equal(submittedForms[0].fields.pin, '1234');
  assert.equal(submittedForms[0].action.includes('1234'), false);
});

test('teacher login uses a native select that opens reliably on Safari', () => {
  assert.match(html, /<select[^>]+id=["']login-teacher["']/s);
  assert.doesNotMatch(html, /id=["']login-teacher["'][^>]+list=["']teacher-options["']/s);
});

test('notification permission is requested only after the signed-in teacher taps enable', async () => {
  assert.match(html, /id=["']push-permission-card["']/);
  assert.match(html, /id=["']push-enable["']/);
  assert.match(html, /OneSignal\.Notifications\.requestPermission/);
  assert.match(html, /OneSignal\.User\.PushSubscription\.optIn/);

  const calls = [];
  const oneSignal = {
    init: async (options) => calls.push(['init', options.appId]),
    login: async (externalId) => calls.push(['login', externalId]),
    logout: async () => calls.push(['logout']),
    Notifications: {
      permission: false,
      requestPermission: async () => {
        calls.push(['requestPermission']);
        oneSignal.Notifications.permission = true;
      },
    },
    User: {
      PushSubscription: {
        optedIn: false,
        optIn: async () => {
          calls.push(['optIn']);
          oneSignal.User.PushSubscription.optedIn = true;
        },
        optOut: async () => calls.push(['optOut']),
      },
    },
  };
  const { context, getElement } = createFrontendRuntime({
    getPushConfiguration: {
      configured: true,
      appId: 'onesignal-app-id',
      externalId: 'teacher_opaque_actual_user',
    },
  });
  context.window.OneSignalDeferred = {
    push(callback) { return Promise.resolve(callback(oneSignal)); },
  };
  vm.runInContext("authState.sessionToken = 'session'; authState.teacherName = 'Tako'; authState.actingTeacherName = 'Jina';", context);

  await context.initializePushForSession();

  assert.deepEqual(calls, [
    ['init', 'onesignal-app-id'],
    ['login', 'teacher_opaque_actual_user'],
  ]);
  assert.equal(calls.some(([name]) => name === 'requestPermission'), false);

  await context.requestPushPermission();
  assert.equal(calls.some(([name]) => name === 'requestPermission'), true);
  assert.equal(calls.some(([name]) => name === 'optIn'), true);
  assert.equal(getElement('push-permission-card').hidden, true);
});

test('notification setup explains iPhone Home Screen requirement and logs out push identity', () => {
  assert.match(html, /iPhone[\s\S]{0,160}主畫面/);
  assert.match(html, /iOS 16\.4/);
  assert.match(html, /OneSignal\.logout\(\)/);
  assert.match(html, /logoutPushIdentity/);
});

test('course administrators have one notification center for manual sends schedules and history', async () => {
  assert.match(html, /data-admin-tab=["']notifications["']/);
  const { context, requestActions, getElement } = createFrontendRuntime({
    getNotificationAdminDashboard: {
      teachers: ['冠蓉', 'Tako', 'Jina'],
      administrators: ['冠蓉', 'Tako'],
      closureWindows: [
        { stage: '第一輪', time: '22:30–22:34' },
        { stage: '第二輪', time: '23:40–23:44' },
      ],
      schedules: [],
      history: [],
    },
  });
  vm.runInContext("authState.sessionToken = 'session'; authState.teacherName = '冠蓉'; authState.managementCapabilities = ['course_admin']; activeAdminTab = 'notifications';", context);

  await context.fetchNotificationAdminDashboard();

  assert.ok(requestActions.includes('getNotificationAdminDashboard'));
  assert.match(getElement('admin-tab-content').innerHTML, /id=["']manual-notification-form["']/);
  assert.match(getElement('admin-tab-content').innerHTML, /22:30–22:34/);
  assert.match(getElement('admin-tab-content').innerHTML, /23:40–23:44/);
});

test('management accounts land directly on the management workspace', () => {
  const { context, requestActions } = createFrontendRuntime({
    getAdminDashboard: {
      pendingInvitations: [], activeInvitees: [], missingObCancellations: [], obWork: [],
      changeRequests: [], exceptions: [], completed: [], teachers: [], replacementOptions: [],
    },
  });
  vm.runInContext("authState.teacherName = 'Tako'; authState.managementCapabilities = ['course_admin'];", context);

  context.showLoggedInApp();

  assert.ok(requestActions.includes('getAdminDashboard'));
});

test('course-admin acting mode is sent only to teacher self-service actions', async () => {
  const { context, submittedForms } = createFrontendRuntime({
    getMyCourses: [],
    getMyPayroll: { month: '2026-09', lines: [], summary: null, disputes: [] },
  });
  vm.runInContext("authState.teacherName = 'Tako'; authState.managementCapabilities = ['course_admin']; authState.actingTeacherName = 'Jina';", context);

  await context.callApi('getMyCourses');
  await context.callApi('getMyPayroll', { month: '2026-09' });

  const courseRequest = submittedForms.find((item) => item.fields.action === 'getMyCourses');
  const payrollRequest = submittedForms.find((item) => item.fields.action === 'getMyPayroll');
  assert.equal(courseRequest.fields.actingTeacherName, 'Jina');
  assert.equal(payrollRequest.fields.actingTeacherName, undefined);
});

test('course admins can enter and leave a clearly labelled teacher acting mode', () => {
  const { context, getElement } = createFrontendRuntime({
    getAdminDashboard: {
      pendingInvitations: [], activeInvitees: [], missingObCancellations: [], obWork: [],
      changeRequests: [], exceptions: [], completed: [], teachers: ['Jina'], replacementOptions: [],
    },
  });
  vm.runInContext("authState.teacherName = 'Tako'; authState.managementCapabilities = ['course_admin'];", context);

  context.startActingAsTeacher('Jina');

  assert.equal(vm.runInContext('authState.actingTeacherName', context), 'Jina');
  assert.equal(getElement('acting-banner').hidden, false);
  assert.match(getElement('current-user').textContent, /Tako.*Jina/);

  context.stopActingAsTeacher();
  assert.equal(vm.runInContext('authState.actingTeacherName', context), '');
  assert.equal(getElement('acting-banner').hidden, true);
});

test('sends authenticated POST data through an iframe relay without exposing the session token in the URL', async () => {
  const { context, submittedForms } = createFrontendRuntime({
    getSession: { teacherName: '老師甲', role: '老師', managementCapabilities: [] },
  });

  const result = await context.callPostApi('getSession', { sessionToken: 'secret-session-token' });

  assert.equal(result.teacherName, '老師甲');
  assert.equal(submittedForms.length, 1);
  assert.equal(submittedForms[0].method.toUpperCase(), 'POST');
  assert.equal(submittedForms[0].action.includes('secret-session-token'), false);
  assert.equal(submittedForms[0].fields.sessionToken, 'secret-session-token');
  assert.equal(submittedForms[0].fields.transport, 'iframe');
  assert.equal(submittedForms[0].fields.requestId, 'test-request-uuid');
});

test('ignores forged iframe relay messages before accepting the matching Google response', async () => {
  const { context, submittedForms, emitWindowEvent } = createFrontendRuntime({}, { autoRelay: false });
  let settled = false;
  const pending = context.callPostApi('getSession').then((value) => {
    settled = true;
    return value;
  });
  assert.equal(submittedForms.length, 1);
  const submitted = submittedForms[0];

  emitWindowEvent('message', {
    origin: 'https://attacker.example',
    source: submitted.frameWindow,
    data: {
      source: 'sherry-gas-relay',
      requestId: submitted.fields.requestId,
      payload: { status: 'success', data: { teacherName: '偽造老師' } },
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);

  emitWindowEvent('message', {
    origin: 'https://relay.script.googleusercontent.com',
    source: {},
    data: {
      source: 'sherry-gas-relay',
      requestId: 'wrong-request-id',
      payload: { status: 'success', data: { teacherName: '錯誤老師' } },
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);

  emitWindowEvent('message', {
    origin: 'https://relay.script.googleusercontent.com',
    source: {},
    data: {
      source: 'sherry-gas-relay',
      requestId: submitted.fields.requestId,
      payload: { status: 'success', data: { teacherName: '老師甲' } },
    },
  });

  assert.equal((await pending).teacherName, '老師甲');
});

test('accepts the hyphenated Apps Script sandbox origin used by Safari', async () => {
  const { context, submittedForms, emitWindowEvent } = createFrontendRuntime({}, { autoRelay: false });
  let settled = false;
  const pending = context.callPostApi('getSession').then((value) => {
    settled = true;
    return value;
  });
  const submitted = submittedForms[0];

  try {
    emitWindowEvent('message', {
      origin: 'https://n-example-0lu-script.googleusercontent.com',
      source: {},
      data: {
        source: 'sherry-gas-relay',
        requestId: submitted.fields.requestId,
        payload: { status: 'success', data: { teacherName: '老師甲' } },
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(settled, true);
  } finally {
    if (!settled) {
      emitWindowEvent('message', {
        origin: 'https://script.googleusercontent.com',
        source: {},
        data: {
          source: 'sherry-gas-relay',
          requestId: submitted.fields.requestId,
          payload: { status: 'success', data: { teacherName: '老師甲' } },
        },
      });
    }
    await pending;
  }
});

test('keeps session tokens out of URLs by routing every authenticated read through POST', () => {
  assert.match(html, /const PUBLIC_GET_ACTIONS\s*=\s*new Set\(\["getTeachers"\]\)/);
  assert.match(html, /if \(!PUBLIC_GET_ACTIONS\.has\(action\)\) return callPostApi\(action, effectiveParams\)/);
  assert.doesNotMatch(html, /query\.set\([\s\S]{0,180}sessionToken/);
});

test('implements date-first leave selection with select-all-visible and clear controls', () => {
  assert.match(html, /id=["']leave-date-list["']/);
  assert.match(html, /id=["']select-all-visible-dates["']/);
  assert.match(html, /id=["']clear-leave-dates["']/);
  assert.match(html, /selectedLeaveDates/);
  assert.match(html, /renderLeaveDates/);
  assert.match(html, /renderLeaveCourses/);
});

test('formats teacher-facing dates with a Traditional Chinese weekday', () => {
  const { context } = createFrontendRuntime();

  assert.equal(context.formatDateWithWeekday('2026/09/24'), '2026/09/24（四）');
  assert.equal(context.formatDateWithWeekday('2026-09-24'), '2026/09/24（四）');
  assert.equal(context.formatDateWithWeekday('2026/02/30'), '2026/02/30');
  assert.equal(context.formatDateWithWeekday('日期未設定'), '日期未設定');
});

test('renders weekdays in leave and substitute lists', async () => {
  const { context, getElement } = createFrontendRuntime({
    getMyCourses: [{
      '日期': '2026/09/24',
      '時間': '18:30',
      '課程': 'A－舞綢 Lv.2',
      'OB Calendar ID': 'calendar-weekday',
    }],
    getMyLeaves: [{
      '代課編號': 'leave-weekday',
      '日期': '2026/09/24',
      '時段': '18:30',
      '課程': 'A－舞綢 Lv.2',
      '狀態': '確認中',
    }],
    getAvailableSubstitutes: [{
      '代課編號': 'sub-weekday',
      '原老師': '老師甲',
      '日期': '2026/09/24',
      '時段': '18:30',
      '課程': 'A－舞綢 Lv.2',
      '課程大類': '舞綢',
      '可沿用原課程': true,
    }],
    getClaimOptions: {
      capabilities: ['舞綢'],
      classes: [],
    },
    getMySubs: [{
      '代課編號': 'my-sub-weekday',
      '原老師': '老師乙',
      '日期': '2026/09/24',
      '時段': '20:00',
      '課程': 'A－舞綢 Lv.1',
    }],
  });

  await context.loadMyCourses();
  vm.runInContext('selectedLeaveDates.add("2026/09/24")', context);
  context.renderLeaveCourses();
  vm.runInContext('selectedLeaveCourses.add("calendar-weekday")', context);
  context.updateLeaveConfirmation();
  await context.fetchMyLeaves();
  await context.fetchAvailableSubstitutes();
  await context.fetchMySubs();

  assert.match(getElement('leave-date-list').innerHTML, /2026\/09\/24（四）/);
  assert.match(getElement('leave-course-list').innerHTML, /2026\/09\/24（四） 18:30/);
  assert.match(getElement('leave-confirmation-list').innerHTML, /2026\/09\/24（四） 18:30/);
  assert.match(getElement('my-leaves-list').innerHTML, /2026\/09\/24（四） 18:30/);
  assert.match(getElement('pending-leaves-list').innerHTML, /2026\/09\/24（四）/);
  assert.match(getElement('my-subs-list').innerHTML, /2026\/09\/24（四） 20:00/);
});

test('shows an exact confirmation count and full selected course list', () => {
  assert.match(html, /id=["']leave-confirmation-count["']/);
  assert.match(html, /id=["']leave-confirmation-list["']/);
  assert.match(html, /updateLeaveConfirmation/);
  assert.match(html, /selectedLeaveCourses\.length/);
});

test('submits leave items in bounded POST batches and verifies exact backend totals', () => {
  assert.match(html, /LEAVE_BATCH_SIZE\s*=\s*25/);
  assert.match(html, /callPostApi\(["']submitLeave["']/);
  assert.match(html, /requested/);
  assert.match(html, /created/);
  assert.match(html, /duplicates/);
  assert.match(html, /failed/);
  assert.match(html, /送出結果與勾選堂數不一致/);
});

test('lists every failed leave course and preserves only failed IDs for retry', () => {
  const { context } = createFrontendRuntime();
  const totals = { requested: 0, created: 0, duplicates: 0, failed: 0, errors: [] };
  const batch = [
    { 日期: '2026/08/10', 時間: '18:30', 課程: '空環 Lv.1', 'OB Calendar ID': 'calendar-a' },
    { 日期: '2026/08/11', 時間: '19:30', 課程: '綢吊 Lv.1', 'OB Calendar ID': 'calendar-b' },
  ];

  context.mergeLeaveBatchResult(totals, {
    requested: 2,
    created: 1,
    duplicates: 0,
    failed: 1,
    errors: [{
      index: 1,
      calendarId: 'calendar-b',
      date: '2026/08/11',
      time: '19:30',
      course: '綢吊 Lv.1',
      message: '課程已異動',
    }],
  }, batch);

  assert.deepEqual(JSON.parse(JSON.stringify(totals.errors)), [{
    calendarId: 'calendar-b',
    date: '2026/08/11',
    time: '19:30',
    course: '綢吊 Lv.1',
    message: '課程已異動',
  }]);
  assert.match(context.formatLeaveFailureMessage(totals), /失敗課程：2026\/08\/11 19:30 綢吊 Lv\.1：課程已異動/);
  assert.match(html, /selectedLeaveCourses\s*=\s*new Set\(totals\.errors/);
  assert.match(html, /await fetchMyLeaves\(\)/);
});

test('reports prior successes and keeps every unconfirmed course after a later transport failure', () => {
  const { context } = createFrontendRuntime();
  const totals = { requested: 1, created: 1, duplicates: 0, failed: 0, errors: [] };
  const unconfirmed = [
    { 日期: '2026/08/12', 時間: '20:00', 課程: '空瑜 Lv.1', 'OB Calendar ID': 'calendar-c' },
    { 日期: '2026/08/13', 時間: '21:00', 課程: '舞綢 Lv.2', 'OB Calendar ID': 'calendar-d' },
  ];

  context.appendUnconfirmedLeaveFailures(totals, unconfirmed, '網路中斷');

  assert.equal(totals.created, 1);
  assert.equal(totals.unconfirmed, 2);
  assert.deepEqual(
    JSON.parse(JSON.stringify(totals.errors.map((item) => item.calendarId))),
    ['calendar-c', 'calendar-d']
  );
  const message = context.formatLeaveFailureMessage(totals);
  assert.match(message, /新增 1 堂/);
  assert.match(message, /空瑜 Lv\.1：尚未確認：網路中斷/);
  assert.match(message, /舞綢 Lv\.2：尚未確認：網路中斷/);
  assert.match(html, /appendUnconfirmedLeaveFailures\(totals, items\.slice\(start\), error\.message\)/);
});

test('renders personal leave history details for the logged-in teacher', () => {
  assert.match(html, /我的請假紀錄/);
  assert.match(html, /callApi\(["']getMyLeaves["']/);
  assert.match(html, /實際課程名稱/);
  assert.match(html, /預計難度/);
  assert.match(html, /OB 核對狀態/);
  assert.match(html, /異動狀態/);
});

test('loads substitutes through the invited-only API and claims through the locked POST action', () => {
  assert.match(html, /callApi\(["']getClaimPageData["']/);
  assert.match(html, /callPostApi\(["']claimSubstitute["']/);
  assert.doesNotMatch(html, /callApi\(["']getPendingLeaves["']/);
  assert.doesNotMatch(html, /callPostApi\(["']submitClaim["']/);
});

test('groups available substitutes by date and keeps the uninvited state neutral', () => {
  assert.match(html, /groupAvailableSubstitutesByDate/);
  assert.match(html, /class=["']claim-date-group["']/);
  assert.match(html, /目前沒有可領取的代課/);
  assert.doesNotMatch(html, /你未受邀|未被邀請|梯次|序位|其他受邀/);
});

test('shows a clear ended-round state instead of an empty substitute list', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimPageData: {
      state: 'ended',
      items: [],
      options: { capabilities: [], classes: [] },
    },
  });

  await context.fetchAvailableSubstitutes();

  assert.match(getElement('pending-leaves-list').innerHTML, /本輪代課領取已結束/);
  assert.match(getElement('pending-leaves-list').innerHTML, /已領取課程不受影響/);
  assert.equal(getElement('claim-submit').disabled, true);
});

test('keeps substitute dates collapsed by default and preserves an expanded date across renders', async () => {
  const { context, getElement } = createFrontendRuntime({
    getAvailableSubstitutes: [
      {
        '代課編號': 'leave-fold-a', '原老師': '老師甲', '日期': '2026/09/12',
        '時段': '13:30', '課程': 'B－空環 Lv.2', '課程大類': '空環', '可沿用原課程': true,
      },
      {
        '代課編號': 'leave-fold-b', '原老師': '老師乙', '日期': '2026/09/13',
        '時段': '15:00', '課程': 'A－舞綢 Lv.1', '課程大類': '舞綢', '可沿用原課程': true,
      },
    ],
  });
  await context.fetchAvailableSubstitutes();
  const list = getElement('pending-leaves-list');

  assert.match(list.innerHTML, /data-claim-date-toggle="2026\/09\/12"[^>]*aria-expanded="false"/);
  assert.match(list.innerHTML, /data-claim-date-content="2026\/09\/12"[^>]*hidden/);

  const toggleAttributes = { 'aria-expanded': 'false' };
  const toggle = {
    setAttribute(name, value) { toggleAttributes[name] = value; },
  };
  const content = { hidden: true };
  context.document.querySelector = (selector) => {
    if (selector.includes('data-claim-date-toggle')) return toggle;
    if (selector.includes('data-claim-date-content')) return content;
    return null;
  };
  const originalRender = context.renderAvailableSubstitutes;
  let renderCalls = 0;
  context.renderAvailableSubstitutes = () => { renderCalls += 1; };
  context.toggleClaimDateGroup('2026/09/12');
  assert.equal(renderCalls, 0);
  assert.equal(toggleAttributes['aria-expanded'], 'true');
  assert.equal(content.hidden, false);

  context.renderAvailableSubstitutes = originalRender;
  originalRender();
  assert.match(list.innerHTML, /data-claim-date-toggle="2026\/09\/12"[^>]*aria-expanded="true"/);
  context.toggleClaimDateGroup('2026/09/12');
  assert.equal(toggleAttributes['aria-expanded'], 'false');
  assert.equal(content.hidden, true);
});

test('removes claimed courses immediately and refreshes after a concurrent conflict', () => {
  assert.match(html, /claimedIds/);
  assert.match(html, /pendingLeaves\s*=\s*pendingLeaves\.filter/);
  assert.match(html, /剛被其他老師領取/);
  assert.match(html, /await fetchAvailableSubstitutes\(\)/);
});

test('a stale claim page refreshes into the ended-round state after the admin closes invitations', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
    },
    getClaimPageData: {
      state: 'active',
      items: [{
        '代課編號': 'leave-c', '原老師': '老師丙', '日期': '2026/08/11',
        '時段': '11:00', '課程': '空環 Lv.1', '課程大類': '空環', '可沿用原課程': true,
      }],
      options: {
        capabilities: ['空環'],
        classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
      },
    },
  }, {
    errorActions: ['claimSubstitute'],
    errorMessages: { claimSubstitute: '目前尚未開放代課領取。' },
    postClaimAvailable: [],
    postClaimState: 'ended',
  });
  await context.fetchAvailableSubstitutes();

  await context.submitClaim();

  assert.match(getElement('pending-leaves-list').innerHTML, /本輪代課領取已結束/);
  assert.equal(getElement('claim-submit').disabled, true);
});

test('keeps the claim button disabled after the final available course is claimed', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-c',
      '原老師': '老師丙',
      '日期': '2026/08/11',
      '時段': '11:00',
      '課程': '空環 Lv.1',
      '課程大類': '空環',
      '可沿用原課程': true,
    }],
  });
  await Promise.resolve();
  await context.fetchAvailableSubstitutes();

  await context.submitClaim();

  assert.equal(getElement('claim-submit').disabled, true);
});

test('shows a persistent success dialog after the claimed-course list finishes refreshing', async () => {
  let finishRefresh;
  const refresh = new Promise((resolve) => { finishRefresh = resolve; });
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-c',
      '原老師': '老師丙',
      '日期': '2026/09/11',
      '時段': '11:00',
      '課程': '空環 Lv.1',
      '課程大類': '空環',
      '可沿用原課程': true,
    }],
  }, { postClaimAvailable: refresh });
  await Promise.resolve();
  await context.fetchAvailableSubstitutes();

  let opened = false;
  getElement('claim-success-dialog').showModal = () => { opened = true; };

  const submitting = context.submitClaim();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(opened, false, 'success confirmation should wait until the list refresh settles');

  finishRefresh([]);
  await submitting;

  assert.equal(opened, true);
  assert.equal(getElement('claim-success-title').textContent, '代課領取成功');
  assert.match(getElement('claim-success-copy').textContent, /成功領取 1 堂代課/);
  assert.match(html, /id="claim-success-records"[^>]*>[^<]*(?:<i[^>]*><\/i>)?查看代課紀錄/);
});

test('delayed claim submits its minutes and immediately removes the occupied next course', async () => {
  let finishRefresh;
  const refresh = new Promise((resolve) => { finishRefresh = resolve; });
  const { context, claimControls, submittedForms, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [],
      specialAvailability: {
        'leave-c': { startTime: '18:30', nextCourseTime: '20:00', mergePartnerIds: ['leave-next'] },
      },
    },
    getAvailableSubstitutes: [
      {
        '代課編號': 'leave-c', '原老師': '老師乙', '日期': '2026/09/01',
        '時段': '18:30', '課程': 'A－空環 Lv.1', '課程大類': '空環', '可沿用原課程': true,
      },
      {
        '代課編號': 'leave-next', '原老師': '老師丙', '日期': '2026/09/01',
        '時段': '20:00', '課程': 'A－空環 Lv.2', '課程大類': '空環', '可沿用原課程': true,
      },
    ],
    claimSubstitute: { count: 1, occupiedSubstituteIds: ['leave-next'] },
  }, { postClaimAvailable: refresh });
  await Promise.resolve();
  await context.fetchAvailableSubstitutes();
  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.claim-course-type'].value = '__ORIGINAL__';
  claimControls['.claim-start-delay'].value = '30';

  const submitting = context.submitClaim();
  await new Promise((resolve) => setImmediate(resolve));

  const form = submittedForms.find((item) => item.fields.action === 'claimSubstitute');
  assert.equal(JSON.parse(form.fields.items)[0].startDelayMinutes, 30);
  assert.doesNotMatch(getElement('pending-leaves-list').innerHTML, /leave-c|leave-next/);

  finishRefresh([]);
  await submitting;
});

test('uses the protected capability result before deciding whether a course change is required', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{ classId: 'class-ring', courseName: '空環 Lv.1', category: '空環' }],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-b',
      '原老師': '老師乙',
      '日期': '2026/08/10',
      '時段': '18:30',
      '課程': '空環 Lv.2',
      '課程大類': '空環',
      '可沿用原課程': true,
    }],
  });
  await Promise.resolve();

  await context.fetchAvailableSubstitutes();

  assert.match(getElement('pending-leaves-list').innerHTML, /value="original"\s+checked/);
  assert.doesNotMatch(getElement('pending-leaves-list').innerHTML, /需要改成可教授的課程/);
});

test('loads protected capability and independent course adjustment options for claims', () => {
  assert.match(html, /callApi\(["']getClaimPageData["']/);
  assert.match(html, /claimOptions/);
  assert.match(html, /claim-course-type/);
  assert.match(html, /claim-difficulty-select/);
  assert.match(html, /課程類型/);
});

test('separates ordinary substitute handling from the special-course flow', () => {
  assert.match(html, /value=["']original["']/);
  assert.match(html, /value=["']existing["']/);
  assert.match(html, /直接認領/);
  assert.match(html, /調整課程或時間/);
  assert.doesNotMatch(html, />\s*沿用原課程\s*<\/label>/);
  assert.doesNotMatch(html, />\s*改用既有 OB 課程\s*<\/label>/);
  assert.doesNotMatch(html, /value=["']new["']/);
  assert.doesNotMatch(html, /value=["']__SPECIAL__["']/);
  assert.match(html, /普通代課/);
  assert.match(html, /安排特別課/);
  assert.match(html, /單堂延長/);
  assert.match(html, /使用連續時段/);
  assert.match(html, /只需勾選特別課開始的第一堂，系統會依課程長度，自動占用同日、同教室需要使用的後續時段。/);
  assert.match(html, /特別課名稱/);
  assert.match(html, /placeholder="例如：舞綢中軸特別課、椅子瑜伽特別課"/);
  assert.match(html, /實際開始時間/);
  assert.match(html, /id="special-actual-start"/);
  assert.equal(
    (html.match(/開始時段預設為第一門課程開始時間，如需調整請從此調整/g) || []).length,
    1
  );
  assert.match(html, /id="special-start-guidance"[^>]*>開始時段預設為第一門課程開始時間，如需調整請從此調整/);
  const specialStartSelect = html.match(/<select id="special-actual-start"[\s\S]*?<\/select>/)?.[0] || '';
  assert.doesNotMatch(specialStartSelect, /開始時段預設為第一門課程開始時間/);
  assert.equal((html.match(/請先勾選第一堂課程/g) || []).length, 2);
  assert.match(html, /只能延後，並以 15 分鐘為單位/);
  assert.match(html, /難度／等級（如有）/);
  assert.match(html, /id="special-claim-summary"[\s\S]*id="special-course-name"/);
  assert.match(html, /自訂分鐘數（90–240）/);
  assert.match(html, /id="special-custom-duration"[^>]*min="90"[^>]*max="240"[^>]*step="15"[^>]*readonly/);
  assert.match(html, /id="special-duration-decrease"[^>]*aria-label="減少 15 分鐘"/);
  assert.match(html, /id="special-duration-increase"[^>]*aria-label="增加 15 分鐘"/);
  assert.match(html, /請使用減少與增加按鈕選擇分鐘數/);
  assert.doesNotMatch(html, /備註\s*<span class="claim-required">必填/);
  assert.doesNotMatch(html, /new-difficulty-required/);
  assert.match(html, /claim-course-type/);
  assert.match(html, /claim-difficulty-select/);
  assert.match(html, /claim-note/);
});

test('custom special-course duration uses visible 15-minute controls on mobile', () => {
  const { context, getElement } = createFrontendRuntime();
  const input = getElement('special-custom-duration');
  input.value = '90';
  context.adjustSpecialCustomDuration(-15);
  assert.equal(input.value, '90');
  context.adjustSpecialCustomDuration(15);
  assert.equal(input.value, '105');
  input.value = '240';
  context.adjustSpecialCustomDuration(15);
  assert.equal(input.value, '240');
});

test('maps own and open substitute slots into the special-course picker without exposing fake substitute ids', () => {
  const { context } = createFrontendRuntime();
  const items = context.buildSpecialCourseDisplayItems([
    {
      slotKey: 'own:cal-own-1', sourceType: 'own', substituteId: '', calendarId: 'cal-own-1',
      date: '2026/08/10', time: '09:00', room: 'A', courseName: 'A－空環 Lv.1',
      originalTeacher: '老師甲',
    },
    {
      slotKey: 'leave:leave-open-1', sourceType: 'leave', substituteId: 'leave-open-1',
      calendarId: 'cal-leave-1', date: '2026/08/10', time: '10:30', room: 'A',
      courseName: 'A－舞綢 Lv.1', originalTeacher: '老師乙',
    },
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(items)), [
    {
      '代課編號': '', '時段鍵': 'own:cal-own-1', '來源類型': 'own', '來源標籤': '自己的正課',
      'OB Calendar ID': 'cal-own-1', '日期': '2026/08/10', '時段': '09:00',
      '課程': 'A－空環 Lv.1', '原老師': '老師甲', '課程大類': '空環', '可沿用原課程': true,
    },
    {
      '代課編號': 'leave-open-1', '時段鍵': 'leave:leave-open-1', '來源類型': 'leave',
      '來源標籤': '開放代課', 'OB Calendar ID': 'cal-leave-1', '日期': '2026/08/10',
      '時段': '10:30', '課程': 'A－舞綢 Lv.1', '原老師': '老師乙',
      '課程大類': '舞綢', '可沿用原課程': true,
    },
  ]);
});

test('renders own-course special requests as one teacher record and one admin work item', () => {
  const { context } = createFrontendRuntime();
  const sourceSlots = [
    { slotKey: 'own:cal-1', sourceType: 'own', time: '09:00', courseName: 'A－空環 Lv.1', calendarId: 'cal-1', originalTeacher: '老師甲' },
    { slotKey: 'own:cal-2', sourceType: 'own', time: '10:30', courseName: 'A－空環 Lv.2', calendarId: 'cal-2', originalTeacher: '老師甲' },
  ];
  const teacherMarkup = context.renderMySubGroup({
    specialGroupId: 'special-1',
    items: [{
      '紀錄類型': '特別課安排', '特別課群組 ID': 'special-1', '日期': '2026/08/10',
      '時段': '09:00', '實際課程名稱': '舞綢中軸特別課', '特別課模式': '使用連續時段',
      '特別課分鐘數': 120, '特別課實際開始時間': '09:00', '特別課結束時間': '11:00',
      '來源時段': sourceSlots, '可申請退出': false, '異動紀錄': [],
    }],
  });
  assert.match(teacherMarkup, /舞綢中軸特別課/);
  assert.match(teacherMarkup, /09:00.*A－空環 Lv\.1/);
  assert.match(teacherMarkup, /10:30.*A－空環 Lv\.2/);
  assert.doesNotMatch(teacherMarkup, /申請退出/);

  const adminMarkup = context.renderAdminObItem({
    recordType: 'specialRequest', specialGroupId: 'special-1', date: '2026/08/10', time: '09:00',
    originalCourse: 'A－空環 Lv.1＋A－空環 Lv.2', originalTeacher: '老師甲',
    substituteTeacher: '老師甲', actualCourse: '舞綢中軸特別課', difficulty: '',
    status: '待處理', changeStatus: '', sourceSlots, auditHistory: [],
  }, [{ calendarId: 'cal-special', date: '2026/08/10', time: '09:00', courseName: 'A－舞綢中軸特別課', teacherName: '老師甲' }]);
  assert.match(adminMarkup, /data-special-replacement-select="special-1"/);
  assert.match(adminMarkup, /data-admin-action="link-special-replacement"/);
  assert.doesNotMatch(adminMarkup, /data-substitute-id=""/);
  assert.match(html, /linkAdminSpecialReplacement\(groupId, select\.value\)/);
});

test('renders delayed claim timing in teacher and admin records without replacement controls on occupancy', () => {
  const { context } = createFrontendRuntime();
  const teacherMarkup = context.renderMySubGroup({
    specialGroupId: '',
    items: [{
      '代課編號': 'leave-a', '日期': '2026/09/01', '時段': '18:30',
      '實際開始時間': '19:00', '延後分鐘數': 30, '課程': 'A－空環 Lv.1',
      '原老師': '老師乙', '處理類型': '沿用原課程', '實際課程名稱': 'A－空環 Lv.1',
      '異動狀態': '', '可申請退出': true, '異動紀錄': [],
    }],
  });
  const primaryMarkup = context.renderAdminObItem({
    substituteId: 'leave-a', date: '2026/09/01', time: '18:30',
    actualStartTime: '19:00', startDelayMinutes: 30,
    originalCourse: 'A－空環 Lv.1', actualCourse: 'A－空環 Lv.1',
    originalTeacher: '老師乙', substituteTeacher: '老師甲', status: '已領取',
    changeStatus: '', differenceReason: '', auditHistory: [],
  }, []);
  const occupiedMarkup = context.renderAdminObItem({
    substituteId: 'leave-b', date: '2026/09/01', time: '20:00',
    originalCourse: 'A－空環 Lv.2', actualCourse: 'A－空環 Lv.2',
    originalTeacher: '老師丙', substituteTeacher: '', status: '延後占用',
    changeStatus: '延後占用／待管理員關閉 OB', differenceReason: '',
    delaySourceSubstituteId: 'leave-a', delaySourceTeacher: '老師甲', auditHistory: [],
  }, []);

  assert.match(teacherMarkup, /調整開始時間：18:30 → 19:00/);
  assert.match(primaryMarkup, /調整開始時間：18:30 → 19:00/);
  assert.match(occupiedMarkup, /延後占用／待管理員關閉 OB/);
  assert.match(occupiedMarkup, /來源代課編號：leave-a/);
  assert.match(occupiedMarkup, /來源老師：老師甲/);
  assert.doesNotMatch(occupiedMarkup, /data-admin-action="link-replacement"/);
});

test('renders early claim timing in teacher and admin records', () => {
  const { context } = createFrontendRuntime();
  const teacherMarkup = context.renderMySubGroup({
    specialGroupId: '',
    items: [{
      '代課編號': 'leave-a', '日期': '2026/09/01', '時段': '18:45',
      '實際開始時間': '18:30', '延後分鐘數': -15, '課程': 'A－空環 Lv.1',
      '原老師': '老師乙', '處理類型': '沿用原課程', '實際課程名稱': 'A－空環 Lv.1',
      '異動狀態': '', '可申請退出': true, '異動紀錄': [],
    }],
  });
  const adminMarkup = context.renderAdminObItem({
    substituteId: 'leave-a', date: '2026/09/01', time: '18:45',
    actualStartTime: '18:30', startDelayMinutes: -15,
    originalCourse: 'A－空環 Lv.1', actualCourse: 'A－空環 Lv.1',
    originalTeacher: '老師乙', substituteTeacher: '老師甲', status: '已領取',
    changeStatus: '', differenceReason: '', auditHistory: [],
  }, []);

  assert.match(teacherMarkup, /調整開始時間：18:45 → 18:30/);
  assert.match(adminMarkup, /調整開始時間：18:45 → 18:30/);
});

test('special-course draft delays the actual start while reserving every occupied slot', () => {
  const { context } = createFrontendRuntime();
  const availability = {
    'leave-a': {
      room: 'B', date: '2026/09/12', startTime: '13:30', nextCourseTime: '15:00',
      mergePartnerIds: ['leave-b'], maxDurationMinutes: 75,
    },
    'leave-b': {
      room: 'B', date: '2026/09/12', startTime: '15:00', nextCourseTime: '16:30',
      mergePartnerIds: ['leave-c'], maxDurationMinutes: 75,
    },
    'leave-c': {
      room: 'B', date: '2026/09/12', startTime: '16:30', nextCourseTime: '17:45',
      mergePartnerIds: [], maxDurationMinutes: 60,
    },
  };

  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'vacancy', substituteIds: ['leave-a', 'leave-b'], courseName: '主題課', durationMinutes: 90, note: '內容',
  }, availability), /只能勾選一堂/);
  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'merge', substituteIds: ['leave-a', 'leave-b'], courseName: '主題課', durationMinutes: 240, note: '內容',
  }, availability), /只勾選特別課開始的第一堂/);
  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'vacancy', substituteIds: ['leave-a'], courseName: '主題課', durationMinutes: 89, note: '',
  }, availability), /90 到 240 分鐘/);

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getSpecialCourseStartTimeOptions('leave-a', 90, availability))),
    ['13:30', '13:45', '14:00', '14:15', '14:30', '14:45'],
  );

  ['13:15', '13:40', '14:50'].forEach((actualStartTime) => {
    assert.throws(() => context.validateSpecialCourseDraft({
      mode: 'merge', substituteIds: ['leave-a'], actualStartTime,
      courseName: '主題課', durationMinutes: 90, note: '',
    }, availability), /實際開始時間/);
  });

  const validated = context.validateSpecialCourseDraft({
    mode: 'merge', startSlotKey: 'leave-a', actualStartTime: '14:00',
    courseName: '主題課', difficulty: '', durationMinutes: 90, note: '',
  }, availability);
  assert.deepEqual(JSON.parse(JSON.stringify(validated)), {
    mode: 'merge',
    startSlotKey: 'leave-a',
    substituteIds: [],
    actualStartTime: '14:00',
    courseName: '主題課',
    difficulty: '',
    durationMinutes: 90,
    note: '',
    slotPreview: {
      ids: ['leave-a', 'leave-b'],
      room: 'B',
      date: '2026/09/12',
      times: ['13:30', '15:00'],
      occupancyStartTime: '13:30',
      actualStartTime: '14:00',
      endTime: '15:30',
    },
  });
});

test('single-slot special course blocks a gap shorter than 90 minutes after turnover', () => {
  const { context } = createFrontendRuntime();
  const availability = {
    'leave-tight': { mergePartnerIds: ['leave-next'], maxDurationMinutes: 75 },
  };

  assert.equal(
    context.getSingleSlotSpecialCourseBlockReason(availability['leave-tight']),
    '扣除 15 分鐘換場後不足 90 分鐘，無法安排單堂特別課；請改用「使用連續時段」。',
  );
  assert.equal(context.getSingleSlotSpecialCourseBlockReason({ maxDurationMinutes: 90 }), '');
  assert.throws(() => context.validateSpecialCourseDraft({
    mode: 'vacancy', substituteIds: ['leave-tight'], courseName: '主題課', durationMinutes: 90, note: '',
  }, availability), /不足 90 分鐘.*使用連續時段/);
});

test('ordinary start delay appears only inside the adjustment panel', () => {
  const { context } = createFrontendRuntime();
  const rendered = context.renderAvailableSubstituteItem({
    '代課編號': 'leave-a',
    '日期': '2026/09/01',
    '時段': '18:30',
    '課程': 'A－空環 Lv.1',
    '原老師': '老師甲',
    '課程大類': '空環',
    '可沿用原課程': true,
  });

  assert.match(rendered, /調整課程或時間/);
  assert.match(rendered, /class="claim-control claim-start-delay"/);
  assert.match(rendered, /提早 15 分鐘/);
  assert.match(rendered, /提早 30 分鐘/);
  assert.match(rendered, /<option value="0" selected>原時段<\/option>/);
  assert.doesNotMatch(rendered, /<option value="-15" selected>/);
  assert.match(rendered, /延後 15 分鐘/);
  assert.match(rendered, /延後 30 分鐘/);
  assert.match(rendered, /value="__ORIGINAL__"/);
  assert.equal((rendered.match(/claim-start-delay/g) || []).length, 1);
  assert.ok(rendered.indexOf('claim-start-delay') > rendered.indexOf('claim-adjustment-panel'));
});

test('ordinary early-start preview allows a safe gap and blocks the previous-course turnover window', () => {
  const { context } = createFrontendRuntime();
  const target = { '代課編號': 'leave-a', '時段': '18:45', '課程': 'A－空環 Lv.1' };

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.buildOrdinaryDelayPreview(target, -15, {
      'leave-a': { previousCourseTime: '17:00', earliestStartTime: '18:15' },
    }, []))),
    {
      actualStartTime: '18:30',
      endTime: '19:30',
      nextCourseTime: '',
      occupiedSubstituteId: '',
      blocked: false,
    }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.buildOrdinaryDelayPreview(target, -15, {
      'leave-a': { previousCourseTime: '17:30', earliestStartTime: '18:45' },
    }, []))),
    {
      actualStartTime: '18:30',
      endTime: '19:30',
      nextCourseTime: '',
      occupiedSubstituteId: '',
      blocked: true,
      blockedReason: '提早時間與上一堂課衝突，請聯絡管理員。',
    }
  );
});

test('ordinary delay preview distinguishes sixty-minute and 綢吊 claims', () => {
  const { context } = createFrontendRuntime();
  const availability = {
    'leave-a': {
      startTime: '18:30', nextCourseTime: '20:00', mergePartnerIds: ['leave-b'],
    },
  };
  const pending = [{ '代課編號': 'leave-b', '時段': '20:00' }];
  const target = { '代課編號': 'leave-a', '時段': '18:30', '課程': 'A－空環 Lv.1' };

  assert.equal(context.getOrdinaryCourseDurationMinutes('A－舞綢 Lv.1'), 60);
  assert.equal(context.getOrdinaryCourseDurationMinutes('A－綢吊 Lv.1'), 90);
  assert.equal(context.buildOrdinaryDelayPreview(target, 15, availability, pending).occupiedSubstituteId, '');
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.buildOrdinaryDelayPreview(target, 30, availability, pending))),
    {
      actualStartTime: '19:00',
      endTime: '20:00',
      nextCourseTime: '20:00',
      occupiedSubstituteId: 'leave-b',
      blocked: false,
    }
  );
  assert.equal(context.buildOrdinaryDelayPreview(
    target,
    30,
    { 'leave-a': { nextCourseTime: '20:00', mergePartnerIds: [] } },
    pending
  ).blocked, true);
});

test('ordinary delayed claim marks the next course as system occupied before submit', async () => {
  const { context } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [],
      specialAvailability: {
        'leave-source': {
          startTime: '10:00', nextCourseTime: '11:15', mergePartnerIds: ['leave-next'],
        },
      },
    },
    getAvailableSubstitutes: [
      {
        '代課編號': 'leave-source', '原老師': '老師甲', '日期': '2026/09/24',
        '時段': '10:00', '課程': 'C－空環 Lv.3~4', '課程大類': '空環', '可沿用原課程': true,
      },
      {
        '代課編號': 'leave-next', '原老師': '老師乙', '日期': '2026/09/24',
        '時段': '11:15', '課程': 'C－柔軟度開發', '課程大類': '地板課程', '可沿用原課程': false,
      },
    ],
  });
  await context.fetchAvailableSubstitutes();

  const source = createOrdinaryClaimConstraintCard({
    substituteId: 'leave-source', checked: true, handling: 'existing', delay: 30,
  });
  const next = createOrdinaryClaimConstraintCard({
    substituteId: 'leave-next', checked: true, handling: 'existing', delay: 0,
  });
  const cards = [source, next];
  const dateCount = { textContent: '2 堂待領' };
  const dateGroup = {
    querySelectorAll(selector) { return selector === '.claim-checkbox' ? cards.map((item) => item.checkbox) : []; },
    querySelector(selector) { return selector === '.claim-date-count' ? dateCount : null; },
  };
  const originalQuerySelector = context.document.querySelector.bind(context.document);
  const originalQuerySelectorAll = context.document.querySelectorAll.bind(context.document);
  context.document.querySelector = (selector) => selector === 'input[name="claim-mode"]:checked'
    ? { value: 'ordinary' }
    : originalQuerySelector(selector);
  context.document.querySelectorAll = (selector) => {
    if (selector === '.claim-checkbox') return cards.map((item) => item.checkbox);
    if (selector === '.claim-checkbox:checked') return cards.map((item) => item.checkbox).filter((item) => item.checked);
    if (selector === '.claim-date-group') return [dateGroup];
    return originalQuerySelectorAll(selector);
  };

  const changeEvent = {
    target: {
      closest(selector) { return selector === '.claim-card' ? source.card : null; },
      classList: { contains() { return false; } },
    },
  };
  context.handleClaimEditorChange(changeEvent);

  assert.equal(source.checkbox.checked, true);
  assert.equal(next.checkbox.checked, false);
  assert.equal(next.checkbox.disabled, true);
  assert.equal(next.editor.hidden, true);
  assert.equal(next.warning.hidden, false);
  assert.equal(next.warning.textContent, '系統自動占用');
  assert.equal(next.classes.has('ordinary-auto-occupied'), true);
  assert.equal(dateCount.textContent, '1 堂待領');
  assert.deepEqual(JSON.parse(JSON.stringify(context.getSelectedClaimIds())), ['leave-source']);

  source.delay.value = '0';
  context.handleClaimEditorChange(changeEvent);

  assert.equal(next.checkbox.disabled, false);
  assert.equal(next.checkbox.checked, false);
  assert.equal(next.warning.hidden, true);
  assert.equal(next.classes.has('ordinary-auto-occupied'), false);
  assert.equal(dateCount.textContent, '2 堂待領');
});

test('time-only adjustment sends original handling with the selected delay', () => {
  const { context, claimCard, claimControls } = createFrontendRuntime();
  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.claim-course-type'].value = '__ORIGINAL__';
  claimControls['.claim-start-delay'].value = '30';

  assert.deepEqual(JSON.parse(JSON.stringify(context.readClaimDraft(claimCard))), {
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: '',
    note: '',
    startDelayMinutes: 30,
  });
});

test('time-only early adjustment sends negative fifteen minutes in the existing field', () => {
  const { context, claimCard, claimControls } = createFrontendRuntime();
  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.claim-course-type'].value = '__ORIGINAL__';
  claimControls['.claim-start-delay'].value = '-15';

  assert.deepEqual(JSON.parse(JSON.stringify(context.readClaimDraft(claimCard))), {
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: '',
    note: '',
    startDelayMinutes: -15,
  });
});

test('direct claim strips every editable override from the submitted draft', () => {
  const { context } = createFrontendRuntime();
  const payload = context.validateClaimDraft({
    handlingType: 'original',
    courseTypeKey: '舞綢',
    actualClassId: 'forged-class',
    actualCourseName: '偽造課程',
    category: '舞綢',
    difficulty: 'Lv.9',
    note: '不應寫入',
  }, {
    '代課編號': 'leave-a',
    '課程': '空環 Lv.1',
    '課程大類': '空環',
    '可沿用原課程': true,
  });

  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    substituteId: 'leave-a',
    handlingType: 'original',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: '',
    note: '',
    startDelayMinutes: 0,
  });
});

test('ordinary adjustment requires a course type but keeps the note optional', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '代課編號': 'leave-cross',
    '課程': '舞綢 Lv.1',
    '課程大類': '舞綢',
    '可沿用原課程': false,
  };

  assert.throws(() => context.validateClaimDraft({
    handlingType: 'original', note: '',
  }, item), /不能沿用原課程/);
  assert.throws(() => context.validateClaimDraft({
    handlingType: 'existing', courseTypeKey: '', difficulty: 'Lv.1', note: '',
  }, item), /課程類型/);
  assert.deepEqual(JSON.parse(JSON.stringify(context.validateClaimDraft({
    handlingType: 'existing', courseTypeKey: '空環', difficulty: 'Lv.1', note: '',
  }, item))), {
    substituteId: 'leave-cross',
    handlingType: 'existing',
    actualClassId: '',
    actualCourseName: '',
    category: '',
    difficulty: 'Lv.1',
    note: '',
    startDelayMinutes: 0,
    courseTypeKey: '空環',
  });
  assert.throws(() => context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '', difficulty: '', note: '改課',
  }, item), /特別課名稱/);
});

test('special-course handling requires a name while difficulty and note stay optional', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '代課編號': 'leave-special',
    '課程': '舞綢 Lv.1',
    '課程大類': '舞綢',
    '可沿用原課程': false,
  };

  assert.throws(() => context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '', difficulty: '', note: '改為特別課',
  }, item), /特別課名稱/);
  assert.deepEqual(JSON.parse(JSON.stringify(context.validateClaimDraft({
    handlingType: 'special', actualCourseName: '主題編舞', difficulty: '', note: '',
  }, item))), {
    substituteId: 'leave-special',
    handlingType: 'special',
    actualClassId: '',
    actualCourseName: '主題編舞',
    category: '其他',
    difficulty: '',
    note: '',
  });
});

test('ordinary notes stay optional even when the apparatus changes', () => {
  const { context } = createFrontendRuntime();
  const item = {
    '課程大類': '空環',
    '可沿用原課程': true,
  };

  assert.equal(context.claimNoteIsRequired(item, 'original', '空環'), false);
  assert.equal(context.claimNoteIsRequired(item, 'existing', '空環'), false);
  assert.equal(context.claimNoteIsRequired(item, 'existing', '舞綢'), false);
  assert.equal(context.claimNoteIsRequired(item, 'special', '其他'), false);
});

test('submits the OB course type and difficulty as independent choices', async () => {
  const { context, claimCard, claimControls } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['地板課程'],
      classes: [
        {
          courseKey: '肩頸舒壓瑜伽 Lv.1', courseName: '肩頸舒壓瑜伽 Lv.1',
          courseTypeKey: '肩頸舒壓瑜伽', courseTypeName: '肩頸舒壓瑜伽',
          difficulty: 'Lv.1', category: '地板課程',
        },
      ],
    },
    getAvailableSubstitutes: [],
  });
  await Promise.resolve();

  await context.fetchAvailableSubstitutes();

  assert.equal(context.findSelectedClaimClass('肩頸舒壓瑜伽', 'Lv.1').courseName, '肩頸舒壓瑜伽 Lv.1');
  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.claim-course-type'].value = '肩頸舒壓瑜伽';
  claimControls['.claim-difficulty-select'].value = 'Lv.1';
  assert.deepEqual(JSON.parse(JSON.stringify(context.readClaimDraft(claimCard))), {
    handlingType: 'existing',
    actualClassId: '',
    actualCourseName: '肩頸舒壓瑜伽 Lv.1',
    category: '地板課程',
    difficulty: 'Lv.1',
    note: '',
    startDelayMinutes: 0,
    courseKey: '肩頸舒壓瑜伽 Lv.1',
    courseTypeKey: '肩頸舒壓瑜伽',
  });
});

test('floor teachers can submit an optional-difficulty custom course name', async () => {
  const { context, claimCard, claimControls } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['地板課程'],
      classes: [{
        courseKey: '地板瑜伽', courseName: '地板瑜伽',
        courseTypeKey: '地板瑜伽', courseTypeName: '地板瑜伽', difficulty: '',
        category: '地板課程',
      }],
    },
    getAvailableSubstitutes: [],
  });
  await context.fetchAvailableSubstitutes();

  assert.deepEqual(JSON.parse(JSON.stringify(context.getClaimCourseTypes())), [
    { courseTypeKey: '地板瑜伽', courseTypeName: '地板瑜伽', difficulty: '' },
    { courseTypeKey: '__OTHER_FLOOR__', courseTypeName: '其他（自行輸入課名）', difficulty: '' },
  ]);

  claimControls['input[type="radio"]:checked'].value = 'existing';
  claimControls['.claim-course-type'].value = '__OTHER_FLOOR__';
  claimControls['.claim-custom-course-name'].value = '筋膜放鬆新主題';
  claimControls['.claim-custom-difficulty'].value = '';
  claimControls['.claim-start-delay'].value = '15';
  context.updateClaimCardState(claimCard);

  assert.equal(claimControls['.claim-custom-course-field'].hidden, false);
  assert.equal(claimControls['.claim-difficulty-field'].hidden, true);
  assert.deepEqual(JSON.parse(JSON.stringify(context.readClaimDraft(claimCard))), {
    handlingType: 'new',
    actualClassId: '',
    actualCourseName: '筋膜放鬆新主題',
    category: '地板課程',
    difficulty: '',
    note: '',
    startDelayMinutes: 15,
  });
  assert.equal(context.validateClaimDraft(context.readClaimDraft(claimCard), {
    '代課編號': 'leave-custom-floor',
    '課程': 'B－舞綢 Lv.2',
    '課程大類': '舞綢',
    '可沿用原課程': false,
  }).startDelayMinutes, 15);
});

test('non-floor teachers do not receive the custom floor course option', async () => {
  const { context } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [{
        courseKey: '空環', courseName: '空環', courseTypeKey: '空環',
        courseTypeName: '空環', difficulty: '', category: '空環',
      }],
    },
    getAvailableSubstitutes: [],
  });
  await context.fetchAvailableSubstitutes();

  assert.deepEqual(JSON.parse(JSON.stringify(context.getClaimCourseTypes())), [
    { courseTypeKey: '空環', courseTypeName: '空環', difficulty: '' },
  ]);
});

test('treats discounted and regular OB names as the same frontend course type', () => {
  const { context } = createFrontendRuntime();

  assert.deepEqual(JSON.parse(JSON.stringify(context.parseClaimCourseOption('現代小品〈優惠〉'))), {
    courseTypeKey: '現代小品', courseTypeName: '現代小品', difficulty: '',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(context.parseClaimCourseOption('A－空瑜 Lv.1-2〈優惠〉'))), {
    courseTypeKey: '空瑜', courseTypeName: '空瑜', difficulty: 'Lv.1-2',
  });
});

test('teacher claim difficulty list merges hyphen and tilde ranges into one canonical option', async () => {
  const { context } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['舞綢'],
      classes: [
        {
          courseKey: '舞綢 Lv.1-2', courseName: '舞綢 Lv.1-2',
          courseTypeKey: '舞綢', courseTypeName: '舞綢', difficulty: 'Lv.1-2', category: '舞綢',
        },
        {
          courseKey: '舞綢 Lv.1~2', courseName: '舞綢 Lv.1~2',
          courseTypeKey: '舞綢', courseTypeName: '舞綢', difficulty: 'Lv.1~2', category: '舞綢',
        },
      ],
    },
    getAvailableSubstitutes: [],
  });

  await context.fetchAvailableSubstitutes();

  assert.deepEqual(JSON.parse(JSON.stringify(context.getClaimDifficulties('舞綢'))), ['Lv.1~2']);
  assert.equal(context.findSelectedClaimClass('舞綢', 'Lv.1~2').courseName, '舞綢 Lv.1-2');
});

test('teacher claim course types exclude period courses from stale API options', async () => {
  const { context } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['空環'],
      classes: [
        {
          courseKey: '空環 Lv.3~4', courseName: '空環 Lv.3~4',
          courseTypeKey: '空環', courseTypeName: '空環', difficulty: 'Lv.3~4', category: '空環',
        },
        {
          courseKey: '空環 Lv.3 技巧訓練期班', courseName: '空環 Lv.3 技巧訓練期班',
          courseTypeKey: '空環 技巧訓練期班', courseTypeName: '空環 技巧訓練期班', difficulty: 'Lv.3', category: '空環',
        },
      ],
    },
    getAvailableSubstitutes: [],
  });

  await context.fetchAvailableSubstitutes();

  assert.deepEqual(JSON.parse(JSON.stringify(context.getClaimCourseTypes())), [
    { courseTypeKey: '空環', courseTypeName: '空環', difficulty: 'Lv.3~4' },
  ]);
  assert.equal(context.findSelectedClaimClass('空環 技巧訓練期班', 'Lv.3'), null);
});

test('renders separate course type and difficulty selectors instead of class IDs', async () => {
  const { context, getElement } = createFrontendRuntime({
    getClaimOptions: {
      capabilities: ['地板課程'],
      classes: [
        {
          courseKey: '地板瑜伽 Lv.1', courseName: '地板瑜伽 Lv.1',
          courseTypeKey: '地板瑜伽', courseTypeName: '地板瑜伽', difficulty: 'Lv.1',
          category: '地板課程',
        },
        {
          courseKey: '地板瑜伽 Lv.2', courseName: '地板瑜伽 Lv.2',
          courseTypeKey: '地板瑜伽', courseTypeName: '地板瑜伽', difficulty: 'Lv.2',
          category: '地板課程',
        },
      ],
    },
    getAvailableSubstitutes: [{
      '代課編號': 'leave-yoga',
      '日期': '2026/09/04',
      '時段': '11:00',
      '課程': '舞綢 Lv.2',
      '課程大類': '舞綢',
      '原老師': '老師甲',
      '可沿用原課程': false,
    }],
  });

  await context.fetchAvailableSubstitutes();

  const markup = getElement('pending-leaves-list').innerHTML;
  assert.match(markup, /<select class="claim-control claim-course-type">/);
  assert.match(markup, /<option value="地板瑜伽"[^>]*>地板瑜伽<\/option>/);
  assert.match(markup, /<select class="claim-control claim-difficulty-select">/);
  assert.doesNotMatch(markup, />389<\/option>/);
  assert.doesNotMatch(markup, /課程代碼/);
});

test('renders the substitute list without waiting for first-view tracking', async () => {
  const neverFinishes = new Promise(() => {});
  const { context, getElement, requestActions } = createFrontendRuntime({
    getAvailableSubstitutes: [{
      '代課編號': 'leave-fast-list',
      '日期': '2026/09/04',
      '時段': '11:00',
      '課程': 'B－舞綢 Lv.2',
      '課程大類': '舞綢',
      '原老師': '老師甲',
      '可沿用原課程': true,
    }],
    getClaimOptions: { capabilities: ['舞綢'], classes: [] },
    recordInvitationFirstView: neverFinishes,
  });

  const rendered = await Promise.race([
    context.fetchAvailableSubstitutes().then(() => true),
    new Promise((resolve) => setImmediate(() => resolve(false))),
  ]);

  assert.equal(rendered, true);
  assert.match(getElement('pending-leaves-list').innerHTML, /B－舞綢 Lv\.2/);
  assert.equal(requestActions.includes('recordInvitationFirstView'), true);
});

test('loads substitute items and claim options in one combined request', async () => {
  const { context, getElement, requestActions } = createFrontendRuntime({
    getClaimPageData: {
      items: [{
        '代課編號': 'leave-visible-before-options',
        '日期': '2026/09/04',
        '時段': '11:00',
        '課程': 'B－舞綢 Lv.2',
        '課程大類': '舞綢',
        '原老師': '老師甲',
        '可沿用原課程': true,
      }],
      options: { capabilities: ['舞綢'], classes: [] },
    },
  });

  await context.fetchAvailableSubstitutes();

  assert.match(getElement('pending-leaves-list').innerHTML, /B－舞綢 Lv\.2/);
  assert.equal(getElement('claim-submit').disabled, true);
  assert.deepEqual(
    requestActions.filter((action) => ['getClaimPageData', 'getAvailableSubstitutes', 'getClaimOptions'].includes(action)),
    ['getClaimPageData'],
  );
});

test('keeps the last leave records visible while a repeat refresh is pending', async () => {
  let fixtureReads = 0;
  let finishRefresh;
  const fixtures = {};
  Object.defineProperty(fixtures, 'getMyLeaves', {
    configurable: true,
    get() {
      fixtureReads += 1;
      if (fixtureReads === 1) {
        return [{ '代課編號': 'leave-snapshot', '日期': '2026/09/08', '時段': '10:00', '課程': 'A－空環 Lv.1' }];
      }
      return new Promise((resolve) => { finishRefresh = resolve; });
    },
  });
  const { context, getElement } = createFrontendRuntime(fixtures);

  await context.fetchMyLeaves();
  assert.match(getElement('my-leaves-list').innerHTML, /A－空環 Lv\.1/);

  const refreshing = context.fetchMyLeaves();
  await Promise.resolve();
  assert.match(getElement('my-leaves-list').innerHTML, /A－空環 Lv\.1/);
  assert.doesNotMatch(getElement('my-leaves-list').innerHTML, /查詢中/);

  finishRefresh([]);
  await refreshing;
  assert.match(getElement('my-leaves-list').innerHTML, /目前沒有請假紀錄/);
});

test('direct claim hides all fields while adjustment shows independent selectors', () => {
  const { context, claimCard, claimControls } = createFrontendRuntime();

  claimControls['input[type="radio"]:checked'].value = 'original';
  context.updateClaimCardState(claimCard);
  assert.equal(claimControls['.claim-fields'].hidden, true);
  assert.equal(claimControls['.claim-adjustment-panel'].hidden, true);

  claimControls['input[type="radio"]:checked'].value = 'existing';
  context.updateClaimCardState(claimCard);
  assert.equal(claimControls['.claim-fields'].hidden, false);
  assert.equal(claimControls['.claim-adjustment-panel'].hidden, false);
});

test('teacher records expose cancel and withdraw request actions', () => {
  assert.match(html, /callPostApi\(["']cancelLeave["']/);
  assert.match(html, /callPostApi\(["']requestLeaveCancellation["']/);
  assert.match(html, /callPostApi\(["']requestClaimWithdrawal["']/);
  assert.match(html, /申請取消/);
  assert.match(html, /申請退出代課/);
});

test('groups the two source rows of one special course without losing their IDs', () => {
  const { context } = createFrontendRuntime();
  const groups = context.groupSpecialCourseItems([
    { '代課編號': 'leave-a', 'OB Calendar ID': 'cal-a', '特別課群組 ID': 'group-1' },
    { '代課編號': 'leave-b', 'OB Calendar ID': 'cal-b', '特別課群組 ID': 'group-1' },
    { '代課編號': 'leave-c', 'OB Calendar ID': 'cal-c', '特別課群組 ID': '' },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].specialGroupId, 'group-1');
  assert.deepEqual(JSON.parse(JSON.stringify(groups[0].items.map((item) => item['代課編號']))), ['leave-a', 'leave-b']);
  assert.deepEqual(JSON.parse(JSON.stringify(groups[0].items.map((item) => item['OB Calendar ID']))), ['cal-a', 'cal-b']);
  assert.deepEqual(JSON.parse(JSON.stringify(groups[1].items.map((item) => item['代課編號']))), ['leave-c']);
  assert.match(html, /特別課群組/);
  assert.match(html, /OB Calendar ID/);
});

test('admin-only dashboard provides all work queues and required actions', () => {
  assert.match(html, /id=["']view-admin["']/);
  assert.match(html, /待邀請/);
  assert.match(html, /邀請中/);
  assert.match(html, /待處理 OB/);
  assert.match(html, /取消.*退出/);
  assert.match(html, /核對異常/);
  assert.match(html, /已完成/);
  assert.match(html, /callApi\(["']getAdminDashboard["']/);
  assert.match(html, /callPostApi\(["']openInvitations["']/);
  assert.match(html, /callPostApi\(["']closeInvitations["']/);
  assert.match(html, /callPostApi\(["']pauseClaims["']/);
  assert.match(html, /callPostApi\(["']syncObCalendar["']/);
  assert.match(html, /callPostApi\(["']reconcileObChanges["']/);
  assert.match(html, /callPostApi\(["']linkReplacementCalendarItem["']/);
  assert.match(html, /callPostApi\(["']resolveChangeRequest["']/);
  assert.match(html, /複製 LINE 邀請文字/);
});

test('admin OB work renders ordinary courses separately from special-course groups', () => {
  const { context } = createFrontendRuntime();
  const markup = context.renderAdminObSections([
    {
      substituteId: 'ordinary-1', date: '2026/09/18', time: '14:00',
      originalCourse: 'B－空環 Lv.1', originalTeacher: '老師甲', substituteTeacher: '老師乙',
      actualCourse: 'B－空環 Lv.1', status: '已領取', changeStatus: '', auditHistory: [],
    },
    {
      recordType: 'specialRequest', specialGroupId: 'special-1', date: '2026/09/20', time: '14:00',
      originalCourse: 'C－空環＋C－舞綢', originalTeacher: '老師丙', substituteTeacher: '老師丙',
      actualCourse: '空中環長帶舞碼', specialMode: '使用連續時段', specialDurationMinutes: 90,
      specialActualStartTime: '14:00', specialEndTime: '15:30', status: '待處理', changeStatus: '',
      sourceSlots: [], auditHistory: [],
    },
  ], []);

  assert.match(markup, /一般代課<\/strong><span>1 堂<\/span>/);
  assert.match(markup, /特別課群組<\/strong><span>1 組<\/span>/);
  assert.ok(markup.indexOf('一般代課') < markup.indexOf('特別課群組'));
  assert.ok(markup.indexOf('ordinary-1') < markup.indexOf('special-1'));
});

test('replacement selector only renders OB courses from the same date', () => {
  const { context } = createFrontendRuntime();
  const markup = context.renderAdminObItem({
    substituteId: 'leave-1', date: '2026/09/18', time: '14:15',
    originalCourse: 'B－空環 Lv.1', originalTeacher: '老師甲', substituteTeacher: '老師乙',
    actualCourse: 'B－空環 Lv.1', status: '已領取', changeStatus: '', auditHistory: [],
  }, [
    { calendarId: 'calendar-same-day', date: '2026/09/18', time: '14:00', courseName: 'B－空環 Lv.1', teacherName: '老師乙' },
    { calendarId: 'calendar-other-day', date: '2026/09/19', time: '14:00', courseName: 'B－空環 Lv.1', teacherName: '老師乙' },
  ]);

  assert.match(markup, /calendar-same-day/);
  assert.doesNotMatch(markup, /calendar-other-day/);
});

test('reconcile OB requires confirmation before sending and reports completion', async () => {
  const { context, getElement, requestActions } = createFrontendRuntime({
    reconcileObChanges: { checked: 4, matched: 3, exceptions: 1 },
    getAdminDashboard: {
      pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [],
      exceptions: [], completed: [], teachers: [], replacementOptions: [],
    },
  });
  let confirmations = 0;
  context.window.confirm = () => {
    confirmations += 1;
    return confirmations > 1;
  };

  const cancelled = await context.reconcileAdminObChanges();
  assert.equal(cancelled, null);
  assert.equal(requestActions.includes('reconcileObChanges'), false);

  const result = await context.reconcileAdminObChanges();
  assert.equal(result.checked, 4);
  assert.deepEqual(
    requestActions.filter((action) => action === 'reconcileObChanges' || action === 'getAdminDashboard'),
    ['reconcileObChanges', 'getAdminDashboard'],
  );
  assert.match(getElement('notice').textContent, /核對完成/);
  assert.match(getElement('notice').textContent, /一致 3 筆/);
  assert.match(getElement('notice').textContent, /異常 1 筆/);
});

test('admin cancellation history does not expose resolution actions after the request is terminal', () => {
  const { context, getElement } = createFrontendRuntime();
  context.__dashboard = {
    changeRequests: [{
      substituteId: 'cancelled-history', date: '2026/09/27', time: '17:30',
      originalCourse: 'B－空環 Lv.1~3', originalTeacher: '芮錤 77',
      substituteTeacher: '', status: '已取消', changeStatus: '已自行取消', auditHistory: [],
    }],
  };
  vm.runInContext('activeAdminTab = "changeRequests"; adminDashboard = __dashboard; renderAdminTab();', context);

  assert.match(getElement('admin-tab-content').innerHTML, /已自行取消/);
  assert.doesNotMatch(getElement('admin-tab-content').innerHTML, /data-admin-action="resolve"/);

  context.__dashboard = {
    changeRequests: [{
      substituteId: 'active-request', date: '2026/09/05', time: '18:15',
      originalCourse: 'A－舞綢 Lv.3~5', originalTeacher: 'Lily Yellow',
      substituteTeacher: 'Jina', status: '已領取', changeStatus: '申請退出中', auditHistory: [],
    }],
  };
  vm.runInContext('adminDashboard = __dashboard; renderAdminTab();', context);

  assert.match(getElement('admin-tab-content').innerHTML, /data-admin-action="resolve"/);
  assert.match(getElement('admin-tab-content').innerHTML, />核准</);
  assert.match(getElement('admin-tab-content').innerHTML, />駁回</);
});

test('approved withdrawal tells the administrator how to reopen the course', async () => {
  const { context, getElement } = createFrontendRuntime({
    resolveChangeRequest: {
      substituteId: 'withdrawal-1', requestType: 'withdrawal', decision: 'approve', status: '確認中',
    },
    getAdminDashboard: {
      pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [],
      exceptions: [], completed: [], teachers: [], replacementOptions: [],
    },
  });

  await context.resolveAdminChangeRequest('withdrawal-1', 'approve', '');

  assert.match(getElement('notice').textContent, /同步 OB 課表/);
  assert.match(getElement('notice').textContent, /重新核對 OB/);
  assert.match(getElement('notice').textContent, /重新開放/);
});

test('linked replacement course reports immediate reconciliation result', async () => {
  const { context, getElement, requestActions } = createFrontendRuntime({
    linkReplacementCalendarItem: {
      substituteId: 'leave-relinked', replacementCalendarId: 'calendar-1400',
      verificationStatus: '已核對', differences: [], actualStartTime: '14:00',
    },
    getAdminDashboard: {
      pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [],
      exceptions: [], completed: [], teachers: [], replacementOptions: [],
    },
  });

  await context.linkAdminReplacement('leave-relinked', 'calendar-1400');

  assert.deepEqual(
    requestActions.filter((action) => action === 'linkReplacementCalendarItem' || action === 'getAdminDashboard'),
    ['linkReplacementCalendarItem', 'getAdminDashboard'],
  );
  assert.match(getElement('notice').textContent, /已連結並核對完成/);
  assert.match(getElement('notice').textContent, /14:00/);
});

test('OB restore work explains the two required administrator steps', () => {
  const { context } = createFrontendRuntime();
  const rendered = context.renderAdminObItem({
    substituteId: 'withdrawal-1', date: '2026/09/05', time: '18:15',
    originalCourse: 'A－舞綢 Lv.3~5', originalTeacher: 'Lily Yellow',
    substituteTeacher: '', actualCourse: '', difficulty: '', status: '確認中',
    verificationStatus: '待回復 OB', changeStatus: '退出後待回復 OB', auditHistory: [],
  }, []);

  assert.match(rendered, /同步 OB 課表/);
  assert.match(rendered, /重新核對 OB/);
  assert.match(rendered, /Lily Yellow/);
  assert.match(rendered, /核對完成後才會重新開放/);
});

test('admin Excel export exposes one action and a pinned publishable workbook writer', () => {
  assert.match(html, /id=["']admin-export["']/);
  assert.match(html, /assets\/xlsx\.full\.min\.js/);
  assert.doesNotMatch(html, /src=["']vendor\//);
  assert.match(html, /匯出 Excel/);
});

test('admin Excel export builds capability-scoped worksheets with complete results', () => {
  const { context } = createFrontendRuntime();
  const course = {
    pendingInvitations: [{
      substituteId: 'pending-1', date: '2026/09/04', time: '11:00', originalCourse: 'B－舞綢 Lv.2',
      originalTeacher: '@N.a', substituteTeacher: '', status: '確認中', pin: '1234'
    }],
    activeInvitees: [{ teacherName: '卡拉 卡拉', openedAt: '2026-08-15 10:00', viewedAt: '' }],
    obWork: [{
      substituteId: 'claimed-1', date: '2026/09/05', time: '12:30', originalCourse: 'A－空瑜 Lv.0~2',
      originalTeacher: '芊芊', substituteTeacher: '卡拉 卡拉', actualCourse: '椅子瑜伽特別課',
      difficulty: 'Open level', status: '已領取', verificationStatus: '待核對', note: '=HYPERLINK("bad")'
    }],
    changeRequests: [{
      substituteId: 'claimed-2', date: '2026/09/06', time: '13:30', originalCourse: 'A－空環 Lv.1',
      originalTeacher: '老師甲', substituteTeacher: '老師乙', status: '已取消', changeStatus: '申請取消中'
    }],
    exceptions: [{
      substituteId: 'claimed-1', date: '2026/09/05', time: '12:30', originalCourse: 'A－空瑜 Lv.0~2',
      originalTeacher: '芊芊', substituteTeacher: '卡拉 卡拉', actualCourse: '椅子瑜伽特別課',
      status: '已領取', verificationStatus: '核對異常'
    }],
    completed: [{
      substituteId: 'claimed-3', date: '2026/09/07', time: '14:00', originalCourse: 'B－舞綢 Lv.1',
      originalTeacher: '老師丙', substituteTeacher: '老師丁', actualCourse: 'B－舞綢 Lv.1',
      status: '已領取', verificationStatus: '已核對'
    }]
  };

  const sheets = context.buildAdminExportSheets({ capabilities: ['course_admin'], course });
  const names = Array.from(sheets, (sheet) => sheet.name);
  assert.deepEqual(names, ['代課結果', '待領取', '邀請中', '待處理OB', '取消退出', '核對異常']);
  const results = sheets[0].rows;
  assert.equal(results.length, 4, 'header plus three unique claimed/completed rows');
  assert.equal(results[1][results[0].indexOf('備註')], '\'=HYPERLINK("bad")');
  assert.doesNotMatch(JSON.stringify(sheets), /1234|pin|salt|hash/i);
});

test('admin Excel export includes own-course special requests and their source slots', () => {
  const { context } = createFrontendRuntime();
  const specialRequest = {
    recordType: 'specialRequest', specialGroupId: 'special-own-1', substituteId: '',
    date: '2026/09/05', time: '12:30', originalCourse: 'A－空瑜 Lv.0~2＋A－舞綢 Lv.2',
    originalTeacher: '蜜莉 戴', substituteTeacher: '蜜莉 戴', actualCourse: '舞綢中軸特別課',
    status: '待處理', verificationStatus: '待核對', specialMode: '使用連續時段',
    specialDurationMinutes: 120, specialActualStartTime: '12:30', specialEndTime: '14:30',
    sourceSlots: [
      { sourceType: 'own', time: '12:30', courseName: 'A－空瑜 Lv.0~2' },
      { sourceType: 'leave', time: '14:00', courseName: 'A－舞綢 Lv.2' },
    ],
  };

  const sheets = context.buildAdminExportSheets({
    capabilities: ['course_admin'],
    course: { pendingInvitations: [], activeInvitees: [], obWork: [specialRequest], changeRequests: [], exceptions: [], completed: [] },
  });
  const results = sheets.find((sheet) => sheet.name === '代課結果').rows;
  assert.equal(results[1][results[0].indexOf('紀錄類型')], '特別課安排');
  assert.equal(
    results[1][results[0].indexOf('來源時段')],
    '自己的正課 12:30 A－空瑜 Lv.0~2；開放代課 14:00 A－舞綢 Lv.2'
  );
});

test('admin Excel export includes payroll and VVIP sheets only when authorized', () => {
  const { context } = createFrontendRuntime();
  const payroll = {
    month: '2026-09',
    summaries: [{
      teacherName: '卡拉 卡拉', subtotal: 5000, bonusRate: 0.1, bonusAmount: 500,
      fixedAdjustment: 0, adminAdjustment: -100, totalSalary: 5400, status: '已確認'
    }],
    lines: [{
      lineId: 'line-1', teacherName: '卡拉 卡拉', date: '2026/09/05', time: '12:30',
      courseName: '椅子瑜伽特別課', billingType: '特別課', attendanceCount: 6,
      courseIncome: 6000, ruleDetail: '固定鐘點', amount: 5000, manualAdjustment: 0, status: '已確認'
    }],
    disputes: [{ id: 'd-1', teacherName: '卡拉 卡拉', lineId: 'line-1', message: '請確認', status: '待處理' }]
  };
  const vvip = {
    month: '2026-09',
    members: [{
      email: 'member@example.com', registeredAt: '2026-08-15 10:00', date: '2026/09/08', time: '18:30',
      courseName: 'A－空瑜 Lv.1', teacherName: '老師甲', calendarId: 'cal-1', status: '已確認'
    }]
  };

  const payrollSheets = context.buildAdminExportSheets({ capabilities: ['payroll_admin'], payroll });
  assert.deepEqual(Array.from(payrollSheets, (sheet) => sheet.name), ['薪資總表', '薪資明細', '薪資異議']);
  assert.equal(payrollSheets[0].rows[1][payrollSheets[0].rows[0].indexOf('應領總額')], 5400);

  const vvipSheets = context.buildAdminExportSheets({ capabilities: ['vvip_admin'], vvip });
  assert.deepEqual(Array.from(vvipSheets, (sheet) => sheet.name), ['VVIP選課']);
  assert.equal(vvipSheets[0].rows[1][vvipSheets[0].rows[0].indexOf('Email')], 'member@example.com');
});

test('admin Excel export keeps headers when an authorized category has no rows', () => {
  const { context } = createFrontendRuntime();
  const sheets = context.buildAdminExportSheets({ capabilities: ['course_admin'], course: {} });

  assert.equal(sheets.length, 6);
  sheets.forEach((sheet) => assert.equal(sheet.rows.length, 1, `${sheet.name} should retain its header`));
});

test('admin Excel export aborts the download when any authorized source fails', async () => {
  const { context } = createFrontendRuntime({
    getAdminDashboard: {
      pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [], exceptions: [], completed: [],
    },
  }, { errorActions: ['getPayrollAdminDashboard'] });
  let downloads = 0;
  context.window.XLSX = {
    utils: {},
    writeFile() { downloads += 1; },
  };
  vm.runInContext(`
    authState.sessionToken = 'admin-session';
    authState.managementCapabilities = ['course_admin', 'payroll_admin'];
  `, context);

  await assert.rejects(context.exportAdminExcel(), /getPayrollAdminDashboard 載入失敗/);
  assert.equal(downloads, 0);
});

test('admin Excel export rows produce a readable xlsx workbook with the pinned writer', () => {
  const XLSX = require('../assets/xlsx.full.min.js');
  const { context } = createFrontendRuntime();
  const sheets = context.buildAdminExportSheets({
    capabilities: ['course_admin'],
    course: {
      pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [], exceptions: [],
      completed: [{
        substituteId: 'claimed-1', date: '2026/09/05', time: '12:30', originalCourse: 'A－空瑜 Lv.0~2',
        originalTeacher: '芊芊', substituteTeacher: '卡拉 卡拉', status: '已領取', verificationStatus: '已核對',
      }],
    },
  });
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  });

  const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });
  const reread = XLSX.read(bytes, { type: 'buffer' });
  const results = XLSX.utils.sheet_to_json(reread.Sheets['代課結果'], { header: 1 });

  assert.equal(XLSX.version, '0.20.3');
  assert.deepEqual(reread.SheetNames, ['代課結果', '待領取', '邀請中', '待處理OB', '取消退出', '核對異常']);
  assert.equal(results[1][results[0].indexOf('代課老師')], '卡拉 卡拉');
});

test('copies the detailed LINE substitute invitation with difficulty guidance', () => {
  assert.match(html, /您好，目前有新的代課可以領取，請登入 Sherry Aerial Studio 教室管理系統查看/);
  assert.match(html, /https:\/\/sherryaerial-web\.github\.io\/sub\.html\//);
  assert.match(html, /【普通代課】/);
  assert.match(html, /【安排特別課】/);
  assert.match(html, /難度／等級請使用選單，不要填在備註/);
  assert.match(html, /備註只寫其他補充事項/);
});

test('ordinary claim notes direct teachers to the separate difficulty field', () => {
  assert.match(html, /placeholder="難度請使用上方欄位；這裡只填其他補充事項"/);
  assert.doesNotMatch(html, /placeholder="可填改課原因、難度調整或其他事項"/);
});

test('groups admin pending courses chronologically by date and time', () => {
  const { context } = createFrontendRuntime();
  const groups = context.groupAdminPendingItemsByDate([
    { substituteId: 'a', date: '2026/09/05', time: '14:00', originalCourse: 'B' },
    { substituteId: 'b', date: '2026/09/04', time: '11:00' },
    { substituteId: 'c', date: '2026/09/05', time: '12:30', originalCourse: 'A' },
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(groups)), [
    {
      date: '2026/09/04',
      items: [{ substituteId: 'b', date: '2026/09/04', time: '11:00' }],
    },
    {
      date: '2026/09/05',
      items: [
        { substituteId: 'c', date: '2026/09/05', time: '12:30', originalCourse: 'A' },
        { substituteId: 'a', date: '2026/09/05', time: '14:00', originalCourse: 'B' },
      ],
    },
  ]);
});

test('renders admin pending dates collapsed with weekday and course count', () => {
  const { context } = createFrontendRuntime();
  const rendered = context.renderAdminPendingDateGroups([
    {
      substituteId: 'a', date: '2026/09/05', time: '12:30', originalCourse: 'A－空瑜 Lv.0~2',
      originalTeacher: '芊芊', substituteTeacher: '', status: '確認中', changeStatus: '', auditHistory: [],
    },
    {
      substituteId: 'b', date: '2026/09/05', time: '14:00', originalCourse: 'A－空環 Lv.2~4',
      originalTeacher: '芊芊', substituteTeacher: '', status: '確認中', changeStatus: '', auditHistory: [],
    },
  ]);

  assert.equal((rendered.match(/class="admin-date-group"/g) || []).length, 1);
  assert.match(rendered, /2026\/09\/05（六）/);
  assert.match(rendered, /2 堂/);
  assert.doesNotMatch(rendered, /<details class="admin-date-group" open>/);
  assert.ok(rendered.indexOf('12:30') < rendered.indexOf('14:00'));
});

test('admin invitation rounds keep the fixed teaching roster and invited positions', () => {
  const { context } = createFrontendRuntime();
  const roster = [
    '卡拉 卡拉', '芊芊♡', 'Tako', '@N.a🧘🏻♀️', '蜜莉 戴',
    'Liz 🌰', 'Jina', 'Ariel Lu', '珍珍', '小mo(子涵）',
    'Vicky Lee', '萱', 'Vivi', '小琪', 'Chloe Lee',
    '芮錤 77', '巧', 'Carrie🐟', '嗨底 Heidi', '壹壹',
    'wen', 'Chin', 'Melody Wang', 'Lily Yellow', '姝姝',
    '妙妙 簡', '寧寧', 'Sherry❤雪莉', 'Josty Lin', 'XUAN',
    '番茄🍅', 'Sue',
  ];
  const rounds = JSON.parse(JSON.stringify(context.buildAdminInvitationRounds(
    [...roster, '冠蓉', '狗狗 陳', 'Lydia 慕恩', '尚昀 陳', 'Angela Chuang', '新老師'],
    [{ teacherName: '卡拉 卡拉' }, { teacherName: 'Tako' }]
  )));

  assert.equal(rounds.length, 8);
  assert.equal(rounds[0].label, '第 1 輪');
  assert.deepEqual(rounds[0].teachers.map((teacher) => teacher.name), roster.slice(0, 5));
  assert.deepEqual(rounds[6].teachers.map((teacher) => teacher.name), ['番茄🍅', 'Sue']);
  assert.deepEqual(rounds[7].teachers.map((teacher) => teacher.name), ['狗狗 陳', '新老師']);
  assert.equal(rounds[7].label, '其他老師');
  assert.equal(rounds[0].teachers[0].invited, true);
  assert.equal(rounds[0].teachers[2].invited, true);
  assert.equal(rounds.flatMap((round) => round.teachers).some((teacher) => teacher.name === '冠蓉'), false);
  assert.equal(rounds.flatMap((round) => round.teachers).some((teacher) => teacher.name === '狗狗 陳'), true);
  assert.equal(rounds.flatMap((round) => round.teachers).some((teacher) => teacher.name === 'Angela Chuang'), false);
});

test('admin invitation rounds render invited teachers disabled and selectable by row', () => {
  const { context } = createFrontendRuntime();
  const rendered = context.renderAdminInvitationRounds(
    ['卡拉 卡拉', '芊芊♡', 'Tako', '@N.a🧘🏻♀️', '蜜莉 戴'],
    [{ teacherName: 'Tako' }]
  );

  assert.match(rendered, /class="teacher-round"/);
  assert.match(rendered, /第 1 輪/);
  assert.match(rendered, /data-admin-action="toggle-teacher-round"/);
  assert.match(rendered, /value="Tako" disabled/);
  assert.match(rendered, /Tako[\s\S]*邀請中/);

  const inputs = [{ checked: false }, { checked: false }];
  const button = {
    textContent: '勾選本排',
    closest() {
      return { querySelectorAll: () => inputs };
    },
  };
  context.toggleAdminTeacherRound(button);
  assert.deepEqual(inputs.map((input) => input.checked), [true, true]);
  assert.equal(button.textContent, '取消本排');
  context.toggleAdminTeacherRound(button);
  assert.deepEqual(inputs.map((input) => input.checked), [false, false]);
  assert.equal(button.textContent, '勾選本排');
});

test('pending invitation queue shows an open teacher picker before collapsed date groups', () => {
  const start = html.indexOf('activeAdminTab === "pendingInvitations"');
  const end = html.indexOf('activeAdminTab === "activeInvitees"', start);
  const pendingBlock = html.slice(start, end);

  assert.ok(start >= 0 && end > start, 'pending invitation render block should exist');
  assert.match(pendingBlock, /const pendingItems = data\.pendingInvitations \|\| \[\]/);
  assert.match(pendingBlock, /pendingItems\.length \? `/);
  assert.match(pendingBlock, /class="invite-teacher-panel"/);
  assert.match(pendingBlock, /class="invite-teacher-placeholder"/);
  assert.match(pendingBlock, /目前沒有待邀請課程/);
  assert.match(pendingBlock, /<details class="invite-teacher-panel" open>/);
  assert.doesNotMatch(pendingBlock, /matchMedia\("\(min-width: 761px\)"\)/);
  assert.match(pendingBlock, /renderAdminPendingDateGroups\(pendingItems\)/);
  assert.match(pendingBlock, /renderAdminInvitationRounds\(data\.teachers, data\.activeInvitees\)/);
  assert.ok(
    pendingBlock.indexOf('${inviteTeacherPanel}') < pendingBlock.indexOf('${pendingCourseList}'),
    'teacher picker should be rendered before the pending course list'
  );
});

test('OB-cancelled queue renders bulk-safe rows separately from pending invitations', () => {
  const { context, getElement } = createFrontendRuntime();
  context.__dashboard = {
    pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [], exceptions: [], completed: [],
    missingObCancellations: [{
      substituteId: 'leave-missing', date: '2026/09/05', time: '19:00',
      originalCourse: 'A－空環 Lv.1', originalTeacher: '老師甲', status: '確認中',
      originalCalendarId: 'cal-missing', auditHistory: [],
    }],
  };

  vm.runInContext('activeAdminTab = "missingObCancellations"; adminDashboard = __dashboard; renderAdminTab();', context);

  const rendered = getElement('admin-tab-content').innerHTML;
  assert.match(rendered, /已從 OB 取消/);
  assert.match(rendered, /value="leave-missing"/);
  assert.match(rendered, /data-admin-action="select-all-ob-cancellations"/);
  assert.match(rendered, /data-admin-action="close-ob-cancellations"/);
  assert.match(html, /longRunningActions\.has\(action\) \? 180000 : 45000/);
  assert.match(html, /"executeNextDayClosures"/);
  assert.match(html, /"closeUnclaimedSubstituteCourses"/);
  assert.match(html, /button\.setAttribute\("aria-busy", "true"\)/);
  assert.match(html, /await closeSelectedMissingObCancellations\(button\);\s*return;/);
});

test('course admin can end every active invitation from one guarded action', async () => {
  const dashboardAfterEnd = {
    pendingInvitations: [], activeInvitees: [], obWork: [], changeRequests: [], exceptions: [], completed: [],
    missingObCancellations: [], teachers: [], replacementOptions: [], paused: false,
  };
  const { context, getElement, requestActions } = createFrontendRuntime({
    endInvitationRound: { closedInvitations: 2, closedTeachers: 2 },
    getAdminDashboard: dashboardAfterEnd,
  });
  context.__dashboard = {
    ...dashboardAfterEnd,
    activeInvitees: [
      { teacherName: '老師甲', openedAt: '2026-08-20 09:00:00' },
      { teacherName: '老師乙', openedAt: '2026-08-20 09:00:00' },
    ],
  };
  vm.runInContext('activeAdminTab = "activeInvitees"; adminDashboard = __dashboard; renderAdminTab();', context);
  assert.match(getElement('admin-tab-content').innerHTML, /結束本輪邀請/);

  context.window.confirm = () => true;
  let finishEndRequest;
  const endRequest = new Promise((resolve) => { finishEndRequest = resolve; });
  context.callPostApi = (action) => {
    requestActions.push(action);
    if (action === 'endInvitationRound') return endRequest;
    return Promise.resolve(dashboardAfterEnd);
  };
  const button = {
    innerHTML: '<i data-lucide="circle-stop"></i>結束本輪邀請',
    dataset: {},
    disabled: false,
    isConnected: true,
  };
  const ending = context.endAdminInvitationRound(button);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(button.disabled, true);

  finishEndRequest({ closedInvitations: 2, closedTeachers: 2 });
  await ending;

  assert.ok(requestActions.includes('endInvitationRound'));
  assert.match(getElement('notice').textContent, /已結束本輪邀請/);
  assert.equal(button.disabled, false);
});

test('payroll admin can adjust salaries and finalize teacher-confirmed results', () => {
  assert.match(html, /callPostApi\(["']adjustPayrollSummary["']/);
  assert.match(html, /callPostApi\(["']finalizePayroll["']/);
  assert.match(html, /調整薪資/);
  assert.match(html, /管理員確認/);
  assert.match(html, /確認全部已核對/);
  assert.match(html, /管理員已確認/);
  assert.match(html, /\.payroll-admin-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(html, /data\.metrics\.teacherConfirmed\s*\|\|\s*0/);
  assert.match(html, /data\.metrics\.finalized\s*\|\|\s*0/);
});

test('course admin can pause leave registration separately from substitute claims', () => {
  assert.match(html, /callPostApi\(["']pauseLeaves["']/);
  const adminHeaderStart = html.indexOf('id="view-admin"');
  const adminHeaderEnd = html.indexOf('class="admin-workspace"', adminHeaderStart);
  const adminHeader = html.slice(adminHeaderStart, adminHeaderEnd);

  assert.match(adminHeader, /id=["']admin-leave-pause["']/);
  assert.match(html, /byId\(["']admin-leave-pause["']\)\.addEventListener\(["']click["']/);
  assert.match(adminHeader, /class=["']admin-command-actions["']/);
  assert.match(html, /\.admin-command-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(html, /暫停請假登記/);
});

test('OB sync button shows progress and keeps the completed row count visible', () => {
  assert.match(html, /id=["']admin-sync-status["'][^>]*aria-live=["']polite["']/);
  assert.match(html, /adminSyncButton\.disabled\s*=\s*true/);
  assert.match(html, /同步中/);
  assert.match(html, /已同步\s*\$\{result\.count\}\s*筆/);
  assert.match(html, /同步失敗/);
  assert.match(html, /finally\s*\{[^}]*adminSyncButton\.disabled\s*=\s*false/s);
});

test('admin can refresh the active dashboard without reloading or losing login state', () => {
  assert.match(html, /id=["']admin-refresh["']/);
  assert.match(html, /function\s+refreshAdminData\s*\(/);
  assert.match(html, /byId\(["']admin-refresh["']\)\.addEventListener\(["']click["']/);
  assert.doesNotMatch(html, /window\.location\.reload\s*\(/);
});

test('VVIP admin renders selection results before whitelist maintenance', () => {
  const { context, getElement } = createFrontendRuntime();
  context.__vvipDashboardFixture = {
    month: '2026-09',
    isOpen: true,
    metrics: { members: 1, activeSelections: 1 },
    members: [{
      email: 'member@example.com', memberName: '會員甲', status: '已確認',
      date: '2026/09/05', time: '19:45', courseName: '折疊環特別課',
      teacherName: 'Sherry', calendarId: 'cal-1', recordKey: 'record-1',
    }],
    courseView: [{
      date: '2026/09/05', time: '19:45', courseName: '折疊環特別課',
      teacherName: 'Sherry', registrants: [{ name: '會員甲', email: 'member@example.com' }],
    }],
    whitelist: [{ id: 'vvip-1', name: '會員甲', email: 'member@example.com', active: true }],
  };

  vm.runInContext('vvipDashboard = __vvipDashboardFixture; renderVvipAdminTab();', context);

  const rendered = getElement('admin-tab-content').innerHTML;
  assert.ok(rendered.indexOf('依課程查看') < rendered.indexOf('會員登記'));
  assert.ok(rendered.indexOf('會員登記') < rendered.indexOf('新增 VVIP 名單'));
  assert.ok(rendered.indexOf('新增 VVIP 名單') < rendered.indexOf('data-admin-action="toggle-vvip-member"'));
});

test('opening VVIP selection sends the administrator-selected cutoff time', async () => {
  const { context, getElement, submittedForms } = createFrontendRuntime({
    setVvipSelectionOpen: { month: '2026-09', isOpen: true },
    getVvipAdminDashboard: {
      month: '2026-09', isOpen: true, closeAt: '2026-08-24 20:00:00',
      metrics: { members: 0, activeSelections: 0, pendingSelections: 0 },
      members: [], courseView: [], whitelist: [],
    },
  });
  getElement('vvip-close-at').value = '2026-08-24T20:00';

  await context.setVvipSelectionOpen(true);

  const request = submittedForms.find((item) => item.fields.action === 'setVvipSelectionOpen');
  assert.equal(request.fields.closeAt, '2026-08-24T20:00');
});

test('management reminders expose only queues authorized for the logged-in administrator', () => {
  const { context } = createFrontendRuntime();
  vm.runInContext(`
    adminDashboard = { obWork: [{}, {}], changeRequests: [{}], missingObCancellations: [] };
    vvipDashboard = { metrics: { pendingSelections: 3 } };
    authState.managementCapabilities = ['course_admin'];
  `, context);
  const takoItems = JSON.parse(JSON.stringify(context.buildAdminReminderItems()));
  assert.deepEqual(takoItems.map((item) => item.label), ['待處理 OB', '待處理異動']);

  vm.runInContext("authState.managementCapabilities = ['course_admin', 'vvip_admin'];", context);
  const crownItems = JSON.parse(JSON.stringify(context.buildAdminReminderItems()));
  assert.deepEqual(crownItems.map((item) => item.label), ['待處理 OB', '待處理異動', 'VVIP 待確認']);
  assert.equal(crownItems[2].count, 3);
});

test('management header renders each pending queue once without a duplicate summary grid', () => {
  const { context, getElement } = createFrontendRuntime();
  vm.runInContext(`
    adminDashboard = {
      teachers: [], pendingInvitations: [], activeInvitees: [],
      obWork: [], changeRequests: [], missingObCancellations: [{ substituteId: 'missing-1' }],
      delayClosures: [], exceptions: [], completed: []
    };
    authState.managementCapabilities = ['course_admin'];
    renderAdminDashboard();
  `, context);

  const headerHtml = `${getElement('admin-reminders').innerHTML}${getElement('admin-summary').innerHTML}`;
  assert.equal((headerHtml.match(/OB 已取消待關閉/g) || []).length, 1);
  assert.equal(getElement('admin-summary').innerHTML, '');
});

test('persists and validates the authenticated session for every user device', () => {
  assert.match(html, /const\s+AUTH_SESSION_KEY\s*=/);
  assert.match(html, /function\s+saveSession\s*\(/);
  assert.match(html, /function\s+readSavedSession\s*\(/);
  assert.match(html, /function\s+clearSavedSession\s*\(/);
  assert.match(html, /callPostApi\(["']getSession["']/);
  assert.match(html, /window\.localStorage\.removeItem\(AUTH_SESSION_KEY\)/);
});

test('cold app start keeps the saved login when session validation only has a connection failure', async () => {
  const storage = new Map([
    ['sherry-substitute-auth-session', JSON.stringify({
      sessionToken: 'saved-session-token',
      teacherName: 'Ariel Lu',
      role: '老師',
      managementCapabilities: [],
    })],
  ]);
  const localStorage = {
    getItem(key) { return storage.get(key) || ''; },
    setItem(key, value) { storage.set(key, value); },
    removeItem(key) { storage.delete(key); },
  };
  const { getElement, requestActions } = createFrontendRuntime(
    { getTeachers: [{ '指導者': 'Ariel Lu' }] },
    {
      localStorage,
      errorActions: ['getSession'],
      errorMessages: { getSession: '系統連線逾時，請重新整理後再試一次。' },
    },
  );

  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(requestActions.includes('getSession'));
  assert.ok(storage.has('sherry-substitute-auth-session'));
  assert.equal(getElement('app-shell').hidden, false);
  assert.equal(getElement('auth-shell').hidden, true);
});

test('cold app start still clears a session that the backend explicitly reports as expired', async () => {
  const storage = new Map([
    ['sherry-substitute-auth-session', JSON.stringify({
      sessionToken: 'expired-session-token',
      teacherName: 'Ariel Lu',
      role: '老師',
      managementCapabilities: [],
    })],
  ]);
  const localStorage = {
    getItem(key) { return storage.get(key) || ''; },
    setItem(key, value) { storage.set(key, value); },
    removeItem(key) { storage.delete(key); },
  };
  const { getElement } = createFrontendRuntime(
    { getTeachers: [{ '指導者': 'Ariel Lu' }] },
    {
      localStorage,
      errorActions: ['getSession'],
      errorMessages: { getSession: '登入狀態已逾期，請重新登入。' },
    },
  );

  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(storage.has('sherry-substitute-auth-session'), false);
  assert.equal(getElement('app-shell').hidden, true);
  assert.equal(getElement('auth-shell').hidden, false);
});

test('management entry stays hidden without capabilities and is enabled by authenticated capabilities', () => {
  assert.match(html, /id=["']admin-entry["'][^>]*hidden/);
  assert.match(html, /managementCapabilities/);
  assert.match(html, /admin-entry["']\)\.hidden\s*=\s*!authState\.managementCapabilities\.length/);
  assert.doesNotMatch(html, /viewId\s*===\s*["']view-admin["']\s*&&\s*authState\.role\s*!==\s*["']管理員["']/);
});

test('uses the approved Morandi taupe operations design system', () => {
  assert.match(html, /--sea-700:\s*#786c64/i);
  assert.match(html, /--aqua-100:\s*#eee0dc/i);
  assert.match(html, /--coral-600:\s*#8f5f68/i);
  assert.match(html, /--shadow-sm:/);
  assert.match(html, /\.app-layout\s*\{/);
  assert.match(html, /\.workspace\s*\{/);
  assert.match(html, /max-width:\s*1180px/);
});

test('uses lucide icons and accessible icon controls throughout navigation', () => {
  assert.match(html, /unpkg\.com\/lucide/);
  assert.match(html, /class=["'][^"']*primary-nav[^"']*["']/);
  assert.match(html, /data-lucide=["']layout-dashboard["']/);
  assert.match(html, /data-lucide=["']log-out["']/);
  assert.match(html, /id=["']logout-button["'][^>]*aria-label=["']登出["']/);
  assert.match(html, /function\s+refreshIcons\s*\(/);
});

test('keeps the twelve capability-scoped admin tabs accessible and exposes their queue counts', () => {
  assert.equal((html.match(/role=["']tab["']/g) || []).length, 12);
  assert.match(html, /aria-selected=["']true["']/);
  assert.match(html, /class=["']admin-tab-count["']/);
  assert.match(html, /data-capability=["']course_admin["']/);
  assert.match(html, /data-capability=["']payroll_admin["']/);
  assert.match(html, /data-capability=["']vvip_admin["']/);
  assert.match(html, /updateAdminTabCounts/);
});

test('admin can correct claimed difficulty and note without asking the teacher to withdraw', () => {
  assert.match(html, /data-admin-tab=["']delayClosures["']/);
  assert.match(html, /data-admin-action=["']correct-claim["']/);
  assert.match(html, /id=["']request-difficulty["']/);
  assert.match(html, /callPostApi\(["']correctClaimDetails["']/);
  assert.match(html, /重新列入 OB 待核對/);
});

test('provides self-only payroll review and protected sync publish dispute controls', () => {
  assert.match(html, /data-view=["']view-payroll["']/);
  assert.match(html, /getMyPayroll/);
  assert.match(html, /confirmPayroll/);
  assert.match(html, /submitPayrollDispute/);
  assert.match(html, /getPayrollAdminDashboard/);
  assert.match(html, /syncPayrollMonth/);
  assert.match(html, /publishPayroll/);
  assert.match(html, /resolvePayrollDispute/);
});

test('admin queue rendering does not leak Array.map indexes into cards', () => {
  assert.doesNotMatch(html, /\.map\(renderAdminItem\)/);
  assert.match(html, /rows\.map\(\(row\)\s*=>\s*renderRow\(row\)\)/);
});

test('optimizes login and navigation for the supplied four-digit PIN workflow', () => {
  assert.match(html, /id=["']login-pin["'][^>]*maxlength=["']4["']/s);
  assert.match(html, /id=["']login-pin["'][^>]*pattern=["']\[0-9\]\{4\}["']/s);
  assert.match(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.primary-nav\s*\{[\s\S]*position:\s*static/);
  assert.doesNotMatch(html, /@media\s*\(max-width:\s*760px\)[\s\S]*\.primary-nav\s*\{[\s\S]*position:\s*fixed[\s\S]*bottom:\s*0/);
});

test('admin workspace exposes independent next-day and whole-month course closure controls', () => {
  assert.match(html, /data-admin-tab=["']closureManagement["']/);
  assert.match(html, /22:30.*0 人/s);
  assert.match(html, /23:40.*雙人/s);
  assert.match(html, /data-admin-action=["']toggle-course-closure-automation["']/);
  assert.match(html, /data-admin-action=["']execute-next-day-closure["']/);
  assert.match(html, /data-admin-action=["']close-unclaimed-substitutes["']/);
  assert.match(html, /整月未領代課/);
  assert.match(html, /場地租借／場租不納入關課/);
  assert.match(html, /item\.actor/);
});

test('closure manager renders an editable one-short community message with one-tap copy', async () => {
  const dashboard = {
    teachers: [], pendingInvitations: [], activeInvitees: [], missingObCancellations: [],
    obWork: [], delayClosures: [], changeRequests: [], exceptions: [], completed: [],
    courseClosure: {
      targetDate: '2026/09/01', triggerCount: 1, automatic: true,
      manualStageAvailability: { '22:30': true, '23:40': false },
      unclaimedCandidates: [], recentLogs: [],
      socialCopy: {
        content: '明12:00劍潭蕃茄柔軟度開發\n各缺一，等到23:40',
        updatedAt: '2026-08-31 22:30:00',
      },
    },
  };
  const { context, getElement } = createFrontendRuntime();
  vm.runInContext('authState.teacherName = "冠蓉"; authState.managementCapabilities = ["course_admin"];', context);
  context.__dashboard = dashboard;
  vm.runInContext('activeAdminTab = "closureManagement"; adminDashboard = __dashboard; renderAdminTab();', context);

  assert.match(getElement('admin-tab-content').innerHTML, /id="closure-social-copy"/);
  assert.match(getElement('admin-tab-content').innerHTML, /明12:00劍潭蕃茄柔軟度開發/);
  assert.match(getElement('admin-tab-content').innerHTML, /data-admin-action="copy-closure-social"/);
});

test('notification deep links route to the requested teacher or authorized admin page', () => {
  const { context } = createFrontendRuntime();

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getInitialAppRoute('?view=claim'))),
    { viewId: 'view-claim', adminTab: '' },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getInitialAppRoute('?view=admin&tab=closureManagement'))),
    { viewId: 'view-admin', adminTab: 'closureManagement' },
  );
});

test('course closure controls explain unavailable manual stages without calling the API', () => {
  assert.match(html, /manualStageAvailability/);
  assert.match(html, /data-stage="22:30"[^>]*aria-disabled="\$\{stage2230Available \? "false" : "true"\}"/);
  assert.match(html, /data-stage="23:40"[^>]*aria-disabled="\$\{stage2340Available \? "false" : "true"\}"/);
  assert.match(html, /if \(button\.getAttribute\("aria-disabled"\) === "true"\)[\s\S]*setNotice\(`\$\{stage\} 檢核尚未開放，請於今日 \$\{stage\} 後再執行。`, "error"\)[\s\S]*return/);
  assert.doesNotMatch(html, /data-stage="22:30"[^>]*\? "" : "disabled"/);
  assert.doesNotMatch(html, /data-stage="23:40"[^>]*\? "" : "disabled"/);
  assert.match(html, /先前已取消 \$\{result\.alreadyProcessedCount \|\| 0\} 堂/);
});
