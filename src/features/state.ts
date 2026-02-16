import { BrowserContext, Page } from 'playwright';
import { BuddyConfig, ConfigLoader } from '../config';

export class StateManager {
  constructor(private config: BuddyConfig) {}

  async injectState(context: BrowserContext, page: Page, userRole: string) {
    console.log(`Injecting state for role: ${userRole}`);

    const roleConfig = this.config.roles?.[userRole];

    if (roleConfig) {
      if (roleConfig.cookies) {
        try {
          await context.addCookies(roleConfig.cookies);
        } catch (e) {
          console.warn("Could not set cookies from config:", e);
        }
      }

      if (roleConfig.localStorage) {
        try {
          await page.evaluate((storage) => {
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
      await context.addCookies(cookies);
    } catch (e) {
      console.warn("Could not set cookies (maybe domain mismatch or about:blank):", e);
    }

    try {
      await page.evaluate((role) => {
        localStorage.setItem('user_role', role);
        localStorage.setItem('feature_flags', JSON.stringify({ beta: true }));
      }, userRole);
    } catch (e) {
      console.warn("Could not set localStorage (maybe restricted origin):", e);
    }

    console.log('State injected (fallback).');
  }

  async dumpState(context: BrowserContext, page: Page, roleName: string = 'captured-session') {
    console.log(`Dumping current session state to role '${roleName}'...`);

    // Cookies
    const cookies = await context.cookies();
    console.log('\n--- COOKIES ---');
    console.log(JSON.stringify(cookies, null, 2));

    // LocalStorage
    let localStorageData = null;
    try {
      localStorageData = await page.evaluate(() => {
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
}
