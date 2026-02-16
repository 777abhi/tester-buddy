import { chromium, Browser, BrowserContext, Page, request } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { BuddyConfig, ConfigLoader } from './config';

export interface InteractiveElement {
  tag: string;
  text: string;
  id: string;
  className: string;
  ariaLabel: string;
  region: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isAlert?: boolean;
}

export interface ExploreResult {
  url: string;
  title: string;
  elements: InteractiveElement[];
}

export interface FormInput {
  tag: string;
  type: string;
  name: string;
  id: string;
  label: string;
  required: boolean;
  value: string;
}

export interface FormResult {
  type: 'form' | 'standalone';
  id: string;
  name: string;
  inputs: FormInput[];
}

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

  async seedData(count: number) {
    const seedConfig = this.config.seeding;

    if (!seedConfig) {
      console.warn('No seeding configuration found. Using mock implementation.');
      console.log(`Mock: Seeding ${count} items...`);
      console.log('Mock: Data seeded successfully.');
      return;
    }

    console.log(`Seeding data to ${seedConfig.url}...`);
    const apiContext = await request.newContext();

    try {
      const response = await apiContext.fetch(seedConfig.url, {
        method: seedConfig.method || 'POST',
        headers: seedConfig.headers,
        data: { count }
      });

      if (response.ok()) {
        console.log(`Data seeded successfully. Status: ${response.status()}`);
      } else {
        console.error(`Failed to seed data. Status: ${response.status()} ${response.statusText()}`);
        console.error(await response.text());
      }
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
      // console.log('Saving trace...'); 
      // Only save trace if we started it. But we don't track it cleanly.
      // Let's try to stop and catch error.
      try {
        const traceName = `trace-${Date.now()}.zip`;
        await this.context.tracing.stop({ path: traceName });
        console.log(`Trace saved to ${traceName}`);
      } catch (e) {
        // Tracing probably wasn't started, which is fine for headless generic tasks
      }
    }

    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed.');
    }
  }

  async launch(headless: boolean = true, storageState?: string) {
    console.log(`Launching browser (headless: ${headless})...`);
    this.browser = await chromium.launch({ headless });

    if (storageState) {
      try {
        this.context = await this.browser.newContext({ storageState });
      } catch (e) {
        console.warn(`Could not load storage state from ${storageState}, starting fresh context. Error:`, e);
        this.context = await this.browser.newContext();
      }
    } else {
      this.context = await this.browser.newContext();
    }

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(60000);
  }

  async performActions(actions: string[]) {
    if (!this.page) throw new Error('Page not initialized');

    for (const actionStr of actions) {
      const parts = actionStr.split(':');
      let actionType = parts[0];

      try {
        if (actionType === 'click') {
          const rest = actionStr.substring(actionType.length + 1);
          console.log(`Clicking: ${rest}`);
          await this.page.click(rest);
          try {
            await this.page.waitForLoadState('networkidle', { timeout: 2000 });
          } catch { /* ignore timeout */ }
        } else if (actionType === 'fill') {
          const p = actionStr.split(':');
          if (p.length < 3) {
            console.error(`Error: 'fill' action requires selector and value. Got: ${actionStr}`);
            continue;
          }
          const selector = p[1];
          const value = p.slice(2).join(':');

          console.log(`Filling ${selector} with "${value}"`);
          await this.page.fill(selector, value);
        } else if (actionType === 'wait') {
          const rest = actionStr.substring(actionType.length + 1);
          const ms = parseInt(rest);
          console.log(`Waiting ${ms}ms`);
          await this.page.waitForTimeout(ms);
        } else if (actionType === 'goto') {
          const rest = actionStr.substring(actionType.length + 1);
          console.log(`Navigating to ${rest}`);
          await this.page.goto(rest);
        }
      } catch (e) {
        console.error(`Error executing ${actionStr}:`, e);
      }
    }
  }

  async checkExpectations(expectations: string[]) {
    if (!this.page) throw new Error('Page not initialized');
    console.log('Verifying expectations...');

    for (const expectation of expectations) {
      const parts = expectation.split(':');
      const type = parts[0];
      const value = parts.slice(1).join(':');

      try {
        if (type === 'text') {
          // Check if text exists anywhere on the page
          const isVisible = await this.page.isVisible(`text=${value}`);
          if (isVisible) {
            console.log(`✅ Expectation passed: Text "${value}" found.`);
          } else {
            console.error(`❌ Expectation failed: Text "${value}" NOT found.`);
            process.exitCode = 1;
          }
        } else if (type === 'selector') {
          // Check if selector exists and is visible
          const isVisible = await this.page.isVisible(value);
          if (isVisible) {
            console.log(`✅ Expectation passed: Selector "${value}" found.`);
          } else {
            console.error(`❌ Expectation failed: Selector "${value}" NOT found.`);
            process.exitCode = 1;
          }
        } else if (type === 'url') {
          const currentUrl = this.page.url();
          if (currentUrl.includes(value)) {
            console.log(`✅ Expectation passed: URL contains "${value}".`);
          } else {
            console.error(`❌ Expectation failed: URL "${currentUrl}" does not contain "${value}".`);
            process.exitCode = 1;
          }
        } else {
          console.warn(`Unknown expectation type: ${type}`);
        }
      } catch (e) {
        console.error(`Error checking expectation ${expectation}:`, e);
      }
    }
  }

  async explore(url: string, options: {
    json?: boolean,
    screenshot?: boolean,
    showAll?: boolean,
    actions?: string[],
    expectations?: string[],
    session?: string
  } = {}): Promise<ExploreResult> {
    try {
      if (!this.page) {
        await this.launch(true, options.session);
      }

      if (!this.page) throw new Error('Page failed to initialize');

      console.log(`Navigating to ${url}...`);
      await this.navigate(url);

      if (options.actions && options.actions.length > 0) {
        await this.performActions(options.actions);
      }

      if (options.expectations && options.expectations.length > 0) {
        await this.checkExpectations(options.expectations);
      }

      if (options.screenshot) {
        await this.page.screenshot({ path: 'screenshot.png', fullPage: false });
        if (!options.json) {
          console.error('Screenshot saved to screenshot.png');
        }
      }

      const data: ExploreResult = await this.page.evaluate(() => {
        const selectors = [
          "button", "a", "input", "select", "textarea",
          "[role='button']", "[role='link']",
          "[role='alert']", "[aria-invalid='true']",
          ".error-message", ".error", ".toast", ".alert"
        ].join(", ");

        const elements = Array.from(document.querySelectorAll(selectors));
        const visible = elements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0;
        });

        return {
          url: window.location.href,
          title: document.title,
          elements: visible.map(el => {
            const rect = el.getBoundingClientRect();
            const parent = el.closest('header, nav, main, footer, form, section, article, aside');
            let region = 'body';
            if (parent) {
              region = parent.tagName.toLowerCase();
              if (parent.id) region += '#' + parent.id;
              else if (parent.className && typeof parent.className === 'string') {
                const classes = parent.className.trim().split(/\s+/);
                if (classes.length > 0 && classes[0]) region += '.' + classes[0];
              }
            }

            const isAlert = el.getAttribute('role') === 'alert' ||
              el.getAttribute('aria-invalid') === 'true' ||
              el.classList.contains('error-message') ||
              el.classList.contains('error') ||
              el.classList.contains('toast') ||
              el.classList.contains('alert');

            return {
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || (el as HTMLInputElement).value || '').trim(),
              id: el.id || '',
              className: el.className || '',
              ariaLabel: el.getAttribute('aria-label') || '',
              region: region,
              box: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              },
              isAlert: isAlert || undefined
            };
          })
        };
      });

      if (options.session && this.context) {
        try {
          await this.context.storageState({ path: options.session });
        } catch (e) {
          console.warn('Could not save session:', e);
        }
      }

      return data;

    } catch (e) {
      console.error('Explore failed:', e);
      throw e;
    }
  }

  async analyzeForms(url: string, options: { json?: boolean, session?: string } = {}): Promise<FormResult[]> {
    try {
      if (!this.page) {
        await this.launch(true, options.session);
      }
      if (!this.page) throw new Error('Page failed to initialize');

      console.log(`Navigating to ${url}...`);
      await this.navigate(url);

      const forms: FormResult[] = await this.page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form'));
        const results: any[] = [];

        function extractInputData(el: any) {
          let label = '';
          if (el.getAttribute('aria-label')) {
            label = el.getAttribute('aria-label');
          } else if (el.getAttribute('aria-labelledby')) {
            const ids = el.getAttribute('aria-labelledby').split(' ');
            label = ids.map((id: string) => document.getElementById(id)?.textContent).join(' ');
          } else if (el.id) {
            const labelEl = document.querySelector(`label[for="${el.id}"]`);
            if (labelEl) label = labelEl.textContent || '';
          }

          if (!label) {
            const parentLabel = el.closest('label');
            if (parentLabel) label = parentLabel.textContent || '';
          }

          if (!label && el.placeholder) label = el.placeholder;
          if (!label && (el.tagName === 'BUTTON' || el.type === 'submit' || el.type === 'button')) {
            label = el.textContent || el.value;
          }

          return {
            tag: el.tagName.toLowerCase(),
            type: el.type || el.tagName.toLowerCase(),
            name: el.name || '',
            id: el.id || '',
            label: (label || '').trim().replace(/\s+/g, ' '),
            required: el.required || false,
            value: el.value || ''
          };
        }

        forms.forEach((form, index) => {
          const inputs = Array.from(form.querySelectorAll('input, select, textarea, button'));
          const visibleInputs = inputs.filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0 && (el as HTMLInputElement).type !== 'hidden';
          });

          if (visibleInputs.length > 0) {
            results.push({
              type: 'form',
              id: form.id || `form-${index}`,
              name: form.getAttribute('name') || '',
              inputs: visibleInputs.map(el => extractInputData(el))
            });
          }
        });

        const allInputs = Array.from(document.querySelectorAll('input, select, textarea, button'));
        const standaloneInputs = allInputs.filter(el => {
          const style = window.getComputedStyle(el);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0 && (el as HTMLInputElement).type !== 'hidden';
          return isVisible && !el.closest('form');
        });

        if (standaloneInputs.length > 0) {
          results.push({
            type: 'standalone',
            id: 'standalone-inputs',
            name: 'Standalone Inputs',
            inputs: standaloneInputs.map(el => extractInputData(el))
          });
        }

        return results;
      });

      if (options.session && this.context) {
        try {
          await this.context.storageState({ path: options.session });
        } catch (e) {
          console.warn('Could not save session:', e);
        }
      }

      return forms;

    } catch (e) {
      console.error('Analyze forms failed:', e);
      throw e;
    }
  }
}
