import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import type * as BaseExports from "../base";

vi.mock("../base", async () => {
  const actual = await vi.importActual<typeof BaseExports>("../base");
  return {
    ...actual,
    apiCall: vi.fn(),
  };
});

const { PermisosApi } = await import("../permisos");
const baseModule = await import("../base");
const apiCallMock = baseModule.apiCall as unknown as Mock;

describe("PermisosApi", () => {
  beforeEach(() => {
    apiCallMock.mockReset();
  });

  it("getAll lista asignaciones de permisos", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });
    await PermisosApi.getAll();

    expect(apiCallMock).toHaveBeenCalledWith(
      "/permiso-rol-entidad/todos-permisos-rol-entidad",
    );
  });

  it("toggleEstado envía PUT con estado", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);
    await PermisosApi.toggleEstado(9, false);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/permiso-rol-entidad/9/cambiar-estado",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
        body: JSON.stringify({ estado: false }),
      }),
    );
  });

  it("update envía PUT al recurso específico", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);
    await PermisosApi.update(2, { estado: true } as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/permiso-rol-entidad/2",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
      }),
    );
  });

  it("create realiza POST para nueva asignación", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);
    await PermisosApi.create({} as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/permiso-rol-entidad",
      expect.objectContaining({
        method: "POST",
        skipJson: true,
      }),
    );
  });

  it("getRoles consulta catálogo de roles", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });
    await PermisosApi.getRoles();

    expect(apiCallMock).toHaveBeenCalledWith("/rol");
  });

  it("createRol envía POST a /rol", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);
    await PermisosApi.createRol({ nombre: "Docente" });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/rol",
      expect.objectContaining({
        method: "POST",
        skipJson: true,
      }),
    );
  });

  it("updateRol envía PUT al recurso de rol", async () => {
    apiCallMock.mockResolvedValueOnce(undefined);
    await PermisosApi.updateRol(5, { nombre: "Admin" });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/rol/5",
      expect.objectContaining({
        method: "PUT",
        skipJson: true,
      }),
    );
  });

  it("getPermisos y getEntidades consultan catálogos correspondientes", async () => {
    apiCallMock.mockResolvedValue({ data: [] });

    await PermisosApi.getPermisos();
    expect(apiCallMock).toHaveBeenNthCalledWith(1, "/permiso");

    await PermisosApi.getEntidades();
    expect(apiCallMock).toHaveBeenNthCalledWith(2, "/entidad");
  });
});
