# Morandi Taupe Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved C Morandi taupe and clay palette with consistent sans-serif Chinese, English, and numeric typography to the main management site and VVIP page.

**Architecture:** Keep both pages standalone and preserve every existing HTML and JavaScript contract. Add a small static visual-contract test first, then update only CSS tokens and presentation selectors in `index.html` and `vvip.html`; use the existing Playwright journeys for final responsive verification.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Playwright, GitHub Pages.

## Global Constraints

- Use `#786c64` as the warm taupe brand color and `#ad8175` as the clay interaction accent.
- Use `#f3f0eb` for the page and `#fffdf9` for content surfaces.
- Use `DM Sans`, `Noto Sans TC`, `PingFang TC`, and system sans-serif fallbacks; remove Georgia and serif heading overrides.
- Preserve all JavaScript flows, GAS actions, Sheet columns, permissions, API contracts, and visible interface copy.
- Preserve distinct error, success, and warning semantics without using green as the dominant success color.
- Run focused tests while editing and one complete test plus desktop/mobile visual verification immediately before deployment.

---

### Task 1: Add the visual contract

**Files:**
- Create: `tests/morandi-visual-contract.test.js`
- Test: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Consumes: standalone CSS embedded in `index.html` and `vvip.html`.
- Produces: static assertions for the approved colors and typography.

- [ ] **Step 1: Write the failing contract test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const pages = [read('index.html'), read('vvip.html')];

test('both pages use the approved Morandi taupe palette', () => {
  pages.forEach((html) => {
    assert.match(html, /#786c64/i);
    assert.match(html, /#ad8175/i);
    assert.match(html, /#f3f0eb/i);
    assert.match(html, /#fffdf9/i);
  });
});

test('both pages use matching sans-serif Chinese and English fonts', () => {
  pages.forEach((html) => {
    assert.match(html, /DM Sans/);
    assert.match(html, /Noto Sans TC/);
    assert.doesNotMatch(html, /Georgia|Noto Serif TC|serif/i);
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/morandi-visual-contract.test.js`

Expected: FAIL because the pages still contain the green palette and serif heading declarations.

- [ ] **Step 3: Commit the failing visual contract with the implementation tasks**

The test stays uncommitted until Tasks 2 and 3 pass, so the implementation commit never leaves the branch red.

### Task 2: Restyle the main management site

**Files:**
- Modify: `index.html`
- Test: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Consumes: existing class names and CSS custom properties in `index.html`.
- Produces: the approved palette and font stack without changing DOM IDs or JavaScript.

- [ ] **Step 1: Load the approved font families**

Add the Google Fonts stylesheet for `DM Sans` and `Noto Sans TC` in `<head>`, with existing system fonts as fallbacks.

- [ ] **Step 2: Replace palette tokens and presentation overrides**

Map the existing token names to `#403936`, `#786f69`, `#d8d0c7`, `#fffdf9`, `#f3f0eb`, `#786c64`, `#ad8175`, and `#eee0dc`. Update focus rings, topbar, login area, navigation, action icons, buttons, status pills, and payroll emphasis to use the same family.

- [ ] **Step 3: Remove serif declarations**

Use `"DM Sans", "Noto Sans TC", "PingFang TC", sans-serif` for headings, body copy, and money values. Remove every `Georgia`, `Noto Serif TC`, and generic `serif` declaration.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/morandi-visual-contract.test.js`

Expected: still FAIL until `vvip.html` is updated, while all `index.html` assertions pass.

### Task 3: Restyle the VVIP page

**Files:**
- Modify: `vvip.html`
- Test: `tests/morandi-visual-contract.test.js`

**Interfaces:**
- Consumes: existing VVIP classes and CSS custom properties.
- Produces: a VVIP page visually consistent with the main site without changing its selection workflow.

- [ ] **Step 1: Load the same font families and palette**

Add the same Google Fonts stylesheet and map the VVIP CSS tokens to the approved taupe, clay, warm-white, charcoal, and muted-blue status colors.

- [ ] **Step 2: Update component states**

Apply the palette to the brand block, focus ring, buttons, counter, date headings, selected-course badges, panels, notices, and empty states while preserving accessible semantic differences.

- [ ] **Step 3: Run the visual contract and frontend contract tests**

Run: `node --test tests/morandi-visual-contract.test.js tests/frontend-contract.test.js tests/vvip-frontend.test.js`

Expected: PASS.

- [ ] **Step 4: Commit the implementation**

```bash
git add index.html vvip.html tests/morandi-visual-contract.test.js
git commit -m "style: apply Morandi taupe interface"
```

### Task 4: Verify and deploy the visual change

**Files:**
- Verify: `index.html`
- Verify: `vvip.html`
- Verify: `tests/visual-check.mjs`
- Verify: `tests/vvip-visual-check.mjs`

**Interfaces:**
- Consumes: the completed CSS-only implementation.
- Produces: deployable GitHub Pages files with recorded test and screenshot evidence.

- [ ] **Step 1: Run the complete test suite once**

Run: `node --test tests/*.test.js`

Expected: all tests PASS.

- [ ] **Step 2: Run desktop and mobile visual journeys once**

Run: `node tests/visual-check.mjs`

Run: `node tests/vvip-visual-check.mjs`

Expected: no horizontal overflow, clipped controls, blank screenshots, mobile navigation overlap, or browser errors.

- [ ] **Step 3: Inspect representative screenshots**

Inspect the login page, one mobile teacher view, one desktop admin/payroll view, and both VVIP viewport screenshots. Confirm readable gray text and consistent taupe/clay styling.

- [ ] **Step 4: Push the verified commit to production**

Push the current branch commit to `origin/main` so GitHub Pages publishes the update. No Apps Script deployment is required because backend code is unchanged.
