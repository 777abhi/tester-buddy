import { describe, it, expect } from 'bun:test';
import { CodeGenerator } from '../src/features/codegen';
import { ActionRecord } from '../src/features/session';

describe('CodeGenerator', () => {
  it('should generate valid Playwright code from history', () => {
    const history: ActionRecord[] = [
      { action: 'goto:https://example.com', timestamp: 123 },
      { action: 'fill:#user:admin', timestamp: 124 },
      { action: 'click:#login', timestamp: 125 },
      { action: 'wait:1000', timestamp: 126 },
      { action: 'expect:text:Welcome', timestamp: 127 }
    ];

    const code = CodeGenerator.generate(history);

    expect(code).toContain("import { test, expect } from '@playwright/test';");
    expect(code).toContain("test('generated test', async ({ page }) => {");
    expect(code).toContain("await page.goto('https://example.com');");
    expect(code).toContain("await page.fill('#user', 'admin');");
    expect(code).toContain("await page.click('#login');");
    expect(code).toContain("await page.waitForTimeout(1000);");
    expect(code).toContain("await expect(page.locator('body')).toContainText('Welcome');");
  });

  it('should handle complex selectors', () => {
    const history: ActionRecord[] = [
      { action: 'fill:#form input[name="email"]:test@example.com', timestamp: 123 }
    ];

    const code = CodeGenerator.generate(history);
    expect(code).toContain("await page.fill('#form input[name=\"email\"]', 'test@example.com');");
  });

  it('should deduplicate consecutive gotos', () => {
    const history: ActionRecord[] = [
      { action: 'goto:https://example.com', timestamp: 123 },
      { action: 'goto:https://example.com', timestamp: 124 },
      { action: 'click:#btn', timestamp: 125 }
    ];

    const code = CodeGenerator.generate(history);
    // Count occurrences of goto
    const matches = code.match(/page\.goto/g);
    expect(matches?.length).toBe(1);
  });

  it('should not deduplicate gotos with intervening actions', () => {
    const history: ActionRecord[] = [
      { action: 'goto:https://example.com', timestamp: 123 },
      { action: 'click:#btn', timestamp: 124 },
      { action: 'goto:https://example.com', timestamp: 125 }
    ];

    const code = CodeGenerator.generate(history);
    const matches = code.match(/page\.goto/g);
    expect(matches?.length).toBe(2);
  });
});
