# Agent Walkthrough: Explore All Features

This guide is designed to be read by an LLM Agent (or a developer building one). It provides a sequential set of tasks to verify the full range of `scout` capabilities.

## Task 1: See the World
**Objective**: Obtain a structured JSON representation of a webpage to understand its content and interactive elements.

**Command**:
```bash
npm run buddy -- scout explore https://www.saucedemo.com/ --json
```

**Expected Outcome**:
-   A JSON object containing:
    -   `url`: Current URL.
    -   `title`: Page title ("Swag Labs").
    -   `elements`: A list of interactive elements (inputs, buttons).

## Task 2: Interact and Verify
**Objective**: Perform a login action and verify it succeeded using a single atomic command.

**Command**:
```bash
npm run buddy -- scout explore https://www.saucedemo.com/ \
  --do "fill:#user-name:standard_user" \
  --do "fill:#password:secret_sauce" \
  --do "click:#login-button" \
  --expect "url:inventory.html" \
  --json \
  --session ./agent-session.json
```

**Expected Outcome**:
-   JSON response where `url` contains `inventory.html`.
-   A new file `./agent-session.json` created, storing the authentication state.

## Task 3: Analyze Forms
**Objective**: Understand the required fields of a complex form without submitting it.

**Command**:
```bash
# First, ensure we are on a page with a form (using the session from Task 2)
npm run buddy -- scout explore https://www.saucedemo.com/checkout-step-one.html --session ./agent-session.json

# Now analyze it
npm run buddy -- scout forms https://www.saucedemo.com/checkout-step-one.html --session ./agent-session.json --json
```

**Expected Outcome**:
-   A JSON array describing the form fields (First Name, Last Name, Zip Code) and their attributes (required: true).

## Task 4: Map the Territory
**Objective**: Discover all links on the site to build a map of reachable pages.

**Command**:
```bash
npm run buddy -- scout crawl https://www.saucedemo.com/ --depth 1 --json
```

**Expected Outcome**:
-   A JSON array of pages, their status codes (200), and links found on them.

## Task 5: Visual Verification
**Objective**: Detect if the page layout has shifted or changed visually.

**Command**:
```bash
# Capture baseline
npm run buddy -- scout visual https://www.saucedemo.com/ --out baseline.png

# Compare (this will match, as nothing changed)
npm run buddy -- scout visual https://www.saucedemo.com/ --base baseline.png --out diff.png
```

**Expected Outcome**:
-   A message indicating the images match or a low pixel difference count.

## Task 6: Write the Test
**Objective**: Convert the session recording from Task 2 into a permanent executable test script.

**Command**:
```bash
npm run buddy -- codegen --session ./agent-session.json --out tests/agent-generated.spec.ts
```

**Expected Outcome**:
-   A file `tests/agent-generated.spec.ts` containing Playwright code that replays the login steps and assertions.

## Summary
You have successfully:
-   [x] Parsed a page's DOM into JSON.
-   [x] Executed a multi-step action chain with verification.
-   [x] Persisted state across commands.
-   [x] Analyzed form structure.
-   [x] Crawled for links.
-   [x] Generated a regression test.
