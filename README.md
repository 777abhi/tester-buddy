# Tester Buddy

Tester Buddy is a CLI-based utility designed to bridge the gap between manual exploratory testing and automated browser interactions. It serves two primary audiences:
1.  **Exploratory Manual Testers**: Provides a powerful "sidekick" browser that handles repetitive tasks, state injection, and accessibility audits.
2.  **Chat LLM Agents**: Offers a text-based interface to "see" and "interact" with web pages, enabling agents to autonomously verify UI, fill forms, and validate flows without a GUI.

---

**[📚 Click here for a Comprehensive Demo Guide & Examples](./Examples.md)**

---

## Installation

Ensure you have Node.js installed (v16+ recommended).

1.  Clone the repository:
    ```bash
    git clone https://github.com/777abhi/tester-buddy.git
    cd tester-buddy
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

---

## 👩‍💻 Section 1: For Exploratory Manual Testers

As a manual tester, you often need to jump into specific states (like "Admin with items in cart") or quickly check for hidden issues (like accessibility violations or console errors) without opening DevTools constantly. Tester Buddy acts as your automated assistant.

### 🚀 Getting Started

Launch an interactive browser session:

```bash
npm run buddy -- --open --url https://www.saucedemo.com/
```

This opens a Chromium browser. You can interact with it normally.

### 🛠 Key Features for Manual Testing

#### 1. Instant Session Management (Login Bypass)
Stop manually logging in every time you restart testing.
1.  **Capture**: Log in manually in the opened browser.
2.  **Save**: In your terminal, type:
    ```bash
    dump admin-role
    ```
    This saves specific cookies and localStorage to `buddy.config.json`.
3.  **Replay**: Next time, launch directly as that user:
    ```bash
    npm run buddy -- --open --role admin-role --url https://www.saucedemo.com/inventory.html
    ```
    You will start logged in, bypassing the login screen.

#### 2. Mock Data Seeding
Need a specific data state? Seed it instantly (requires backend configuration).
```bash
npm run buddy -- --open --seed-items 50
```

#### 3. On-Demand Audits
While testing, type `audit` in the terminal to:
-   Scan the current page for **Accessibility Violations** (using Axe Core).
-   Report any **Console Errors** that occurred during your session.

#### 4. Automated Tracing
Every session is automatically recorded. When you type `exit`, a pure Playwright Trace (`trace-<timestamp>.zip`) is saved. You can upload this to [trace.playwright.dev](https://trace.playwright.dev/) to inspect network calls, snapshots, and errors post-mortem.

---

## 🤖 Section 2: For Chat LLM Agents (Terminal Only)

As an AI agent, you don't have eyes or a mouse. Tester Buddy gives you a "textual viewport" and "action capability" to autonomously explore and test web applications.

### 🔍 How to "See" a Page

Use the `explore` command to get a structured, LLM-friendly representation of the page.

```bash
# Get a JSON dump of all interactive elements
npm run buddy -- explore https://www.saucedemo.com/ --json
```

**What you get:**
-   **Interactive Elements**: Links, buttons, inputs (filtered for visibility).
-   **Accessibility Info**: ARIA labels, roles.
-   **Structure**: Elements grouped by functional areas.

**Tip:** Use the `--json` flag for easier parsing, or omit it for a Markdown summary that uses fewer tokens.

### ✍️ How to "Act" on a Page

You can chain actions to simulate a user flow and verify the result in a single command.

**Example: Login Flow Verification**
```bash
npm run buddy -- explore https://www.saucedemo.com/ \
  --do "fill:#user-name:standard_user" \
  --do "fill:#password:secret_sauce" \
  --do "click:#login-button" \
  --do "wait:2000" \
  --expect "text:Swag Labs"
```

**Supported `--do` Actions:**
-   `click:<selector>`: Click an element.
-   `fill:<selector>:<value>`: Type text into an input.
-   `goto:<url>`: Navigate to a new URL.
-   `wait:<ms>`: Pause execution (useful for waiting for animations).

**Supported `--expect` Verifications:**
-   `text:<value>`: Verify page contains specific text.
-   `selector:<value>`: Verify an element exists.
-   `url:<value>`: Verify the current URL contains a string.

### 📝 Handling Forms

Use the `forms` command to specifically analyze input fields, understanding what data is required.

```bash
```bash
npm run buddy -- forms https://www.saucedemo.com/ --json
```

**Returns:**
-   Form groups.
-   Input types, names, IDs, required status, and current values.

### 🧠 Persistent Memory for Agents

Agents can maintain "state" across different command executions using the `--session` flag.

1.  **Login and Save State:**
    ```bash
    npm run buddy -- explore https://www.saucedemo.com/ \
      --do "fill:#user-name:standard_user" \
      --do "fill:#password:secret_sauce" \
      --do "click:#login-button" \
      --session ./standard-session.json
    ```

2.  **Reuse State (Start Logged In):**
    ```bash
    ```bash
    npm run buddy -- explore https://www.saucedemo.com/inventory.html \
      --session ./standard-session.json
    ```

---

## Configuration (`buddy.config.json`)

You can pre-define mocked network responses and user roles in `buddy.config.json`.

```json
{
  "roles": {
    "admin": {
      "cookies": [{ "name": "session", "value": "..." }],
      "localStorage": { "theme": "dark" }
    }
  },
  "mocks": [
    {
      "urlPattern": "**/api/data",
      "method": "GET",
      "response": { "status": 200, "body": { "id": 1 } }
    }
  ]
}
```

## 🗺️ Roadmap & Future Features

We are actively working on making Tester Buddy even more powerful. Here is what is coming next:

### 🚀 Proposed Agentic Capabilities
- [ ] **Site Crawling & Mapping (`crawl`)**:
    - **Goal**: Allow agents to autonomous map out an application without manually navigating every link.
    - **Usage**: `npm run buddy -- crawl https://www.saucedemo.com/ --depth 2`
    - **Benefits**: Automatically discovers all reachable pages, reports broken links (404s), and generates a "sitemap" JSON.

- [ ] **Test Code Generation (`codegen`)**:
    - **Goal**: Directly convert an exploration session into a robust Playwright test file.
    - **Usage**: `npm run buddy -- codegen --session ./my-session.json --out tests/new-flow.spec.ts`
    - **Benefits**: Removes boilerplate, ensures selector consistency, and includes expectations automatically.

- [ ] **Network & Console Monitoring**:
    - **Goal**: Catch invisible functionality bugs (API failures, JS errors) during exploration.
    - **Usage**: `npm run buddy -- explore <url> --monitor-errors`
    - **Benefits**: Fails if network requests error (4xx/5xx) or console errors occur, detecting issues visible UI might miss.

- [ ] **Visual Change Detection**:
    - **Goal**: Help agents "see" unplanned visual changes.
    - **Usage**: `npm run buddy -- explore <url> --diff baseline.png`
    - **Benefits**: Returns similarity score/description of visual changes, identifying CSS regressions.

- [ ] **Smart Form Fuzzing**:
    - **Goal**: Automated stress testing of input fields.
    - **Usage**: `npm run buddy -- fuzz <url>`
    - **Benefits**: Injects boundary values to crash test forms and report stack traces.

- [ ] **Interactive REPL Mode**:
    - **Goal**: Faster feedback loop for agents.
    - **Usage**: `npm run buddy -- repl`
    - **Benefits**: Keeps browser open for instant JSON command/result cycle, removing launch overhead.

### For Manual Testers
- [ ] **Visual Regression Mode**: Take a "baseline" screenshot and automatically highlight differences in future sessions.
- [ ] **Mobile Device Emulation**: simple text command to switch viewport and user-agent (e.g., `device iphone-14`).
- [ ] **Markdown Bug Report**: `report bug` command that auto-generates a ticket with trace, screenshots, and logs.
- [ ] **Network Throttling**: simulate 3G/4G networks to test performance under poor conditions.
- [ ] **Session Video Recording**: record the entire session as .mp4 for easy sharing.
- [ ] **GIF Creation**: create a GIF of the last 30 seconds of interaction for quick bug demos.
- [ ] **Screenshot Annotation**: draw arrows and text on screenshots directly from the CLI before saving.
- [ ] **Geolocation Override**: set custom latitude/longitude to test location-based features.
- [ ] **Timezone Travel**: override system timezone to test date/time logic.
- [ ] **Locale/Language Switching**: instantly change browser language (e.g., `locale fr-FR`) to test i18n.
- [ ] **Dark/Light Mode Toggle**: switch OS preference simulation on the fly.
- [ ] **Accessibility Spotlight**: highlight all elements with a11y issues directly on the page.
- [ ] **Broken Link Checker**: scan current page for 404 links.
- [ ] **Form Filler**: populate forms with realistic dummy data (names, emails, addresses).
- [ ] **Cookie Editor**: view, add, or delete cookies via CLI commands.
- [ ] **LocalStorage Viewer**: dump local storage contents to terminal.
- [ ] **Session Restore**: drag-and-drop a previous session file to restore state.
- [ ] **Element Highlighter**: target elements with CSS selectors to visualize them on page.
- [ ] **Performance Metrics**: on-demand measurement of LCP, CLS, and FID.
- [ ] **PDF Export**: save the current page as a PDF file.
- [ ] **QR Code Generator**: generate a QR code in terminal for the current URL to open on mobile.
- [ ] **User Agent Switcher**: cycle through common user agents.
- [ ] **Ad/Tracker Blocking**: simulate an environment with ad blockers enabled.
- [ ] **Bypass CSP**: disable Content Security Policy for debugging.

### For Chat LLM Agents
- [ ] **`--cleanup-html`**: specific flag to strip clear/styles/svgs from the explore output, saving token context window.
- [ ] **`--vision` Mode**: new command to take a screenshot and return a simplified layout description (or bounding boxes) for multimodal models.
- [ ] **Self-Healing Selectors**: if a selector fails, the CLI will try to find the element by text or other attributes automatically.
- [ ] **Automatic Retry**: built-in robustness for flaky network operations.
- [ ] **DOM Snapshot with Computed Styles**: get precise styling info for layout verification.
- [ ] **Accessibility Name Calculation**: prompt for the computed accessible name of an element.
- [ ] **Visibility Check**: API to verify if an element is obscured by another.
- [ ] **Event Listener Inspection**: list all events attached to an element.
- [ ] **Hover Simulation**: trigger hover states on elements.
- [ ] **Drag and Drop API**: simulated drag and drop interactions.
- [ ] **File Upload**: handle file input elements via path.
- [ ] **Native Dialog Handling**: auto-accept/dismiss alerts and confirms.
- [ ] **Log Retrieval**: fetch console and network logs since the last command.
- [ ] **Markdown Output Mode**: formatted specifically effectively for reading.
- [ ] **Semantic Search**: find elements by meaning/description (e.g., "search button") without selectors.
- [ ] **Auto-Summarization**: condense page content into a brief summary.
- [ ] **Tabular Data Extraction**: convert HTML tables to JSON/CSV.
- [ ] **Readability View**: extract main article content, removing navigation/ads.
- [ ] **Regex Text Search**: verify page content matches a regex pattern.
- [ ] **Network Idle Wait**: intelligent waiting for network quiescence.
- [ ] **DOM Event Wait**: wait for a specific custom event to fire.
- [ ] **Arbitrary Script Execution**: run a provided Playwright script string.
- [ ] **Element Screenshot**: capture just a specific element as base64.
- [ ] **Tree-Based Exploration**: explore DOM by traversing children/parent nodes.

---


## License

ISC
