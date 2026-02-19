import { expect, it, describe, beforeEach } from "bun:test";
import { PerformanceMonitor } from "../src/features/performance";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;
  let mockPage: any;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    mockPage = {
      evaluate: async (fn: any) => {
        // Mocking the return value of the evaluate function
        // simulating what window.performance would return
        return {
          navigation: {
            loadTime: 1200,
            domContentLoaded: 800,
          },
          paint: {
            firstPaint: 500,
            firstContentfulPaint: 600,
          },
          resources: {
            count: 15,
            totalSize: 500000,
          }
        };
      }
    };
  });

  it("should capture performance metrics", async () => {
    const metrics = await monitor.measure(mockPage);
    expect(metrics).toBeDefined();
    expect(metrics.navigation.loadTime).toBe(1200);
    expect(metrics.navigation.domContentLoaded).toBe(800);
    expect(metrics.paint.firstPaint).toBe(500);
    expect(metrics.paint.firstContentfulPaint).toBe(600);
    expect(metrics.resources.count).toBe(15);
    expect(metrics.resources.totalSize).toBe(500000);
  });
});
