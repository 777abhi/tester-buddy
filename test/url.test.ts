import { expect, it, describe } from "bun:test";
import { redactUrl } from "../src/utils/url";

describe("redactUrl", () => {
    it("should redact sensitive query parameters", () => {
        const url = "https://example.com/api/login?username=jules&password=secret123&token=abc-123";
        const redacted = redactUrl(url);
        expect(redacted).toContain("username=REDACTED");
        expect(redacted).toContain("password=REDACTED");
        expect(redacted).toContain("token=REDACTED");
    });

    it("should leave non-sensitive query parameters intact", () => {
        const url = "https://example.com/search?q=query&page=1";
        const redacted = redactUrl(url);
        expect(redacted).toBe(url);
    });

    it("should redact PII like email", () => {
        const url = "https://example.com/profile?email=user@example.com&userId=123";
        const redacted = redactUrl(url);
        expect(redacted).toContain("email=REDACTED");
        expect(redacted).toContain("userId=123");
    });

    it("should handle mixed sensitive and non-sensitive parameters", () => {
        const url = "https://api.service.com/v1/data?key=private-key&id=456&debug=true";
        const redacted = redactUrl(url);
        expect(redacted).toContain("key=REDACTED");
        expect(redacted).toContain("id=456");
        expect(redacted).toContain("debug=true");
    });

    it("should handle partial matches of sensitive keywords", () => {
        const url = "https://example.com/auth?my_api_key=secret&session_id=999";
        const redacted = redactUrl(url);
        expect(redacted).toContain("my_api_key=REDACTED");
        expect(redacted).toContain("session_id=REDACTED");
    });

    it("should return original string for invalid URLs", () => {
        const invalidUrl = "not-a-url";
        expect(redactUrl(invalidUrl)).toBe(invalidUrl);
    });

    it("should return original string if no sensitive parameters are found", () => {
        const url = "https://example.com/path/to/resource";
        expect(redactUrl(url)).toBe(url);
    });
});
