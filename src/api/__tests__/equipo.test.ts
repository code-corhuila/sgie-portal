import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import type * as BaseExports from "../base";

vi.mock("../base", async () => {
  const actual = await vi.importActual<typeof BaseExports>("../base");
  return {
    ...actual,
    apiCall: vi.fn(),
  };
});

const { EquiposApi } = await import("../equipo");
const baseModule = await import("../base");
const apiCallMock = baseModule.apiCall as unknown as Mock;

describe("EquiposApi", () => {
  beforeEach(() => {
    apiCallMock.mockReset();
  });

  it("getAll obtiene información de equipos con instalación", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await EquiposApi.getAll();

    expect(apiCallMock).toHaveBeenCalledWith("/equipo/equipo-instalacion");
  });

  it("searchByCodigo codifica parámetro y retorna datos", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await EquiposApi.searchByCodigo("EQ 01");

    expect(apiCallMock).toHaveBeenCalledWith(
      "/equipo/equipo-instalacion?codigoEquipo=EQ%2001",
    );
  });

  it("toggleEstado realiza PUT con estado", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await EquiposApi.toggleEstado(7, false);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/equipo/7/cambiar-estado",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
        body: JSON.stringify({ estado: false }),
      }),
    );
  });

  it("create y update equipo envían payload JSON", async () => {
    apiCallMock.mockResolvedValue(undefined);

    await EquiposApi.createEquipo({} as any);
    await EquiposApi.updateEquipo(9, {} as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/equipo",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/equipo/9",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
  });

  it("catálogos de categorías, tipos e instalaciones consultan endpoints correctos", async () => {
    apiCallMock.mockResolvedValue({ data: [] });

    await EquiposApi.getCategorias();
    await EquiposApi.createCategoria({} as any);
    await EquiposApi.getTipos();
    await EquiposApi.createTipo({} as any);
    await EquiposApi.getInstalaciones();

    expect(apiCallMock).toHaveBeenCalledWith("/categoria-equipo");
    expect(apiCallMock).toHaveBeenCalledWith(
      "/categoria-equipo",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith("/tipo-equipo");
    expect(apiCallMock).toHaveBeenCalledWith(
      "/tipo-equipo",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith("/instalacion");
  });
});
