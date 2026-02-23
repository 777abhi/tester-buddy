# Tester Buddy: Manual Tester Guide

Welcome to the **Manual Tester's Guide** for Tester Buddy. This tool acts as your "sidekick" browser, automating repetitive tasks, managing state, and performing on-demand audits so you can focus on exploratory testing.

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

## 🚀 Getting Started

Launch an interactive browser session:

```bash
npm run buddy -- sidekick --url https://www.saucedemo.com/
```

This opens a Chromium browser. You can interact with it normally.

## 🛠 Key Features

### 1. Instant Session Management (Login Bypass)
Stop manually logging in every time you restart testing.
1.  **Capture**: Log in manually in the opened browser.
2.  **Save**: In your terminal, type:
    ```bash
    dump admin-role
    ```
    This saves specific cookies and localStorage to `buddy.config.json`.
3.  **Replay**: Next time, launch directly as that user:
    ```bash
    npm run buddy -- sidekick --role admin-role --url https://www.saucedemo.com/inventory.html
    ```
    You will start logged in, bypassing the login screen.

### 2. Mock Data Seeding
Need a specific data state? Seed it instantly (requires backend configuration).

This command sends a request to the endpoint configured in `buddy.config.json` under `seeding`.

```bash
npm run buddy -- sidekick --seed-items 50
```

### 3. On-Demand Audits
While testing, type `audit` in the terminal to:
-   Scan the current page for **Accessibility Violations** (using Axe Core).
-   Report any **Console Errors** that occurred during your session.

### 4. Automated Tracing
Every session is automatically recorded. When you type `exit`, a pure Playwright Trace (`trace-<timestamp>.zip`) is saved. You can upload this to [trace.playwright.dev](https://trace.playwright.dev/) to inspect network calls, snapshots, and errors post-mortem.

## 🗺️ Roadmap for Manual Testers

- [x] **Visual Regression Mode**: Take a "baseline" screenshot and automatically highlight differences in future sessions.
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
- [x] **Performance Metrics**: on-demand measurement of Load Time and First Contentful Paint (FCP).
- [ ] **PDF Export**: save the current page as a PDF file.
- [ ] **QR Code Generator**: generate a QR code in terminal for the current URL to open on mobile.
- [ ] **User Agent Switcher**: cycle through common user agents.
- [ ] **Ad/Tracker Blocking**: simulate an environment with ad blockers enabled.
- [ ] **Bypass CSP**: disable Content Security Policy for debugging.

## Useful Links

- **[Examples](./examples.md)**: Real-world scenarios.
- **[Configuration Reference](../common/configuration.md)**: How to set up roles and mocks.
- **[FAQ](../common/faq.md)**: Common questions.
- **[Step-by-Step Walkthrough](./walkthrough.md)**: A complete tour of features.
