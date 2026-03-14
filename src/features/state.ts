import { BrowserContext, Page } from 'playwright';
import { BuddyConfig, ConfigLoader } from '../config';
import { safeParseLocalStorage } from '../utils/security';

export class StateManager {
  constructor(private config: BuddyConfig) {}

  async injectState(context: BrowserContext, page: Page, userRole: string) {
    console.log(`Injecting state for role: ${userRole}`);

    const roleConfig = this.config.roles?.[userRole];

    if (roleConfig) {
      const tasks: Promise<void>[] = [];

      if (roleConfig.cookies) {
        tasks.push(context.addCookies(roleConfig.cookies).catch(e => {
          console.warn("Could not set cookies from config:", e);
        }));
      }

      if (roleConfig.localStorage) {
        tasks.push(page.evaluate((storage) => {
          for (const [key, value] of Object.entries(storage)) {
            localStorage.setItem(key, value as string);
          }
        }, roleConfig.localStorage).catch(e => {
          console.warn("Could not set localStorage from config:", e);
        }));
      }

      await Promise.all(tasks);
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
    const fallbackTasks = [
      context.addCookies(cookies).catch(e => {
        console.warn("Could not set cookies (maybe domain mismatch or about:blank):", e);
      }),
      page.evaluate((role) => {
        localStorage.setItem('user_role', role);
        localStorage.setItem('feature_flags', JSON.stringify({ beta: true }));
      }, userRole).catch(e => {
        console.warn("Could not set localStorage (maybe restricted origin):", e);
      })
    ];

    await Promise.all(fallbackTasks);

    console.log('State injected (fallback).');
  }

  async dumpState(context: BrowserContext, page: Page, roleName: string = 'captured-session') {
    console.log(`Dumping current session state to role '${roleName}'...`);

    // Parallelize cookie and localStorage retrieval
    const [cookies, localStorageData] = await Promise.all([
      context.cookies(),
      page.evaluate(() => {
        try {
          return JSON.stringify({ ...localStorage });
        } catch (e) {
          return null;
        }
      }).catch(e => {
        console.warn('Could not read localStorage:', e);
        return null;
      })
    ]);

    console.log('\n--- COOKIES ---');
    console.log(JSON.stringify(cookies, null, 2));

    const validatedLocalStorage = localStorageData ? safeParseLocalStorage(localStorageData) : null;

    if (validatedLocalStorage) {
      console.log('\n--- LOCAL STORAGE ---');
      console.log(JSON.stringify(validatedLocalStorage, null, 2));
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

    if (validatedLocalStorage) {
      capturedRole.localStorage = validatedLocalStorage;
    }

    this.config.roles[roleName] = capturedRole;
    await ConfigLoader.save(this.config);
    console.log(`\n✅ Session saved as role '${roleName}' in buddy.config.json`);
  }
}
