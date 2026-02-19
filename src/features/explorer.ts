import { Page } from 'playwright';
import { PerformanceMetrics } from './performance';

export interface InteractiveElement {
  tag: string;
  text: string;
  id: string;
  className: string;
  ariaLabel: string;
  region: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isAlert?: boolean;
}

export interface ExploreResult {
  url: string;
  title: string;
  elements: InteractiveElement[];
  performance?: PerformanceMetrics;
}

export class Explorer {
  async scrape(page: Page): Promise<ExploreResult> {
    return await page.evaluate(() => {
      const selectors = [
        "button", "a", "input", "select", "textarea",
        "[role='button']", "[role='link']",
        "[role='alert']", "[aria-invalid='true']",
        ".error-message", ".error", ".toast", ".alert"
      ].join(", ");

      const elements = Array.from(document.querySelectorAll(selectors));
      const visible = elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0;
      });

      return {
        url: window.location.href,
        title: document.title,
        elements: visible.map(el => {
          const rect = el.getBoundingClientRect();
          const parent = el.closest('header, nav, main, footer, form, section, article, aside');
          let region = 'body';
          if (parent) {
            region = parent.tagName.toLowerCase();
            if (parent.id) region += '#' + parent.id;
            else if (parent.className && typeof parent.className === 'string') {
              const classes = parent.className.trim().split(/\s+/);
              if (classes.length > 0 && classes[0]) region += '.' + classes[0];
            }
          }

          const isAlert = el.getAttribute('role') === 'alert' ||
            el.getAttribute('aria-invalid') === 'true' ||
            el.classList.contains('error-message') ||
            el.classList.contains('error') ||
            el.classList.contains('toast') ||
            el.classList.contains('alert');

          return {
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || (el as HTMLInputElement).value || '').trim(),
            id: el.id || '',
            className: el.className || '',
            ariaLabel: el.getAttribute('aria-label') || '',
            region: region,
            box: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            isAlert: isAlert || undefined
          };
        })
      };
    });
  }
}
