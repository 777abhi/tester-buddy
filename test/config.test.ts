import { expect, it, describe, afterEach } from "bun:test";
import { ConfigLoader } from "../src/config";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const TEST_CONFIG_PATH = join(process.cwd(), "test-buddy.config.json");

describe("ConfigLoader", () => {
  afterEach(() => {
    if (existsSync(TEST_CONFIG_PATH)) {
      unlinkSync(TEST_CONFIG_PATH);
    }
  });

  it("should load configuration from file", async () => {
    const configData = {
      roles: {
        admin: {
          cookies: [{ name: "session", value: "123", domain: "localhost", path: "/" }],
          localStorage: { theme: "dark" }
        }
      }
    };
    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(configData));

    const config = await ConfigLoader.load(TEST_CONFIG_PATH);
    expect(config).toEqual(configData);
  });

  it("should return empty config if file does not exist", async () => {
    const config = await ConfigLoader.load("non-existent-file.json");
    expect(config).toEqual({});
  });
});
