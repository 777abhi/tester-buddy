import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { redactUrl } from '../utils/url';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleErrors: string[] = [];
  private networkErrors: string[] = [];
  private static readonly MAX_CONSOLE_ERRORS = 1000;

  async launch(headless: boolean = true, storageState?: string | { cookies: any[], origins: any[] }) {
    console.log(`Launching browser (headless: ${headless})...`);
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    if (storageState) {
      try {
        this.context = await this.browser.newContext({ storageState });
      } catch (e) {
        const errorMsg = typeof storageState === 'string' ? storageState : 'provided object';
        console.warn(`Could not load storage state from ${errorMsg}, starting fresh context. Error:`, e);
        this.context = await this.browser.newContext();
      }
    } else {
      this.context = await this.browser.newContext();
    }

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(60000);
    this.setupListeners();
  }

  async launchInteractive(startUrl?: string) {
    console.log('Launching interactive session...');
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext({
      viewport: null, // Full content
    });

    // Start tracing
    await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });

    this.page = await this.context.newPage();
    
    this.setupListeners();

    // Long timeout for manual testing
    this.page.setDefaultTimeout(0);

    console.log('Browser launched. Ready for manual testing.');

    if (startUrl) {
      console.log(`Navigating to: ${redactUrl(startUrl)}`);
      await this.page.goto(startUrl);
    }
  }

  private setupListeners() {
    if (!this.page) return;

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
        if (this.consoleErrors.length > BrowserManager.MAX_CONSOLE_ERRORS) {
          this.consoleErrors.shift();
        }
      }
    });

    this.page.on('response', response => {
      const status = response.status();
      if (status >= 400) {
        const errorMsg = `[${status}] ${response.request().method()} ${redactUrl(response.url())}`;
        this.networkErrors.push(errorMsg);
        if (this.networkErrors.length > BrowserManager.MAX_CONSOLE_ERRORS) {
          this.networkErrors.shift();
        }
      }
    });
  }

  async ensurePage(headless: boolean = true, session?: string | { cookies: any[], origins: any[] }) {
    if (!this.page) {
      await this.launch(headless, session);
    }
    if (!this.page) throw new Error('Page failed to initialize');
    return this.page;
  }

  getPage(): Page | null {
    return this.page;
  }

  getContext(): BrowserContext | null {
    return this.context;
  }

  getConsoleErrors(): string[] {
    return this.consoleErrors;
  }

  getNetworkErrors(): string[] {
    return this.networkErrors;
  }

  clearErrors() {
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  async close() {
    if (this.context) {
      try {
        const traceName = `trace-${Date.now()}.zip`;
        // Only stops if tracing was started, might throw if not
        await this.context.tracing.stop({ path: traceName });
        console.log(`Trace saved to ${traceName}`);
      } catch (e) {
        // Tracing probably wasn't started
      }
    }

    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed.');
    }
  }
}
