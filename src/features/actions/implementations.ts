import { Page, expect } from 'playwright';
import { Action } from './interface';
import { ActionResult } from './types';
import { getSemanticLocator } from './utils';

export class ClickAction implements Action {
  constructor(public selector: string) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Clicking: ${this.selector}`);
    const semantic = await getSemanticLocator(page, this.selector);

    try {
      await page.click(this.selector);
      try {
        await page.waitForLoadState('networkidle', { timeout: 2000 });
      } catch { /* ignore timeout */ }
      return { success: true, semanticLocator: semantic };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(semanticLocator?: string): string {
    if (semanticLocator) {
      return `await page.${semanticLocator}.click();`;
    }
    return `await page.click('${this.selector}');`;
  }
}

export class FillAction implements Action {
  constructor(public selector: string, public value: string) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Filling ${this.selector} with "${this.value}"`);
    const semantic = await getSemanticLocator(page, this.selector);

    try {
      await page.fill(this.selector, this.value);
      return { success: true, semanticLocator: semantic };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(semanticLocator?: string): string {
    if (semanticLocator) {
      return `await page.${semanticLocator}.fill('${this.value}');`;
    }
    return `await page.fill('${this.selector}', '${this.value}');`;
  }
}

export class WaitAction implements Action {
  constructor(public ms: number) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Waiting ${this.ms}ms`);
    try {
      await page.waitForTimeout(this.ms);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(_?: string): string {
    return `await page.waitForTimeout(${this.ms});`;
  }
}

export class GotoAction implements Action {
  constructor(public url: string) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Navigating to ${this.url}`);
    try {
      await page.goto(this.url);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(_?: string): string {
    return `await page.goto('${this.url}');`;
  }
}

export class PressAction implements Action {
  constructor(public key: string) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Pressing key: ${this.key}`);
    try {
      await page.keyboard.press(this.key);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(_?: string): string {
    return `await page.keyboard.press('${this.key}');`;
  }
}

export class ScrollAction implements Action {
  constructor(public target: string) {}

  async execute(page: Page): Promise<ActionResult> {
    try {
      if (this.target === 'top') {
        console.log(`Scrolling to top`);
        await page.evaluate(() => window.scrollTo(0, 0));
      } else if (this.target === 'bottom') {
        console.log(`Scrolling to bottom`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      } else {
        console.log(`Scrolling to selector: ${this.target}`);
        const el = await page.$(this.target);
        if (el) {
          await el.scrollIntoViewIfNeeded();
        } else {
          console.warn(`Element not found for scrolling: ${this.target}`);
          return { success: false, error: 'Element not found' };
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(_?: string): string {
    if (this.target === 'top') {
      return `await page.evaluate(() => window.scrollTo(0, 0));`;
    } else if (this.target === 'bottom') {
      return `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`;
    } else {
      return `await page.locator('${this.target}').scrollIntoViewIfNeeded();`;
    }
  }
}

export class ExpectAction implements Action {
  constructor(public type: string, public value: string) {}

  async execute(page: Page): Promise<ActionResult> {
    // Reusing logic from strategies.ts but adapting to Action interface
    try {
      let passed = false;
      if (this.type === 'text') {
        passed = await page.isVisible(`text=${this.value}`);
        if (passed) console.log(`✅ Expectation passed: Text "${this.value}" found.`);
        else console.error(`❌ Expectation failed: Text "${this.value}" NOT found.`);
      } else if (this.type === 'selector') {
        passed = await page.isVisible(this.value);
        if (passed) console.log(`✅ Expectation passed: Selector "${this.value}" found.`);
        else console.error(`❌ Expectation failed: Selector "${this.value}" NOT found.`);
      } else if (this.type === 'url') {
        const currentUrl = page.url();
        passed = currentUrl.includes(this.value);
        if (passed) console.log(`✅ Expectation passed: URL contains "${this.value}".`);
        else console.error(`❌ Expectation failed: URL "${currentUrl}" does not contain "${this.value}".`);
      }

      if (!passed) {
        process.exitCode = 1;
        return { success: false, error: 'Expectation failed' };
      }
      return { success: true };
    } catch (e: any) {
      console.error(`Error checking expectation ${this.type}:${this.value}`, e);
      return { success: false, error: e.message };
    }
  }

  toCode(_?: string): string {
    if (this.type === 'text') {
      return `await expect(page.locator('body')).toContainText('${this.value}');`;
    } else if (this.type === 'selector') {
      return `await expect(page.locator('${this.value}')).toBeVisible();`;
    } else if (this.type === 'url') {
      return `await expect(page).toHaveURL(new RegExp('${this.value}'));`;
    }
    return `// Unknown expectation type: ${this.type}`;
  }
}

export class LoopAction implements Action {
  constructor(public count: number, public action: Action) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Looping ${this.count} times`);
    for (let i = 0; i < this.count; i++) {
      const result = await this.action.execute(page);
      if (!result.success) {
        return result;
      }
    }
    return { success: true };
  }

  toCode(semanticLocator?: string): string {
    return `for (let i = 0; i < ${this.count}; i++) {
  ${this.action.toCode()}
}`;
  }
}

export class ConditionAction implements Action {
  constructor(public selector: string, public action: Action) {}

  async execute(page: Page): Promise<ActionResult> {
    console.log(`Checking condition: ${this.selector}`);
    try {
      const el = await page.$(this.selector);
      if (el) {
        console.log(`Condition met: ${this.selector} exists. Executing inner action.`);
        return await this.action.execute(page);
      } else {
        console.log(`Condition not met: ${this.selector} does not exist. Skipping.`);
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  toCode(semanticLocator?: string): string {
    return `if (await page.$('${this.selector}')) {
  ${this.action.toCode()}
}`;
  }
}
