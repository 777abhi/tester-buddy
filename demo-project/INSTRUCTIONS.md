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

## 3. Cleanup

- Stop the `http-server` (Ctrl+C).
- Remove any generated trace files if desired.
