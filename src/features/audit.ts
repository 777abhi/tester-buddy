import { Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

export class Auditor {
  async runAudit(page: Page, consoleErrors: string[]) {
    console.log('Running quick audit...');

    // Accessibility Scan
    try {
      // Need to be on a page with content
      const url = page.url();
      if (url === 'about:blank') {
        console.warn("Cannot run audit on about:blank. Please navigate to a URL first.");
      } else {
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        if (accessibilityScanResults.violations.length > 0) {
          console.warn(`Found ${accessibilityScanResults.violations.length} accessibility violations:`);
          accessibilityScanResults.violations.forEach(v => {
            console.warn(`- [${v.impact}] ${v.help}: ${v.helpUrl}`);
          });
        } else {
          console.log('No accessibility violations found.');
        }
      }
    } catch (e) {
      console.error("Failed to run Axe audit:", e);
    }

    // Check Console Errors
    if (consoleErrors.length > 0) {
      console.warn(`Detected ${consoleErrors.length} console errors during session:`);
      consoleErrors.forEach(err => console.warn(`- ${err}`));
    } else {
      console.log('No console errors recorded.');
    }
  }
}
