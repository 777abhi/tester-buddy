import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

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

export interface BuddyConfig {
  roles?: Record<string, RoleConfig>;
}

export class ConfigLoader {
  static async load(configPath: string = 'buddy.config.json'): Promise<BuddyConfig> {
    if (!existsSync(configPath)) {
      return {};
    }

    try {
      const data = await readFile(configPath, 'utf-8');
      return JSON.parse(data) as BuddyConfig;
    } catch (error) {
      console.warn(`Failed to parse config file at ${configPath}:`, error);
      return {};
    }
  }

  static async save(config: BuddyConfig, configPath: string = 'buddy.config.json'): Promise<void> {
    try {
      await writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(`Configuration saved to ${configPath}`);
    } catch (error) {
      console.error(`Failed to save config file at ${configPath}:`, error);
    }
  }
}
