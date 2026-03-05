import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import * as fsPromises from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

// Setup fs mock
const mockFs = {
  data: '{}',
  fileExists: false,
};

const mockReadFile = mock(async (path: string, encoding: string) => {
  if (!mockFs.fileExists) {
    const error = new Error('ENOENT');
    (error as any).code = 'ENOENT';
    throw error;
  }
  return mockFs.data;
});

const mockWriteFile = mock(async (path: string, data: string, encoding: string) => {
  mockFs.data = data;
  mockFs.fileExists = true;
});

mock.module('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));


describe('LLMCache', () => {
  let cache: any;

  beforeEach(async () => {
    mockFs.data = '{}';
    mockFs.fileExists = false;
    const mod = await import('../src/features/llm_cache');
    cache = new mod.LLMCache('/test-dir');
  });

  afterEach(() => {
    mock.restore();
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
    mockFs.data = JSON.stringify({ [key]: 'let b = 2;' });
    mockFs.fileExists = true;

    const result = await cache.get(prompt);
    expect(result).toBe('let b = 2;');
  });

  it('should return null for unmatched prompt in existing cache', async () => {
    const prompt = 'existing prompt';
    const key = createHash('sha256').update(prompt).digest('hex');
    mockFs.data = JSON.stringify({ [key]: 'let b = 2;' });
    mockFs.fileExists = true;

    const result = await cache.get('new prompt');
    expect(result).toBeNull();
  });

  it('should append to an existing cache', async () => {
    const existingPrompt = 'existing prompt';
    const existingKey = createHash('sha256').update(existingPrompt).digest('hex');
    mockFs.data = JSON.stringify({ [existingKey]: 'let b = 2;' });
    mockFs.fileExists = true;

    await cache.set('new prompt', 'let c = 3;');
    const newKey = createHash('sha256').update('new prompt').digest('hex');

    const cacheData = JSON.parse(mockFs.data);
    expect(cacheData[existingKey]).toBe('let b = 2;');
    expect(cacheData[newKey]).toBe('let c = 3;');
  });
});
