# WebLens: CLI Web Explorer for LLMs

**WebLens** is a lightweight command-line utility designed to give Large Language Models (LLMs) "eyes" on the web. It renders web pages into a simplified, text-based format (Markdown tables) that LLMs can easily parse and understand.

This tool is particularly useful for LLMs operating in a **terminal-only environment** where:
*   There is no visual browser available.
*   There is no Model Context Protocol (MCP) server (e.g., Puppeteer/Playwright server) to interact with the browser directly.
*   The LLM needs to write robust automation scripts (e.g., Playwright, Selenium) by inspecting the actual DOM structure of a page.

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

WebLens provides a single command `explore` to visit a URL and list its interactive elements.

```bash
python weblense/weblens.py explore <URL> [OPTIONS]
```

### Options

*   `--screenshot`: Saves a screenshot of the page to `screenshot.png`. useful if you have a way to view images, but primarily WebLens focuses on text output.
*   `--show-all`: **Important**. By default, if a page has more than 50 interactive elements, WebLens summarizes them to save context window space. Use this flag to force WebLens to list **all** elements. This is essential when you need to find a specific selector on a complex page.
*   `--help`: Show help message.

### Output Format
The output is a Markdown table with the following columns:
*   **Tag**: The HTML tag (e.g., `a`, `button`, `input`).
*   **Text/Value**: The visible text or value of the element.
*   **ID**: The DOM ID (crucial for reliable scripting).
*   **Class**: The class list.
*   **ARIA-label**: Accessibility label.

## LLM Workflow: From Exploration to Automation

When using WebLens to write test automation scripts (e.g., Playwright), follow this iterative process:

1.  **Explore**: Run WebLens on the target URL.
2.  **Analyze**: Look at the output table to identify the elements you need to interact with. Prioritize using `ID` if available, then unique `Class` names or `Text` content.
3.  **Refine**: If the output is a summary (e.g., "Found 230 elements..."), run the command again with `--show-all` to get the details.
4.  **Script**: Write a Playwright script step-by-step using the selectors found.
5.  **Verify**: If the script involves navigation, you might need to run WebLens on the *next* URL to find selectors for the subsequent steps.

## Example Scenario: Automating a Purchase

**Goal**: Write a Playwright script to add a "Grey Jacket" to the cart on `https://sauce-demo.myshopify.com/`.

### Step 1: Explore the Homepage

**Command:**
```bash
python weblense/weblens.py explore https://sauce-demo.myshopify.com/
```

**Output (Snippet):**
```markdown
| Tag | Text/Value | ID | Class | ARIA-label |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |
| a | Log In | customer_login_link |  |  |
| a | Grey jacket £55.00 | product-1 | animated fadeInUpBig |  |
| a | Noir jacket £60.00 | product-2 | animated fadeInUpBig |  |
...
```

**Analysis:**
We see the "Grey jacket" link has an ID `product-1`. This is a perfect selector.

### Step 2: Explore the Product Page
(We assume clicking `#product-1` leads to the product page. To get selectors for the "Add to Cart" button, we explore the product URL directly.)

**Command:**
```bash
python weblense/weblens.py explore https://sauce-demo.myshopify.com/products/grey-jacket
```

**Output (Snippet):**
```markdown
| Tag | Text/Value | ID | Class | ARIA-label |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |
| select | Grey jacket | product-select-option-0 | single-option-selector |  |
| input | Add to Cart | add | btn add-to-cart |  |
...
```

**Analysis:**
The "Add to Cart" button is an `input` with ID `add`.

### Step 3: Write the Automation Script
Based on the selectors found (`#product-1` and `#add`), we can write a robust Playwright script.

**Generated Script (`test_checkout.py`):**
```python
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=False)
    page = browser.new_page()

    # 1. Go to Home
    print("Navigating to home...")
    page.goto("https://sauce-demo.myshopify.com/")

    # 2. Click on Grey Jacket (Found ID: product-1)
    print("Clicking product...")
    page.click("#product-1")

    # 3. Wait for navigation and Add to Cart (Found ID: add)
    # Good practice to wait for the element to be visible
    page.wait_for_selector("#add")
    print("Adding to cart...")
    page.click("#add")

    # Verification (Optional)
    # We could look for a success message or cart update,
    # but for this example, we just wait a bit to see the result.
    page.wait_for_timeout(3000)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
```

## Tips for LLMs

*   **Handling Summaries**: If WebLens replies with a summary table (e.g., "| Functional Area | Count |"), it means the page is complex. Immediately re-run the command with `--show-all`.
*   **Selector Priority**: Always prefer `ID`. If `ID` is missing, look for unique combinations of `Tag` and `Text`, or `Class`.
*   **Dynamic Content**: WebLens waits for `domcontentloaded`. If a page is heavily dynamic (SPA), some elements might load later. The tool has a short built-in wait, but if you miss elements, they might be loading asynchronously.
*   **Navigation**: WebLens is a static analyzer. It does not maintain a session or follow links automatically. You must explore each URL in your flow manually to build a multi-step script.
