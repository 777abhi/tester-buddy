import { LLMCache } from './llm_cache';

export class LLMClient {
  private cache: LLMCache;

  constructor() {
    this.cache = new LLMCache();
  }

  async generateTestCode(prompt: string): Promise<string> {
    const cachedResponse = await this.cache.get(prompt);
    if (cachedResponse) {
      return cachedResponse;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const ollamaModel = process.env.OLLAMA_MODEL;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey && !ollamaModel && !anthropicKey) {
      throw new Error('Either OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_MODEL environment variable is required');
    }

    const systemPrompt = 'You are an expert software engineer in test. Your job is to write Playwright test code based on the user\'s prompt.';

    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    let response: Response;

    if (anthropicKey) {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022', // Consider parameterizing if needed
          system: systemPrompt,
          messages: messages,
          temperature: 0.2,
          max_tokens: 4096
        })
      });
    } else if (ollamaModel) {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
      response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          stream: false,
          options: {
            temperature: 0.2
          }
        })
      });
    } else {
      // apiKey is guaranteed to be truthy here
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Consider parameterizing if needed
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature: 0.2
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let content: string;

    if (anthropicKey) {
      content = data.content[0].text;
    } else if (ollamaModel) {
      content = data.message.content;
    } else {
      content = data.choices[0].message.content;
    }

    let finalCode: string;

    // Extract code from markdown block if present
    const codeBlockMatch = content.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      finalCode = codeBlockMatch[1].trim();
    } else {
      finalCode = content.trim();
    }

    await this.cache.set(prompt, finalCode);
    return finalCode;
  }
}
