import { expect, it, describe, beforeEach, spyOn, mock } from "bun:test";
import { ClickAction, FillAction, PressAction, ScrollAction } from "../src/features/actions/strategies";
import { Page } from "playwright";

describe("Action Strategies", () => {
  let mockPage: any;
  let mockElement: any;

  beforeEach(() => {
    mockElement = {
      click: mock(async () => {}),
      fill: mock(async () => {}),
      scrollIntoViewIfNeeded: mock(async () => {}),
      tagName: 'BUTTON',
      getAttribute: mock((name: string) => {
        if (name === 'role') return 'button';
        if (name === 'aria-label') return 'Submit';
        return null;
      }),
      innerText: 'Submit'
    };

    mockPage = {
      click: mock(async () => {}),
      fill: mock(async () => {}),
      waitForLoadState: mock(async () => {}),
      waitForTimeout: mock(async () => {}),
      keyboard: {
        press: mock(async () => {}),
      },
      evaluate: mock(async (fn: Function, arg: any) => {
        // Mock evaluate to simulate getSemanticLocator logic somewhat
        // Since we can't easily run the real browser code here, we'll mock the return
        // based on the element we "found"
        if (arg === mockElement) {
           return "getByRole('button', { name: 'Submit' })";
        }
        return undefined;
      }),
      $: mock(async (selector: string) => {
        if (selector === "#missing") return null;
        return mockElement;
      }),
    };
  });

  describe("ClickAction", () => {
    it("should click the selector and return semantic locator", async () => {
      const action = new ClickAction();
      const result = await action.execute(mockPage as Page, "#btn");

      expect(mockPage.click).toHaveBeenCalledWith("#btn");
      expect(result.success).toBe(true);
      expect(result.semanticLocator).toBe("getByRole('button', { name: 'Submit' })");
    });
  });

  describe("FillAction", () => {
    it("should fill the selector and return semantic locator", async () => {
      const action = new FillAction();
      const result = await action.execute(mockPage as Page, "#input:hello");

      expect(mockPage.fill).toHaveBeenCalledWith("#input", "hello");
      expect(result.success).toBe(true);
      expect(result.semanticLocator).toBe("getByRole('button', { name: 'Submit' })"); // Mocked return
    });

    it("should fail if format is invalid", async () => {
      const action = new FillAction();
      const result = await action.execute(mockPage as Page, "invalid");

      expect(result.success).toBe(false);
      expect(result.error).toContain("requires selector and value");
    });
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

      await action.execute(mockPage as Page, "#target");

      expect(mockPage.$).toHaveBeenCalledWith("#target");
      expect(mockElement.scrollIntoViewIfNeeded).toHaveBeenCalled();
    });

    it("should return error if selector not found", async () => {
      const action = new ScrollAction();

      const result = await action.execute(mockPage as Page, "#missing");

      expect(mockPage.$).toHaveBeenCalledWith("#missing");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Element not found");
    });
  });
});
