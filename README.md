# Tester Buddy

Tester Buddy is a CLI-based utility designed to bridge the gap between manual exploratory testing and automated browser interactions. It serves two primary audiences:
1.  **Exploratory Manual Testers**: Provides a powerful "sidekick" browser that handles repetitive tasks, state injection, and accessibility audits.
2.  **Chat LLM Agents**: Offers a text-based interface to "see" and "interact" with web pages, enabling agents to autonomously verify UI, fill forms, and validate flows without a GUI.

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
npm run buddy -- --open --url https://example.com
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
    npm run buddy -- --open --role admin-role --url https://example.com/dashboard
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
npm run buddy -- explore https://example.com --json
```

**What you get:**
-   **Interactive Elements**: Links, buttons, inputs (filtered for visibility).
-   **Accessibility Info**: ARIA labels, roles.
-   **Structure**: Elements grouped by functional areas.

**Tip:** Use the `--json` flag for easier parsing, or omit it for a Markdown summary that uses fewer tokens.

### ✍️ How to "Act" on a Page

You can chain actions to simulate a user flow and verify the result in a single command.

**Example: Search for "Updates"**
```bash
npm run buddy -- explore https://example.com \
  --do "fill:#search-input:Updates" \
  --do "click:.search-button" \
  --do "wait:2000" \
  --expect "text:Search Results"
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
npm run buddy -- forms https://example.com/signup --json
```

**Returns:**
-   Form groups.
-   Input types, names, IDs, required status, and current values.

### 🧠 Persistent Memory for Agents

Agents can maintain "state" across different command executions using the `--session` flag.

1.  **Login and Save State:**
    ```bash
    npm run buddy -- explore https://example.com/login \
      --do "fill:#user:admin" \
      --do "fill:#pass:secret" \
      --do "click:#login-btn" \
      --session ./admin-session.json
    ```

2.  **Reuse State (Start Logged In):**
    ```bash
    npm run buddy -- explore https://example.com/admin \
      --session ./admin-session.json
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

## License

ISC
