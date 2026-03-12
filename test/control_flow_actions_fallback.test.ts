import { expect, it, describe, beforeEach, afterEach, mock } from "bun:test";
import { ActionParser } from "../src/features/actions/parser";
import { ClickAction, RetryAction } from "../src/features/actions/implementations";
import { Page } from "playwright";

describe("RetryAction Dynamic Fallback", () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      click: mock(async () => {}),
      waitForTimeout: mock(async () => {}),
    };
  });

  it("should execute specific fallback based on failure type", async () => {
    const action = new ClickAction("#btn");
    action.execute = mock(async () => ({ success: false, error: "TimeoutError: element not found" }));

    const timeoutFallback = new ClickAction("#timeout-btn");
    timeoutFallback.execute = mock(async () => ({ success: true, semanticLocator: "timeout" }));

    const defaultFallback = new ClickAction("#default-btn");
    defaultFallback.execute = mock(async () => ({ success: true, semanticLocator: "default" }));

    const retryAction = new RetryAction(1, 100, action, {
      "TimeoutError": timeoutFallback,
      "default": defaultFallback
    });

    const result = await retryAction.execute(mockPage as Page);
    expect(result.success).toBe(true);
    expect(timeoutFallback.execute).toHaveBeenCalledTimes(1);
    expect(defaultFallback.execute).not.toHaveBeenCalled();
  });

  it("should execute default fallback if no failure type matches", async () => {
    const action = new ClickAction("#btn");
    action.execute = mock(async () => ({ success: false, error: "NetworkError: disconnected" }));

    const timeoutFallback = new ClickAction("#timeout-btn");
    timeoutFallback.execute = mock(async () => ({ success: true, semanticLocator: "timeout" }));

    const defaultFallback = new ClickAction("#default-btn");
    defaultFallback.execute = mock(async () => ({ success: true, semanticLocator: "default" }));

    const retryAction = new RetryAction(1, 100, action, {
      "TimeoutError": timeoutFallback,
      "default": defaultFallback
    });

    const result = await retryAction.execute(mockPage as Page);
    expect(result.success).toBe(true);
    expect(timeoutFallback.execute).not.toHaveBeenCalled();
    expect(defaultFallback.execute).toHaveBeenCalledTimes(1);
  });

  it("should generate valid Playwright code for dynamic fallbacks", () => {
    const action = new ClickAction("#btn");
    const timeoutFallback = new ClickAction("#timeout-btn");
    const defaultFallback = new ClickAction("#default-btn");
    const retryAction = new RetryAction(1, 100, action, {
      "TimeoutError": timeoutFallback,
      "default": defaultFallback
    });

    const code = retryAction.toCode();
    expect(code).toContain("if (e.message && e.message.includes('TimeoutError'))");
    expect(code).toContain("await page.click('#timeout-btn');");
    expect(code).toContain("await page.click('#default-btn');");
  });

  it("should throw unhandled errors in generated Playwright code when no fallback matches", () => {
    const action = new ClickAction("#btn");
    const timeoutFallback = new ClickAction("#timeout-btn");
    const retryAction = new RetryAction(1, 100, action, {
      "TimeoutError": timeoutFallback
    });

    const code = retryAction.toCode();
    expect(code).toContain("if (e.message && e.message.includes('TimeoutError'))");
    expect(code).toContain("await page.click('#timeout-btn');");
    expect(code).toContain("throw e;");
  });
});
