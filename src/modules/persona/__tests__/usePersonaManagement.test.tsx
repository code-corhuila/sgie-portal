import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "../../../test-utils/renderWithProviders";
import { usePersonaManagement } from "../hooks/usePersonaManagement";
import { personaKeys } from "../queryKeys";

vi.mock("../../../api/persona", () => ({
  PersonasApi: {
    getAll: vi.fn(),
    searchByDocumento: vi.fn(),
    getRoles: vi.fn(),
    toggleEstadoUsuario: vi.fn(),
    createPersona: vi.fn(),
    updatePersona: vi.fn(),
    createUsuario: vi.fn(),
    updateUsuario: vi.fn(),
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

const { PersonasApi } = await import("../../../api/persona");
const personasApiMocks = PersonasApi as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("usePersonaManagement", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderManagementHook = (
    documentoBusqueda = "",
    enableRoles = false,
  ) =>
    renderHook(
      () =>
        usePersonaManagement({
          documentoBusqueda,
          enableRoles,
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

  it("retorna personas base cuando no hay búsqueda activa", async () => {
    personasApiMocks.getAll.mockResolvedValueOnce([
      { idPersona: 1, estado: true },
    ]);

    const { result } = renderManagementHook();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.personas).toHaveLength(1);
    expect(PersonasApi.getAll).toHaveBeenCalled();
  });

  it("usa resultados de búsqueda cuando se suministra documento", async () => {
    personasApiMocks.getAll.mockResolvedValueOnce([]);
    personasApiMocks.searchByDocumento.mockResolvedValueOnce([
      { idPersona: 2, estado: true },
    ]);

    const { result } = renderManagementHook("12345");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const payload = await result.current.searchPersonas();
      expect(payload).toHaveLength(1);
    });

    expect(personasApiMocks.searchByDocumento).toHaveBeenCalledWith("12345");
  });

  it("toggleEstado actualiza cache optimistamente y llama API", async () => {
    personasApiMocks.getAll.mockResolvedValueOnce([
      { idPersona: 10, estado: false },
    ]);
    personasApiMocks.toggleEstadoUsuario.mockResolvedValue(undefined);

    queryClient.setQueryData(personaKeys.all, [{ idPersona: 10, estado: false }]);

    const { result } = renderManagementHook();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.toggleEstado({ idPersona: 10, estado: true });
    });

    const cached = queryClient.getQueryData<any[]>(personaKeys.all);
    expect(cached?.[0]?.estado).toBe(true);
    expect(personasApiMocks.toggleEstadoUsuario).toHaveBeenCalledWith(
      10,
      true,
    );
  });
});
