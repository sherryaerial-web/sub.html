# Sherry Aerial PWA Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable OneSignal Web Push for selected-teacher invitations, claim/withdrawal results, and the 22:30/23:40 closure workflow, including a copyable one-person-short community message.

**Architecture:** Keep the existing GitHub Pages SPA and GAS backend. The PWA identifies the signed-in teacher to OneSignal with an opaque GAS-derived external ID; GAS sends transactional pushes through OneSignal REST API after core state transitions complete. A push-only service worker is added without fetch handlers or offline caching, and closure social-copy state is stored only in Script Properties.

**Tech Stack:** Static HTML/CSS/JavaScript, OneSignal Web SDK v16, OneSignal REST API, Google Apps Script, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-30-push-notifications-design.md`

## Global Constraints

- iPhone/iPad support requires iOS/iPadOS 16.4+ and launch from an installed Home Screen PWA.
- Notification permission is requested only after a visible user click.
- `OneSignalSDKWorker.js` must not register `fetch` handlers or use Cache Storage.
- OneSignal REST API key and external-ID salt never leave GAS Script Properties.
- Push failures never roll back or fail successful leave, claim, invitation, withdrawal, OB, or closure transactions.
- Do not add, clear, overwrite, move, or reindex any formal Sheet data.
- Do not add a notification Sheet; configuration, deduplication, and latest social copy use Script Properties.
- Only active accounts with `course_admin` receive manager pushes.
- Production `clasp push --force`, GAS deployment, and GitHub main push remain separate release actions after full verification.

---

## File Structure

- Create `OneSignalSDKWorker.js`: OneSignal push-only service worker loader.
- Modify `Code.gs`: push configuration, opaque identity, OneSignal REST client, event hooks, closure summary/social copy generation, deduplication.
- Modify `index.html`: OneSignal SDK bootstrap, permission card, subscription controls, deep-link routing, closure social-copy editor/copy action.
- Modify `tests/backend-core.test.js`: backend push client, recipients, event, closure, social-copy, and non-rollback tests.
- Modify `tests/frontend-contract.test.js`: permission UI, identity lifecycle, deep links, and community-copy interactions.
- Modify `tests/pwa-contract.test.js`: allow the push-only worker while continuing to forbid offline caches and fetch handlers.
- Modify `README.md`: Script Properties, OneSignal setup, user onboarding, and release smoke checks.

---

### Task 1: Backend Push Configuration, Identity, and OneSignal Client

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getPushConfiguration_(session): {configured, appId, externalId}`.
- Produces: `getPushExternalId_(teacherName): string` with prefix `teacher_` and opaque SHA-256 content.
- Produces: `sendPushNotificationSafely_(teacherNames, message): {attempted, delivered, error}`.
- Produces: `getActiveCourseAdminNames_(): string[]`.
- Consumes later: `message = {eventKey, heading, content, url}`.

- [ ] **Step 1: Write failing backend tests for safe configuration and identity**

Add tests proving:

```js
test('push configuration exposes only app id and opaque external id', () => {
  const backend = loadBackend({ PropertiesService: createPropertiesFixture({
    ONESIGNAL_APP_ID: 'public-app-id',
    ONESIGNAL_REST_API_KEY: 'private-rest-key',
    PUSH_EXTERNAL_ID_SALT: 'private-salt',
  }) });
  const config = backend.getPushConfiguration_({ teacherName: 'Jina' });
  assert.equal(config.configured, true);
  assert.equal(config.appId, 'public-app-id');
  assert.match(config.externalId, /^teacher_[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(config), /private-rest-key|private-salt|Jina/);
});

test('push configuration disables cleanly when OneSignal properties are absent', () => {
  const backend = loadBackend({ PropertiesService: createPropertiesFixture({}) });
  assert.deepEqual(
    JSON.parse(JSON.stringify(backend.getPushConfiguration_({ teacherName: 'Jina' }))),
    { configured: false, appId: '', externalId: '' }
  );
});
```

Extend the test `Utilities` fixture with deterministic `computeDigest` support and add a Script Properties fixture that implements `getProperty`, `setProperty`, `deleteProperty`, and `getProperties`.

- [ ] **Step 2: Run the focused tests and verify red**

Run:

```bash
node --test --test-name-pattern='push configuration|opaque external id' tests/backend-core.test.js
```

Expected: FAIL because the push helpers do not exist.

- [ ] **Step 3: Implement Script Property names and authenticated configuration route**

Add exact configuration keys:

```js
ONESIGNAL_APP_ID_PROPERTY: 'ONESIGNAL_APP_ID',
ONESIGNAL_REST_API_KEY_PROPERTY: 'ONESIGNAL_REST_API_KEY',
PUSH_EXTERNAL_ID_SALT_PROPERTY: 'PUSH_EXTERNAL_ID_SALT',
PUSH_SENT_KEY_PREFIX: 'PUSH_SENT_',
COURSE_CLOSURE_SOCIAL_COPY_PREFIX: 'COURSE_CLOSURE_SOCIAL_COPY_'
```

Add `getPushConfiguration` to the authenticated `doPost` handlers. It must use the real signed-in `session`, never `actingSession()`, so admin impersonation does not reassign the device to another teacher.

Implement `getPushConfiguration_` to return `configured:false` unless both App ID and REST API Key exist. Generate `PUSH_EXTERNAL_ID_SALT` once with two UUIDs when configuration is otherwise complete, save it only in Script Properties, then derive the teacher external ID from `salt + ':' + normalized teacher name` using SHA-256.

- [ ] **Step 4: Write failing REST-client and admin-recipient tests**

Add tests with fake active/inactive account rows and a fake `UrlFetchApp.fetch` asserting:

```js
assert.deepEqual(backend.getActiveCourseAdminNames_(), ['冠蓉', 'Tako']);
assert.equal(request.url, 'https://api.onesignal.com/notifications');
assert.equal(request.options.headers.Authorization, 'Key private-rest-key');
assert.deepEqual(payload.include_aliases.external_id, [
  backend.getPushExternalId_('冠蓉'),
  backend.getPushExternalId_('Tako'),
]);
assert.equal(payload.target_channel, 'push');
assert.equal(payload.url, 'https://sherryaerial-web.github.io/sub.html/?view=admin&tab=closureManagement');
```

Also simulate HTTP 500 and assert `sendPushNotificationSafely_` returns an error object without throwing.

- [ ] **Step 5: Implement the OneSignal client and recipient lookup**

Implement `getActiveCourseAdminNames_` from `登入帳號`: require `是否在職`, then use `getAccountManagementCapabilities_` and include only accounts containing `course_admin`.

Implement the REST payload:

```js
{
  app_id: appId,
  include_aliases: { external_id: externalIds },
  target_channel: 'push',
  headings: { en: cleanText_(message.heading) },
  contents: { en: cleanText_(message.content) },
  url: cleanText_(message.url)
}
```

Use `muteHttpExceptions:true`. Treat 2xx as success; all other codes return a structured error. Empty recipients or missing properties return `{attempted:false, delivered:0, error:''}`. Never log the REST API key or full request headers.

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
node --test --test-name-pattern='push configuration|opaque external id|OneSignal|course admin push' tests/backend-core.test.js
```

Expected: PASS.

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: add safe OneSignal push backend"
```

---

### Task 2: PWA Notification Permission and Identity Lifecycle

**Files:**
- Create: `OneSignalSDKWorker.js`
- Modify: `index.html`
- Modify: `tests/pwa-contract.test.js`
- Modify: `tests/frontend-contract.test.js`

**Interfaces:**
- Consumes: `getPushConfiguration` response from Task 1.
- Produces: `initializePushForSession()`, `requestPushPermission()`, `setPushOptedIn(enabled)`, and `logoutPushIdentity()`.
- Produces UI elements: `#push-permission-card`, `#push-enable`, `#push-disable`, `#push-status-copy`.

- [ ] **Step 1: Replace the old no-worker contract with a push-only worker contract**

Change the PWA test from “no service worker registration” to these exact guarantees:

```js
const worker = fs.readFileSync(path.join(root, 'OneSignalSDKWorker.js'), 'utf8');
assert.match(worker, /OneSignalSDK\.sw\.js/);
assert.doesNotMatch(worker, /addEventListener\s*\(\s*['"]fetch['"]/);
assert.doesNotMatch(worker, /caches\s*\.|CacheStorage|cache\.addAll/);
assert.doesNotMatch(html, /navigator\.serviceWorker\.register/);
```

The OneSignal SDK owns worker registration; app code must not register a competing worker.

- [ ] **Step 2: Add failing frontend tests for permission states**

Extend the frontend runtime fixture with an injectable `OneSignal` stub. Cover:

- configured and permission default: show “開啟即時通知” and enable button;
- iOS browser not standalone: show “請先加入主畫面” and do not call native permission;
- permission granted and opted in: show “通知已開啟” and disable button;
- permission denied: show system-settings guidance and no repeated automatic request;
- logout: call `OneSignal.logout()`;
- restored login: call `OneSignal.login(externalId)` once configuration arrives;
- acting-as teacher mode: retain the administrator's push external ID.

- [ ] **Step 3: Run the PWA/frontend tests and verify red**

Run:

```bash
node --test --test-name-pattern='push-only|notification permission|push identity|Home Screen' tests/pwa-contract.test.js tests/frontend-contract.test.js
```

Expected: FAIL because worker, SDK, and permission UI are absent.

- [ ] **Step 4: Add worker, SDK loader, and home permission card**

Create `OneSignalSDKWorker.js` with only:

```js
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
```

Load the v16 page SDK with `defer`. Add the notification card below `.home-welcome`, styled for desktop and mobile without creating a modal or covering the bottom navigation.

Initialize OneSignal only after authenticated `getPushConfiguration` returns `configured:true`. Call:

```js
await OneSignal.init({
  appId: config.appId,
  serviceWorkerPath: 'OneSignalSDKWorker.js',
  serviceWorkerParam: { scope: './' },
  notifyButton: { enable: false },
  allowLocalhostAsSecureOrigin: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
});
await OneSignal.login(config.externalId);
```

Call `OneSignal.Notifications.requestPermission()` only from the enable-button click. Use `OneSignal.User.PushSubscription.optIn()` and `optOut()` for later toggles. On site logout, await or safely queue `OneSignal.logout()` without making logout depend on OneSignal availability.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
node --test --test-name-pattern='push-only|notification permission|push identity|Home Screen' tests/pwa-contract.test.js tests/frontend-contract.test.js
```

Expected: PASS.

Commit:

```bash
git add OneSignalSDKWorker.js index.html tests/pwa-contract.test.js tests/frontend-contract.test.js
git commit -m "feat: add PWA notification opt-in"
```

---

### Task 3: Teacher Transactional Notification Hooks

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Consumes: `sendPushNotificationSafely_` from Task 1.
- Produces pushes for `openInvitations_`, `claimSubstitute_`, `claimSpecialCourse_`, and `resolveChangeRequest_`.

- [ ] **Step 1: Write failing tests for exact event recipients**

Add isolated fixtures asserting:

```js
assert.deepEqual(pushes[0].teachers, ['Jina']);
assert.equal(
  pushes[0].message.url,
  'https://sherryaerial-web.github.io/sub.html/?view=claim'
);
```

for a newly opened invitation, while already-open teachers create no push. Add ordinary and special claim tests targeting only the claiming teacher with `?view=mysubs`. Add withdrawal approval and rejection tests targeting `priorSubstitute`, even after approval clears the Sheet substitute cell.

Add one test where the OneSignal client throws/returns failure and assert the invitation row, claim row, and withdrawal resolution still contain their successful final states.

- [ ] **Step 2: Run event tests and verify red**

Run:

```bash
node --test --test-name-pattern='pushes newly opened invitation|pushes claim success|pushes withdrawal result|push failure never rolls back' tests/backend-core.test.js
```

Expected: FAIL because event hooks are absent.

- [ ] **Step 3: Refactor transaction boundaries before adding sends**

For each core function, preserve all existing locked Sheet reads/writes and audit events. Capture the successful result and the server-trusted teacher/course summary, release the lock, then call the safe push helper. Do not call external APIs while holding `LockService`.

`openInvitations_` must retain `rowsToAppend.map(row => row[1])` as `openedTeachers`; teachers counted in `alreadyOpen` are never recipients.

`claimSubstitute_` and `claimSpecialCourse_` must return their existing public result shape. Build the push summary from the re-read Sheet rows, never from untrusted frontend item names.

`resolveChangeRequest_` must capture `priorSubstitute` before approving an exit and use it for both approval and rejection notifications.

- [ ] **Step 4: Add teacher message copy and deep links**

Use concise headings/content:

- invitation: `新的代課已開放` / `管理員已開放代課給你，點此查看可領課程。` / `?view=claim`;
- claim: `代課領取成功` / include date, time, and actual course summary / `?view=mysubs`;
- withdrawal approved: `退出代課已核准` / include original date/time/course / `?view=mysubs`;
- withdrawal rejected: `退出代課未核准` / include reason when present / `?view=mysubs`.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
node --test --test-name-pattern='pushes newly opened invitation|pushes claim success|pushes withdrawal result|push failure never rolls back' tests/backend-core.test.js
```

Expected: PASS.

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: send teacher workflow notifications"
```

---

### Task 4: Closure Summaries and One-Person-Short Community Copy

**Files:**
- Modify: `Code.gs`
- Test: `tests/backend-core.test.js`

**Interfaces:**
- Produces: `getOneShortClosureCourses_(details): CourseSummary[]`.
- Produces: `buildClosureCommunityCopy_(courses): string`.
- Produces: `notifyClosureResultSafely_(result): object`.
- Extends closure dashboard data with `socialCopy: {targetDate, text, courseCount, generatedAt}` or `null`.

- [ ] **Step 1: Write failing rule and formatter tests**

Create normalized details for:

- general course with 1 attendee: included;
- Jina/小美/卡拉 or 2-point course with 2 attendees: included;
- course containing `雙人` with 3 attendees: included;
- counts below or above exactly one short: excluded;
- venue rental and cancelled course: excluded;
- missing location: included with `場館待確認` rather than guessed venue.

Assert sorted output and exact ending:

```js
assert.equal(copy, [
  '明12:00劍潭蕃茄柔軟度開發',
  '13:30晴光Lily舞綢',
  '21:30晴光Nana 空瑜',
  '各缺一，等到23:40',
].join('\n'));
```

Extend `normalizeClosureCalendarDetail_` fixture inputs with OB `classRoom` and `location` and assert normalized `room` and `location` survive.

- [ ] **Step 2: Run social-copy tests and verify red**

Run:

```bash
node --test --test-name-pattern='one person short|closure community copy|closure location' tests/backend-core.test.js
```

Expected: FAIL because the candidate and formatter functions are absent.

- [ ] **Step 3: Implement exact one-short rules and editable copy source**

Use `getCourseClosureRule_(detail, '23:40')` as the only authority for `minimumEnrollment`. Include a detail only when:

```js
rule.manualReview !== true &&
rule.minimumEnrollment != null &&
Number(detail.enrollmentCount) === Number(rule.minimumEnrollment) - 1
```

Extend normalization with OB room/location fields using the same safe extraction pattern already used by payroll sync. Strip room prefix, difficulty, level, discount, and decorative emoji only at the social-copy display boundary; never change OB or Sheet course names.

Add a small alias map for the confirmed community spellings: `番茄🍅 → 蕃茄`, `巧 → 巧巧`, `Lily Yellow → Lily`, `Ariel Lu → Ariel`, and both `@N.a🧘🏻♀️`／`@N.a🧘🏻‍♀️ → Nana`. Unknown teachers fall back to their cleaned account name.

- [ ] **Step 4: Persist the latest 22:30 copy only in Script Properties**

After `executeNextDayClosuresCore_` completes stage `22:30`, compute one-short courses from the same trusted OB response and store JSON at:

```text
COURSE_CLOSURE_SOCIAL_COPY_YYYYMMDD
```

The JSON contains only `targetDate`, `text`, `courseCount`, and `generatedAt`. Delete properties older than 7 days. Return the current target-date copy in `getCourseClosureDashboard_`; no Sheet writes or header changes.

- [ ] **Step 5: Add manager completion/failure pushes with deduplication**

For every successful manual or automatic closure result, send one manager push after locks are released. At 22:30 include `X 堂只差一人，社群文字待貼` when `courseCount > 0`. At both stages include cancelled, manual-review, and failed counts; when failures exist include the first three failed course summaries and `另有 N 堂` when needed.

Use a Script Property key derived from `targetDate + stage + result digest`; a retry with the same result does not send again, while a changed failure result can send a corrected alert. If the closure core itself throws before returning a result, retain the existing failure Email and send a best-effort manager failure push without exposing API tokens.

- [ ] **Step 6: Run focused closure tests and commit**

Run:

```bash
node --test --test-name-pattern='one person short|closure community copy|closure location|closure manager push|closure push deduplicates|closure failure push' tests/backend-core.test.js
```

Expected: PASS.

Commit:

```bash
git add Code.gs tests/backend-core.test.js
git commit -m "feat: notify managers about course closures"
```

---

### Task 5: Admin Community-Copy UI and Notification Deep Links

**Files:**
- Modify: `index.html`
- Modify: `tests/frontend-contract.test.js`
- Modify: `tests/visual-check.mjs`

**Interfaces:**
- Consumes: `adminDashboard.courseClosure.socialCopy` from Task 4.
- Produces: `renderClosureSocialCopy(copy)`, `copyClosureCommunityText()`, `readRequestedAppDestination()`.

- [ ] **Step 1: Add failing DOM tests for the closure copy panel**

Render a closure dashboard containing social copy and assert:

- an editable textarea contains the full multi-line text;
- a `複製社群文字` button exists;
- clicking copies the textarea's current edited value, not the original response;
- an empty/null social copy renders no panel;
- mobile layout has no horizontal overflow and the button remains at least 44px high.

- [ ] **Step 2: Add failing deep-link tests**

Inject these URLs into the frontend runtime:

```text
/?view=claim
/?view=mysubs
/?view=admin&tab=closureManagement
```

Assert navigation occurs only after session restoration. Assert a teacher without `course_admin` cannot activate `view-admin`; it falls back to home with a visible permission notice. Remove handled query parameters with `history.replaceState` so reload does not repeatedly force navigation.

- [ ] **Step 3: Run frontend tests and verify red**

Run:

```bash
node --test --test-name-pattern='community copy|notification deep link' tests/frontend-contract.test.js
```

Expected: FAIL because the panel and routing are absent.

- [ ] **Step 4: Implement the closure copy panel and copy action**

Render the panel at the top of the `closureManagement` tab, ahead of the execution controls. Use a labelled textarea, course count, generated time, and `複製社群文字` button. Reuse the existing clipboard fallback used by `複製 LINE 邀請文字`; show `社群文字已複製。` on success.

- [ ] **Step 5: Implement safe post-login routing**

Parse only the allowlisted view/tab values. Store the requested destination in memory during initial load, apply it after `applySession` and capability rendering, then clear it. Do not accept arbitrary selectors, URLs, or action names from query parameters.

- [ ] **Step 6: Run focused tests and the two notification-related visual states**

Run:

```bash
node --test --test-name-pattern='community copy|notification deep link' tests/frontend-contract.test.js
node tests/visual-check.mjs
```

Expected: focused tests PASS; desktop and mobile notification card/community-copy states have no clipping or horizontal overflow.

- [ ] **Step 7: Commit**

```bash
git add index.html tests/frontend-contract.test.js tests/visual-check.mjs
git commit -m "feat: add closure community copy workflow"
```

---

### Task 6: Configuration Guide and Release Verification

**Files:**
- Modify: `README.md`
- Verify: `Code.gs`, `index.html`, `OneSignalSDKWorker.js`, all tests.

**Interfaces:**
- Consumes all prior tasks.
- Produces a release-ready branch; it does not itself push main or deploy GAS.

- [ ] **Step 1: Document exact OneSignal setup**

Add a README section requiring:

1. Create one OneSignal Web app for origin `https://sherryaerial-web.github.io`.
2. Set the default notification click URL to `https://sherryaerial-web.github.io/sub.html/`.
3. Keep OneSignal auto-prompt disabled because the site owns the consent UI.
4. Add GAS Script Properties `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY`; let the backend generate `PUSH_EXTERNAL_ID_SALT` after configuration.
5. Never paste the REST API Key into chat, Git, HTML, Sheet cells, or screenshots.
6. iPhone/iPad users install to Home Screen before tapping the in-app enable button; Android/desktop users tap the same button after login.

- [ ] **Step 2: Run syntax and focused notification tests**

Run:

```bash
cp Code.gs /tmp/sherry-push-Code.js
node --check /tmp/sherry-push-Code.js
node --test --test-name-pattern='push|notification|OneSignal|community copy|closure manager' tests/*.test.js
```

Expected: syntax valid and all notification-related tests PASS.

- [ ] **Step 3: Run the one full pre-release verification**

Run:

```bash
git diff --check
node --test tests/*.test.js
node tests/visual-check.mjs
node tests/vvip-visual-check.mjs
```

Expected: no whitespace errors; all tests and both visual journeys PASS.

- [ ] **Step 4: Perform non-production OneSignal smoke tests**

Using test identities only, verify:

- iPhone Home Screen PWA: permission card, native prompt, foreground/background delivery, click to correct view;
- Android Chrome/PWA: same flow;
- administrator test identity: simulated 22:30 completion and copy panel;
- teacher test identity: selected invitation, claim success, withdrawal approval and rejection;
- disabled notifications: core actions still succeed;
- a forced fake OneSignal error in automated fixtures: no formal Sheet mutation beyond the operation under test.

Do not trigger a real invitation, claim, withdrawal, or closure against formal data solely for smoke testing.

- [ ] **Step 5: Review branch and request production authorization**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
git diff origin/main...HEAD --stat
```

Report the changed files, test totals, OneSignal configuration status, and explicitly state that formal Sheet data was not modified. Before `clasp push --force`, creating a GAS version, or pushing GitHub main, explain that the release adds an external push provider and a push-only service worker, then obtain explicit production authorization.
