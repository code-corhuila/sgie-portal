import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import type * as BaseExports from "../base";

vi.mock("../base", async () => {
  const actual = await vi.importActual<typeof BaseExports>("../base");
  return {
    ...actual,
    apiCall: vi.fn(),
  };
});

const { PersonasApi } = await import("../persona");
const baseModule = await import("../base");
const apiCallMock = baseModule.apiCall as unknown as Mock;

describe("PersonasApi", () => {
  beforeEach(() => {
    apiCallMock.mockReset();
  });

  it("getAll requests persona listado endpoint", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await PersonasApi.getAll();

    expect(apiCallMock).toHaveBeenCalledWith(
      "/persona/persona-usuario?numeroIdentificacion=",
    );
  });

  it("searchByDocumento encodes parametro", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await PersonasApi.searchByDocumento("123 45");

    expect(apiCallMock).toHaveBeenCalledWith(
      "/persona/persona-usuario?numeroIdentificacion=123%2045",
    );
  });

  it("toggleEstadoUsuario performs PUT with estado payload", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await PersonasApi.toggleEstadoUsuario(10, true);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/usuario/10/cambiar-estado",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
        body: JSON.stringify({ estado: true }),
      }),
    );
  });

  it("createPersona sends POST without expecting JSON", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await PersonasApi.createPersona({ nombre: "Test" } as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/persona",
      expect.objectContaining({
        method: "POST",
        skipJson: true,
      }),
    );
  });

  it("updatePersona sends PUT to persona id endpoint", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await PersonasApi.updatePersona(7, { nombre: "Nuevo" } as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/persona/7",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
      }),
    );
  });

  it("getRoles fetches /rol catalog", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await PersonasApi.getRoles();

    expect(apiCallMock).toHaveBeenCalledWith("/rol");
  });

  it("createUsuario posts to /usuario", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await PersonasApi.createUsuario({} as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/usuario",
      expect.objectContaining({
        method: "POST",
        skipJson: true,
      }),
    );
  });

  it("updateUsuario puts to /usuario/:id", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);

    await PersonasApi.updateUsuario(3, {} as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/usuario/3",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
      }),
    );
  });
});
