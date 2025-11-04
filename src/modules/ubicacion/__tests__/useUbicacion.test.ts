import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../api/base", () => ({
  apiCall: vi.fn(),
}));

const toastMock = vi.fn();

vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual<typeof import("@chakra-ui/react")>(
    "@chakra-ui/react",
  );
  return {
    ...actual,
    useToast: () => toastMock,
  };
});

const baseApi = await import("../../../api/base");
const apiCallMock = baseApi.apiCall as unknown as ReturnType<typeof vi.fn>;

const { useUbicacion } = await import("../hooks/useUbicacion");

describe("useUbicacion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    apiCallMock.mockResolvedValue([]);
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carga filas normalizadas y genera identificadores únicos", async () => {
    apiCallMock.mockResolvedValueOnce([
      {
        idInstalacion: 1,
        nombreInstalacion: "Laboratorio",
        idCampus: 2,
        nombreCampus: "Campus Central",
        idMunicipio: 3,
        nombreMunicipio: "Neiva",
        idDepartamento: 4,
        nombreDepartamento: "Huila",
        idContinente: 5,
        nombreContinente: "América",
        idCategoriaInstalacion: 6,
        nombreCategoriaInstalacion: "Sala",
        estadoInstalacion: true,
      },
    ]);

    const { result } = renderHook(() => useUbicacion());

    await waitFor(() => expect(apiCallMock).toHaveBeenCalledTimes(1));
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].unique).toContain("inst-1");
  });

  it("usa caché al consultar países por continente", async () => {
    apiCallMock.mockResolvedValueOnce([]); // carga inicial de instalaciones
    apiCallMock.mockResolvedValueOnce({
      data: [{ id: 1, nombre: "Colombia" }],
    });

    const { result } = renderHook(() => useUbicacion());

    await waitFor(() => expect(apiCallMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      const first = await result.current.fetchPaisesByContinente(10);
      expect(first).toHaveLength(1);

      const second = await result.current.fetchPaisesByContinente(10);
      expect(second).toHaveLength(1);
    });

    expect(apiCallMock).toHaveBeenCalledTimes(2); // una por efecto inicial y otra por la primera llamada
  });
});
