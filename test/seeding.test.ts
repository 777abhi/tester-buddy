import { expect, it, describe, afterAll, spyOn } from "bun:test";
import { Buddy } from "../src/buddy";
import { BuddyConfig } from "../src/config";

// Mock server state
let lastRequest: any = null;
const port = 4000 + Math.floor(Math.random() * 1000);

const server = Bun.serve({
  port: port,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/seed") {
      try {
        const body = await req.json();
        lastRequest = {
            method: req.method,
            url: req.url,
            body: body,
        };
      } catch (e) {
          lastRequest = {
              method: req.method,
              url: req.url,
              body: null
          }
      }
      return new Response("OK");
    }
    return new Response("Not Found", { status: 404 });
  },
});

describe("Buddy Seeding", () => {

  afterAll(() => {
    server.stop();
  });

  it("should send seed request when configured", async () => {
    const config: BuddyConfig = {
      seeding: {
        url: `http://localhost:${port}/seed`,
        method: "POST"
      }
    };

    const buddy = new Buddy(config);
    lastRequest = null;

    await buddy.seedData(50);

    expect(lastRequest).not.toBeNull();
    expect(lastRequest.method).toBe("POST");
    expect(lastRequest.body).toEqual({ count: 50 });
  });

  it("should warn and use mock when not configured", async () => {
    const buddy = new Buddy({});
    lastRequest = null;

    const warnSpy = spyOn(console, "warn");
    // Suppress console output for cleaner test run
    const logSpy = spyOn(console, "log");
    warnSpy.mockImplementation(() => {});
    logSpy.mockImplementation(() => {});

    await buddy.seedData(10);

    expect(warnSpy).toHaveBeenCalledWith("No seeding configuration found. Using mock implementation.");
    expect(lastRequest).toBeNull();

    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
