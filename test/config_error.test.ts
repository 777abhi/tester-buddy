import { expect, it, describe, beforeEach, afterEach, spyOn, mock } from "bun:test";

const mockReadFile = mock(() => Promise.resolve('{}'));

mock.module("fs/promises", () => {
  return {
    readFile: mockReadFile,
    writeFile: mock(() => Promise.resolve()),
  };
});

// Import ConfigLoader using require to ensure mocks are in place
const { ConfigLoader } = require("../src/config");

describe("ConfigLoader Error Handling", () => {
  let warnSpy: any;

  beforeEach(() => {
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    mockReadFile.mockClear();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("should return empty config and warn when readFile throws non-ENOENT error", async () => {
    const error = new Error("Permission denied");
    (error as any).code = "EACCES";
    mockReadFile.mockRejectedValue(error);

    const config = await ConfigLoader.load("some-path.json");

    expect(config).toEqual({});
    expect(warnSpy).toHaveBeenCalled();
    const warnCall = warnSpy.mock.calls[0];
    expect(warnCall[0]).toBe("Could not load some-path.json:");
    expect(warnCall[1]).toBe(error.message);
  });

  it("should return empty config and warn when JSON.parse fails", async () => {
    mockReadFile.mockResolvedValue("invalid json");

    const config = await ConfigLoader.load("invalid.json");

    expect(config).toEqual({});
    expect(warnSpy).toHaveBeenCalled();
    const warnCall = warnSpy.mock.calls[0];
    expect(warnCall[0]).toBe("Could not load invalid.json:");
    expect(warnCall[1]).toMatch(/Unexpected (token|identifier)/);
  });

  it("should return empty config and NOT warn when readFile throws ENOENT error", async () => {
    const error = new Error("File not found");
    (error as any).code = "ENOENT";
    mockReadFile.mockRejectedValue(error);

    const config = await ConfigLoader.load("non-existent.json");

    expect(config).toEqual({});
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
