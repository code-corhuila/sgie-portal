import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "../../../test-utils/renderWithProviders";
import { usePermisosManagement } from "../hooks/usePermisosManagement";
import { permisosKeys } from "../queryKeys";

vi.mock("../../../api/permisos", () => ({
  PermisosApi: {
    getAll: vi.fn(),
    getRoles: vi.fn(),
    getPermisos: vi.fn(),
    getEntidades: vi.fn(),
    toggleEstado: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    createRol: vi.fn(),
    updateRol: vi.fn(),
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

const { PermisosApi } = await import("../../../api/permisos");
const permisosApiMocks = PermisosApi as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("usePermisosManagement", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    toastMock.mockReset();
    permisosApiMocks.getRoles.mockResolvedValue([]);
    permisosApiMocks.getPermisos.mockResolvedValue([]);
    permisosApiMocks.getEntidades.mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderHookWithProvider = () =>
    renderHook(() => usePermisosManagement(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it("expone los datos cargados desde PermisosApi", async () => {
    permisosApiMocks.getAll.mockResolvedValueOnce([
      { id: 1, estado: true, rol: { id: 1 }, entidad: { id: 1 } },
    ]);

    const { result } = renderHookWithProvider();

    await waitFor(() => expect(result.current.asignacionesQuery.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it("toggleEstado actualiza cache optimistamente y llama API", async () => {
    const initial = [{ id: 5, estado: true }];
    permisosApiMocks.getAll.mockResolvedValueOnce(initial);
    permisosApiMocks.toggleEstado.mockResolvedValue(undefined);

    queryClient.setQueryData(permisosKeys.all, initial);

    const { result } = renderHookWithProvider();

    await waitFor(() => expect(result.current.asignacionesQuery.isSuccess).toBe(true));

    await act(async () => {
      await result.current.toggleEstado({ id: 5, nextState: false });
    });

    const cached = queryClient.getQueryData<any[]>(permisosKeys.all);
    expect(cached?.[0]?.estado).toBe(false);
    expect(permisosApiMocks.toggleEstado).toHaveBeenCalledWith(5, false);
  });

  it("createAsignacion delega en API y permite invalidar", async () => {
    permisosApiMocks.getAll.mockResolvedValueOnce([]);
    permisosApiMocks.create.mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHookWithProvider();
    await waitFor(() => expect(result.current.asignacionesQuery.isSuccess).toBe(true));

    await act(async () => {
      await result.current.createAsignacion({} as any);
    });

    expect(permisosApiMocks.create).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: permisosKeys.all,
    });
  });
});
