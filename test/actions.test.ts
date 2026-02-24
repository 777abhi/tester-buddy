import { expect, it, describe, beforeEach, spyOn, mock } from "bun:test";
import { ClickAction, FillAction, PressAction, ScrollAction } from "../src/features/actions/implementations";
import { Page } from "playwright";

describe("Action Implementations", () => {
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
      const action = new ClickAction("#btn");
      const result = await action.execute(mockPage as Page);

      expect(mockPage.click).toHaveBeenCalledWith("#btn");
      expect(result.success).toBe(true);
      expect(result.semanticLocator).toBe("getByRole('button', { name: 'Submit' })");
    });
  });

  describe("FillAction", () => {
    it("should fill the selector and return semantic locator", async () => {
      const action = new FillAction("#input", "hello");
      const result = await action.execute(mockPage as Page);

      expect(mockPage.fill).toHaveBeenCalledWith("#input", "hello");
      expect(result.success).toBe(true);
      expect(result.semanticLocator).toBe("getByRole('button', { name: 'Submit' })"); // Mocked return
    });

    // The logic to validate params is moved to Parser.
    // FillAction constructor expects strings.
  });

  describe("PressAction", () => {
    it("should press the specified key", async () => {
      const action = new PressAction("Enter");
      await action.execute(mockPage as Page);
      expect(mockPage.keyboard.press).toHaveBeenCalledWith("Enter");
    });
  });

  describe("ScrollAction", () => {
    it("should scroll to top", async () => {
      const action = new ScrollAction("top");
      await action.execute(mockPage as Page);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it("should scroll to bottom", async () => {
      const action = new ScrollAction("bottom");
      await action.execute(mockPage as Page);
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it("should scroll to selector", async () => {
      const action = new ScrollAction("#target");

      await action.execute(mockPage as Page);

      expect(mockPage.$).toHaveBeenCalledWith("#target");
      expect(mockElement.scrollIntoViewIfNeeded).toHaveBeenCalled();
    });

    it("should return error if selector not found", async () => {
      const action = new ScrollAction("#missing");

      const result = await action.execute(mockPage as Page);

      expect(mockPage.$).toHaveBeenCalledWith("#missing");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Element not found");
    });
  });
});
