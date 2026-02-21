import { expect, it, describe, spyOn } from "bun:test";
import { Explorer } from "../src/features/explorer";
import { INTERACTIVE_SELECTORS, ALERT_SELECTORS } from "../src/features/constants";

describe("Explorer", () => {
  it("should call page.evaluate with correct constants", async () => {
    const explorer = new Explorer();
    const mockPage = {
      evaluate: async (fn: any, args: any) => {
        return { fn, args };
      }
    };

    const result = await explorer.scrape(mockPage as any) as any;

    expect(result.args.interactive).toEqual(INTERACTIVE_SELECTORS);
    expect(result.args.alerts).toEqual(ALERT_SELECTORS);
  });

  it("should use override selectors from config if provided", async () => {
    const customInteractive = ["div.interactive"];
    const customAlerts = ["div.alert"];
    const explorer = new Explorer({
      interactiveSelectors: customInteractive,
      alertSelectors: customAlerts
    });

    const mockPage = {
      evaluate: async (fn: any, args: any) => {
        return { fn, args };
      }
    };

    const result = await explorer.scrape(mockPage as any) as any;

    expect(result.args.interactive).toEqual(customInteractive);
    expect(result.args.alerts).toEqual(customAlerts);
  });
});
