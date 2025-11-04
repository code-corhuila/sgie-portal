import { describe, it, expect, vi } from "vitest";

const listeners: Array<(error: { status: number }) => void> = [];
const removeListener = vi.fn();

vi.mock("../../api/base", () => ({
  onUnauthorized: vi.fn((listener: (error: { status: number }) => void) => {
    listeners.push(listener);
    return removeListener;
  }),
}));

const { setupInterceptor } = await import("../interceptor");

describe("setupInterceptor", () => {
  it("invoca callback solo para errores 401 y permite desuscribirse", () => {
    const callback = vi.fn();
    const unsubscribe = setupInterceptor(callback);

    expect(typeof unsubscribe).toBe("function");
    expect(listeners).toHaveLength(1);

    listeners[0]({ status: 500 });
    expect(callback).not.toHaveBeenCalled();

    listeners[0]({ status: 401 });
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(removeListener).toHaveBeenCalled();
  });
});
