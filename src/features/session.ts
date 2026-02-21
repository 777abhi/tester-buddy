import { BrowserContext, Cookie } from 'playwright';
import { readFile, writeFile } from 'fs/promises';

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
    try {
      const content = await readFile(path, 'utf-8');
      const data = JSON.parse(content);

      // Handle legacy format (Playwright storage state)
      const cookies = data.cookies || [];
      const origins = data.origins || [];
      const history = data.history || [];

      return { cookies, origins, history };
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return { cookies: [], origins: [], history: [] };
      }
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

      await writeFile(path, JSON.stringify(sessionData, null, 2));
    } catch (e) {
      console.error(`Failed to save session to ${path}:`, e);
    }
  }
}
