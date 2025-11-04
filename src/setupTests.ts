import "@testing-library/jest-dom";
import "whatwg-fetch";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

if (!("matchMedia" in window)) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      media: query,
      matches: false,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  // @ts-expect-error - exposing stub for JSDOM
  window.ResizeObserver = ResizeObserverStub;
}
