import { describe, it, expect } from 'bun:test';
import { CodeGenerator } from '../src/features/codegen';
import { ActionRecord } from '../src/features/session';

describe('CodeGenerator (AI Prompt)', () => {
  it('should generate an AI prompt from session history', () => {
    const history: ActionRecord[] = [
      { action: 'goto:https://example.com', timestamp: 123 },
      { action: 'click:#login', semantic: 'getByRole("button")', timestamp: 124 }
    ];

    const prompt = CodeGenerator.generatePrompt(history);

    expect(prompt).toContain('Playwright test suite');
    expect(prompt).toContain('goto:https://example.com');
    expect(prompt).toContain('getByRole("button")');
  });
});
