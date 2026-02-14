# Real World Testing Scenarios

We will use the **SauceDemo** (Swag Labs) website (`https://www.saucedemo.com/`) to test complex scenarios.

## Scenario 1: End-to-End Flow Audit

This scenario tests the ability to audit a real application at different stages of a user flow.

1.  **Launch Tester Buddy**:
    ```bash
    # Run from the demo-project directory to use the updated config
    cd demo-project
    npx ts-node ../src/cli.ts --open --url https://www.saucedemo.com/
    ```

2.  **Audit Login Page**:
    -   Type `audit` in the terminal.
    -   Observe any accessibility issues on the public login page.

3.  **Perform Login**:
    -   Username: `standard_user`
    -   Password: `secret_sauce`
    -   Click **Login**.

4.  **Audit Inventory Page**:
    -   Once logged in, type `audit` again.
    -   This checks the "Inventory" state.

5.  **Audit Error State**:
    -   Click "Add to cart" on a few items.
    -   Go to the **Cart** page.
    -   Click **Checkout**.
    -   Try to click **Continue** *without* filling in the form.
    -   You see an error message "Error: First Name is required".
    -   Type `audit` now.
    -   **Result**: Check if the tool picks up accessibility issues with the error message itself!

## Scenario 2: Cross-Domain Role Injection

We have configured `buddy.config.json` with a cookie for `www.saucedemo.com`.

1.  **Run with Injection**:
    ```bash
    npx ts-node ../src/cli.ts --open --url https://www.saucedemo.com/inventory.html --role sauce-user
    ```

2.  **Observation**:
    -   The tool attempts to inject the `session-username` cookie for `www.saucedemo.com`.
    -   **Note**: Real-world sites have complex auth (tokens, session IDs). If this simple cookie injection works, you will land directly on the Inventory page. If not, it demonstrates the limits of simple cookie injection against robust auth systems!
    -   *Experiment*: See if adding the cookie manually in the config allows you to bypass login.
