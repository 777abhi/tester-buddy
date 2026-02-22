import { Page } from 'playwright';
import { ActionStrategy, ExpectationStrategy, ActionResult } from './types';

// --- Helper ---

async function getSemanticLocator(page: Page, selector: string): Promise<string | undefined> {
  try {
    const handle = await page.$(selector);
    if (!handle) return undefined;

    const semantic = await page.evaluate((el: HTMLElement) => {
      function escape(str: string) {
        return str.replace(/'/g, "\\'");
      }

      const tagName = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const ariaLabel = el.getAttribute('aria-label');
      const placeholder = el.getAttribute('placeholder');
      const text = el.innerText?.trim()?.split('\n')[0]; // First line only
      const testId = el.getAttribute('data-testid');

      // 1. Explicit Role
      if (role && ['button', 'link', 'checkbox', 'radio', 'textbox', 'combobox', 'listbox', 'menuitem'].includes(role)) {
        if (ariaLabel) {
            return `getByRole('${role}', { name: '${escape(ariaLabel)}' })`;
        }
        if (text && text.length > 0 && text.length < 50) {
             return `getByRole('${role}', { name: '${escape(text)}' })`;
        }
      }

      // 2. Implicit Roles (Semantic Tags)
      if (tagName === 'button') {
          if (ariaLabel) return `getByRole('button', { name: '${escape(ariaLabel)}' })`;
          if (text) return `getByRole('button', { name: '${escape(text)}' })`;
      }

      if (tagName === 'a' && (el as HTMLAnchorElement).href) {
           if (ariaLabel) return `getByRole('link', { name: '${escape(ariaLabel)}' })`;
           if (text) return `getByRole('link', { name: '${escape(text)}' })`;
      }

      if (tagName === 'input') {
          const type = (el as HTMLInputElement).type;
          if (['submit', 'button', 'reset'].includes(type)) {
              if ((el as HTMLInputElement).value) return `getByRole('button', { name: '${escape((el as HTMLInputElement).value)}' })`;
          }

          if (placeholder) return `getByPlaceholder('${escape(placeholder)}')`;
          if (ariaLabel) return `getByLabel('${escape(ariaLabel)}')`;

          // Check for associated label
          if ((el as HTMLInputElement).labels && (el as HTMLInputElement).labels!.length > 0) {
              const labelText = (el as HTMLInputElement).labels![0].innerText.trim();
              if (labelText) return `getByLabel('${escape(labelText)}')`;
          }
      }

      if (tagName === 'textarea') {
         if (placeholder) return `getByPlaceholder('${escape(placeholder)}')`;
         if (ariaLabel) return `getByLabel('${escape(ariaLabel)}')`;
      }

      // 3. Test ID
      if (testId) return `getByTestId('${escape(testId)}')`;

      // 4. Text Fallback (careful with this)
      if (text && text.length > 0 && text.length < 30) {
         // Only if it looks like a distinct element
         return `getByText('${escape(text)}')`;
      }

      return undefined;
    }, handle);

    return semantic || undefined;
  } catch (e) {
    return undefined;
  }
}

// --- Actions ---

export class ClickAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'click';
  }

  async execute(page: Page, selector: string): Promise<ActionResult> {
    console.log(`Clicking: ${selector}`);
    const semantic = await getSemanticLocator(page, selector);

    try {
      await page.click(selector);
      try {
        await page.waitForLoadState('networkidle', { timeout: 2000 });
      } catch { /* ignore timeout */ }
      return { success: true, semanticLocator: semantic };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class FillAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'fill';
  }

  async execute(page: Page, params: string): Promise<ActionResult> {
    const firstColonIndex = params.indexOf(':');
    if (firstColonIndex === -1) {
      const msg = `Error: 'fill' action requires selector and value. Got: ${params}`;
      console.error(msg);
      return { success: false, error: msg };
    }
    
    const selector = params.substring(0, firstColonIndex);
    const value = params.substring(firstColonIndex + 1);

    console.log(`Filling ${selector} with "${value}"`);
    const semantic = await getSemanticLocator(page, selector);

    try {
      await page.fill(selector, value);
      return { success: true, semanticLocator: semantic };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class WaitAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'wait';
  }

  async execute(page: Page, msString: string): Promise<ActionResult> {
    const ms = parseInt(msString);
    console.log(`Waiting ${ms}ms`);
    try {
      await page.waitForTimeout(ms);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class GotoAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'goto';
  }

  async execute(page: Page, url: string): Promise<ActionResult> {
    console.log(`Navigating to ${url}`);
    try {
      await page.goto(url);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class PressAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'press';
  }

  async execute(page: Page, key: string): Promise<ActionResult> {
    console.log(`Pressing key: ${key}`);
    try {
      await page.keyboard.press(key);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class ScrollAction implements ActionStrategy {
  matches(actionType: string): boolean {
    return actionType === 'scroll';
  }

  async execute(page: Page, target: string): Promise<ActionResult> {
    try {
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
          return { success: false, error: 'Element not found' };
        }
      }
      return { success: true };
    } catch (e: any) {
       return { success: false, error: e.message };
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
