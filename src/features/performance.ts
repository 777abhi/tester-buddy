import { Page } from 'playwright';

export interface PerformanceMetrics {
  navigation: {
    loadTime: number;
    domContentLoaded: number;
  };
  paint: {
    firstPaint: number;
    firstContentfulPaint: number;
  };
  resources: {
    count: number;
    totalSize: number;
  };
}

export class PerformanceMonitor {
  async measure(page: Page): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const perf = window.performance;
      const navEntry = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = Array.from(perf.getEntriesByType('paint'));
      const resourceEntries = Array.from(perf.getEntriesByType('resource'));

      let loadTime = 0;
      let domContentLoaded = 0;

      if (navEntry) {
        // Typically startTime for navigation is 0, but good to be explicit if using relative timing
        loadTime = navEntry.loadEventEnd;
        domContentLoaded = navEntry.domContentLoadedEventEnd;
      } else {
        // Fallback to Navigation Timing Level 1
        const t = perf.timing;
        loadTime = t.loadEventEnd - t.navigationStart;
        domContentLoaded = t.domContentLoadedEventEnd - t.navigationStart;
      }

      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

      let totalSize = 0;
      resourceEntries.forEach(entry => {
        if ('transferSize' in entry) {
          totalSize += (entry as any).transferSize;
        }
      });

      return {
        navigation: {
          loadTime: Math.round(loadTime),
          domContentLoaded: Math.round(domContentLoaded),
        },
        paint: {
          firstPaint: firstPaint ? Math.round(firstPaint.startTime) : 0,
          firstContentfulPaint: firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : 0,
        },
        resources: {
          count: resourceEntries.length,
          totalSize: totalSize,
        },
      };
    });

    return metrics;
  }
}
