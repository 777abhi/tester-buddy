import { Page } from 'playwright';

export async function getSemanticLocator(page: Page, selector: string): Promise<string | undefined> {
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
