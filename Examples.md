# Tester Buddy: Comprehensive Usage Guide

This guide provides a deep dive into the capabilities of Tester Buddy, showcasing real-world scenarios for both Exploratory Manual Testers and Autonomous Agents using [Sauce Demo](https://www.saucedemo.com/).

## 👩‍💻 Part 1: The Manual Tester's Toolkit

As an engineer, you want to skip repetitive setup and focus on finding edge cases.

### Scenario A: Skipping the Login Screen (Session Bypass)
Stop typing "standard_user" a hundred times a day.

**1. Capture the State:**
Open the browser, log in manually, and save the session.

```bash
npm run buddy -- --open --url https://www.saucedemo.com/
# ... Manually log in as 'standard_user' in the browser ...
# In the terminal:
dump standard-role
```

**2. Instant Replay:**
Next time, start directly on the inventory page, fully authenticated.

```bash
npm run buddy -- --open --role standard-role --url https://www.saucedemo.com/inventory.html
```

### Scenario B: Data Seeding & State Injection
Need to test the "Cart" page with 5 items but don't want to click "Add" 5 times?

```bash
# Seed 5 items into the cart and open the browser
npm run buddy -- --open --role standard-role --seed-items 5 --url https://www.saucedemo.com/cart.html
```
> **Note:** Requires backend support for the `--seed-items` flag.

### Scenario C: Quick Accessibility & Error Audit
While exploring, you notice a weird UI glitch. Check for underlying issues instantly.

1. **Launch:** `npm run buddy -- --open --url https://www.saucedemo.com/`
2. **Navigate:** Go to the suspicious page.
3. **Audit:** Type `audit` in the terminal.

**Results:**
- "Found 3 Accessibility Violations: [critical] Buttons must have discernible text"
- "Console Warnings: React key prop missing"

### Scenario D: Simulating Backend Failures (Mocks)
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
2.  **Launch**: `npm run buddy -- --open --url https://www.saucedemo.com/checkout-step-two.html`
3.  **Test**: Click "Finish".
    *   **Result**: The browser will receive the 500 error, allowing you to verify if the UI displays a proper error message instead of crashing.

### Scenario E: Capturing a Bug with Zero Effort (Auto-Tracing)
You found a tricky bug but the dev says "works on my machine."

1.  **Reproduce**: Open a session: `npm run buddy -- --open`
2.  **Interact**: Perform the steps that cause the bug.
3.  **Exit**: Type `exit` in the terminal.
4.  **Share**: A `trace.zip` file is automatically created. Send this to the developer.
    *   **Benefit**: They can open it in [trace.playwright.dev](https://trace.playwright.dev) to see a timeline, network logs, and DOM snapshots of exactly what you did.


### Scenario F: Sharing a Bug Repro (Session Sharing)
You found a bug that only happens after a complex setup. Don't make the developer repeat your steps.

1.  **Capture**: In your interactive session, when the bug occurs (or just before), type:
    ```bash
    dump bug-repro-123
    ```
    This creates `bug-repro-123.json`.
2.  **Share**: Send `bug-repro-123.json` to your developer.
3.  **Reproduce**: They run:
    ```bash
    npm run buddy -- --open --url https://www.saucedemo.com/inventory.html --session ./bug-repro-123.json
    ```
    They launch effectively "as you," with your cookies and local storage state.

### Scenario G: Quick Form Validation Audit
You want to verify if the "Checkout" form really requires a POSTAL CODE without trying to submit it empty.

1.  **Run**:
    ```bash
    npm run buddy -- forms https://www.saucedemo.com/checkout-step-one.html --session ./standard-session.json
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

---

## 🤖 Part 2: The Autonomous Agent's Interface

Agents use Tester Buddy to verify flows, scrape structured data, and detect bugs without vision.

### Scenario A: Mapping the UI (Exploration)
Agent wants to know what's on the login page to decide what to do next.

```bash
npm run buddy -- explore https://www.saucedemo.com/ --json
```
**Agent Interpretation:** *"I see a user input (#user-name), a password input (#password), and a login button (#login-button). I should fill these to proceed."*

### Scenario B: Verifying a "Happy Path" (Login & Shop)
Agent executes a multi-step flow to verify the "Add to Cart" feature works.

```bash
npm run buddy -- explore https://www.saucedemo.com/ \
  --do "fill:#user-name:standard_user" \
  --do "fill:#password:secret_sauce" \
  --do "click:#login-button" \
  --do "click:#add-to-cart-sauce-labs-backpack" \
  --do "wait:1000" \
  --expect "text:1" \
  --expect "selector:.shopping_cart_badge"
```
**Result:** ✅ Expectation passed: Selector `.shopping_cart_badge` found.

### Scenario C: Bug Hunting (Negative Testing)
Agent tests if a locked-out user is correctly blocked.

```bash
npm run buddy -- explore https://www.saucedemo.com/ \
  --do "fill:#user-name:locked_out_user" \
  --do "fill:#password:secret_sauce" \
  --do "click:#login-button" \
  --expect "text:Epic sadface: Sorry, this user has been locked out."
```
**Result:** ✅ Expectation passed: Text "Epic sadface..." found.

### Scenario D: Analyzing Complex Forms
Agent encounters a checkout form and needs to know required fields.

```bash
npm run buddy -- forms https://www.saucedemo.com/checkout-step-one.html --session ./standard-session.json --json
```

**Output:**
```json
[
  {
    "id": "checkout_info",
    "inputs": [
      { "name": "firstName", "required": true, "type": "text" },
      { "name": "lastName", "required": true, "type": "text" },
      { "name": "postalCode", "required": true, "type": "text" }
    ]
  }
]
```

### Scenario E: Generating a Regression Test
Agent converts its successful exploration into a permanent test file.

```bash
npm run buddy -- codegen --title "SauceDemo Checkout Flow" --out tests/checkout.spec.ts
```
*(Proposed Feature)*

---

## 🌍 Part 3: Examples from Famous Test Sites

See how Tester Buddy handles diverse web elements and app styles.

### 1. The Internet (Herokuapp) - Dynamic Controls
Testing asynchronous UI changes (waiting for elements to appear/disappear).
**URL:** [https://the-internet.herokuapp.com/dynamic_controls](https://the-internet.herokuapp.com/dynamic_controls)

```bash
npm run buddy -- explore https://the-internet.herokuapp.com/dynamic_controls \
  --do "click:#checkbox" \
  --do "click:#btn" \
  --do "wait:3000" \
  --expect "text:It's gone!"
```

### 2. TodoMVC (React) - Double Click & State
Testing complex interactions like double-clicking to edit.
**URL:** [https://demo.playwright.dev/todomvc/](https://demo.playwright.dev/todomvc/)

```bash
# Add a todo item
npm run buddy -- explore https://demo.playwright.dev/todomvc/ \
  --do "fill:.new-todo:Buy Milk" \
  --do "click:.new-todo" \
  --expect "text:Buy Milk"
```

### 3. Automation Exercise - Contact Form
Filling a multi-field contact form and uploading a file.
**URL:** [https://automationexercise.com/contact_us](https://automationexercise.com/contact_us)

```bash
npm run buddy -- explore https://automationexercise.com/contact_us \
  --do "fill:[name='name']:Tester" \
  --do "fill:[name='email']:test@example.com" \
  --do "fill:[name='subject']:Feedback" \
  --do "fill:#message:Great tool!" \
  --do "click:[name='submit']" \
  --expect "text:Success! Your details have been submitted successfully."
```

### 4. Wikipedia - Search Flow
**Scenario**: searching for a topic and verifying the result page.
**URL:** [https://www.wikipedia.org/](https://www.wikipedia.org/)

```bash
npm run buddy -- explore https://www.wikipedia.org/ \
  --do "fill:#searchInput:Software testing" \
  --do "click:.pure-button-primary-progressive" \
  --expect "text:Software testing"
```

### 5. Hacker News - Navigation
**Scenario**: Verifying navigation between "Top" and "New" stories.
**URL:** [https://news.ycombinator.com/](https://news.ycombinator.com/)

```bash
npm run buddy -- explore https://news.ycombinator.com/ \
  --do "click:text=new" \
  --expect "url:newest"
```

---

## 🛠 Advanced Configuration

### `buddy.config.json`
Define reusable testing roles and network mocks.

```json
{
  "roles": {
    "problem_user": {
      "cookies": [],
      "localStorage": { "session-username": "problem_user" }
    }
  },
  "mocks": [
    {
      "urlPattern": "**/*.jpg",
      "method": "GET",
      "response": { "status": 404, "body": "" }
    }
  ]
}
```

**Usage:**
```bash
npm run buddy -- --open --url https://www.saucedemo.com/ --mock-images
```