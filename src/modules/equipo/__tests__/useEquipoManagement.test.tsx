import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "../../../test-utils/renderWithProviders";
import { useEquipoManagement } from "../hooks/useEquipoManagement";
import { equipoKeys } from "../queryKeys";

vi.mock("../../../api/equipo", () => ({
  EquiposApi: {
    getAll: vi.fn(),
    searchByCodigo: vi.fn(),
    getCategorias: vi.fn(),
    getTipos: vi.fn(),
    getInstalaciones: vi.fn(),
    createCategoria: vi.fn(),
    createTipo: vi.fn(),
    createEquipo: vi.fn(),
    updateEquipo: vi.fn(),
    toggleEstado: vi.fn(),
  },
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

const { EquiposApi } = await import("../../../api/equipo");
const equiposApiMocks = EquiposApi as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("useEquipoManagement", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    toastMock.mockReset();
    equiposApiMocks.getCategorias.mockResolvedValue([]);
    equiposApiMocks.getTipos.mockResolvedValue([]);
    equiposApiMocks.getInstalaciones.mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderHookWithParams = (codigoBusqueda = "") =>
    renderHook(
      () =>
        useEquipoManagement({
          codigoBusqueda,
          enableCategorias: false,
          enableTipos: false,
          enableInstalaciones: false,
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

  it("usa listado base cuando no hay búsqueda", async () => {
    equiposApiMocks.getAll.mockResolvedValueOnce([
      { idEquipo: 1, estadoEquipo: true },
    ]);

    const { result } = renderHookWithParams();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.equipos).toHaveLength(1);
  });

  it("searchEquipos dispara consulta y devuelve resultados", async () => {
    equiposApiMocks.getAll.mockResolvedValueOnce([]);
    equiposApiMocks.searchByCodigo.mockResolvedValueOnce([
      { idEquipo: 2, estadoEquipo: true },
    ]);

    const { result } = renderHookWithParams("EQ-01");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const found = await result.current.searchEquipos();
      expect(found).toHaveLength(1);
    });

    expect(equiposApiMocks.searchByCodigo).toHaveBeenCalledWith("EQ-01");
  });

  it("toggleEstado actualiza cache y llama API", async () => {
    const initial = [{ idEquipo: 5, estadoEquipo: true }];
    equiposApiMocks.getAll.mockResolvedValueOnce(initial);
    equiposApiMocks.toggleEstado.mockResolvedValue(undefined);
    queryClient.setQueryData(equipoKeys.all, initial);

    const { result } = renderHookWithParams();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.toggleEstado({
        idEquipo: 5,
        nextEstado: false,
        codigo: undefined,
      });
    });

    const cached = queryClient.getQueryData<any[]>(equipoKeys.all);
    expect(cached?.[0]?.estadoEquipo).toBe(false);
    expect(equiposApiMocks.toggleEstado).toHaveBeenCalledWith(5, false);
  });
});
