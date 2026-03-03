export class LLMClient {
  async generateTestCode(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const ollamaModel = process.env.OLLAMA_MODEL;

    if (!apiKey && !ollamaModel) {
      throw new Error('Either OPENAI_API_KEY or OLLAMA_MODEL environment variable is required');
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an expert software engineer in test. Your job is to write Playwright test code based on the user\'s prompt.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    let response: Response;

    if (ollamaModel) {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
      response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: messages,
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
          messages: messages,
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

    if (ollamaModel) {
      content = data.message.content;
    } else {
      content = data.choices[0].message.content;
    }

    // Extract code from markdown block if present
    const codeBlockMatch = content.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    return content.trim();
  }
}
