import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../api/base", () => ({
  apiCall: vi.fn(),
  unwrapApiEnvelope: (payload: unknown) => payload,
}));

const baseModule = await import("../../../api/base");
const apiCallMock = baseModule.apiCall as unknown as ReturnType<typeof vi.fn>;

import { useCrud } from "../hooks/useCrud";

type Item = { id: number; name: string };

describe("useCrud hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCallMock.mockResolvedValue([]);
  });

  it("carga datos iniciales cuando autoFetch es true", async () => {
    apiCallMock.mockResolvedValueOnce([{ id: 1, name: "Item" }]);

    const { result } = renderHook(() => useCrud<Item>("/items"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1, name: "Item" }]);
    expect(apiCallMock).toHaveBeenCalledWith("/items");
  });

  it("permite crear, actualizar y eliminar elementos", async () => {
    const { result } = renderHook(() =>
      useCrud<Item>("/items", { autoFetch: false }),
    );

    apiCallMock.mockResolvedValueOnce({ id: 2, name: "Nuevo" });
    apiCallMock.mockResolvedValueOnce([{ id: 2, name: "Nuevo" }]); // fetchAll

    await act(async () => {
      const created = await result.current.create({ name: "Nuevo" } as any);
      expect(created).toEqual({ id: 2, name: "Nuevo" });
    });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Nuevo" }),
      }),
    );

    apiCallMock.mockResolvedValueOnce({ id: 2, name: "Actualizado" });
    apiCallMock.mockResolvedValueOnce([{ id: 2, name: "Actualizado" }]); // fetchAll

    await act(async () => {
      await result.current.update(2, { name: "Actualizado" });
    });
    expect(apiCallMock).toHaveBeenCalledWith(
      "/items/2",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ name: "Actualizado" }),
      }),
    );

    apiCallMock.mockResolvedValueOnce(undefined);
    apiCallMock.mockResolvedValueOnce([]); // fetchAll

    await act(async () => {
      await result.current.remove(2);
    });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/items/2",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
