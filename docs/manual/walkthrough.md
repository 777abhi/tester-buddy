# Manual Tester Walkthrough: Explore All Features

This guide provides a step-by-step walkthrough to help you explore every feature of Tester Buddy's "Sidekick" mode. Follow these steps to master the tool.

## Prerequisites
- Node.js installed.
- Repository cloned and dependencies installed (`npm install`).

## Step 1: Launch Your First Sidekick Session
The `sidekick` command opens a browser that you control, but with superpowers.

1.  Run the command:
    ```bash
    npm run buddy -- sidekick --url https://www.saucedemo.com/
    ```
2.  A Chromium browser will open.
3.  **Action**: Log in manually with:
    -   Username: `standard_user`
    -   Password: `secret_sauce`

## Step 2: Capture Your Session (Login Bypass)
Instead of logging in every time, let's save this state.

1.  In the terminal where `sidekick` is running, type:
    ```bash
    dump my-session
    ```
2.  You should see a confirmation that `my-session` was saved to `buddy.config.json` (or a session file).
3.  Type `exit` to close the browser.

## Step 3: Replay the Session
Now, let's launch directly into the inventory page, bypassing the login screen.

1.  Run:
    ```bash
    npm run buddy -- sidekick --role my-session --url https://www.saucedemo.com/inventory.html
    ```
2.  **Observe**: You land directly on the inventory page. No login required!

## Step 4: Perform an On-Demand Audit
Let's check the page for accessibility issues and errors.

1.  In your running session, navigate to the "Cart" page (click the cart icon).
2.  In the terminal, type:
    ```bash
    audit
    ```
3.  **Observe**: The terminal will print a report of:
    -   Accessibility violations (Axe-core).
    -   Any console errors that happened in the background.

## Step 5: Test with Mocked Data (Seeding)
*Note: This feature requires the backend to support the seeding endpoint defined in `buddy.config.json`.*

If configured, you can inject data.
1.  Run:
    ```bash
    npm run buddy -- sidekick --seed-items 5 --url https://www.saucedemo.com/cart.html
    ```
2.  **Observe**: If the backend supports it, your cart would start with 5 items.

## Step 6: Visual Regression Check
Let's see if the page looks correct compared to a baseline.

1.  **Capture Baseline**:
    ```bash
    npm run buddy -- scout visual https://www.saucedemo.com/ --out baseline.png
    ```
2.  **Compare**:
    ```bash
    npm run buddy -- scout visual https://www.saucedemo.com/ --base baseline.png --out diff.png
    ```
3.  **Check**: If they match, it passes. If not, `diff.png` highlights the changes.

## Step 7: Analyze the Trace
Every session records a Playwright trace.

1.  If you have a session open, type `exit`.
2.  Look in your folder for a file named `trace-<timestamp>.zip`.
3.  Go to [trace.playwright.dev](https://trace.playwright.dev/).
4.  Upload the zip file.
5.  **Explore**: You can scrub through your entire timeline, see screenshots, network requests, and console logs for every second of your session.

## Summary
You have now:
-   [x] Bypassed login with Session Management.
-   [x] Audited a page for a11y issues.
-   [x] Learned how to use Data Seeding.
-   [x] Performed a Visual Check.
-   [x] Inspected a Debug Trace.

Happy Testing!
