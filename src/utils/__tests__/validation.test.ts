import { describe, it, expect } from "vitest";
import {
  EMAIL_REGEX,
  PASSWORD_RULE_REGEX,
  ensureExactLength,
  isEmailValid,
  sanitizeDigits,
} from "../validation";

describe("validation utilities", () => {
  it("sanitizeDigits removes non numeric characters and respects max length", () => {
    expect(sanitizeDigits("12-34.56")).toBe("123456");
    expect(sanitizeDigits("99 88 77", 4)).toBe("9988");
  });

  it("EMAIL_REGEX and isEmailValid accept valid email formats", () => {
    expect(isEmailValid("user@example.com")).toBe(true);
    expect(EMAIL_REGEX.test("bad-email")).toBe(false);
  });

  it("PASSWORD_RULE_REGEX enforces uppercase and special character", () => {
    expect(PASSWORD_RULE_REGEX.test("Clave$segura")).toBe(true);
    expect(PASSWORD_RULE_REGEX.test("solo minusculas")).toBe(false);
    expect(PASSWORD_RULE_REGEX.test("SINCARACTERES")).toBe(false);
  });

  it("ensureExactLength delegates to sanitizeDigits with slicing", () => {
    expect(ensureExactLength("abc12345", 3)).toBe("123");
  });
});
