# Tester Buddy

Tester Buddy is a CLI-based utility designed to assist manual exploratory testers by automating repetitive tasks and providing testing aids directly within a browser session. It leverages Playwright for browser automation and Axe Core for accessibility audits.

## Features

- **Interactive Browser Session**: Launches a Chromium browser instance ready for manual testing.
- **Configurable Target URL**: Start the session directly at a specific URL.
- **Automated Tracing**: Automatically records a Playwright trace (screenshots, snapshots, sources) of your session.
- **User Role Injection**: Quickly inject user session state (cookies, local storage) for different roles (e.g., admin, customer).
- **Data Seeding**: Mock data seeding to prepare the test environment.
- **Session Capture & Replay**: Capture real session state (cookies, localStorage) and replay it to bypass logins.
- **Accessibility Auditing**: Integrated Axe Core accessibility scans.
- **Console Monitoring**: Captures console errors during your session.

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

## Usage

Run the tool using `npm run buddy` followed by the desired options.

### Basic Command

```bash
npm run buddy -- [options]
```

### Options

| Option | Description |
| :--- | :--- |
| `--open` | Launch the interactive browser session. Required for most interactive features. |
| `--url <url>` | Start session at a specific URL. Requires `--open`. |
| `--role <role>` | Inject a specific user role (e.g., `admin`, `customer`). Sets cookies and local storage. Requires `--open`. |
| `--seed-items <count>` | Mock seeding a specific number of items to the backend. |
| `-V, --version` | Output the version number. |
| `-h, --help` | Display help for command. |

### Interactive Commands

Once the session is running (with `--open`), you can type commands into the terminal:

-   `audit`: Runs a quick audit on the current page.
    -   **Accessibility**: Scans for violations using `@axe-core/playwright`.
    -   **Console Errors**: Reports any console errors captured during the session.
-   `exit`: Closes the browser and saves the session trace.

### Output

Upon exiting the session, a Playwright Trace file is saved to the current directory with the name format:
`trace-<timestamp>.zip`

You can view this trace by uploading it to [trace.playwright.dev](https://trace.playwright.dev/) or using the Playwright CLI:
```bash
npx playwright show-trace trace-<timestamp>.zip
```

## Session Management (New!)

Tester Buddy now supports capturing and replaying real-world sessions, allowing you to bypass complex login flows.

### 1. Capture a Session
1.  Launch the tool: `npx ts-node src/cli.ts --open --url https://example.com`
2.  Log in manually on the site.
3.  In the terminal, type:
    ```bash
    dump my-role-name
    ```
    *(If you don't provide a name, it defaults to `captured-session`)*
4.  This automatically saves your cookies and localStorage to `buddy.config.json`.

### 2. Replay a Session
Launch the tool with the `--role` flag to inject the captured state:

```bash
npx ts-node src/cli.ts --open --url https://example.com/dashboard --role my-role-name
```

The tool will:
1.  Launch the browser.
2.  Inject the cookies and localStorage for `my-role-name`.
3.  **Navigate** to the target URL (e.g., `/dashboard`), bypassing the login screen.

---

## Contributinguration

You can customize the behavior of Tester Buddy by creating a `buddy.config.json` file in the current directory. This allows you to define custom cookies and local storage for different user roles.

### Example `buddy.config.json`

```json
{
  "roles": {
    "admin": {
      "cookies": [
        {
          "name": "session_id",
          "value": "admin-secret-token",
          "domain": "localhost",
          "path": "/"
        }
      ],
      "localStorage": {
        "theme": "dark",
        "notifications": "enabled"
      }
    },
    "customer": {
      "cookies": [],
      "localStorage": {
        "cart_id": "12345"
      }
    }
  }
}
```

## Roadmap & Future Features

We are constantly looking to improve Tester Buddy. Here are some ideas for future development:

1.  **Network Mocking**: Enable defining mock API responses for specific routes to test edge cases or backend failures.
2.  **Heuristic Testing Tools**:
    -   **Form Filler**: Automatically fill forms with valid/invalid data.
    -   **Bug Magnet**: Inject common problematic inputs (e.g., SQL injection strings, XSS vectors, long strings) into focused fields.
3.  **Device Emulation**: Support for emulating mobile devices (viewports, user agents) to test responsiveness.
4.  **Visual Regression Helpers**: Ability to take a "baseline" screenshot and compare it against the current state during the session.
5.  **Issue Tracker Integration**: Create Jira/GitHub issues directly from the CLI, automatically attaching the trace and screenshots.
6.  **Screenshot Management**: Easier way to take labeled screenshots during session.
7.  **Session Replay**: Ability to replay a recorded session (from trace).
8.  **Custom Javascript Injection**: Inject custom JS snippets into the page.
9.  **Cookie/Storage Editor**: Simple CLI command to list/edit cookies/local storage.
10. **Performance Metrics**: Collect basic performance metrics (LCP, CLS) during the session.
11. **AI Assistant**: Integrate an LLM to analyze the page content and suggest test cases or potential bugs.

## License

ISC
