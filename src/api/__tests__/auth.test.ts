import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import type * as BaseExports from "../base";

vi.mock("../base", async () => {
  const actual = await vi.importActual<typeof BaseExports>("../base");
  return {
    ...actual,
    apiCall: vi.fn(),
  };
});

const { AuthApi } = await import("../auth");
const baseModule = await import("../base");
const apiCallMock = baseModule.apiCall as unknown as Mock;

describe("AuthApi", () => {
  beforeEach(() => {
    apiCallMock.mockReset();
  });

  it("login calls /usuario/login with payload and unwraps response", async () => {
    apiCallMock.mockResolvedValueOnce({ data: { token: "abc" } });

    const result = await AuthApi.login({
      email: "user@example.com",
      password: "secret",
    });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/usuario/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "secret",
        }),
      }),
    );
    expect(result).toEqual({ token: "abc" });
  });

  it("logout calls /usuario/logout with POST and skipJson", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await AuthApi.logout();

    expect(apiCallMock).toHaveBeenCalledWith(
      "/usuario/logout",
      expect.objectContaining({
        method: "POST",
        skipJson: true,
      }),
    );
  });

  it("currentSession fetches and unwraps session payload", async () => {
    apiCallMock.mockResolvedValueOnce({ data: { email: "a@b.com" } });

    const result = await AuthApi.currentSession();

    expect(apiCallMock).toHaveBeenCalledWith("/usuario/me");
    expect(result).toEqual({ email: "a@b.com" });
  });
});
