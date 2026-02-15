# WebLens: CLI Web Explorer for LLMs

**WebLens** is a lightweight command-line utility designed to give Large Language Models (LLMs) and Agents "eyes" on the web. It renders web pages into a simplified, text-based format (Markdown tables or JSON) that LLMs can easily parse and understand.

This tool is particularly useful for LLMs operating in a **terminal-only environment** where:
*   There is no visual browser available.
*   The LLM needs to interact with pages (click, fill forms) without writing full Playwright scripts.
*   The LLM needs to maintain session state (cookies, login) across multiple commands.

## Installation

### Prerequisites
*   Python 3.10 or higher
*   Node.js (for Playwright browser binaries)

### Setup
1.  Navigate to the `weblense` directory (or run from root if `requirements.txt` is accessible).
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Install Playwright browsers:
    ```bash
    playwright install
    ```

## Usage

WebLens provides two main commands: `explore` and `forms`.

### Exploring the Page
To visit a URL and list its interactive elements:

```bash
python weblense/weblens.py explore <URL> [OPTIONS]
```

#### Options

*   `--json`: **Agent Mode**. Outputs the page structure in a detailed JSON format including bounding boxes. Perfect for machine parsing.
*   `--session <path>`: Path to a JSON file to save/load cookies and localStorage. Use this to maintain login sessions across commands.
*   `--do <action>`: Perform an action before analyzing. Can be repeated.
    *   **Format**: `action:selector:value` (value is optional for click/wait)
    *   **Examples**:
        *   `--do click:#submit`
        *   `--do fill:#username:myuser`
        *   `--do wait:2000`
*   `--screenshot`: Saves a screenshot of the page to `screenshot.png`.
*   `--show-all`: **Important**. By default, if a page has more than 50 interactive elements, WebLens summarizes them. Use this to force listing **all** elements.

#### Output Format (Markdown)
The default output is a Markdown table with:
*   **Tag**: HTML tag.
*   **Text/Value**: Visible text or value.
*   **ID**: DOM ID.
*   **Class**: Class list.
*   **ARIA-label**: Accessibility label.

#### Output Format (JSON)
When using `--json`, the output is a structured JSON object:
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "elements": [
    {
      "tag": "a",
      "text": "More information...",
      "region": "body",
      "box": { "x": 100, "y": 200, "width": 50, "height": 20 }
    }
  ]
}
```

### Analyzing Forms
To analyze forms on a page and identify robust selectors for input fields:

```bash
python weblense/weblens.py forms <URL>
```

## Agent Workflows

### 1. Stateless Exploration
Get a quick snapshot of a page's interactive elements.
```bash
python weblense/weblens.py explore https://example.com --json
```

### 2. Multi-step Operations (Session Management)
Perform a login flow by chaining commands with a session file.

**Step 1: Go to login page and analyze forms**
```bash
python weblense/weblens.py forms https://github.com/login --session session.json
```

**Step 2: Perform Login**
Use the `--do` flag to fill fields and click the sign-in button in one go.

```bash
python weblense/weblens.py explore https://github.com/login \
  --do "fill:#login_field:myuser" \
  --do "fill:#password:mypassword" \
  --do "click:input[name='commit']" \
  --session session.json
```

**Step 3: Verify Dashboard**
```bash
python weblense/weblens.py explore https://github.com/ --session session.json
```

## Tips for Agents
*   **Use JSON**: Always use `--json` for programmatic access.
*   **Session Persistence**: Always provide a `--session` path.
*   **Chaining Actions**: Use multiple `--do` flags to execute a sequence of actions (fill form -> click submit -> wait).
