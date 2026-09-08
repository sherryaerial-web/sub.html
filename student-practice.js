(function(global) {
  'use strict';

  var APP_URL = 'https://script.google.com/macros/s/AKfycbyJADHe_DZdNIbfv_KPewAcBekEond-5Fw63i-RWCd1mHl_O9uGAQ-LTnzENZshjnhe/exec';
  var STORAGE_KEY = 'sherry_student_practice_token_v2';

  function buildSlotCards(data) {
    var date = String(data && data.date || '');
    var cards = [];
    (data && data.rooms || []).forEach(function(roomValue) {
      var room = String(roomValue && roomValue.room || '');
      (roomValue && roomValue.slots || []).forEach(function(slot) {
        var type = slot.type === 'shared' ? 'shared' : 'empty';
        cards.push({
          key: room + '|' + slot.startTime + '|' + type,
          room: room,
          type: type,
          time: slot.startTime + '–' + slot.endTime,
          title: type === 'shared'
            ? '已有學生自主練習，可登記一起使用'
            : '空教室，可選擇練習時長',
          durations: (slot.durations || []).map(Number),
          groupId: type === 'shared' ? String(slot.groupId || '') : '',
          date: date,
          startTime: String(slot.startTime || ''),
          endTime: String(slot.endTime || '')
        });
      });
    });
    return cards;
  }

  function buildSubmissionPayload(slot, durationValue, identity, noteValue) {
    var payload = {
      studentToken: String(identity && identity.studentToken || ''),
      note: String(noteValue || '').trim()
    };
    if (!payload.studentToken) {
      payload.appName = String(identity && identity.appName || '').trim();
      payload.email = String(identity && identity.email || '').trim();
    }
    if (slot.type === 'shared') {
      payload.groupId = String(slot.groupId || '');
      return payload;
    }
    payload.date = String(slot.date || '');
    payload.room = String(slot.room || '');
    payload.startTime = String(slot.selectedStartTime || slot.startTime || '');
    payload.durationMinutes = Number(durationValue);
    return payload;
  }

  function buildBookingFormState(card) {
    var shared = card && card.type === 'shared';
    return {
      title: shared ? '登記一起使用' : '登記自主練習',
      startFieldHidden: false,
      startDisabled: shared,
      startOptions: shared ? [String(card.startTime || '')].filter(Boolean) : [],
      durationFieldHidden: shared
    };
  }

  global.StudentPracticePage = {
    buildSlotCards: buildSlotCards,
    buildSubmissionPayload: buildSubmissionPayload,
    buildBookingFormState: buildBookingFormState
  };

  if (!global.document) return;
  var document = global.document;
  var state = { date: '', room: 'A', data: null, cards: [], selected: null };
  var byId = function(id) { return document.getElementById(id); };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalizeDateInput(date) {
    return String(date || '').replace(/\//g, '-');
  }

  function showNotice(message, type) {
    var notice = byId('notice');
    notice.textContent = message || '';
    notice.className = 'notice ' + (message ? 'visible ' + (type || '') : '');
  }

  async function callApi(action, params, method) {
    if (method === 'GET') {
      var url = new URL(APP_URL);
      url.searchParams.set('action', action);
      Object.keys(params || {}).forEach(function(key) { url.searchParams.set(key, params[key]); });
      var getResponse = await fetch(url.toString(), { cache: 'no-store', redirect: 'follow' });
      if (!getResponse.ok) throw new Error('連線失敗（HTTP ' + getResponse.status + '）');
      var getPayload = await getResponse.json();
      if (!getPayload || getPayload.status !== 'success') throw new Error(getPayload && getPayload.message || '讀取失敗。');
      return getPayload.data;
    }
    var body = new URLSearchParams({ action: action });
    Object.keys(params || {}).forEach(function(key) {
      body.set(key, typeof params[key] === 'string' ? params[key] : JSON.stringify(params[key]));
    });
    var response = await fetch(APP_URL, {
      method: 'POST', redirect: 'follow', cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString()
    });
    if (!response.ok) throw new Error('連線失敗（HTTP ' + response.status + '）');
    var payload = await response.json();
    if (!payload || payload.status !== 'success') throw new Error(payload && payload.message || '送出失敗。');
    return payload.data;
  }

  function renderRooms() {
    byId('rooms').innerHTML = ['A', 'B', 'C', 'D'].map(function(room) {
      var count = state.cards.filter(function(card) { return card.room === room; }).length;
      return '<button type="button" class="room-tab ' + (room === state.room ? 'active' : '') +
        '" data-room="' + room + '"><b>' + room + '</b><span>' + count + ' 個時段</span></button>';
    }).join('');
  }

  function renderSlots() {
    var slots = state.cards.filter(function(card) { return card.room === state.room; });
    var container = byId('slots');
    if (!slots.length) {
      container.innerHTML = '<div class="empty-state"><b>這天目前沒有可登記時段</b><span>請換一天或其他教室看看。</span></div>';
      return;
    }
    container.innerHTML = slots.map(function(card) {
      var durations = card.type === 'shared'
        ? '使用原時段'
        : card.durations.map(function(minutes) { return minutes + ' 分'; }).join(' · ');
      return '<button type="button" class="slot-card ' + card.type + '" data-slot-key="' + escapeHtml(card.key) + '">' +
        '<span class="slot-time">' + escapeHtml(card.time) + '</span>' +
        '<strong>' + escapeHtml(card.title) + '</strong>' +
        '<span class="slot-meta">' + escapeHtml(durations) + '</span>' +
        '<span class="slot-action">' + (card.type === 'shared' ? '加入使用' : '選擇這個空檔') + ' <i>›</i></span></button>';
    }).join('');
  }

  function render() {
    renderRooms();
    renderSlots();
  }

  async function loadAvailability() {
    showNotice('正在更新可登記時段…', 'loading');
    byId('slots').innerHTML = '<div class="loading-card"></div><div class="loading-card"></div>';
    try {
      state.data = await callApi('getStudentPracticeAvailability', { date: state.date }, 'GET');
      state.cards = buildSlotCards(state.data);
      showNotice('', '');
      render();
    } catch (error) {
      state.cards = [];
      render();
      showNotice(error.message || '暫時無法讀取空檔，請稍後再試。', 'error');
    }
  }

  function buildStartOptions(card, duration) {
    var start = Number(card.startTime.slice(0, 2)) * 60 + Number(card.startTime.slice(3));
    var end = Number(card.endTime.slice(0, 2)) * 60 + Number(card.endTime.slice(3));
    var values = [];
    for (var minute = start; minute + duration <= end; minute += 5) {
      values.push(String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0'));
    }
    return values;
  }

  function syncStartOptions() {
    var card = state.selected;
    if (!card || card.type === 'shared') return;
    var duration = Number(byId('duration').value);
    var options = buildStartOptions(card, duration);
    var select = byId('start-time');
    select.innerHTML = options.map(function(value) { return '<option>' + value + '</option>'; }).join('');
    select.value = options[0] || '';
  }

  function openBooking(card) {
    state.selected = card;
    var formState = buildBookingFormState(card);
    byId('dialog-title').textContent = formState.title;
    byId('dialog-summary').textContent = normalizeDateInput(card.date).replace(/-/g, '/') + ' · ' + card.room + ' 教室 · ' + card.time;
    byId('duration-field').hidden = formState.durationFieldHidden;
    byId('start-field').hidden = formState.startFieldHidden;
    byId('start-time').disabled = formState.startDisabled;
    byId('duration').innerHTML = card.durations.map(function(value) {
      return '<option value="' + value + '">' + value + ' 分鐘</option>';
    }).join('');
    byId('duration').value = String(card.durations[0] || 60);
    if (formState.startOptions.length) {
      byId('start-time').innerHTML = formState.startOptions.map(function(value) {
        return '<option value="' + value + '">' + value + '</option>';
      }).join('');
      byId('start-time').value = formState.startOptions[0];
    } else {
      syncStartOptions();
    }
    var hasToken = !!localStorage.getItem(STORAGE_KEY);
    byId('identity-fields').hidden = hasToken;
    byId('app-name').required = !hasToken;
    byId('app-email').required = !hasToken;
    byId('booking-dialog').showModal();
  }

  async function submitBooking(event) {
    event.preventDefault();
    var button = byId('submit-booking');
    button.disabled = true;
    button.textContent = '送出中…';
    showNotice('', '');
    try {
      var card = Object.assign({}, state.selected, { selectedStartTime: byId('start-time').value });
      var payload = buildSubmissionPayload(card, byId('duration').value, {
        studentToken: localStorage.getItem(STORAGE_KEY) || '',
        appName: byId('app-name').value,
        email: byId('app-email').value
      }, byId('student-note').value);
      var result = await callApi('submitStudentPractice', { practice: payload }, 'POST');
      if (result.studentToken) localStorage.setItem(STORAGE_KEY, result.studentToken);
      byId('booking-dialog').close();
      byId('success-title').textContent = result.status === '已成立' ? '登記已成立' : '申請已收到';
      byId('success-copy').textContent = result.status === '已成立'
        ? '已完成登記。如需取消或換時間，請在開始前 2 小時聯繫官方 LINE。'
        : '目前待老師確認資格，尚未成立，請勿重複送出。';
      byId('success-dialog').showModal();
      await loadAvailability();
    } catch (error) {
      showNotice(error.message || '送出失敗，請稍後再試。', 'error');
    } finally {
      button.disabled = false;
      button.textContent = '確認送出';
    }
  }

  function init() {
    var today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    state.date = today.replace(/-/g, '/');
    byId('practice-date').value = today;
    byId('practice-date').min = today;
    byId('practice-date').addEventListener('change', function(event) {
      state.date = event.target.value.replace(/-/g, '/');
      loadAvailability();
    });
    byId('rooms').addEventListener('click', function(event) {
      var button = event.target.closest('[data-room]');
      if (!button) return;
      state.room = button.dataset.room;
      render();
    });
    byId('slots').addEventListener('click', function(event) {
      var button = event.target.closest('[data-slot-key]');
      if (!button) return;
      var card = state.cards.find(function(item) { return item.key === button.dataset.slotKey; });
      if (card) openBooking(card);
    });
    byId('duration').addEventListener('change', syncStartOptions);
    byId('booking-form').addEventListener('submit', submitBooking);
    byId('close-booking').addEventListener('click', function() { byId('booking-dialog').close(); });
    byId('close-success').addEventListener('click', function() { byId('success-dialog').close(); });
    loadAvailability();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : this);
