# Safari iframe relay design

## Problem

Safari intermittently blocks authenticated cross-origin POST responses from the Apps Script web app with a CORS error, leaving teacher pages at `載入中...` even though Apps Script returned HTTP 200.

## Design

- Keep the GitHub Pages URL and existing backend actions.
- Submit authenticated POST parameters through a hidden HTML form targeted at a hidden iframe.
- Ask `doPost` for an HTML relay response with a unique request ID.
- Base64-encode the JSON payload before embedding it in the relay page.
- Relay the result to the production GitHub Pages origin through `postMessage`.
- Accept only HTTPS Apps Script / Googleusercontent origins and the matching high-entropy request ID.
- Remove the temporary form, iframe, listener, and timeout after every request.
- Preserve the original JSON response for callers that do not request iframe transport.

## Data safety

This changes only the browser-to-GAS response transport. It does not migrate, clear, or batch-update any Sheet data, and existing action-level authorization and exact-ID writes remain unchanged.

