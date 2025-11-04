import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import {
  ApiError,
  apiCall,
  buildApiUrl,
  onUnauthorized,
  unwrapApiEnvelope,
} from "../base";

const originalFetch = global.fetch;
const mockFetch = vi.fn();

describe("api base helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    // Reset cookies between tests
    document.cookie = "";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("buildApiUrl composes endpoint with base url", () => {
    expect(buildApiUrl("/persona")).toBe(
      "http://localhost:8080/v1/api/persona",
    );
    expect(buildApiUrl("persona")).toBe("http://localhost:8080/v1/api/persona");
  });

  it("unwrapApiEnvelope returns raw payload when not wrapped", () => {
    expect(unwrapApiEnvelope({ id: 1 })).toEqual({ id: 1 });
  });

  it("unwrapApiEnvelope extracts data field from envelope", () => {
    expect(unwrapApiEnvelope({ status: true, data: { id: 2 } })).toEqual({
      id: 2,
    });
  });

  it("apiCall performs GET requests and parses JSON", async () => {
    const responsePayload = { ok: true };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiCall("/health");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/v1/api/health",
      expect.objectContaining({
        credentials: "include",
      }),
    );
    expect(result).toEqual(responsePayload);
  });

  it("apiCall attaches CSRF header for mutating requests when cookie exists", async () => {
    document.cookie = "XSRF-TOKEN=fake-token";
    mockFetch.mockResolvedValueOnce(
      new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiCall("/persona", { method: "POST", body: "{}" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0] ?? [];
    const headers = (options?.headers as Headers) ?? new Headers();
    expect(headers.get("X-XSRF-TOKEN")).toBe("fake-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("apiCall notifies unauthorized listeners on 401", async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiCall("/persona")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("apiCall throws ApiError when JSON is invalid", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("invalid-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiCall("/persona")).rejects.toBeInstanceOf(ApiError);
  });
});
