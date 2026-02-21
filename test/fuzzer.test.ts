import { expect, it, describe, beforeEach, spyOn, mock } from "bun:test";
import { Fuzzer } from "../src/features/fuzzer";
import { FormAnalyzer } from "../src/features/forms";

// Mock FormAnalyzer
mock.module("../src/features/forms", () => {
  return {
    FormAnalyzer: class {
      async analyze(page: any) {
        return [
          {
            type: "form",
            id: "login-form",
            index: 0,
            inputs: [
              {
                tag: "input",
                type: "text",
                name: "username",
                id: "user",
                label: "Username",
                required: true,
                value: ""
              },
              {
                tag: "input",
                type: "password",
                name: "password",
                id: "pass",
                label: "Password",
                required: true,
                value: ""
              },
              {
                tag: "button",
                type: "submit",
                name: "",
                id: "submit-btn",
                label: "Login",
                required: false,
                value: ""
              }
            ]
          }
        ];
      }
    }
  };
});

describe("Fuzzer", () => {
  let fuzzer: Fuzzer;
  let mockPage: any;
  let mockLocator: any;

  beforeEach(() => {
    fuzzer = new Fuzzer();

    // Create a mock locator that returns itself for chaining
    mockLocator = {
      fill: mock(() => Promise.resolve()),
      click: mock(() => Promise.resolve()),
      first: () => mockLocator,
      count: mock(() => Promise.resolve(1)),
      isVisible: mock(() => Promise.resolve(true)),
      locator: () => mockLocator,
      nth: () => mockLocator,
    };

    mockPage = {
      fill: mock(() => Promise.resolve()),
      click: mock(() => Promise.resolve()),
      waitForLoadState: mock(() => Promise.resolve()),
      url: () => "http://test.com",
      goto: mock(() => Promise.resolve()),
      reload: mock(() => Promise.resolve()),
      evaluate: mock(() => Promise.resolve()),
      on: mock(() => {}),
      off: mock(() => {}),
      locator: mock(() => mockLocator),
    };
  });

  it("should find forms and fill inputs with fuzz payloads", async () => {
    const results = await fuzzer.fuzz(mockPage, { timeout: 10 });

    // Expect at least one result per payload per input
    expect(results.length).toBeGreaterThan(0);

    // Check that fill was called on the locator
    const calls = (mockLocator.fill as any).mock.calls;
    const filledValues = calls.map((call: any[]) => call[0]); // fill(value)

    // Check for SQL injection payload
    expect(filledValues.some((val: string) => val.includes("' OR '1'='1"))).toBe(true);

    // Check for Long String payload
    expect(filledValues.some((val: string) => val.length > 100)).toBe(true);

    // Check that submit button was clicked
    expect(mockLocator.click).toHaveBeenCalled();

    // Check that reload was called (since url didn't change in mock)
    expect(mockPage.reload).toHaveBeenCalled();
  });
});
