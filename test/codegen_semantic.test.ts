import { describe, it, expect } from 'bun:test';
import { CodeGenerator } from '../src/features/codegen';
import { ActionRecord } from '../src/features/session';

describe('CodeGenerator (Semantic)', () => {
  it('should generate semantic locators when available', () => {
    const history: ActionRecord[] = [
      {
        action: 'click:#login',
        timestamp: 125,
        semantic: "getByRole('button', { name: 'Login' })"
      }
    ];

    const code = CodeGenerator.generate(history);

    expect(code).toContain("await page.getByRole('button', { name: 'Login' }).click();");
    expect(code).not.toContain("await page.click('#login');");
  });

  it('should fallback to selector when semantic is missing', () => {
    const history: ActionRecord[] = [
      { action: 'click:#login', timestamp: 125 }
    ];

    const code = CodeGenerator.generate(history);

    expect(code).toContain("await page.click('#login');");
  });

  it('should generate semantic fill actions', () => {
    const history: ActionRecord[] = [
      {
        action: 'fill:#username:admin',
        timestamp: 125,
        semantic: "getByLabel('Username')"
      }
    ];

    const code = CodeGenerator.generate(history);

    expect(code).toContain("await page.getByLabel('Username').fill('admin');");
    expect(code).not.toContain("await page.fill('#username', 'admin');");
  });
});
