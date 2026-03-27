import { describe, expect, it } from "vitest";
import { parseQueryBoolean, parseQueryNumber, parseQueryString } from "./pagination";

describe("pagination query helpers", () => {
  it("parses string values", () => {
    expect(parseQueryString(" hello ")).toBe("hello");
    expect(parseQueryString("")).toBeUndefined();
    expect(parseQueryString(undefined)).toBeUndefined();
  });

  it("parses numeric values with fallback", () => {
    expect(parseQueryNumber("12", 1)).toBe(12);
    expect(parseQueryNumber("1.8", 1)).toBe(1);
    expect(parseQueryNumber("0", 7)).toBe(7);
    expect(parseQueryNumber("abc", 5)).toBe(5);
  });

  it("parses booleans", () => {
    expect(parseQueryBoolean("true")).toBe(true);
    expect(parseQueryBoolean("false")).toBe(false);
    expect(parseQueryBoolean("TRUE")).toBeUndefined();
    expect(parseQueryBoolean(undefined)).toBeUndefined();
  });
});
