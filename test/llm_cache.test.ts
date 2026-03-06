import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { createHash } from 'crypto';
import { LLMCache } from '../src/features/llm_cache';

describe('LLMCache', () => {
  let cache: LLMCache;
  let tempDir: string;
  let cacheFilePath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(join(os.tmpdir(), 'llm-cache-test-'));
    cacheFilePath = join(tempDir, '.llm-cache.json');
    cache = new LLMCache(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should get null when cache is empty', async () => {
    const result = await cache.get('test prompt');
    expect(result).toBeNull();
  });

  it('should save and get a cached response', async () => {
    await cache.set('test prompt', 'const a = 1;');
    const result = await cache.get('test prompt');
    expect(result).toBe('const a = 1;');
  });

  it('should handle reading from an existing cache file', async () => {
    const prompt = 'existing prompt';
    const key = createHash('sha256').update(prompt).digest('hex');
    await fsPromises.writeFile(cacheFilePath, JSON.stringify({ [key]: 'let b = 2;' }), 'utf8');

    const result = await cache.get(prompt);
    expect(result).toBe('let b = 2;');
  });

  it('should return null for unmatched prompt in existing cache', async () => {
    const prompt = 'existing prompt';
    const key = createHash('sha256').update(prompt).digest('hex');
    await fsPromises.writeFile(cacheFilePath, JSON.stringify({ [key]: 'let b = 2;' }), 'utf8');

    const result = await cache.get('new prompt');
    expect(result).toBeNull();
  });

  it('should append to an existing cache', async () => {
    const existingPrompt = 'existing prompt';
    const existingKey = createHash('sha256').update(existingPrompt).digest('hex');
    await fsPromises.writeFile(cacheFilePath, JSON.stringify({ [existingKey]: 'let b = 2;' }), 'utf8');

    await cache.set('new prompt', 'let c = 3;');
    const newKey = createHash('sha256').update('new prompt').digest('hex');

    const cacheContent = await fsPromises.readFile(cacheFilePath, 'utf8');
    const cacheData = JSON.parse(cacheContent);
    expect(cacheData[existingKey]).toBe('let b = 2;');
    expect(cacheData[newKey]).toBe('let c = 3;');
  });
});
