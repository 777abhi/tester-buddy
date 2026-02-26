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
});
