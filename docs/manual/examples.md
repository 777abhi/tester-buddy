# Manual Tester Examples

This collection of real-world scenarios showcases how to use Tester Buddy as a manual testing sidekick.

## Scenario A: Skipping the Login Screen (Session Bypass)
Stop typing "standard_user" a hundred times a day.

**1. Capture the State:**
Open the browser, log in manually, and save the session.

```bash
npm run buddy -- sidekick --url https://www.saucedemo.com/
# ... Manually log in as 'standard_user' in the browser ...
# In the terminal:
dump standard-role
```

**2. Instant Replay:**
Next time, start directly on the inventory page, fully authenticated.

```bash
npm run buddy -- sidekick --role standard-role --url https://www.saucedemo.com/inventory.html
```

## Scenario B: Data Seeding & State Injection
Need to test the "Cart" page with 5 items but don't want to click "Add" 5 times?

```bash
# Seed 5 items into the cart and open the browser
npm run buddy -- sidekick --role standard-role --seed-items 5 --url https://www.saucedemo.com/cart.html
```
> **Note:** Requires backend support for the `--seed-items` flag.

## Scenario C: Quick Accessibility & Error Audit
While exploring, you notice a weird UI glitch. Check for underlying issues instantly.

1. **Launch:** `npm run buddy -- sidekick --url https://www.saucedemo.com/`
2. **Navigate:** Go to the suspicious page.
3. **Audit:** Type `audit` in the terminal.

**Results:**
- "Found 3 Accessibility Violations: [critical] Buttons must have discernible text"
- "Console Warnings: React key prop missing"

## Scenario D: Simulating Backend Failures (Mocks)
You want to see how the checkout page handles a 500 server error when placing an order.

1.  **Configure**: Edit `buddy.config.json` to mock the API endpoint.
    ```json
    "mocks": [
      {
        "urlPattern": "**/checkout-complete.html",
        "method": "GET",
        "response": { "status": 500, "body": "Internal Server Error" }
      }
    ]
    ```
2.  **Launch**: `npm run buddy -- sidekick --url https://www.saucedemo.com/checkout-step-two.html`
3.  **Test**: Click "Finish".
    *   **Result**: The browser will receive the 500 error, allowing you to verify if the UI displays a proper error message instead of crashing.

## Scenario E: Capturing a Bug with Zero Effort (Auto-Tracing)
You found a tricky bug but the dev says "works on my machine."

1.  **Reproduce**: Open a session: `npm run buddy -- sidekick`
2.  **Interact**: Perform the steps that cause the bug.
3.  **Exit**: Type `exit` in the terminal.
4.  **Share**: A `trace.zip` file is automatically created. Send this to the developer.
    *   **Benefit**: They can open it in [trace.playwright.dev](https://trace.playwright.dev) to see a timeline, network logs, and DOM snapshots of exactly what you did.


## Scenario F: Sharing a Bug Repro (Session Sharing)
You found a bug that only happens after a complex setup. Don't make the developer repeat your steps.

1.  **Capture**: In your interactive session, when the bug occurs (or just before), type:
    ```bash
    dump bug-repro-123
    ```
    This creates `bug-repro-123.json`.
2.  **Share**: Send `bug-repro-123.json` to your developer.
3.  **Reproduce**: They run:
    ```bash
    npm run buddy -- sidekick --url https://www.saucedemo.com/inventory.html --session ./bug-repro-123.json
    ```
    They launch effectively "as you," with your cookies and local storage state.

## Scenario G: Quick Form Validation Audit
You want to verify if the "Checkout" form really requires a POSTAL CODE without trying to submit it empty.

1.  **Run**:
    ```bash
    npm run buddy -- scout forms https://www.saucedemo.com/checkout-step-one.html --session ./standard-session.json
    ```
2.  **Verify Output**:
    ```
    | Label | Type | Name | ID | Required | Current Value |
    |---|---|---|---|---|---|
    | First Name | text | firstName | first-name | true | |
    | Last Name | text | lastName | last-name | true | |
    | Zip/Postal Code | text | postalCode | postal-code | true | |
    ```
    You can instantly see `Required: true` for all fields, confirming the HTML validation attributes are present.
