# Tester Buddy Demo Project Instructions

This project is set up to help you explore the features of `tester-buddy` in a controlled environment.

## 1. Start the Demo Site

First, you need to serve the `index.html` file. You can use any static file server. Since you have Node.js installed, `npx http-server` is a quick option.

Open a terminal in the `tester-buddy/demo-project` directory and run:

```bash
npx http-server . -p 8080
```

This will serve the site at `http://127.0.0.1:8080`.

## 2. Explore Tester Buddy Features

Open a NEW terminal window (keep the server running) and navigate to the root of the `tester-buddy` repository.

### A. Launch Interactive Session

Run the following command to start an interactive session with the demo site:

```bash
npm run buddy -- --open --url http://127.0.0.1:8080
```

Once the browser opens:
1.  **Test Audit**: Type `audit` in the terminal where `tester-buddy` is running.
    -   You should see accessibility violations reported (e.g., missing label, low contrast).
    -   Click the "Trigger Console Error" button on the webpage, then run `audit` again. You should see the console error reported.
2.  **Test Trace**: Type `exit` to close the session. A `.zip` trace file will be saved. You can view it using `npx playwright show-trace <trace-file>.zip`.

### B. Test Role Injection

`tester-buddy` can inject state (cookies/localStorage) to simulate different user roles. We have configured this in `buddy.config.json`.

Run the session with the `admin` role:


```bash
# We must run from the directory where buddy.config.json exists because the tool looks for it in the current directory.
cd demo-project
npx ts-node ../src/cli.ts --open --url http://127.0.0.1:8080 --role admin
```

If successful, you will see "Active Role detected: admin" on the page.

## 3. Advanced Scenarios

We have enhanced the demo with a **Dashboard** that has protected routes and dynamic content.

### A. Bypass Login (Role Injection)
Normally, if you try to go to `http://127.0.0.1:8080/dashboard.html` without logging in, you will be redirected back to the login page.

**Test this:**
1.  Open the browser manually to `http://127.0.0.1:8080/dashboard.html`.
2.  Observe the redirect.

**Now, bypass it with Tester Buddy:**
1.  Run the following command:
    ```bash
    npx ts-node ../src/cli.ts --open --url http://127.0.0.1:8080/dashboard.html --role admin
    ```
2.  **Result**: You should land directly on the Dashboard! The tool injected the session before the page loaded, satisfying the auth check.

### B. Audit Dynamic Content
The Dashboard loads data after a 1.5-second delay. This simulates a real-world Single Page App (SPA).

1.  Wait for the "Recent Activity" and "Statistics" cards to appear.
2.  Run `audit` in the terminal.
3.  **Result**: You should see accessibility violations for the "Statistics" numbers (intentionally low contrast).

### C. Audit Modals
1.  Click the **"Open Settings Modal"** button on the dashboard.
2.  With the modal open, run `audit` in the terminal.
3.  **Result**: The audit will capture issues inside the modal (e.g., the input missing a label).

## 4. Cleanup

- Stop the `http-server` (Ctrl+C).
- Remove any generated trace files if desired.
