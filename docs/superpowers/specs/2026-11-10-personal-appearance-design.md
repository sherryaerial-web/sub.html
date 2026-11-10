# Personal Appearance Settings

Status: design for approval; no production implementation or deployment.

## Intent and Confirmed Decisions

Each signed-in teacher or manager can choose their own interface colors. Preferences follow the account across devices and never change another person's interface. The user selected both preset palettes and custom primary/secondary colors.

The original warm taupe/blush palette remains the default. The user approved the revised low-saturation palette preview, not the earlier saturated green/contrasting-color proposal. Keep the newly approved navigation organization and all existing business features.

This whole batch stays local until the user separately authorizes release. No live Sheets, account properties, bookings, payroll, OB, messages, or notifications are changed during implementation/testing.

## Approaches

1. Presets only: consistent, simple and low-risk, but no individual adjustment.
2. Presets plus custom primary/secondary colors: retains the curated starting points while allowing personal adjustment. This is the user's selected approach.

Cross-device storage cannot be achieved with browser-only preferences. Use the existing authenticated GAS backend, with a small, separately namespaced account preference record and a browser cache. This technical choice is proposed by the implementer, not a new business rule.

## User Experience

- Entry: `我的 > 個人化`; available to ordinary teachers and managers. Managers use their existing teacher/My workspace entry, without another top-level admin category.
- One compact dialog with six paired-color swatches, followed by native primary and secondary color inputs. No additional font, layout, avatar, notification, or permission settings.
- Opening copies the last saved preferences into a draft. Selecting a preset applies its full palette to the draft. Editing either color switches to custom mode and keeps the selected preset as the base for background neutrals.
- Preview updates the actual interface immediately, including dialogs and mobile navigation, without rerendering any course/business form or clearing drafts, scroll positions, selections, or open records.
- `儲存` explicitly saves the draft. `取消`, close, or Escape reverts to the last saved appearance. `恢復原本配色` changes the draft to the original palette; it still requires `儲存` to persist.
- A short inline status distinguishes loading, unsaved, saved, unavailable, and result-unconfirmed states. No new persistent global banner or explanatory wall of text.
- Saving disables duplicate submission. Close/discard can end the local preview while a request is pending, but cannot revoke an already-sent save; completion is reconciled only for the same signed-in account. Do not claim that closing canceled a server write.

## Palette Baseline

The approved preview lives at `/Users/ivy/.codex/visualizations/2026/07/03/019f2a56-6253-7f42-8c87-e7b40f20034c/personal-color-options.html`.

| Preset ID | Label | Primary | Secondary |
| --- | --- | --- | --- |
| original | 原本配色 | #786c64 | #eee0dc |
| rose | 藕粉 × 暖灰 | #857377 | #e9dcdf |
| sage | 鼠尾草 × 米白 | #717a70 | #dfe5dd |
| blue | 霧藍 × 珍珠灰 | #707c83 | #dfe5e8 |
| lilac | 灰紫 × 淡藕 | #7b7482 | #e5dfe9 |
| stone | 石灰 × 霧白 | #737675 | #e2e5e3 |

For original, preserve source tokens: ink `#403936`, surface `#fffdf9`, page `#f3f0eb`, navigation `#ebe5dd`, line `#d8d0c7`, strong `#665851`, decorative edge `#ad8175`. Restore the original muted header/body relationship in the integrated local shell, without restoring old clutter or old navigation.

Custom colors accept only six-digit RGB hex values. The chosen two colors remain visible as selected; derived background tints, borders and readable foregrounds are computed separately. Curated defaults are muted, but do not silently desaturate an individual's custom choice. Maintain normal-text contrast of at least 4.5:1 against its actual surface and clear focus/selection visibility. Use computed black/white or appropriately darkened foregrounds when necessary.

Semantic error, warning, success and booking/payroll status colors remain independent of personal decoration, retain labels, and do not become indistinguishable. Native focus indicators, disabled states, loading states and the brand logo remain legible. Public student pages, emails, exports, printed documents and externally embedded activity tools are outside scope.

## Existing Code and Ownership

- `index.html`: My menu, session lifecycle (`applySession`, login restoration, `clearSession`), role switch, and dialog entry/event wiring.
- `workspace-navigation.css`: current shell palette plus several hardcoded white/green colors. Convert only appearance-related values into scoped theme tokens; preserve geometry and mobile date/time padding guards.
- A small `personal-appearance.js` module: palette data, validation, contrast/tint helpers, draft state, per-account cached preferences and guarded rendering. No external theme library is needed.
- `Code.gs`: authenticated `doPost` handlers for get/save appearance and isolated preference helpers. Preserve existing Sheet schemas/indexes and auth/role semantics.
- `admin-transport.js`: reuse the existing POST transport, operation identity and reconciliation. Only add a human-readable save action label if needed; do not bypass or weaken generic mutation safety.

## Storage and API Contract

Use `PropertiesService.getScriptProperties()` through the existing `getScriptProperties_` helper. One property per authenticated canonical `session.teacherName`, under a dedicated prefix such as `PERSONAL_APPEARANCE_V1_` plus its SHA-256 hash. This is not GAS UserProperties and is not keyed by a browser-supplied target or session token. Account renaming/migration is outside this feature; an unmatched identity starts with original colors.

Payload: `{ schemaVersion: 1, mode: 'preset'|'custom', presetId, primary, secondary, revision, updatedAt }`. `presetId` is the base palette in custom mode. Limit serialized records to 1 KiB and validate types, enum values, hex colors and integer revisions. Do not enumerate/delete unrelated properties to make space. Capacity/storage errors leave the previous preference intact and surface a non-success state.

- `getPersonalAppearance`: authenticated POST, no writes on read. Missing record returns original palette, revision zero. Corrupt/unsupported data returns a clearly unavailable/recovery-needed result, with original colors for rendering; do not erase or silently overwrite it.
- `savePersonalAppearance`: authenticated POST with normalized draft plus `expectedRevision`; owner always comes from the verified session. Reject foreign account/owner fields. Do not accept arbitrary CSS, HTML, URLs or unknown palette IDs.
- Use the existing tracked mutation protocol. Inside the preference handler, acquire the existing script lock, reread the current revision, and write only that account's property. Return the saved record after readback.
- Identical already-saved content is a no-op success. A revision conflict returns a normal completed result `{ saved: false, reason: 'conflict', current: ... }`, not a thrown mutation error that would leave an uncertain receipt. Preserve the draft and offer an explicit reload; never auto-overwrite another device's newer choice.
- Other known pre-write validation failures should also finish as an explicit non-saved result. An unexpected/unknown write result uses the existing pending-operation reconciliation, never blind retry. Confirmed saves alone update the browser's saved-preference cache.
- Reset is a versioned save of original preferences, not property deletion, so older devices cannot overwrite the reset unnoticed.

## Session and Failure Behavior

Only verified sessions load personal preferences. Use a per-account cache to avoid repeated resets while retrieving the latest server value; missing or blocked browser storage must not break login or other functionality. If existing write transport cannot persist its safety receipt, explain that saving is unavailable; do not bypass that guard.

Tag each preference request with both owner and session generation. Ignore late responses after logout, account switch, or a newer request. A late get must not override an open edited draft or a completed newer save. Logout/account invalidation cancels the preview, clears in-memory state and restores original appearance on the login screen. The same account's teacher/admin workspaces share one appearance.

While acting as another teacher, retain the real logged-in manager's colors and disable personalization editing in that mode. The frontend excludes the action from teacher-acting injection, and the backend rejects explicit `actingTeacherName` on saves. No account's permissions are changed by appearance data.

On retrieval failure, use the last validated cached preference or original fallback, with an inline unsynced state when settings are opened. Do not block normal work. Do not allow a cloud save until a current server revision is known. On save failure/timeout, preserve the draft and clearly state it is not yet confirmed saved. No automatic background write queue. Another device obtains updates at login/session restore or on opening personalization; real-time push synchronization is not required.

## Scope and Safety

- No removal or modification of leave selection, no required leave reason, no changes to practice approval, booking, rental, payroll, financial exports, activity rules, or notification subscriptions.
- No global theme-setting permission and no ability for an admin to change another person's colors.
- No product code changes until design approval. Then create an implementation plan, implement locally, and use offline mocks for all tests.
- No commits, pushes or deployments as part of this design review. Later release authorization must explicitly cover both frontend and GAS.

## Acceptance and Verification

1. Original palette is the default and exactly restores the established color tokens. Six presets plus both custom color controls work on teacher/admin desktop and 390/320px mobile views, including dialogs, bottom bars and native date/time fields.
2. Preview/cancel/reset/save behave distinctly, without mutating course forms or losing navigation/selection state.
3. Two simulated devices with the same verified account read the same saved preference; a different account cannot read/write it through forged input. Acting mode, expired sessions and logout are covered.
4. Cover old schema, invalid input, storage denial/corruption, network failure, double click, unknown delivery, same-content retry, revision conflict and late responses.
5. Custom extremes (white/white, black/black, same colors, bright colors) keep text/actions/focus legible; semantic status colors stay fixed.
6. Run focused tests while developing, then one full offline regression because this touches session/shared transport integration. Browser tests block external connections and report zero real Sheet/OB/mail/notification calls. Verify existing leave multi-date/multi-class/no-reason flow and the existing practice/push fixes remain intact.

## Builder Discretion

Exact internal function names, local cache prefix, token names, test file names and small dialog spacing can follow existing conventions. Keep the confirmed palette, per-account ownership, explicit save, failure semantics and no-deployment boundary unchanged. Implementation must not import the simplified sample course/mock interaction logic into the actual app.
