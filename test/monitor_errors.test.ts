import { expect, it, describe, afterAll, beforeAll } from "bun:test";
import { Buddy } from "../src/buddy";

describe("Buddy.explore with monitorErrors", () => {
    let server: any;
    let baseUrl: string;

    beforeAll(() => {
        server = Bun.serve({
            port: 0, // Random port
            fetch(req) {
                const url = new URL(req.url);
                if (url.pathname === "/") {
                    return new Response(`
                        <html>
                            <body>
                                <h1>Test Page</h1>
                                <script>
                                    console.error("Test Console Error");
                                    fetch('/api/error').catch(() => {});
                                    fetch('/api/missing').catch(() => {});
                                </script>
                            </body>
                        </html>
                    `, { headers: { "Content-Type": "text/html" } });
                }
                if (url.pathname === "/api/error") {
                    return new Response("Server Error", { status: 500 });
                }
                if (url.pathname === "/api/missing") {
                    return new Response("Not Found", { status: 404 });
                }
                return new Response("Not Found", { status: 404 });
            },
        });
        baseUrl = `http://localhost:${server.port}`;
    });

    afterAll(() => {
        server.stop();
    });

    it("should fail when console or network errors occur if monitorErrors is true", async () => {
        const buddy = new Buddy();

        // We expect this to throw because of the errors
        let error: Error | null = null;
        try {
            await buddy.explore(baseUrl, { monitorErrors: true } as any); // Type cast until we update interface
        } catch (e: any) {
            error = e;
        }

        expect(error).not.toBeNull();
        if (error) {
            expect(error.message).toContain("Test Console Error");
            expect(error.message).toContain("500");
            expect(error.message).toContain("/api/error");
            expect(error.message).toContain("404");
            expect(error.message).toContain("/api/missing");
        }

        await buddy.close();
    }, 20000);

    it("should NOT fail when errors occur if monitorErrors is false (default)", async () => {
        const buddy = new Buddy();

        // Should not throw
        await expect(buddy.explore(baseUrl)).resolves.toBeDefined();

        await buddy.close();
    }, 20000);
});
