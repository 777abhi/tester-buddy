import { expect, it, describe, beforeEach, mock } from "bun:test";
import { ActionParser } from "../src/features/actions/parser";
import { ClickAction } from "../src/features/actions/implementations";
import { Page } from "playwright";

describe("Control Flow Actions", () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      click: mock(async () => {}),
      $: mock(async (selector: string) => {
        if (selector === "#exists") return {};
        return null;
      }),
      evaluate: mock(async () => {}), // for semantic locator
    };
  });

  describe("LoopAction", () => {
    it("should parse loop action correctly", () => {
      const action = ActionParser.parse("loop:3:click:#btn") as any;
      expect(action.constructor.name).toBe("LoopAction");
      expect(action.count).toBe(3);
      expect(action.action).toBeInstanceOf(ClickAction);
      expect((action.action as ClickAction).selector).toBe("#btn");
    });

    it("should execute inner action N times", async () => {
      // We can't use the real LoopAction yet, so we mock the behavior or wait for implementation.
      // This test is expected to fail or error out until implemented.
      const action = ActionParser.parse("loop:3:click:#btn") as any;

      // Mock the inner action's execute method to track calls
      action.action.execute = mock(async () => ({ success: true }));

      await action.execute(mockPage as Page);
      expect(action.action.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe("ConditionAction", () => {
    it("should parse if action correctly", () => {
      const action = ActionParser.parse("if:#exists:click:#btn") as any;
      expect(action.constructor.name).toBe("ConditionAction");
      expect(action.selector).toBe("#exists");
      expect(action.action).toBeInstanceOf(ClickAction);
    });

    it("should execute inner action if selector exists", async () => {
      const action = ActionParser.parse("if:#exists:click:#btn") as any;
      action.action.execute = mock(async () => ({ success: true }));

      await action.execute(mockPage as Page);
      expect(mockPage.$).toHaveBeenCalledWith("#exists");
      expect(action.action.execute).toHaveBeenCalledTimes(1);
    });

    it("should NOT execute inner action if selector does NOT exist", async () => {
      const action = ActionParser.parse("if:#missing:click:#btn") as any;
      action.action.execute = mock(async () => ({ success: true }));

      await action.execute(mockPage as Page);
      expect(mockPage.$).toHaveBeenCalledWith("#missing");
      expect(action.action.execute).not.toHaveBeenCalled();
    });
  });

  describe("Nested Actions", () => {
    it("should parse nested loop and if", () => {
      const action = ActionParser.parse("loop:2:if:#exists:click:#btn") as any;
      expect(action.constructor.name).toBe("LoopAction");
      expect(action.count).toBe(2);
      expect(action.action.constructor.name).toBe("ConditionAction");
      expect(action.action.selector).toBe("#exists");
      expect(action.action.action).toBeInstanceOf(ClickAction);
    });
  });

  describe("RetryAction", () => {
    it("should parse retry action correctly with default interval", () => {
      const action = ActionParser.parse("retry:3:click:#btn") as any;
      expect(action.constructor.name).toBe("RetryAction");
      expect(action.maxRetries).toBe(3);
      expect(action.interval).toBe(500);
      expect(action.action).toBeInstanceOf(ClickAction);
    });

    it("should parse retry action correctly with custom interval", () => {
      const action = ActionParser.parse("retry:3:1000:click:#btn") as any;
      expect(action.constructor.name).toBe("RetryAction");
      expect(action.maxRetries).toBe(3);
      expect(action.interval).toBe(1000);
      expect(action.action).toBeInstanceOf(ClickAction);
    });

    it("should execute inner action and stop if it succeeds on first try", async () => {
      const action = ActionParser.parse("retry:3:click:#btn") as any;
      action.action.execute = mock(async () => ({ success: true }));

      const result = await action.execute(mockPage as Page);
      expect(result.success).toBe(true);
      expect(action.action.execute).toHaveBeenCalledTimes(1);
    });

    it("should retry inner action until it succeeds", async () => {
      const action = ActionParser.parse("retry:3:click:#btn") as any;
      let calls = 0;
      action.action.execute = mock(async () => {
        calls++;
        if (calls < 3) return { success: false, error: "Failed" };
        return { success: true };
      });

      const result = await action.execute(mockPage as Page);
      expect(result.success).toBe(true);
      expect(action.action.execute).toHaveBeenCalledTimes(3);
    });

    it("should wait for custom interval between retries", async () => {
      const action = ActionParser.parse("retry:2:2000:click:#btn") as any;
      let calls = 0;
      action.action.execute = mock(async () => {
        calls++;
        if (calls < 2) return { success: false, error: "Failed" };
        return { success: true };
      });
      mockPage.waitForTimeout = mock(async () => {});

      const result = await action.execute(mockPage as Page);
      expect(result.success).toBe(true);
      expect(action.action.execute).toHaveBeenCalledTimes(2);
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });

    it("should return failure if max retries are exceeded", async () => {
      const action = ActionParser.parse("retry:2:click:#btn") as any;
      action.action.execute = mock(async () => ({ success: false, error: "Always fails" }));

      const result = await action.execute(mockPage as Page);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Always fails");
      expect(action.action.execute).toHaveBeenCalledTimes(2);
    });

    it("should parse retry action with fallback action", () => {
      const action = ActionParser.parse("retry:3:click:#btn:click:#fallback") as any;
      expect(action.constructor.name).toBe("RetryAction");
      expect(action.maxRetries).toBe(3);
      expect(action.interval).toBe(500);
      expect(action.action).toBeInstanceOf(ClickAction);
      expect(action.fallbackAction).toBeInstanceOf(ClickAction);
      expect((action.fallbackAction as ClickAction).selector).toBe("#fallback");
    });

    it("should execute fallback action if all retries fail", async () => {
      const action = ActionParser.parse("retry:2:1000:click:#btn:click:#fallback") as any;
      action.action.execute = mock(async () => ({ success: false, error: "Always fails" }));
      action.fallbackAction.execute = mock(async () => ({ success: true }));

      const result = await action.execute(mockPage as Page);
      expect(result.success).toBe(true);
      expect(action.action.execute).toHaveBeenCalledTimes(2);
      expect(action.fallbackAction.execute).toHaveBeenCalledTimes(1);
    });
  });
});
