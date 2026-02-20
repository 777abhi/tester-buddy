# Agent Prompt Guide for Tester Buddy

This guide explains how to use `tester-buddy` (invoked via `npm run buddy`) as an autonomous agent tool for exploring websites and generating test automation scripts.

## Introduction

`tester-buddy` is a CLI tool designed to be the "eyes and hands" of an LLM agent. It allows you to:
1.  **Explore** a web page to discover interactive elements.
2.  **Perform Actions** (click, fill, type, scroll) to navigate the application.
3.  **Maintain State** across invocations using session files.
4.  **Extract Information** for writing Playwright tests or manual test cases.

The tool runs in **headless mode** by default when using the `scout explore` command, making it suitable for terminal-only environments.

## Setup

Ensure you are in the project root. The tool is executed via `npm run buddy`.
For detailed command usage and options, see the **[Usage Guide](./usage-guide.md)**.

## Workflow

The standard autonomous loop is: **Explore -> Analyze -> Action -> Verify**.

### 1. Explore (Start Session)

Start by exploring the target URL. **Always** use `--session` to save cookies/localStorage, so you don't lose your place. **Always** use `--json` for machine-readable output.

```bash
npm run buddy -- scout explore <url> --session session.json --json
```

**Output Analysis:**
The JSON output contains:
*   `url`: The current URL (important to track navigation).
*   `title`: Page title.
*   `elements`: List of interactive elements (buttons, inputs, links).

### 2. Analyze & Decide

Parse the JSON. Look for elements relevant to your goal (e.g., a login form, a "Next" button).
*   Identify the `selector` (id, class, or construct one).
*   Decide on an action (`click`, `fill`, `press`).

### 3. Perform Action

Run `scout explore` again on the **current URL** (from the previous step's JSON) with the `--do` flag.

**Syntax:** `--do "action:params"`

*   **Click:** `--do "click:#submit-btn"`
*   **Fill:** `--do "fill:#username:admin"` (Format: `selector:value`)
*   **Press (Keyboard):** `--do "press:Enter"`, `--do "press:Tab"`
*   **Scroll:** `--do "scroll:bottom"`, `--do "scroll:top"`, `--do "scroll:#footer"`
*   **Wait:** `--do "wait:2000"` (milliseconds)
*   **Goto:** `--do "goto:https://example.com/new"`

**Example (Login):**
```bash
npm run buddy -- scout explore <current_url> --session session.json --do "fill:#user:admin" --do "fill:#pass:secret" --do "click:#login" --json
```

### 4. Verify

Check the JSON output of the action command.
*   Did `url` change? (Navigation successful)
*   Are there error messages in `elements`?
*   Is the new content visible?

## Writing Playwright Tests

You can automatically generate a Playwright test script from your exploration session.

1.  **Ensure you used `--session <file>`** during your exploration.
2.  **Run Codegen:**
    ```bash
    npm run buddy -- codegen --session session.json --out tests/generated.spec.ts
    ```
3.  **Refine:**
    Read the generated file and refine assertions if necessary.

**Legacy Method (Manual Prompting):**

"Based on the exploration of [URL], write a Playwright test in TypeScript.
*   Start at [Initial URL].
*   Perform the following steps: [List steps taken].
*   Use the following selectors I discovered:
    *   Username: #user
    *   Password: #pass
    *   Login Button: #login
*   Add assertions for [Expected Result]."

## Manual Test Script Generation

You can also generate manual test cases.

**Prompt Template:**
"Create a manual test case for the Login functionality based on the exploration. Include Preconditions, Steps, and Expected Results."

## Tips for Agents

*   **State Persistence:** Always pass `--session session.json` to every command in a sequence.
*   **Current URL:** Always check the `url` field in the JSON response. If the page navigated, use the *new* URL in the next command.
*   **Truncated Output:** If you are *not* using JSON (text mode), output is summarized for >50 elements. Use `--show-all` to see everything, or prefer `--json`.
*   **Screenshots:** Use `--screenshot` to save a `screenshot.png` if you need visual confirmation (and have tools to view it).
*   **Errors:** If the command fails, check stderr.
*   **Selectors:** Prefer ID (`#id`) or unique attributes. If unavailable, use text selectors or stable classes.

## Command Reference

*   `npm run buddy -- scout explore <url> --json --session <file>`
*   `npm run buddy -- scout explore <url> --do <action> --json --session <file>`
*   `npm run buddy -- scout crawl <url> --json` (Map site structure)
*   `npm run buddy -- scout forms <url> --json` (Analyze forms specifically)
*   `npm run buddy -- codegen --session <file> --out <file>` (Generate test code)
