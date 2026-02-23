# Agent Examples

This collection of real-world scenarios showcases how autonomous agents can use Tester Buddy via the `scout` command.

## Scenario A: Mapping the UI (Exploration)
Agent wants to know what's on the login page to decide what to do next.

```bash
npm run buddy -- scout explore https://www.saucedemo.com/ --json
```
**Agent Interpretation:** *"I see a user input (#user-name), a password input (#password), and a login button (#login-button). I should fill these to proceed."*

## Scenario B: Verifying a "Happy Path" (Login & Shop)
Agent executes a multi-step flow to verify the "Add to Cart" feature works.

```bash
npm run buddy -- scout explore https://www.saucedemo.com/ \
  --do "fill:#user-name:standard_user" \
  --do "fill:#password:secret_sauce" \
  --do "click:#login-button" \
  --do "click:#add-to-cart-sauce-labs-backpack" \
  --do "wait:1000" \
  --expect "text:1" \
  --expect "selector:.shopping_cart_badge"
```
**Result:** ✅ Expectation passed: Selector `.shopping_cart_badge` found.

## Scenario C: Bug Hunting (Negative Testing)
Agent tests if a locked-out user is correctly blocked.

```bash
npm run buddy -- scout explore https://www.saucedemo.com/ \
  --do "fill:#user-name:locked_out_user" \
  --do "fill:#password:secret_sauce" \
  --do "click:#login-button" \
  --expect "text:Epic sadface: Sorry, this user has been locked out."
```
**Result:** ✅ Expectation passed: Text "Epic sadface..." found.

## Scenario D: Analyzing Complex Forms
Agent encounters a checkout form and needs to know required fields.

```bash
npm run buddy -- scout forms https://www.saucedemo.com/checkout-step-one.html --session ./standard-session.json --json
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

## Scenario E: Wikipedia - Search Flow
**Scenario**: searching for a topic and verifying the result page.
**URL:** [https://www.wikipedia.org/](https://www.wikipedia.org/)

```bash
npm run buddy -- scout explore https://www.wikipedia.org/ \
  --do "fill:#searchInput:Software testing" \
  --do "click:.pure-button-primary-progressive" \
  --expect "text:Software testing"
```
