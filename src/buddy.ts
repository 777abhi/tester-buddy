import { chromium, Browser, BrowserContext, Page, request } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { BuddyConfig, ConfigLoader } from './config';

export class Buddy {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleErrors: string[] = [];
  private static readonly MAX_CONSOLE_ERRORS = 1000;

  constructor(private config: BuddyConfig = {}) { }

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
        if (this.consoleErrors.length > Buddy.MAX_CONSOLE_ERRORS) {
          this.consoleErrors.shift();
        }
      }
    });

    // Long timeout for manual testing
    this.page.setDefaultTimeout(0);

    console.log('Browser launched. Ready for manual testing.');

    // Apply network mocks if configured
    await this.applyMocks();

    if (startUrl) {
      console.log(`Navigating to: ${startUrl}`);
      await this.page.goto(startUrl);
    }

    // Navigate to a blank page or a help page to ensure the browser is visible and ready
    // Using about:blank is fine, but for axe to work we might need valid HTML.
    // We will let the user navigate.
  }

  async applyMocks() {
    if (!this.config.mocks || this.config.mocks.length === 0) {
      return;
    }

    if (!this.page) {
      console.warn('Cannot apply mocks: Page not initialized.');
      return;
    }

    console.log(`Applying ${this.config.mocks.length} network mocks...`);

    for (const mockConfig of this.config.mocks) {
      await this.page.route(mockConfig.urlPattern, async (route) => {
        const request = route.request();
        if (mockConfig.method && request.method() !== mockConfig.method.toUpperCase()) {
          // Method mismatch, continue to next handler or network
          await route.continue();
          return;
        }

        console.log(`Mocking request: ${request.method()} ${request.url()}`);

        let body = mockConfig.response.body;
        if (typeof body !== 'string') {
          body = JSON.stringify(body);
        }

        await route.fulfill({
          status: mockConfig.response.status,
          contentType: mockConfig.response.contentType,
          body: body,
        });
      });
    }
  }

  async injectState(userRole: string) {
    if (!this.context || !this.page) {
      throw new Error('Browser not initialized. Call launchInteractive() first.');
    }

    console.log(`Injecting state for role: ${userRole}`);

    const roleConfig = this.config.roles?.[userRole];

    if (roleConfig) {
      if (roleConfig.cookies) {
        try {
          await this.context.addCookies(roleConfig.cookies);
        } catch (e) {
          console.warn("Could not set cookies from config:", e);
        }
      }

      if (roleConfig.localStorage) {
        try {
          await this.page.evaluate((storage) => {
            for (const [key, value] of Object.entries(storage)) {
              localStorage.setItem(key, value as string);
            }
          }, roleConfig.localStorage);
        } catch (e) {
          console.warn("Could not set localStorage from config:", e);
        }
      }

      console.log('State injected from config.');
      return;
    }

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

    console.log('State injected (fallback).');
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

  async dumpState(roleName: string = 'captured-session') {
    if (!this.context || !this.page) {
      console.log('No active session.');
      return;
    }

    console.log(`Dumping current session state to role '${roleName}'...`);

    // Cookies
    const cookies = await this.context.cookies();
    console.log('\n--- COOKIES ---');
    console.log(JSON.stringify(cookies, null, 2));

    // LocalStorage
    let localStorageData = null;
    try {
      localStorageData = await this.page.evaluate(() => {
        return JSON.stringify(localStorage);
      });
      console.log('\n--- LOCAL STORAGE ---');
      console.log(JSON.stringify(JSON.parse(localStorageData), null, 2));
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    console.log('-------------------\n');

    // Auto-save to config
    if (!this.config.roles) {
      this.config.roles = {};
    }

    const capturedRole: any = {
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path
      })),
    };

    if (localStorageData) {
      try {
        capturedRole.localStorage = JSON.parse(localStorageData);
      } catch (e) {
        // ignore
      }
    }

    this.config.roles[roleName] = capturedRole;
    await ConfigLoader.save(this.config);
    console.log(`\n✅ Session saved as role '${roleName}' in buddy.config.json`);
  }

  async navigate(url: string) {
    if (this.page) {
      console.log(`Navigating to: ${url}`);
      await this.page.goto(url);
    }
  }

  async reload() {
    if (this.page) {
      console.log('Reloading page...');
      await this.page.reload();
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
