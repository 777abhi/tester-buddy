# Tester Buddy: LLM Agent Guide

This is the **authoritative manual** for autonomous agents (e.g., GPT-4.1) using the `tester-buddy` CLI. It describes how to interact with websites, maintain state, and verify actions without human intervention.

## 🤖 Core Directives for Autonomous Agents

1.  **Always Use JSON**: Append `--json` to every command. Text output is for humans; JSON is for you.
2.  **Maintain State**: Always use `--session ./session.json` (or a unique path) to persist cookies and local storage across commands. Without this, every command starts a fresh, empty browser session.
3.  **Monitor Errors**: Use `--monitor-errors` when critical actions (like form submission) occur to catch hidden 404s/500s or console exceptions.
4.  **Verify Navigation**: Always check the `url` field in the JSON response to confirm if a navigation action (click/goto) succeeded.
5.  **Sequential Execution**: You must execute commands one by one. The state file bridges the gap between executions.

## 🛠 Command Reference

The entry point is `npm run buddy -- <command> [options]`.

### 1. `scout explore`: The Eyes and Hands
Your primary tool to see the page and interact with it.

**Syntax:**
```bash
npm run buddy -- scout explore <url> --json --session <path> [options]
```

**Options:**
*   `--do "action:params"`: Perform an action. Can be repeated for a sequence.
    *   `click:<selector>`: Click an element (e.g., `click:#submit`).
    *   `fill:<selector>:<value>`: Fill an input (e.g., `fill:#user:admin`).
    *   `press:<key>`: Press a key (e.g., `press:Enter`, `press:Tab`).
    *   `scroll:<target>`: Scroll page (e.g., `scroll:bottom`, `scroll:#footer`).
    *   `wait:<ms>`: Wait for X milliseconds (e.g., `wait:2000`).
    *   `goto:<url>`: Navigate to a URL.
*   `--expect "type:value"`: Verify state.
    *   `text:<string>`: Page contains text.
    *   `selector:<selector>`: Element exists.
    *   `url:<string>`: URL contains string.
*   `--monitor-errors`: Fail if network/console errors occur.
*   `--performance`: Include performance metrics in JSON.
*   `--screenshot`: Save `screenshot.png` (useful if you have vision capabilities).

**JSON Output Schema:**
```json
{
  "url": "https://example.com/dashboard",
  "title": "Dashboard",
  "elements": [
    {
      "tag": "button",
      "text": "Submit",
      "id": "submit-btn",
      "className": "btn primary",
      "ariaLabel": "",
      "region": "form#login",
      "isAlert": false
    }
  ],
  "performance": { ... } // if --performance used
}
```

### 2. `scout crawl`: The Map
Discover the structure of a website to find all reachable pages.

**Syntax:**
```bash
npm run buddy -- scout crawl <url> --json --depth 2
```

**JSON Output Schema:**
Array of objects:
```json
[
  {
    "url": "https://example.com/about",
    "status": 200,
    "links": ["https://example.com/team", ...],
    "error": null
  }
]
```

### 3. `scout forms`: The Analyst
Deep dive into forms to understand required fields and input types.

**Syntax:**
```bash
npm run buddy -- scout forms <url> --json --session <path>
```

**JSON Output Schema:**
Array of form groups:
```json
[
  {
    "id": "login-form",
    "inputs": [
      { "type": "text", "name": "user", "required": true, "value": "" }
    ]
  }
]
```

### 4. `codegen`: The Scribe
Convert your session history into a permanent Playwright test file.

**Syntax:**
```bash
npm run buddy -- codegen --session <path> --out <path>
```

### 5. `scout visual`: Visual Verification
Compare the current page appearance against a baseline image to detect visual regressions.

**Syntax:**
```bash
# Capture a baseline
npm run buddy -- scout visual <url> --out baseline.png

# Compare current state with baseline
npm run buddy -- scout visual <url> --base baseline.png --out diff.png
```

### 6. `scout fuzz`: Stress Testing
Automated stress testing of input fields to find crashes and errors.

**Syntax:**
```bash
npm run buddy -- scout fuzz <url>
```

---

## 🔄 Standard Workflows

### Workflow 1: Autonomous Exploration & Verification

**Goal**: Navigate to a page, perform an action, and verify the result.

1.  **Inspect**: Start by exploring the initial URL.
    ```bash
    npm run buddy -- scout explore https://example.com --json --session ./session.json
    ```
2.  **Analyze**: Parse the `elements` list in the JSON. Find the element you want (e.g., a button with text "Login").
    *   *Self-Correction*: If multiple elements look similar, prioritize those with `id` or unique `aria-label`.
3.  **Act**: Execute the action using the selector found.
    ```bash
    npm run buddy -- scout explore https://example.com \
      --do "fill:#username:admin" \
      --do "fill:#password:secret" \
      --do "click:#login-btn" \
      --json --session ./session.json --monitor-errors
    ```
    *Note: We reuse the URL from the previous step, but if the `click` causes navigation, the `scout explore` command will handle it. However, it's best practice to use the *current* URL returned in the previous JSON.*
4.  **Verify**: Check the new JSON output.
    *   Did `url` change? (Successful navigation)
    *   Are there error alerts (check `isAlert: true` in elements)?
    *   Did the expected element appear?

### Workflow 2: Test Generation

**Goal**: Create a regression test from an exploration session.

1.  **Record**: Perform your exploration steps (Workflow 1), ensuring `--session ./session.json` is passed to *every* command.
2.  **Generate**:
    ```bash
    npm run buddy -- codegen --session ./session.json --out tests/generated_test.spec.ts
    ```
3.  **Refine**: (Optional) Read the generated file and improve assertions if needed.

### Workflow 3: Site Mapping

**Goal**: Understand the layout of a documentation site or blog.

1.  **Crawl**:
    ```bash
    npm run buddy -- scout crawl https://example.com/docs --depth 2 --json
    ```
2.  **Analyze**: Look for 404s in the output to report broken links. Use the list of URLs to plan further `scout explore` tasks.

---

## 🧠 Mental Model for Agents

*   **State is a File**: You have no persistent browser process. The `session.json` file is your memory. If you delete it or forget to include it, you have amnesia.
*   **Selectors**:
    *   Best: ID (`#submit`)
    *   Good: Attribute (`[data-testid="submit"]`)
    *   Okay: Class (`.btn-primary`) - risky if multiple exist.
    *   Avoid: Complex XPath or brittle paths.
*   **Wait Strategy**: The tool has built-in waiting, but for heavy SPAs, adding a `--do "wait:1000"` after a click can prevent reading the DOM before it updates.
*   **Error Recovery**:
    *   If a selector fails, check the `elements` list again. Did the ID change?
    *   If network errors occur (found via `--monitor-errors`), report them.
    *   If the page is empty, try increasing `wait` or checking if it requires a login you missed.

## ⚠️ Troubleshooting

*   **"Selector not found"**: The page might have changed or loaded slowly.
    *   *Fix*: Run `scout explore` again without actions to see the current state.
*   **"Session not found"**: You forgot to create it or passed the wrong path.
    *   *Fix*: The first `scout explore` creates the file if it doesn't exist.
*   **Navigation loop**: You keep seeing the same page after clicking.
    *   *Fix*: The click might not have triggered. Try `click` again, or check if the button is actually a link and use `goto` with the `href`.

## 🗺️ Roadmap for Agents

- [x] **Site Crawling & Mapping (`scout crawl`)**: Map site structure.
- [x] **Network & Console Monitoring**: Catch invisible bugs.
- [x] **Visual Sitemap Generator**: Generate DOT/Mermaid graphs.
- [x] **Test Code Generation (`codegen`)**: Convert session to Playwright test.
- [x] **Visual Change Detection**: Compare screenshots.
- [x] **Smart Form Fuzzing**: Automated stress testing.
- [ ] **Interactive REPL Mode**: Instant feedback loop.
- [ ] **`--vision` Mode**: Screenshot analysis for multimodal models.
- [ ] **Self-Healing Selectors**: Automatic recovery from brittle selectors.
- [ ] **Automatic Retry**: Robustness for flaky networks.
- [ ] **Semantic Search**: Find elements by description.

## Useful Links

- **[Examples](./examples.md)**: Agent-specific scenarios.
- **[Configuration Reference](../common/configuration.md)**: Mocking and roles.
- **[Step-by-Step Walkthrough](./walkthrough.md)**: A complete tour of features.
