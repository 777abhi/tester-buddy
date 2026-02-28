import { Page } from 'playwright';

export class Healer {
  async heal(page: Page, failedSelector: string): Promise<string | null> {
    // 1. Extract a potential keyword from the failed selector
    // e.g., "#btn-submit" -> "submit"
    // e.g., ".user-login-button" -> "login"
    let keyword = failedSelector.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).pop()?.toLowerCase();

    // If the last part is too generic like 'btn' or 'button', pick the one before it
    const parts = failedSelector.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
    if (parts.length > 1 && ['btn', 'button', 'input', 'id', 'class'].includes(parts[parts.length - 1].toLowerCase())) {
       keyword = parts[parts.length - 2].toLowerCase();
    }

    if (!keyword || keyword.length < 2) {
      return null;
    }

    try {
      // 2. Query the page to find elements that might match this keyword
      const healedSelector = await page.evaluate((kw: string) => {
        // Look for buttons, links, inputs
        const elements = document.querySelectorAll('button, a, input, [role="button"], [role="link"], [tabindex="0"]');

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;

          function escape(str: string) {
            return str.replace(/"/g, '\\"');
          }

          // Check text content
          const text = (el.innerText || el.textContent || '').trim().toLowerCase();
          if (text.includes(kw)) {
             // If we find a good match, construct a selector
             if (text === kw || text.length < 30) {
                // Playwright text selector
                return `text="${escape(el.innerText?.trim() || '')}"`;
             }
          }

          // Check common attributes
          const attributes = ['name', 'id', 'placeholder', 'aria-label', 'data-testid', 'value'];
          for (const attr of attributes) {
             const val = el.getAttribute(attr)?.toLowerCase() || '';
             if (val.includes(kw)) {
               // Construct an attribute selector
               const tagName = el.tagName.toLowerCase();
               return `${tagName}[${attr}="${escape(el.getAttribute(attr) || '')}"]`;
             }
          }
        }
        return null;
      }, keyword);

      return healedSelector;
    } catch (e) {
      console.warn(`Healer failed to evaluate page:`, e);
      return null;
    }
  }
}
