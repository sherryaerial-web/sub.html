export function bootWorkspaceFixture(capabilities = ['course_admin', 'payroll_admin', 'invoice_admin', 'vvip_admin', 'raffle_admin']) {
  window.offlineReads = [];
  window.offlineWrites = [];
  const status = { source: 'course_snapshot', status: 'snapshot', lastSuccessAt: '2026-11-10 09:00:00' };
  const courses = [
    { 'OB Calendar ID': 'offline-course-a', '日期': '2026/11/11', '時間': '18:30–19:30', '課程': '空中環基礎', '教室': 'A', '課程大類': '空中環' },
    { 'OB Calendar ID': 'offline-course-b', '日期': '2026/11/11', '時間': '20:00–21:00', '課程': '空中綢緞進階', '教室': 'C', '課程大類': '空中綢緞' },
    { 'OB Calendar ID': 'offline-course-c', '日期': '2026/11/13', '時間': '18:30–19:30', '課程': '空中環基礎', '教室': 'B', '課程大類': '空中環' }
  ];
  const practice = { filters: {}, summary: { total: 3, active: 2, waitlisted: 1, cancelled: 0 }, notificationFailures: [], bookings: [
    { bookingId: 'offline-practice-a', date: '2026/11/11', room: 'A', creatorName: 'wen', startTime: '10:00', endTime: '11:00', status: '候補', seriesId: 'offline-series', waitlistCalendarId: 'offline-ob', reason: '等待相關課程取消後補入', participants: [{ teacherName: 'wen', role: '建立者', startTime: '10:00', endTime: '11:00' }], audits: [] },
    { bookingId: 'offline-practice-b', date: '2026/11/11', room: 'B', creatorName: '珍珍', startTime: '10:00', endTime: '11:30', status: '已成立', participants: [{ teacherName: '珍珍', role: '建立者', startTime: '10:00', endTime: '11:30' }], audits: [] },
    { bookingId: 'offline-practice-c', date: '2026/11/12', room: 'C', creatorName: 'Tako', startTime: '14:00', endTime: '16:00', status: '已成立', participants: [{ teacherName: 'Tako', role: '建立者', startTime: '14:00', endTime: '16:00' }], audits: [] }
  ] };
  const students = { summary: { pendingQualification: 1, active: 1, changePending: 0 }, requests: [
    { participantId: 'offline-student-a', appName: '示範學生 A', date: '2026/11/11', room: 'C', startTime: '15:00', endTime: '16:00', status: '待確認資格', canMarkAsCompanion: true, qualificationVenue: '劍潭' },
    { participantId: 'offline-student-b', appName: '示範學生 B', date: '2026/11/12', room: 'A', startTime: '14:00', endTime: '15:00', status: '已成立' }
  ] };
  const main = { teachers: ['冠蓉', 'Tako', '珍珍'], pendingInvitations: [], activeInvitees: [], obWork: [], courseAdjustments: [], changeRequests: [], exceptions: [], completed: [], delayClosures: [], missingObCancellations: [], leavePaused: false,
    monthlyDiscount: { pendingCount: 1, candidates: [] }, dataStatus: status,
    operations: { dataStatus: status, tasks: [
      { key: 'offline-review', label: '學生自主練習資格待確認', date: '2026/11/11', time: '15:00', targetId: 'offline-student-a', tab: 'practice', owner: 'Tako', urgency: '待處理' },
      { key: 'offline-discount', label: '優惠課推薦待確認', date: '2026/11/12', time: '18:30', targetId: 'offline-course-a', tab: 'monthlyDiscount', urgency: '待處理' }
    ], exceptions: [], identities: [], closure: { ruleCatalogue: { version: 'offline', rules: [], stages: [] }, assessments: { dates: {} } } } };
  const notifications = { teachers: ['冠蓉', 'Tako', '珍珍'], administrators: ['冠蓉'], schedules: [], history: [], closureWindows: [], monthlyOperations: {
    month: '2026-11', now: '2026-11-10 09:00', schedule: { bookingDate: '2026-11-20' }, systemState: { leavePaused: false, claimsPaused: false, openInvitationCount: 0 }, automaticReminders: [], templates: {}, operations: []
  } };
  const payroll = { month: '2026-11', version: 'offline-payroll', deductions: [], lines: [], summaries: [], disputes: [], metrics: { teachers: 0, totalSalary: 0, pendingConfirmations: 0, teacherConfirmed: 0, finalized: 0, errors: 0, openDisputes: 0 }, dataStatus: { ...status, source: 'payroll_snapshot' } };
  const vvip = { month: '2026-12', isOpen: false, members: [], whitelist: [], metrics: { members: 0, activeSelections: 0, pendingSelections: 0 } };
  const invoices = { queue: [], items: [], audit: [], settings: { scheduleText: '每日約 00:00', defaultMerchantProfile: 'primary', lastSyncAt: '2026-11-10 09:00' }, scheduler: { installed: true } };
  const dates = Array.from({ length: 7 }, (_, index) => ({ date: `2026/11/${10 + index}`, hasSchedule: true }));
  const home = { today: '2026/11/10', monthLabel: '11 月', dates, weekSummary: { regular: 2, substitute: 1, practice: 1 }, pendingCount: 1, upcoming: [
    { id: 'offline-reminder', date: '2026/11/11', time: '15:00', title: '自主練習', meta: 'C 教室 · 候補', targetView: 'practice' }
  ], scheduleByDate: Object.fromEntries(dates.map(({ date }) => [date, [
    { id: `${date}-a`, date, startTime: '18:30', endTime: '19:30', room: 'A', title: '空中環基礎', kind: 'regular', status: '授課' },
    { id: `${date}-b`, date, startTime: '20:00', endTime: '21:00', room: 'C', title: '空中綢緞進階', kind: 'substitute', status: '代課' }
  ]])) };
  const rentalCatalog = { instructorId: 'offline-teacher', instructorReady: true, classes: [{ classId: 'offline-rental-60', durationMinutes: 60, name: '場地租借 60 分鐘' }, { classId: 'offline-rental-90', durationMinutes: 90, name: '場地租借 90 分鐘' }], rooms: ['A', 'B', 'C', 'D'].map((room, index) => ({ room, roomId: `offline-${index}` })) };
  const reads = {
    getAdminDashboard: main, getPracticeAdminDashboard: practice, getStudentPracticeAdminDashboard: students,
    getPayrollAdminDashboard: payroll, getVvipAdminDashboard: vvip, getInvoiceAdminDashboard: invoices,
    getNotificationAdminDashboard: notifications, getNotificationInbox: { unreadCount: 0, items: [] },
    getTeacherHomeDashboard: home, getMyCourses: courses, getMyLeaves: [], getMySubs: [],
    getClaimPageData: { state: 'active', items: [], options: { capabilities: [], classes: [] } },
    getMyPracticeBookings: { items: [] }, getMyRentalRequests: { items: [] }, getRentalCatalog: rentalCatalog,
    getPushConfiguration: { configured: true, appId: 'offline-app', externalId: 'offline-teacher' },
    getPushSubscriptionStatus: { status: 'ready', matched: true, enabled: true },
    getMyPayroll: { month: '2026-11', lines: [], summaries: [], status: '尚未發布' },
    getRaffleWorkspace: { campaigns: [], claims: [], readOnly: true, canCorrect: false, canPrepare: false }
  };
  const read = async (action, params = {}) => {
    window.offlineReads.push({ action, params });
    if (action === 'getPracticeDay') return { date: params.date || '2026/11/10', teacherName: '冠蓉', quickDurations: [60, 90, 120], rooms: ['A', 'B', 'C', 'D'].map(room => ({ room, blocks: [{ id: `offline-block-${room}`, type: 'course', date: params.date || '2026/11/10', room, startTime: '18:30', endTime: '19:30', label: '空中環基礎', teacherName: '冠蓉' }] })) };
    if (Object.prototype.hasOwnProperty.call(reads, action)) return structuredClone(reads[action]);
    window.offlineWrites.push(action);
    throw Error('本機預覽不執行正式操作，也不會發送通知。');
  };
  callApi = read;
  callPostApi = read;
  authState.sessionToken = 'offline-preview-only';
  authState.teacherName = '冠蓉'; authState.role = '管理員'; authState.actingTeacherName = '';
  authState.managementCapabilities = capabilities;
  Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
  pushSdk = { Notifications: { permission: true }, User: { externalId: 'offline-teacher', PushSubscription: {
    id: '11111111-1111-4111-8111-111111111111', token: 'offline-token', optedIn: true
  } } };
  pushSdk.login = async identity => { pushSdk.User.externalId = identity; };
  pushSdkAppId = 'offline-app'; pushIdentityExternalId = 'offline-teacher';
  pushSessionToken = authState.sessionToken; pushSessionTeacherName = authState.teacherName;
  pushVerifiedFingerprint = getPushFingerprint(pushSdk);
  pushStatusMessage = '本機示範裝置：通知綁定有效。';
  adminDashboard = structuredClone(main); notificationDashboard = structuredClone(notifications);
  payrollDashboard = structuredClone(payroll); vvipDashboard = structuredClone(vvip); invoiceDashboard = structuredClone(invoices);
  practiceAdminDashboard = structuredClone(practice); studentPracticeAdminDashboard = structuredClone(students);
  globalCourseList = structuredClone(courses); hasCourseSnapshot = true;
  teacherHomeDashboard = structuredClone(home);
  document.getElementById('auth-shell').hidden = true;
  document.getElementById('app-shell').hidden = false;
  document.getElementById('current-user').textContent = '冠蓉';
  document.querySelector('.topbar .brand-subtitle').textContent = '本機預覽 · 示範資料';
  document.title = 'Sherry Aerial | 本機預覽・示範資料';
  document.getElementById('account-teacher-name').textContent = '冠蓉';
  document.getElementById('admin-entry').hidden = !capabilities.length;
  document.getElementById('account-admin-entry').hidden = !capabilities.length;
  activeAdminSection = 'dashboard'; activeAdminTab = 'pendingInvitations';
  switchView(capabilities.length ? 'view-admin' : 'view-home');
  refreshIcons();
}
