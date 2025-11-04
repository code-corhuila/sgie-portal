import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "../../../test-utils/renderWithProviders";
import { userReserva } from "../hooks/UserReserva";

vi.mock("../../../api/reserva", () => ({
  ReservaApi: {
    getReservas: vi.fn(),
    getTiposReserva: vi.fn(),
    getEquipos: vi.fn(),
    getInstalaciones: vi.fn(),
    getCategoriaMantenimientoEquipo: vi.fn(),
    getCategoriaMantenimientoInstalacion: vi.fn(),
    getHorasDisponiblesInstalacion: vi.fn(),
    getHorasDisponiblesEquipo: vi.fn(),
    createReserva: vi.fn(),
    createDetalleInstalacion: vi.fn(),
    createDetalleEquipo: vi.fn(),
    createMantenimientoInstalacion: vi.fn(),
    createMantenimientoEquipo: vi.fn(),
    updateReserva: vi.fn(),
    updateDetalleInstalacion: vi.fn(),
    updateDetalleEquipo: vi.fn(),
    updateMantenimientoInstalacion: vi.fn(),
    updateMantenimientoEquipo: vi.fn(),
    cerrarDetalleInstalacion: vi.fn(),
    cerrarDetalleEquipo: vi.fn(),
    cerrarMantenimientoInstalacion: vi.fn(),
    cerrarMantenimientoEquipo: vi.fn(),
  },
}));

vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual<typeof import("@chakra-ui/react")>(
    "@chakra-ui/react",
  );
  return {
    ...actual,
    useToast: () => vi.fn(),
  };
});

const { ReservaApi } = await import("../../../api/reserva");
const reservaApiMocks = ReservaApi as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("userReserva hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    reservaApiMocks.getReservas.mockResolvedValue([]);
    reservaApiMocks.getTiposReserva.mockResolvedValue([
      { id: 1, nombre: "Reserva Instalacion" },
      { id: 2, nombre: "Reserva Equipo" },
      { id: 3, nombre: "Mantenimiento Instalacion" },
      { id: 4, nombre: "Mantenimiento Equipo" },
    ]);
    reservaApiMocks.getEquipos.mockResolvedValue([]);
    reservaApiMocks.getInstalaciones.mockResolvedValue([]);
    reservaApiMocks.getCategoriaMantenimientoEquipo.mockResolvedValue([]);
    reservaApiMocks.getCategoriaMantenimientoInstalacion.mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderReservaHook = () =>
    renderHook(() => userReserva(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it("resolveGrupo identifica correctamente los tipos de reserva", () => {
    const { result } = renderReservaHook();

    expect(result.current.resolveGrupo("Reserva de Instalación")).toBe(
      "RESERVA_INSTALACION",
    );
    expect(result.current.resolveGrupo("Reserva Equipo")).toBe(
      "RESERVA_EQUIPO",
    );
    expect(result.current.resolveGrupo("Mantenimiento instalación")).toBe(
      "MANTENIMIENTO_INSTALACION",
    );
    expect(result.current.resolveGrupo("Mantenimiento Equipo")).toBe(
      "MANTENIMIENTO_EQUIPO",
    );
  });

  it("createReservaFlow crea los recursos asociados según el tipo", async () => {
    reservaApiMocks.createReserva.mockResolvedValue({ id: 99 });
    reservaApiMocks.createDetalleInstalacion.mockResolvedValue(undefined);

    const { result } = renderReservaHook();

    await waitFor(() =>
      expect(result.current.tipoReservaOptions.length).toBeGreaterThan(0),
    );

    await act(async () => {
      await result.current.createReservaFlow(
        123,
        {
          tipoReservaId: 1,
          fechaReserva: "2024-10-05",
          horaInicio: "08:00",
          horaFin: "10:00",
          idInstalacion: 55,
        } as any,
        {
          programaAcademico: "Ingeniería",
          numeroEstudiantes: 10,
        } as any,
      );
    });

    expect(reservaApiMocks.createReserva).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoReserva: { id: "1" },
        persona: { id: "123" },
      }),
    );
    expect(reservaApiMocks.createDetalleInstalacion).toHaveBeenCalledWith(
      expect.objectContaining({
        instalacion: { id: "55" },
        reserva: { id: "99" },
      }),
    );
  });

  it("getHorasDisponiblesInstalacion guarda horas en estado", async () => {
    reservaApiMocks.getHorasDisponiblesInstalacion.mockResolvedValue([
      { hora: "08:00" },
      { hora: "09:00" },
    ]);

    const { result } = renderReservaHook();

    await act(async () => {
      await result.current.getHorasDisponiblesInstalacion(
        "2024-10-05",
        10,
        undefined,
      );
    });

    expect(result.current.horasDisponibles).toEqual(["08:00", "09:00"]);
  });
});
