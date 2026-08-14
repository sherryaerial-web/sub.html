# Safari iframe relay implementation plan

1. Add frontend behavior tests for hidden-form POST, token privacy, trusted origin, and request-ID matching.
2. Add a backend behavior test that executes the generated relay script and verifies its exact target origin and payload.
3. Replace authenticated cross-origin `fetch POST` with hidden form/iframe transport.
4. Add a GAS HtmlOutput relay while preserving normal JSON responses.
5. Run all Node tests, JavaScript syntax checks, and diff checks.
6. After explicit production approval, push GAS, create a new deployment version, publish Pages, and verify in Safari without submitting any business action.

