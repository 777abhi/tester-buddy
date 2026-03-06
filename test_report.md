# Tester Buddy - Feature Demonstration Report

This report outlines the functionality of the `tester-buddy` utility, demonstrating its capabilities from an actual user's perspective. It includes commands executed against a local test application (`http://localhost:3000`), with their resulting logs and relevant outputs.

## Setup

A local testing server was spawned hosting a basic page (`index.html`) containing a login form, links, and an interactive button.

```html
<!-- Test Application Structure -->
<h1>Tester Buddy Test Page</h1>
<form id="login" action="/submit" method="POST">
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" required>
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required>
    <button type="submit">Login</button>
</form>
<div>
    <a href="/about.html">About</a>
    <button id="alert-btn" onclick="alert('Hello!')">Alert</button>
</div>
```

---

## Sidekick Mode (Manual Testing Companion)

The `sidekick` command acts as a companion for manual testing. It launches an interactive browser session where QA testers can perform exploratory tests.

**Command:**
```bash
npm run buddy -- sidekick --url http://localhost:3000
```

**Output Log:**
```
> app@1.0.0 buddy
> ts-node src/cli.ts sidekick --url http://localhost:3000

Launching interactive session...
```
*Note: Due to its interactive nature, it opens a Chromium window where standard testing takes place.*

---

## Scout Commands (Automated Utilities)

The `scout` module provides various automation tools ideal for LLM agents or rapid structure checks.

### 1. Page Exploration (`scout explore`)
Scans the target URL and generates a Markdown table of interactive elements (inputs, links, buttons) that an AI or user might want to interact with. It also captures a screenshot.

**Command:**
```bash
npm run buddy -- scout explore http://localhost:3000 --screenshot
```

**Output:**
```
Launching browser (headless: true)...
Navigating to http://localhost:3000...
Screenshot saved to screenshot.png
Current URL: http://localhost:3000/
Page Title: Test Page

| Tag | Text/Value | ID | Class | ARIA-label |
|---|---|---|---|---|
| input |  | username |  |  |
| input |  | password |  |  |
| button | Login |  |  |  |
| a | About |  |  |  |
| button | Alert | alert-btn |  |  |
Browser closed.
```
**Screenshot Captured:** `screenshot.png`

### 2. Form Analysis (`scout forms`)
Extracts details about all forms available on the page, including their inputs, types, and whether they are required fields.

**Command:**
```bash
npm run buddy -- scout forms http://localhost:3000
```

**Output:**
```
Launching browser (headless: true)...
Navigating to http://localhost:3000...
###  (ID: login)
| Label | Type | Name | ID | Required | Current Value |
|---|---|---|---|---|---|
| Username: | text | username | username | true |  |
| Password: | password | password | password | true |  |
| Login | submit |  |  | false |  |

### Standalone Inputs (ID: standalone-inputs)
| Label | Type | Name | ID | Required | Current Value |
|---|---|---|---|---|---|
| Alert | submit |  | alert-btn | false |  |

Browser closed.
```

### 3. Website Crawler (`scout crawl`)
Maps the website structure by discovering and visiting links up to a predefined depth, generating a status report.

**Command:**
```bash
npm run buddy -- scout crawl http://localhost:3000
```

**Output:**
```
Launching browser (headless: true)...
Starting crawl from http://localhost:3000 with depth 2...
Crawling: http://localhost:3000 (Depth: 0)
Crawling: http://localhost:3000/about.html (Depth: 1)
Crawling: http://localhost:3000/index.html (Depth: 2)

Crawling complete. Found 3 pages.

| Status | URL | Links Found | Error |
|---|---|---|---|
| ✅ 200 | http://localhost:3000 | 1 |  |
| ✅ 200 | http://localhost:3000/about.html | 1 |  |
| ✅ 200 | http://localhost:3000/index.html | 1 |  |
Browser closed.
```

### 4. Vulnerability Fuzzer (`scout fuzz`)
Injects common attack vectors (SQLi, XSS, Buffer Overflow, etc.) into detected forms and observes the page state to detect potential vulnerabilities.

**Command:**
```bash
npm run buddy -- scout fuzz http://localhost:3000
```

**Output:**
```
Launching browser (headless: true)...
Navigating to http://localhost:3000...
Found 2 forms. Starting fuzzing...
Fuzzing form login with SQL Injection...
Fuzzing form login with XSS...
Fuzzing form login with Buffer Overflow...
Fuzzing form login with Format String...
Fuzzing form login with Integer Overflow...
Fuzzing form login with Boundary Zero...
Fuzzing form login with Boundary Negative...

### Fuzzing Results for http://localhost:3000

| Form ID | Payload Type | Status | Error | Time (ms) |
|---|---|---|---|---|
| login | SQL Injection | ⚠️ error | Failed to load resource: th... | 661 |
| login | XSS | ⚠️ error | Failed to load resource: th... | 632 |
| login | Buffer Overflow | ⚠️ error | Failed to load resource: th... | 643 |
| login | Format String | ⚠️ error | Failed to load resource: th... | 625 |
| login | Integer Overflow | ⚠️ error | Failed to load resource: th... | 620 |
| login | Boundary Zero | ⚠️ error | Failed to load resource: th... | 635 |
| login | Boundary Negative | ⚠️ error | Failed to load resource: th... | 620 |

🚨 Detected 7 potential vulnerabilities or crashes!
Browser closed.
```

### 5. Visual Regression Testing (`scout visual`)
Captures a baseline screenshot and later compares it against the current state to detect visual UI changes.

**Commands:**
```bash
# Generate Baseline
npm run buddy -- scout visual http://localhost:3000 --out baseline.png

# Compare Against Baseline
npm run buddy -- scout visual http://localhost:3000 --base baseline.png --out diff.png
```

**Output (Comparison):**
```
Launching browser (headless: true)...
Navigating to http://localhost:3000...
Diff image saved to diff.png
Browser closed.
Visual check complete.
Mismatch pixels: 0
Images match!
```

---

## Test Generation (`codegen`)

The codegen utility translates a saved session history (actions like navigating, filling, and clicking) into an automated Playwright test script leveraging semantic locators automatically discovered by the execution engine.

**Command:**
```bash
npm run buddy -- codegen --session my_session.json
```

**Given Session (`my_session.json`):**
```json
{
  "history": [
    { "action": "goto:http://localhost:3000", "semantic": null },
    { "action": "fill:#username:admin", "semantic": "getByLabel('Username:')" },
    { "action": "fill:#password:password", "semantic": "getByLabel('Password:')" },
    { "action": "click:button[type='submit']", "semantic": "getByRole('button', { name: 'Login' })" }
  ]
}
```

**Generated Playwright Code:**
```typescript
import { test, expect } from '@playwright/test';

test('generated test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByLabel('Username:').fill('admin');
  await page.getByLabel('Password:').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
});
```

---

*End of Report.*
