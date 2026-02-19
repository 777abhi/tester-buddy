import { expect, it, describe, beforeEach, spyOn, mock } from "bun:test";
import { PressAction, ScrollAction } from "../src/features/actions/strategies";
import { Page } from "playwright";

describe("Action Strategies", () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      keyboard: {
        press: mock(async () => {}),
      },
      evaluate: mock(async () => {}),
      $: mock(async (selector: string) => {
        if (selector === "#missing") return null;
        return {
          scrollIntoViewIfNeeded: mock(async () => {}),
        };
      }),
    };
  });

  describe("PressAction", () => {
    it("should press the specified key", async () => {
      const action = new PressAction();
      await action.execute(mockPage as Page, "Enter");
      expect(mockPage.keyboard.press).toHaveBeenCalledWith("Enter");
    });
  });

  describe("ScrollAction", () => {
    it("should scroll to top", async () => {
      const action = new ScrollAction();
      await action.execute(mockPage as Page, "top");
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it("should scroll to bottom", async () => {
      const action = new ScrollAction();
      await action.execute(mockPage as Page, "bottom");
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it("should scroll to selector", async () => {
      const action = new ScrollAction();
      const mockElement = {
        scrollIntoViewIfNeeded: mock(async () => {}),
      };
      // Override the default mock for this test
      mockPage.$ = mock(async () => mockElement);

      await action.execute(mockPage as Page, "#target");

      expect(mockPage.$).toHaveBeenCalledWith("#target");
      expect(mockElement.scrollIntoViewIfNeeded).toHaveBeenCalled();
    });

    it("should warn if selector not found", async () => {
      const action = new ScrollAction();
      mockPage.$ = mock(async () => null);
      const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

      await action.execute(mockPage as Page, "#missing");

      expect(mockPage.$).toHaveBeenCalledWith("#missing");
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
