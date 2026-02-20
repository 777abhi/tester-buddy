import { ActionRecord } from './session';

export class CodeGenerator {
  static generate(history: ActionRecord[]): string {
    const lines: string[] = [
      "import { test, expect } from '@playwright/test';",
      "",
      "test('generated test', async ({ page }) => {",
    ];

    // Remove consecutive duplicate gotos to the same URL
    const cleanHistory: ActionRecord[] = [];
    let lastGoto: string | null = null;

    for (const record of history) {
      if (record.action.startsWith('goto:')) {
        const url = record.action.substring(5);
        if (url === lastGoto) {
          continue;
        }
        lastGoto = url;
      } else {
        lastGoto = null;
      }
      cleanHistory.push(record);
    }

    for (const record of cleanHistory) {
      const { action } = record;

      const firstColon = action.indexOf(':');
      let type = action;
      let params = '';
      if (firstColon !== -1) {
        type = action.substring(0, firstColon);
        params = action.substring(firstColon + 1);
      }

      switch (type) {
        case 'goto':
          lines.push(`  await page.goto('${params}');`);
          break;

        case 'click':
          lines.push(`  await page.click('${params}');`);
          break;

        case 'fill':
          // Compatible with ActionExecutor logic: selector cannot contain colons
          // NOTE: This parsing logic is limited by the current CLI syntax `fill:selector:value`.
          // If selector contains colons (e.g., `div:first-child`), it will be incorrectly parsed.
          // This matches the behavior of ActionExecutor, so generated code faithfully reproduces
          // what was executed, even if the execution was flawed due to this limitation.
          // Future improvement: Support escaped colons or a different delimiter.
          const fillParts = params.split(':');
          if (fillParts.length >= 2) {
            const selector = fillParts[0];
            const value = fillParts.slice(1).join(':');
            lines.push(`  await page.fill('${selector}', '${value}');`);
          } else {
             lines.push(`  // Warning: invalid fill params '${params}'`);
          }
          break;

        case 'press':
          lines.push(`  await page.keyboard.press('${params}');`);
          break;

        case 'wait':
          lines.push(`  await page.waitForTimeout(${params});`);
          break;

        case 'scroll':
            if (params === 'top') {
                lines.push(`  await page.evaluate(() => window.scrollTo(0, 0));`);
            } else if (params === 'bottom') {
                lines.push(`  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`);
            } else {
                lines.push(`  await page.locator('${params}').scrollIntoViewIfNeeded();`);
            }
            break;

        case 'expect':
            const expParts = params.split(':');
             if (expParts.length >= 2) {
                const expType = expParts[0];
                const expVal = expParts.slice(1).join(':');

                if (expType === 'text') {
                    lines.push(`  await expect(page.locator('body')).toContainText('${expVal}');`);
                } else if (expType === 'selector') {
                    lines.push(`  await expect(page.locator('${expVal}')).toBeVisible();`);
                } else if (expType === 'url') {
                    lines.push(`  await expect(page).toHaveURL(new RegExp('${expVal}'));`);
                }
             }
             break;
      }
    }

    lines.push("});");
    return lines.join('\n');
  }
}
