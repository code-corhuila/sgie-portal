import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import type * as BaseExports from "../base";

vi.mock("../base", async () => {
  const actual = await vi.importActual<typeof BaseExports>("../base");
  return {
    ...actual,
    apiCall: vi.fn(),
  };
});

const { ReservaApi } = await import("../reserva");
const baseModule = await import("../base");
const apiCallMock = baseModule.apiCall as unknown as Mock;

describe("ReservaApi", () => {
  beforeEach(() => {
    apiCallMock.mockReset();
  });

  it("getReservas agrega query solo cuando aplica", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });
    await ReservaApi.getReservas();
    expect(apiCallMock).toHaveBeenCalledWith(
      "/reserva/reservas-mantenimientos",
    );

    apiCallMock.mockResolvedValueOnce({ data: [] });
    await ReservaApi.getReservas("123");
    expect(apiCallMock).toHaveBeenCalledWith(
      "/reserva/reservas-mantenimientos?numeroIdentificacion=123",
    );
  });

  it("obtiene catálogos base mediante llamados GET", async () => {
    apiCallMock.mockResolvedValue({ data: [] });

    await ReservaApi.getTiposReserva();
    await ReservaApi.getEquipos();
    await ReservaApi.getInstalaciones();
    await ReservaApi.getCategoriaMantenimientoEquipo();
    await ReservaApi.getCategoriaMantenimientoInstalacion();

    const urls = apiCallMock.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      "/tipo-reserva",
      "/equipo",
      "/instalacion",
      "/categoria-mantenimiento-equipo",
      "/categoria-mantenimiento-instalacion",
    ]);
  });

  it("getHorasDisponiblesInstalacion arma query string correctamente", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await ReservaApi.getHorasDisponiblesInstalacion({
      fecha: "2024-01-01",
      idInstalacion: 10,
      idDetalle: 5,
    });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/reserva/horas-disponibles-instalacion?fecha=2024-01-01&idInstalacion=10&idDetalle=5",
    );
  });

  it("getHorasDisponiblesEquipo arma query string sin idDetalle opcional", async () => {
    apiCallMock.mockResolvedValueOnce({ data: [] });

    await ReservaApi.getHorasDisponiblesEquipo({
      fecha: "2024-01-01",
      idEquipo: 3,
    });

    expect(apiCallMock).toHaveBeenCalledWith(
      "/reserva/horas-disponibles-equipo?fecha=2024-01-01&idEquipo=3",
    );
  });

  it("createReserva espera respuesta unwrap y POST JSON", async () => {
    apiCallMock.mockResolvedValueOnce({ data: { id: 9 } });
    const result = await ReservaApi.createReserva({} as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/reserva",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(result).toEqual({ id: 9 });
  });

  it("acciones de detalle y mantenimiento envían POST o PUT con skipJson", async () => {
    apiCallMock.mockResolvedValue(undefined);

    await ReservaApi.createDetalleInstalacion({} as any);
    await ReservaApi.createDetalleEquipo({} as any);
    await ReservaApi.createMantenimientoInstalacion({} as any);
    await ReservaApi.createMantenimientoEquipo({} as any);
    await ReservaApi.updateReserva(1, {} as any);
    await ReservaApi.updateDetalleInstalacion(2, {} as any);
    await ReservaApi.updateDetalleEquipo(3, {} as any);
    await ReservaApi.updateMantenimientoInstalacion(4, {} as any);
    await ReservaApi.updateMantenimientoEquipo(5, {} as any);
    await ReservaApi.cerrarDetalleInstalacion(6, {} as any);
    await ReservaApi.cerrarDetalleEquipo(7, {} as any);
    await ReservaApi.cerrarMantenimientoInstalacion(8, {} as any);
    await ReservaApi.cerrarMantenimientoEquipo(9, {} as any);

    expect(apiCallMock).toHaveBeenCalledWith(
      "/detalle-reserva-instalacion",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/detalle-reserva-equipo",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/mantenimiento-instalacion",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/mantenimiento-equipo",
      expect.objectContaining({ method: "POST", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/reserva/1",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/detalle-reserva-instalacion/2/actualizar-detalle-reserva",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/detalle-reserva-equipo/3/actualizar-detalle-reserva-equipo",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/mantenimiento-instalacion/4/actualizar-mantenimiento-instalacion",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/mantenimiento-equipo/5/actualizar-mantenimiento-equipo",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/detalle-reserva-instalacion/6/cerrar-detalle-reserva-instalacion",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/detalle-reserva-equipo/7/cerrar-detalle-reserva-equipo",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/mantenimiento-instalacion/8/cerrar-mantenimiento-instalacion",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
    expect(apiCallMock).toHaveBeenCalledWith(
      "/mantenimiento-equipo/9/cerrar-mantenimiento-equipo",
      expect.objectContaining({ method: "PUT", skipJson: true }),
    );
  });
});
