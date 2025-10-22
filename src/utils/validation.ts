export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
export const PASSWORD_RULE_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

export const sanitizeDigits = (value: string, maxLength?: number): string => {
  const digits = value.replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
};

export const isEmailValid = (value: string): boolean => EMAIL_REGEX.test(value);

export const ensureExactLength = (value: string, length: number): string =>
  sanitizeDigits(value, length);
