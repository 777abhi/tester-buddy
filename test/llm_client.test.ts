import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { LLMClient } from '../src/features/llm_client';

describe('LLMClient', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
  });

  it('should throw an error if OPENAI_API_KEY is missing', async () => {
    const client = new LLMClient();
    expect(client.generateTestCode('prompt')).rejects.toThrow('OPENAI_API_KEY environment variable is required');
  });

  it('should call the OpenAI API with the prompt and return the generated code', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
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

    const client = new LLMClient();
    const result = await client.generateTestCode('my prompt');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: expect.stringContaining('my prompt')
    }));

    // Should extract code from markdown block
    expect(result).toBe('import { test } from "@playwright/test";');
  });

  it('should return raw content if no code block is found', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
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

    const client = new LLMClient();
    const result = await client.generateTestCode('prompt');

    expect(result).toBe('import { test } from "@playwright/test";\n// some test');
  });

  it('should throw an error if the API request fails', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ error: { message: 'Bad request' } }), { status: 400 }))
    ) as any;

    const client = new LLMClient();
    expect(client.generateTestCode('prompt')).rejects.toThrow('LLM API returned status 400: {"error":{"message":"Bad request"}}');
  });
});
