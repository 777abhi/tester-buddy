import { readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';

export class LLMCache {
  private cachePath: string;

  constructor(cacheDir: string = process.cwd()) {
    this.cachePath = join(cacheDir, '.llm-cache.json');
  }

  private generateKey(prompt: string): string {
    return createHash('sha256').update(prompt).digest('hex');
  }

  async get(prompt: string): Promise<string | null> {
    try {
      const data = await this.readCache();
      const key = this.generateKey(prompt);
      return data[key] || null;
    } catch (error) {
      console.warn('Failed to read LLM cache:', error);
      return null;
    }
  }

  async set(prompt: string, code: string): Promise<void> {
    try {
      const data = await this.readCache();
      const key = this.generateKey(prompt);
      data[key] = code;
      await writeFile(this.cachePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.warn('Failed to write LLM cache:', error);
    }
  }

  private async readCache(): Promise<Record<string, string>> {
    try {
      const content = await readFile(this.cachePath, 'utf8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }
}
