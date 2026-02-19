import { BrowserManager } from './core/browser';
import { BuddyConfig } from './config';
import {
  ActionExecutor,
  Explorer,
  Crawler,
  FormAnalyzer,
  NetworkManager,
  StateManager,
  Auditor,
  Seeder,
  PerformanceMonitor,
  ExploreResult,
  CrawlResult,
  FormResult
} from './features'; // Using barrel file

export type { ExploreResult, InteractiveElement } from './features/explorer';
export type { CrawlResult } from './features/crawler';
export type { FormResult, FormInput } from './features/forms';

export class Buddy {
  private browserManager: BrowserManager;
  private actionExecutor: ActionExecutor;
  private explorer: Explorer;
  private crawler: Crawler;
  private formAnalyzer: FormAnalyzer;
  private networkManager: NetworkManager;
  private stateManager: StateManager;
  private auditor: Auditor;
  private seeder: Seeder;
  private performanceMonitor: PerformanceMonitor;

  constructor(private config: BuddyConfig = {}) {
    this.browserManager = new BrowserManager();
    this.actionExecutor = new ActionExecutor();
    this.explorer = new Explorer();
    this.crawler = new Crawler();
    this.formAnalyzer = new FormAnalyzer();
    this.networkManager = new NetworkManager(config);
    this.stateManager = new StateManager(config);
    this.auditor = new Auditor();
    this.seeder = new Seeder(config);
    this.performanceMonitor = new PerformanceMonitor();
  }

  async launchInteractive(startUrl?: string) {
    await this.browserManager.launchInteractive(startUrl);
    await this.applyMocks();
  }

  async launch(headless: boolean = true, storageState?: string) {
    await this.browserManager.launch(headless, storageState);
  }

  async close() {
    await this.browserManager.close();
  }

  async applyMocks() {
    const page = this.browserManager.getPage();
    if (page) {
      await this.networkManager.applyMocks(page);
    }
  }

  async injectState(userRole: string) {
    const context = this.browserManager.getContext();
    const page = this.browserManager.getPage();
    if (context && page) {
      await this.stateManager.injectState(context, page, userRole);
    } else {
      throw new Error('Browser not initialized. Call launchInteractive() first.');
    }
  }

  async seedData(count: number) {
    await this.seeder.seedData(count);
  }

  async quickAudit() {
    const page = this.browserManager.getPage();
    if (page) {
      await this.auditor.runAudit(page, this.browserManager.getConsoleErrors());
    } else {
      throw new Error('Page not initialized.');
    }
  }

  async dumpState(roleName: string = 'captured-session') {
    const context = this.browserManager.getContext();
    const page = this.browserManager.getPage();
    if (context && page) {
      await this.stateManager.dumpState(context, page, roleName);
    } else {
      console.log('No active session.');
    }
  }

  async navigate(url: string) {
    const page = this.browserManager.getPage();
    if (page) {
      console.log(`Navigating to: ${url}`);
      await page.goto(url);
    }
  }

  async reload() {
    const page = this.browserManager.getPage();
    if (page) {
      console.log('Reloading page...');
      await page.reload();
    }
  }

  async explore(url: string, options: {
    json?: boolean,
    screenshot?: boolean,
    showAll?: boolean,
    actions?: string[],
    expectations?: string[],
    session?: string,
    monitorErrors?: boolean,
    performance?: boolean
  } = {}): Promise<ExploreResult> {
    try {
      const page = await this.browserManager.ensurePage(true, options.session);

      if (options.monitorErrors) {
        this.browserManager.clearErrors();
      }

      console.log(`Navigating to ${url}...`);
      await page.goto(url);

      if (options.actions && options.actions.length > 0) {
        await this.actionExecutor.performActions(page, options.actions);
      }

      if (options.expectations && options.expectations.length > 0) {
        await this.actionExecutor.checkExpectations(page, options.expectations);
      }

      if (options.screenshot) {
        await page.screenshot({ path: 'screenshot.png', fullPage: false });
        if (!options.json) {
          console.error('Screenshot saved to screenshot.png');
        }
      }

      const data = await this.explorer.scrape(page);

      if (options.performance) {
        data.performance = await this.performanceMonitor.measure(page);
      }

      if (options.monitorErrors) {
        const consoleErrors = this.browserManager.getConsoleErrors();
        const networkErrors = this.browserManager.getNetworkErrors();

        if (consoleErrors.length > 0 || networkErrors.length > 0) {
          const errorMessages = [
            ...consoleErrors.map(e => `Console Error: ${e}`),
            ...networkErrors.map(e => `Network Error: ${e}`)
          ];
          throw new Error(`Monitoring failed with ${errorMessages.length} errors:\n${errorMessages.join('\n')}`);
        }
      }

      if (options.session) {
        try {
          const context = this.browserManager.getContext();
          if (context) await context.storageState({ path: options.session });
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
      const page = await this.browserManager.ensurePage(true, options.session);

      console.log(`Navigating to ${url}...`);
      await page.goto(url);

      const forms = await this.formAnalyzer.analyze(page);

      if (options.session) {
        try {
          const context = this.browserManager.getContext();
          if (context) await context.storageState({ path: options.session });
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

  async crawl(startUrl: string, maxDepth: number = 2): Promise<CrawlResult[]> {
    await this.browserManager.ensurePage(true);
    const page = this.browserManager.getPage();
    if (!page) throw new Error("Page not initialized");
    
    return await this.crawler.crawl(page, startUrl, maxDepth);
  }
}
