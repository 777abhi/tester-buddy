import { BrowserContext, Cookie } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export interface ActionRecord {
  action: string;
  url?: string;
  timestamp: number;
}

export interface SessionData {
  cookies: Cookie[];
  origins: { origin: string; localStorage: { name: string; value: string }[] }[];
  history: ActionRecord[];
}

export class SessionManager {
  async loadSession(path: string): Promise<SessionData> {
    if (!existsSync(path)) {
      return { cookies: [], origins: [], history: [] };
    }

    try {
      const content = readFileSync(path, 'utf-8');
      const data = JSON.parse(content);

      // Handle legacy format (Playwright storage state)
      const cookies = data.cookies || [];
      const origins = data.origins || [];
      const history = data.history || [];

      return { cookies, origins, history };
    } catch (e) {
      console.warn(`Failed to load session from ${path}:`, e);
      return { cookies: [], origins: [], history: [] };
    }
  }

  async saveSession(path: string, context: BrowserContext, history: ActionRecord[]) {
    try {
      const storageState = await context.storageState();
      const sessionData: SessionData = {
        cookies: storageState.cookies,
        origins: storageState.origins,
        history
      };

      writeFileSync(path, JSON.stringify(sessionData, null, 2));
    } catch (e) {
      console.error(`Failed to save session to ${path}:`, e);
    }
  }
}
