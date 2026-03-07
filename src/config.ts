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

export interface LLMConfig {
  openaiKey?: string;
  anthropicKey?: string;
  ollamaModel?: string;
  ollamaUrl?: string;
}

export interface BuddyConfig {
  roles?: Record<string, RoleConfig>;
  mocks?: MockConfig[];
  seeding?: SeedConfig;
  explorer?: ExplorerConfig;
  llm?: LLMConfig;
}

export class ConfigLoader {
  static async load(configPath: string = 'buddy.config.json'): Promise<BuddyConfig> {
    let config: BuddyConfig = {};
    if (existsSync(configPath)) {
      try {
        const data = await readFile(configPath, 'utf-8');
        config = JSON.parse(data) as BuddyConfig;
      } catch (error) {
        console.warn(`Failed to parse config file at ${configPath}:`, error);
      }
    }

    // Fallback to environment variables
    const openaiKey = config.llm?.openaiKey || process.env.OPENAI_API_KEY;
    const anthropicKey = config.llm?.anthropicKey || process.env.ANTHROPIC_API_KEY;
    const ollamaModel = config.llm?.ollamaModel || process.env.OLLAMA_MODEL;
    const ollamaUrl = config.llm?.ollamaUrl || process.env.OLLAMA_URL;

    if (openaiKey || anthropicKey || ollamaModel || ollamaUrl) {
      config.llm = {
        openaiKey,
        anthropicKey,
        ollamaModel,
        ollamaUrl
      };
    }

    return config;
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
