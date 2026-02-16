import { Page } from 'playwright';

export interface FormInput {
  tag: string;
  type: string;
  name: string;
  id: string;
  label: string;
  required: boolean;
  value: string;
}

export interface FormResult {
  type: 'form' | 'standalone';
  id: string;
  name: string;
  inputs: FormInput[];
}

export class FormAnalyzer {
  async analyze(page: Page): Promise<FormResult[]> {
    return await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const results: any[] = [];

      function extractInputData(el: any) {
        let label = '';
        if (el.getAttribute('aria-label')) {
          label = el.getAttribute('aria-label');
        } else if (el.getAttribute('aria-labelledby')) {
          const ids = el.getAttribute('aria-labelledby').split(' ');
          label = ids.map((id: string) => document.getElementById(id)?.textContent).join(' ');
        } else if (el.id) {
          const labelEl = document.querySelector(`label[for="${el.id}"]`);
          if (labelEl) label = labelEl.textContent || '';
        }

        if (!label) {
          const parentLabel = el.closest('label');
          if (parentLabel) label = parentLabel.textContent || '';
        }

        if (!label && el.placeholder) label = el.placeholder;
        if (!label && (el.tagName === 'BUTTON' || el.type === 'submit' || el.type === 'button')) {
          label = el.textContent || el.value;
        }

        return {
          tag: el.tagName.toLowerCase(),
          type: el.type || el.tagName.toLowerCase(),
          name: el.name || '',
          id: el.id || '',
          label: (label || '').trim().replace(/\s+/g, ' '),
          required: el.required || false,
          value: el.value || ''
        };
      }

      forms.forEach((form, index) => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea, button'));
        const visibleInputs = inputs.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0 && (el as HTMLInputElement).type !== 'hidden';
        });

        if (visibleInputs.length > 0) {
          results.push({
            type: 'form',
            id: form.id || `form-${index}`,
            name: form.getAttribute('name') || '',
            inputs: visibleInputs.map(el => extractInputData(el))
          });
        }
      });

      const allInputs = Array.from(document.querySelectorAll('input, select, textarea, button'));
      const standaloneInputs = allInputs.filter(el => {
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0 && (el as HTMLInputElement).type !== 'hidden';
        return isVisible && !el.closest('form');
      });

      if (standaloneInputs.length > 0) {
        results.push({
          type: 'standalone',
          id: 'standalone-inputs',
          name: 'Standalone Inputs',
          inputs: standaloneInputs.map(el => extractInputData(el))
        });
      }

      return results;
    });
  }
}
