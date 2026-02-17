import { expect, it, describe, beforeEach, mock } from "bun:test";
import { Buddy } from "../src/buddy";
import { BuddyConfig } from "../src/config";

describe("Buddy Network Mocking", () => {
    let buddy: Buddy;
    let mockPage: any;

    const mockConfig: BuddyConfig = {
        mocks: [
            {
                urlPattern: "**/api/users",
                method: "GET",
                response: {
                    status: 200,
                    contentType: "application/json",
                    body: { users: [] }
                }
            }
        ]
    };

    beforeEach(() => {
        buddy = new Buddy(mockConfig);
        mockPage = {
            route: mock(() => { }),
        };
        (buddy as any).browserManager = {
            getPage: () => mockPage,
            ensurePage: async () => mockPage,
        };
    });

    it("should register routes from config", async () => {
        await buddy.applyMocks();
        expect(mockPage.route).toHaveBeenCalled();
        // Verify the first argument is the url pattern
        expect(mockPage.route.mock.calls[0][0]).toBe("**/api/users");
    });
});
