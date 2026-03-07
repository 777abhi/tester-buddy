import { readFile, writeFile } from 'fs/promises';

export interface CookieConfig {
  name: string;
  value: string;
  domain: string;
  path: string;
}

export interface RoleConfig {
  cookies?: CookieConfig[];
  localStorage?: Record<string, string>;
}

export interface MockResponse {
  status: number;
  contentType: string;
  body: string | object;
}

export interface MockConfig {
  urlPattern: string;
  method?: string; // GET, POST, etc.
  response: MockResponse;
}

export interface SeedConfig {
  url: string;
  method?: string; // Default POST
  headers?: Record<string, string>;
}

export interface ExplorerConfig {
  interactiveSelectors?: string[];
  alertSelectors?: string[];
}

export interface BuddyConfig {
  roles?: Record<string, RoleConfig>;
  mocks?: MockConfig[];
  seeding?: SeedConfig;
  explorer?: ExplorerConfig;
}

export class ConfigLoader {
  static readonly CONFIG_FILE = 'buddy.config.json';

  static async load(configPath: string = this.CONFIG_FILE): Promise<BuddyConfig> {
    try {
      const data = await readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
         return {}; // Return empty config if not found
      }
      console.warn(`Could not load ${configPath}:`, e.message);
      return {};
    }
  }

  static async save(config: BuddyConfig, configPath: string = this.CONFIG_FILE): Promise<void> {
    try {
      await writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(`Configuration saved to ${configPath}`);
    } catch (error) {
      console.error(`Failed to save config file at ${configPath}:`, error);
    }
  }
}
