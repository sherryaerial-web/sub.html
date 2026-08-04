const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function createFrontendRuntime(fixtures = {}) {
  const elements = new Map();
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
        classList: { add() {}, remove() {}, toggle() {} },
      });
    }
    return elements.get(id);
  };
  const checkedClaim = { dataset: { substituteId: 'leave-c' }, checked: true };
  const noteInput = { value: '', dataset: { required: 'false' }, focus() {} };
  const document = {
    getElementById: getElement,
    querySelectorAll(selector) {
      if (selector === '.claim-checkbox:checked') return [checkedClaim];
      return [];
    },
    querySelector(selector) {
      if (selector.startsWith('[data-note-for=')) return noteInput;
      return null;
    },
  };
  const responseFor = (url, request = {}) => {
    const isPost = request.method === 'POST';
    const action = isPost
      ? new URLSearchParams(request.body || '').get('action')
      : new URL(url).searchParams.get('action');
    const data = isPost ? { count: 1 } : (fixtures[action] || []);
    const payload = { status: 'success', data };
    return Promise.resolve({ ok: true, status: 200, json: async () => payload, url });
  };
  const context = {
    console,
    document,
    fetch: responseFor,
    URLSearchParams,
    CSS: { escape: (value) => String(value) },
    window: {
      localStorage: { getItem() { return ''; }, setItem() {} },
      scrollTo() {},
      setTimeout() {},
    },
  };
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.createContext(context);
  vm.runInContext(script, context, { filename: 'index.html' });
  return { context, elements, getElement };
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

test('submits claims by UUID with per-course change notes', () => {
  assert.match(html, /代課編號/);
  assert.match(html, /substituteId/);
  assert.match(html, /changeNote/);
  assert.match(html, /改成什麼課/);
  assert.match(html, /change-note-input/);
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

test('provides teacher login and sends credentials through form-encoded POST', () => {
  assert.match(html, /id=["']login-form["']/);
  assert.match(html, /id=["']login-teacher["']/);
  assert.match(html, /id=["']login-pin["']/);
  assert.match(html, /callPostApi\(["']login["']/);
  assert.match(html, /application\/x-www-form-urlencoded/);
  assert.match(html, /method:\s*["']POST["']/);
});

test('implements date-first leave selection with select-all-visible and clear controls', () => {
  assert.match(html, /id=["']leave-date-list["']/);
  assert.match(html, /id=["']select-all-visible-dates["']/);
  assert.match(html, /id=["']clear-leave-dates["']/);
  assert.match(html, /selectedLeaveDates/);
  assert.match(html, /renderLeaveDates/);
  assert.match(html, /renderLeaveCourses/);
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

test('renders personal leave history details for the logged-in teacher', () => {
  assert.match(html, /我的請假紀錄/);
  assert.match(html, /callApi\(["']getMyLeaves["']/);
  assert.match(html, /實際課程名稱/);
  assert.match(html, /預計難度/);
  assert.match(html, /OB 核對狀態/);
  assert.match(html, /異動狀態/);
});

test('loads substitutes through the invited-only API and claims through the locked POST action', () => {
  assert.match(html, /callApi\(["']getAvailableSubstitutes["']/);
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

test('removes claimed courses immediately and refreshes after a concurrent conflict', () => {
  assert.match(html, /claimedIds/);
  assert.match(html, /pendingLeaves\s*=\s*pendingLeaves\.filter/);
  assert.match(html, /剛被其他老師領取/);
  assert.match(html, /await fetchAvailableSubstitutes\(\)/);
});

test('keeps the claim button disabled after the final available course is claimed', async () => {
  const { context, getElement } = createFrontendRuntime();
  await Promise.resolve();

  await context.submitClaim();

  assert.equal(getElement('claim-submit').disabled, true);
});

test('loads the teacher courses before deciding whether a substitute note is required', async () => {
  const { context, getElement } = createFrontendRuntime({
    getMyCourses: [{
      '日期': '2026/08/01',
      '時間': '09:00',
      '課程': '空環 Lv.1',
      '課程大類': '空環',
      'OB Calendar ID': 'calendar-a',
    }],
    getAvailableSubstitutes: [{
      '代課編號': 'leave-b',
      '原老師': '老師乙',
      '日期': '2026/08/10',
      '時段': '18:30',
      '課程': '空環 Lv.2',
      '課程大類': '空環',
    }],
  });
  await Promise.resolve();

  await context.fetchAvailableSubstitutes();

  assert.match(getElement('pending-leaves-list').innerHTML, /難度或其他備註（選填）/);
  assert.doesNotMatch(getElement('pending-leaves-list').innerHTML, /改成什麼課（必填）/);
});
