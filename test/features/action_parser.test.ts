import { expect, test, describe } from "bun:test";
import { ActionParser } from "../../src/features/actions/parser";
import { ClickAction, FillAction, WaitAction, GotoAction, PressAction, ScrollAction } from "../../src/features/actions/implementations";

describe("ActionParser", () => {
  test("should parse click action", () => {
    const action = ActionParser.parse("click:button");
    expect(action).toBeInstanceOf(ClickAction);
    expect((action as any).selector).toBe("button");
  });

  test("should parse fill action", () => {
    const action = ActionParser.parse("fill:#email:test@example.com");
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe("#email");
    expect((action as any).value).toBe("test@example.com");
  });

  test("should parse wait action", () => {
    const action = ActionParser.parse("wait:1000");
    expect(action).toBeInstanceOf(WaitAction);
    expect((action as any).ms).toBe(1000);
  });

  test("should parse goto action", () => {
    const action = ActionParser.parse("goto:https://example.com");
    expect(action).toBeInstanceOf(GotoAction);
    expect((action as any).url).toBe("https://example.com");
  });

  test("should parse press action", () => {
    const action = ActionParser.parse("press:Enter");
    expect(action).toBeInstanceOf(PressAction);
    expect((action as any).key).toBe("Enter");
  });

  test("should parse scroll action", () => {
    const action = ActionParser.parse("scroll:bottom");
    expect(action).toBeInstanceOf(ScrollAction);
    expect((action as any).target).toBe("bottom");
  });

  // Edge cases
  test("should parse fill action with colons in value", () => {
    const action = ActionParser.parse("fill:#api-key:key:123:abc");
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe("#api-key");
    expect((action as any).value).toBe("key:123:abc");
  });

  // Enhanced parser support for quoted selectors
  test("should parse fill action with quoted selector containing colons", () => {
    const action = ActionParser.parse('fill:"div:nth-child(2)":test');
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe("div:nth-child(2)");
    expect((action as any).value).toBe("test");
  });

  test("should parse click action with quoted selector containing colons", () => {
    const action = ActionParser.parse('click:"button:with:colon"');
    expect(action).toBeInstanceOf(ClickAction);
    expect((action as any).selector).toBe("button:with:colon");
  });

  test("should parse fill action with quoted value containing colons", () => {
    const action = ActionParser.parse('fill:#id:"value:complex"');
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe("#id");
    expect((action as any).value).toBe("value:complex");
  });

  test("should parse fill action with both quoted", () => {
    const action = ActionParser.parse('fill:"#id:complex":"value:complex"');
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe("#id:complex");
    expect((action as any).value).toBe("value:complex");
  });

  test("should parse wait action with quoted number", () => {
    const action = ActionParser.parse('wait:"1000"');
    expect(action).toBeInstanceOf(WaitAction);
    expect((action as any).ms).toBe(1000);
  });

  test("should handle escaped quotes in quoted selector", () => {
    // Input: fill:"input[name=\"foo\"]":val
    // In JS string literal: "fill:\"input[name=\\\"foo\\\"]\":val"
    const action = ActionParser.parse('fill:"input[name=\\"foo\\"]":val');
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe('input[name="foo"]');
    expect((action as any).value).toBe("val");
  });

  test("should parse fill action with complex selector", () => {
    const action = ActionParser.parse("fill:input[name='email']:user@test.com");
    expect(action).toBeInstanceOf(FillAction);
    expect((action as any).selector).toBe("input[name='email']");
    expect((action as any).value).toBe("user@test.com");
  });

  test("should throw error for unknown action", () => {
    expect(() => ActionParser.parse("fly:moon")).toThrow();
  });
});
