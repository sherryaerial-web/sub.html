# Admin Refresh And Persistent Session Design

## Goal

Keep cancelled or withdrawn records out of the completed queue, let administrators refresh dashboard data without reloading the page, and preserve authenticated sessions on each user's personal device.

## Behavior

- `取消／退出` contains pending and completed cancellation or withdrawal history.
- `已完成` contains only non-cancelled records whose OB verification is complete.
- `重新整理資料` reloads the active management view and shows a visible result without calling `window.location.reload()`.
- A successful login is stored in `localStorage`, validated against Apps Script on startup, and cleared only by explicit logout, invalidation, or expiry.
- Sessions last 30 days. The Apps Script cache remains capped at six hours while Script Properties preserve the authoritative expiry.

## Safety And Testing

- No Sheet columns or indexes change.
- Session tokens remain opaque and are never displayed.
- Add focused backend queue/session tests and frontend contract tests. Do not run the full visual review for this non-visual change.
