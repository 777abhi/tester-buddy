import { Page } from 'playwright';
import { PerformanceMetrics } from './performance';
import { INTERACTIVE_SELECTORS, ALERT_SELECTORS } from './constants';
import { ExplorerConfig } from '../config';

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
  constructor(private config: ExplorerConfig = {}) {}

  async scrape(page: Page): Promise<ExploreResult> {
    const interactive = this.config.interactiveSelectors || INTERACTIVE_SELECTORS;
    const alerts = this.config.alertSelectors || ALERT_SELECTORS;

    return await page.evaluate(({ interactive, alerts }) => {
      const selectors = [...interactive, ...alerts].join(", ");

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

          const isAlert = alerts.some(selector => el.matches(selector));

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
    }, { interactive, alerts });
  }
}
