import { expect, it, describe, afterAll, beforeAll } from "bun:test";
import { Buddy } from "../src/buddy";

// Mock server state
const port = 5000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://localhost:${port}`;

const server = Bun.serve({
  port: port,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response(`
        <html>
          <body>
            <h1>Home</h1>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/broken">Broken Link</a>
            <a href="https://example.com">External Link</a>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }
    if (url.pathname === "/about") {
      return new Response(`
        <html>
          <body>
            <h1>About</h1>
            <a href="/">Home</a>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }
    if (url.pathname === "/contact") {
      return new Response(`
        <html>
          <body>
            <h1>Contact</h1>
            <a href="mailto:test@test.com">Email</a>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }
    return new Response("Not Found", { status: 404 });
  },
});

describe("Buddy Crawl", () => {
  let buddy: Buddy;

  beforeAll(() => {
    buddy = new Buddy({});
  });

  afterAll(async () => {
    await buddy.close();
    server.stop();
  });

  it("should crawl the site and discover links up to depth", async () => {
    // Cast to any because crawl is not yet defined
    // depth defaults to 2 in CLI, but we pass explicitly
    const results = await (buddy as any).crawl(baseUrl, 2);

    // Expectations
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);

    // Check Home page
    // Using find because order is not guaranteed (BFS vs network speed)
    const home = results.find((r: any) => r.url === baseUrl + "/" || r.url === baseUrl);
    expect(home).toBeDefined();
    expect(home.status).toBe(200);
    // Links might be absolute
    const aboutLink = home.links.find((l: string) => l.includes("/about"));
    expect(aboutLink).toBeDefined();

    // Check About page (depth 1)
    const about = results.find((r: any) => r.url.includes("/about"));
    expect(about).toBeDefined();
    expect(about.status).toBe(200);

    // Check Broken link (depth 1)
    const broken = results.find((r: any) => r.url.includes("/broken"));
    expect(broken).toBeDefined();
    expect(broken.status).toBe(404);

    // External link should not be visited (crawled)
    const external = results.find((r: any) => r.url.includes("example.com"));
    expect(external).toBeUndefined();
  }, 30000); // Increased timeout to 30s
});
