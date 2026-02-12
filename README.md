# Tester Buddy

Tester Buddy is a CLI-based utility designed to assist manual exploratory testers by automating repetitive tasks and providing testing aids directly within a browser session. It leverages Playwright for browser automation and Axe Core for accessibility audits.

## Features

- **Interactive Browser Session**: Launches a Chromium browser instance ready for manual testing.
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

1.  **Configurable Target URL**: Allow specifying a starting URL via a flag or config file, instead of starting at a blank page.
2.  **Dynamic Configuration**: Support a configuration file (e.g., `buddy.config.json`) to define custom cookie domains, local storage keys, and other environment-specific settings.
3.  **Network Mocking**: enable defining mock API responses for specific routes to test edge cases or backend failures.
4.  **Heuristic Testing Tools**:
    -   **Form Filler**: Automatically fill forms with valid/invalid data.
    -   **Bug Magnet**: Inject common problematic inputs (e.g., SQL injection strings, XSS vectors, long strings) into focused fields.
5.  **Device Emulation**: Support for emulating mobile devices (viewports, user agents) to test responsiveness.
6.  **Visual Regression Helpers**: Ability to take a "baseline" screenshot and compare it against the current state during the session.
7.  **Issue Tracker Integration**: Create Jira/GitHub issues directly from the CLI, automatically attaching the trace and screenshots.

## License

ISC
