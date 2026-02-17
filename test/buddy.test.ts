import { expect, it, describe, beforeEach, spyOn } from "bun:test";
import { Buddy } from "../src/buddy";

describe("Buddy.injectState", () => {
  let buddy: any;
  let mockContext: any;
  let mockPage: any;

  beforeEach(() => {
    buddy = new Buddy();
    mockContext = {
      addCookies: async () => {},
    };
    mockPage = {
      evaluate: async () => {},
    };
    // Accessing private members for testing purposes
    (buddy as any).browserManager = {
      getContext: () => mockContext,
      getPage: () => mockPage,
      ensurePage: async () => mockPage,
    };
  });

  it("should catch and log error when addCookies fails", async () => {
    const error = new Error("Mocked addCookies error");
    mockContext.addCookies = async () => {
      throw error;
    };

    const warnSpy = spyOn(console, "warn");
    warnSpy.mockImplementation(() => {});

    await buddy.injectState("test-role");

    expect(warnSpy).toHaveBeenCalledWith(
      "Could not set cookies (maybe domain mismatch or about:blank):",
      error
    );

    warnSpy.mockRestore();
  });

  it("should not log warning when addCookies succeeds", async () => {
    mockContext.addCookies = async () => {};

    const warnSpy = spyOn(console, "warn");
    warnSpy.mockImplementation(() => {});

    await buddy.injectState("test-role");

    expect(warnSpy).not.toHaveBeenCalledWith(
      "Could not set cookies (maybe domain mismatch or about:blank):",
      expect.anything()
    );

    warnSpy.mockRestore();
  });
});
