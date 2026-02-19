import { Page } from 'playwright';
import { ActionStrategy, ExpectationStrategy } from './types';

// --- Actions ---

export class ClickAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'click';
  }

  async execute(page: Page, selector: string): Promise<void> {
    console.log(`Clicking: ${selector}`);
    await page.click(selector);
    try {
      await page.waitForLoadState('networkidle', { timeout: 2000 });
    } catch { /* ignore timeout */ }
  }
}

export class FillAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'fill';
  }

  async execute(page: Page, params: string): Promise<void> {
    // params expected: "selector:value"
    // Since existing code split by ':', we need to handle that carefully.
    // The previous implementation was: args.split(':') where parts[0] is 'fill'. 
    // Here 'params' is "selector:value".
    
    // We need to find the first colon to separate selector and value
    const firstColonIndex = params.indexOf(':');
    if (firstColonIndex === -1) {
      console.error(`Error: 'fill' action requires selector and value. Got: ${params}`);
      return;
    }
    
    const selector = params.substring(0, firstColonIndex);
    const value = params.substring(firstColonIndex + 1);

    console.log(`Filling ${selector} with "${value}"`);
    await page.fill(selector, value);
  }
}

export class WaitAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'wait';
  }

  async execute(page: Page, msString: string): Promise<void> {
    const ms = parseInt(msString);
    console.log(`Waiting ${ms}ms`);
    await page.waitForTimeout(ms);
  }
}

export class GotoAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'goto';
  }

  async execute(page: Page, url: string): Promise<void> {
    console.log(`Navigating to ${url}`);
    await page.goto(url);
  }
}

export class PressAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'press';
  }

  async execute(page: Page, key: string): Promise<void> {
    console.log(`Pressing key: ${key}`);
    await page.keyboard.press(key);
  }
}

export class ScrollAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'scroll';
  }

  async execute(page: Page, target: string): Promise<void> {
    if (target === 'top') {
      console.log(`Scrolling to top`);
      await page.evaluate(() => window.scrollTo(0, 0));
    } else if (target === 'bottom') {
      console.log(`Scrolling to bottom`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else {
      console.log(`Scrolling to selector: ${target}`);
      const el = await page.$(target);
      if (el) {
        await el.scrollIntoViewIfNeeded();
      } else {
        console.warn(`Element not found for scrolling: ${target}`);
      }
    }
  }
}

// --- Expectations ---

export class TextExpectation implements ExpectationStrategy {
  matches(type: string): boolean { return type === 'text'; }
  
  async verify(page: Page, value: string): Promise<boolean> {
    const isVisible = await page.isVisible(`text=${value}`);
    if (isVisible) {
      console.log(`✅ Expectation passed: Text "${value}" found.`);
      return true;
    } else {
      console.error(`❌ Expectation failed: Text "${value}" NOT found.`);
      return false;
    }
  }
}

export class SelectorExpectation implements ExpectationStrategy {
  matches(type: string): boolean { return type === 'selector'; }

  async verify(page: Page, value: string): Promise<boolean> {
    const isVisible = await page.isVisible(value);
    if (isVisible) {
      console.log(`✅ Expectation passed: Selector "${value}" found.`);
      return true;
    } else {
      console.error(`❌ Expectation failed: Selector "${value}" NOT found.`);
      return false;
    }
  }
}

export class UrlExpectation implements ExpectationStrategy {
  matches(type: string): boolean { return type === 'url'; }

  async verify(page: Page, value: string): Promise<boolean> {
    const currentUrl = page.url();
    if (currentUrl.includes(value)) {
      console.log(`✅ Expectation passed: URL contains "${value}".`);
      return true;
    } else {
      console.error(`❌ Expectation failed: URL "${currentUrl}" does not contain "${value}".`);
      return false;
    }
  }
}
