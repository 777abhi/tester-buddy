# Tester Buddy

Tester Buddy is a CLI-based utility designed to assist manual exploratory testers by automating repetitive tasks and providing testing aids directly within a browser session. It leverages Playwright for browser automation and Axe Core for accessibility audits.

## Features

- **Interactive Browser Session**: Launches a Chromium browser instance ready for manual testing.
- **Configurable Target URL**: Start the session directly at a specific URL.
- **Automated Tracing**: Automatically records a Playwright trace (screenshots, snapshots, sources) of your session.
- **User Role Injection**: Quickly inject user session state (cookies, local storage) for different roles (e.g., admin, customer).
- **Data Seeding**: Mock data seeding to prepare the test environment.
- **In-Session Audit**: Run quick accessibility and console error checks on demand without leaving the session.

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

## Roadmap & Future Features

We are constantly looking to improve Tester Buddy. Here are some ideas for future development:

1.  **Dynamic Configuration**: Support a configuration file (e.g., `buddy.config.json`) to define custom cookie domains, local storage keys, and other environment-specific settings.
2.  **Network Mocking**: enable defining mock API responses for specific routes to test edge cases or backend failures.
3.  **Heuristic Testing Tools**:
    -   **Form Filler**: Automatically fill forms with valid/invalid data.
    -   **Bug Magnet**: Inject common problematic inputs (e.g., SQL injection strings, XSS vectors, long strings) into focused fields.
4.  **Device Emulation**: Support for emulating mobile devices (viewports, user agents) to test responsiveness.
5.  **Visual Regression Helpers**: Ability to take a "baseline" screenshot and compare it against the current state during the session.
6.  **Issue Tracker Integration**: Create Jira/GitHub issues directly from the CLI, automatically attaching the trace and screenshots.
7.  **Screenshot Management**: Easier way to take labeled screenshots during session.
8.  **Session Replay**: Ability to replay a recorded session (from trace).
9.  **Custom Javascript Injection**: Inject custom JS snippets into the page.
10. **Cookie/Storage Editor**: Simple CLI command to list/edit cookies/local storage.
11. **Performance Metrics**: Collect basic performance metrics (LCP, CLS) during the session.

## License

ISC
