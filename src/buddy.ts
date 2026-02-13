import { chromium, Browser, BrowserContext, Page, request } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

export class Buddy {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleErrors: string[] = [];

  constructor() {}

  async launchInteractive(startUrl?: string) {
    console.log('Launching interactive session...');
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext({
      viewport: null, // Full content
    });

    // Start tracing
    await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });

    this.page = await this.context.newPage();

    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    });

    // Long timeout for manual testing
    this.page.setDefaultTimeout(0);

    console.log('Browser launched. Ready for manual testing.');

    if (startUrl) {
      console.log(`Navigating to: ${startUrl}`);
      await this.page.goto(startUrl);
    }

    // Navigate to a blank page or a help page to ensure the browser is visible and ready
    // Using about:blank is fine, but for axe to work we might need valid HTML.
    // We will let the user navigate.
  }

  async injectState(userRole: string) {
    if (!this.context || !this.page) {
      throw new Error('Browser not initialized. Call launchInteractive() first.');
    }

    console.log(`Injecting state for role: ${userRole}`);

    // Mock implementation of state injection
    // In a real app, you would probably target a specific domain
    const cookies = [
      {
        name: 'session_id',
        value: `mock_session_${userRole}_${Date.now()}`,
        domain: 'example.com', // Placeholder
        path: '/',
      },
    ];

    // We catch error in case we are on about:blank and setting cookies fails for specific domain if not matched
    try {
        await this.context.addCookies(cookies);
    } catch (e) {
        console.warn("Could not set cookies (maybe domain mismatch or about:blank):", e);
    }

    try {
        await this.page.evaluate((role) => {
          localStorage.setItem('user_role', role);
          localStorage.setItem('feature_flags', JSON.stringify({ beta: true }));
        }, userRole);
    } catch (e) {
        console.warn("Could not set localStorage (maybe restricted origin):", e);
    }

    console.log('State injected.');
  }

  async seedData(endpoint: string, payload: any) {
    console.log(`Seeding data to ${endpoint}...`);
    // Using a separate request context for API calls
    const apiContext = await request.newContext();

    try {
        // In a real scenario, we would post to the endpoint
        // const response = await apiContext.post(endpoint, { data: payload });
        // console.log(`Response status: ${response.status()}`);

        // Mocking the action for the MVP
        console.log('Mock: Sending payload:', JSON.stringify(payload));
        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));
        console.log('Mock: Data seeded successfully.');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await apiContext.dispose();
    }
  }

  async quickAudit() {
    if (!this.page) {
      throw new Error('Page not initialized.');
    }

    console.log('Running quick audit...');

    // Accessibility Scan
    try {
      // Need to be on a page with content
      const url = this.page.url();
      if (url === 'about:blank') {
          console.warn("Cannot run audit on about:blank. Please navigate to a URL first.");
      } else {
          const accessibilityScanResults = await new AxeBuilder({ page: this.page }).analyze();
          if (accessibilityScanResults.violations.length > 0) {
            console.warn(`Found ${accessibilityScanResults.violations.length} accessibility violations:`);
            accessibilityScanResults.violations.forEach(v => {
              console.warn(`- [${v.impact}] ${v.help}: ${v.helpUrl}`);
            });
          } else {
            console.log('No accessibility violations found.');
          }
      }
    } catch (e) {
      console.error("Failed to run Axe audit:", e);
    }

    // Check Console Errors
    if (this.consoleErrors.length > 0) {
      console.warn(`Detected ${this.consoleErrors.length} console errors during session:`);
      this.consoleErrors.forEach(err => console.warn(`- ${err}`));
    } else {
      console.log('No console errors recorded.');
    }
  }

  async close() {
    if (this.context) {
      console.log('Saving trace...');
      const traceName = `trace-${Date.now()}.zip`;
      await this.context.tracing.stop({ path: traceName });
      console.log(`Trace saved to ${traceName}`);
    }

    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed.');
    }
  }
}
