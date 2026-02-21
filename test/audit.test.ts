import { expect, it, describe, beforeEach, afterEach, spyOn, mock } from "bun:test";

const mockAnalyze = mock(() => Promise.resolve({ violations: [] }));

// Mocking dependencies
mock.module("@axe-core/playwright", () => {
  return {
    default: class {
      constructor() {}
      analyze = mockAnalyze;
    },
  };
});

mock.module("playwright", () => {
  return {
    Page: class {},
  };
});

// Import Auditor using require to ensure mocks are in place
const { Auditor } = require("../src/features/audit");

describe("Auditor", () => {
  let auditor: Auditor;
  let mockPage: any;
  let logSpy: any;
  let warnSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    auditor = new Auditor();
    mockPage = {
      url: () => "https://example.com",
    };
    logSpy = spyOn(console, "log").mockImplementation(() => {});
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = spyOn(console, "error").mockImplementation(() => {});
    mockAnalyze.mockClear();
    mockAnalyze.mockResolvedValue({ violations: [] });
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("should warn when on about:blank and skip audit", async () => {
    mockPage.url = () => "about:blank";
    await auditor.runAudit(mockPage, []);

    expect(warnSpy).toHaveBeenCalledWith("Cannot run audit on about:blank. Please navigate to a URL first.");
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it("should report no violations when audit is clean", async () => {
    await auditor.runAudit(mockPage, []);

    expect(logSpy).toHaveBeenCalledWith("No accessibility violations found.");
    expect(logSpy).toHaveBeenCalledWith("No console errors recorded.");
  });

  it("should report violations when found", async () => {
    const mockViolations = [
      {
        impact: "critical",
        help: "Images must have alternate text",
        helpUrl: "https://axe-core.org/rules/image-alt",
      },
      {
        impact: "serious",
        help: "Elements must have sufficient color contrast",
        helpUrl: "https://axe-core.org/rules/color-contrast",
      }
    ];
    mockAnalyze.mockResolvedValue({ violations: mockViolations });

    await auditor.runAudit(mockPage, []);

    expect(warnSpy).toHaveBeenCalledWith("Found 2 accessibility violations:");
    expect(warnSpy).toHaveBeenCalledWith("- [critical] Images must have alternate text: https://axe-core.org/rules/image-alt");
    expect(warnSpy).toHaveBeenCalledWith("- [serious] Elements must have sufficient color contrast: https://axe-core.org/rules/color-contrast");
  });

  it("should report console errors when provided", async () => {
    const consoleErrors = ["Error 1", "Error 2"];
    await auditor.runAudit(mockPage, consoleErrors);

    expect(warnSpy).toHaveBeenCalledWith("Detected 2 console errors during session:");
    expect(warnSpy).toHaveBeenCalledWith("- Error 1");
    expect(warnSpy).toHaveBeenCalledWith("- Error 2");
  });

  it("should handle audit failures gracefully", async () => {
    const error = new Error("Scan failed");
    mockAnalyze.mockRejectedValue(error);

    await auditor.runAudit(mockPage, []);

    expect(errorSpy).toHaveBeenCalledWith("Failed to run Axe audit:", error);
  });
});
