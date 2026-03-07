import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { LLMClient } from '../src/features/llm_client';

describe('LLMClient', () => {
  let originalFetch: typeof global.fetch;
  let originalOpenAiKey: string | undefined;
  let originalOllamaModel: string | undefined;
  let originalOllamaUrl: string | undefined;
  let originalAnthropicKey: string | undefined;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalOpenAiKey = process.env.OPENAI_API_KEY;
    originalOllamaModel = process.env.OLLAMA_MODEL;
    originalOllamaUrl = process.env.OLLAMA_URL;
    originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OLLAMA_MODEL;
    delete process.env.OLLAMA_URL;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalOpenAiKey !== undefined) process.env.OPENAI_API_KEY = originalOpenAiKey;
    if (originalOllamaModel !== undefined) process.env.OLLAMA_MODEL = originalOllamaModel;
    if (originalOllamaUrl !== undefined) process.env.OLLAMA_URL = originalOllamaUrl;
    if (originalAnthropicKey !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
  });

  describe('Configuration and Errors', () => {
    it('should throw an error if no API key or Ollama model is provided', async () => {
      const client = new LLMClient({});
      await expect(client.generateTestCode('prompt error 1')).rejects.toThrow('LLM configuration is missing. Either openaiKey, anthropicKey, or ollamaModel must be provided.');
    });

    it('should throw an error if the API request fails', async () => {
      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify({ error: { message: 'Bad request' } }), { status: 400 }))
      ) as any;

      const client = new LLMClient({ openaiKey: 'test-key' });
      await expect(client.generateTestCode('prompt error 2')).rejects.toThrow('LLM API returned status 400: {"error":{"message":"Bad request"}}');
    });
  });

  describe('OpenAI Support', () => {
    it('should call the OpenAI API with the prompt and return the generated code', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '```typescript\nimport { test } from "@playwright/test";\n```'
            }
          }
        ]
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      ) as any;

      const client = new LLMClient({ openaiKey: 'test-key' });
      // force empty cache read by overriding class behavior
      (client as any).cache.get = mock(async () => null);
      (client as any).cache.set = mock(async () => {});
      // Use unique prompt to bypass cache
      const result = await client.generateTestCode('my prompt unique openai');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        },
        body: expect.stringContaining('my prompt unique openai')
      }));

      // Should extract code from markdown block
      expect(result).toBe('import { test } from "@playwright/test";');
    });

    it('should return raw content if no code block is found', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'import { test } from "@playwright/test";\n// some test'
            }
          }
        ]
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      ) as any;

      const client = new LLMClient({ openaiKey: 'test-key' });
      const result = await client.generateTestCode('prompt no block unique');

      expect(result).toBe('import { test } from "@playwright/test";\n// some test');
    });
  });

  describe('Anthropic Support', () => {
    it('should call the Anthropic API with the prompt and return the generated code', async () => {
      const mockResponse = {
        content: [
          {
            text: '```typescript\nimport { test } from "@playwright/test";\n```'
          }
        ]
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      ) as any;

      const client = new LLMClient({ anthropicKey: 'test-anthropic-key' });
      // force empty cache read by overriding class behavior
      (client as any).cache.get = mock(async () => null);
      (client as any).cache.set = mock(async () => {});
      const result = await client.generateTestCode('my anthropic prompt unique');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-anthropic-key',
          'anthropic-version': '2023-06-01'
        },
        body: expect.stringContaining('my anthropic prompt unique')
      }));

      // Should extract code from markdown block
      expect(result).toBe('import { test } from "@playwright/test";');
    });

    it('should return raw content if no code block is found for anthropic', async () => {
      const mockResponse = {
        content: [
          {
            text: 'import { test } from "@playwright/test";\n// some anthropic test'
          }
        ]
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      ) as any;

      const client = new LLMClient({ anthropicKey: 'test-anthropic-key' });
      const result = await client.generateTestCode('prompt anthropic no block unique');

      expect(result).toBe('import { test } from "@playwright/test";\n// some anthropic test');
    });
  });

  describe('Ollama Support', () => {
    it('should call the Ollama API when OLLAMA_MODEL is present', async () => {
      const mockResponse = {
        message: { content: '```typescript\n// ollama code\n```' }
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      ) as any;

      const client = new LLMClient({ ollamaModel: 'llama3' });
      // force empty cache read by overriding class behavior
      (client as any).cache.get = mock(async () => null);
      (client as any).cache.set = mock(async () => {});
      const result = await client.generateTestCode('test prompt ollama unique');

      expect(result).toBe('// ollama code');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:11434/api/chat');

      const requestOptions = fetchCall[1];
      expect(requestOptions.method).toBe('POST');

      const body = JSON.parse(requestOptions.body);
      expect(body.model).toBe('llama3');
      expect(body.stream).toBe(false);
      expect(body.messages.length).toBe(2);
      expect(body.messages[1].content).toBe('test prompt ollama unique');
    });

    it('should use custom OLLAMA_URL if provided', async () => {
      const mockResponse = {
        message: { content: 'code' }
      };

      global.fetch = mock(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 }))
      ) as any;

      const client = new LLMClient({ ollamaModel: 'llama3', ollamaUrl: 'http://custom-ollama:11434/api/chat' });
      // force empty cache read by overriding class behavior
      (client as any).cache.get = mock(async () => null);
      (client as any).cache.set = mock(async () => {});
      await client.generateTestCode('test prompt ollama url unique');

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toBe('http://custom-ollama:11434/api/chat');
    });
  });
});
