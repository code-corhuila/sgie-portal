import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
} from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";

vi.mock("../../../api/auth", () => ({
  AuthApi: {
    currentSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("../../../utils/interceptor", () => ({
  setupInterceptor: vi.fn(() => vi.fn()),
}));

const { AuthApi } = await import("../../../api/auth");
const authApiMocks = AuthApi as unknown as Record<string, Mock>;

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expone contexto tras validar sesión inicial", async () => {
    authApiMocks.currentSession.mockResolvedValueOnce({
      roles: ["ADMIN"],
      permisos: ["persona:leer"],
      email: "user@example.com",
      idUsuario: 42,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() =>
      expect(result.current.isAuthenticated).toBe(true),
    );
    expect(result.current.email).toBe("user@example.com");
    expect(result.current.role).toBe("ADMIN");
    expect(result.current.permissions).toEqual(["persona:leer"]);
    expect(result.current.userId).toBe(42);
  });

  it("restablece sesión cuando currentSession falla con 401", async () => {
    const error = new Error("Unauthorized");
    (error as any).status = 401;
    authApiMocks.currentSession.mockRejectedValueOnce(error);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.checkingAuth).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
  });

  it("login actualiza estado cuando AuthApi.login resuelve", async () => {
    authApiMocks.currentSession.mockResolvedValueOnce({
      roles: null,
      permisos: [],
      email: null,
      idUsuario: null,
    });
    authApiMocks.login.mockResolvedValueOnce({
      roles: ["GESTOR"],
      permisos: ["dashboard:ver"],
      email: "gestor@example.com",
      idUsuario: 7,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.checkingAuth).toBe(false));

    await act(async () => {
      const success = await result.current.login("gestor@example.com", "pwd");
      expect(success).toBe(true);
    });

    expect(result.current.role).toBe("GESTOR");
    expect(result.current.permissions).toEqual(["dashboard:ver"]);
    expect(result.current.email).toBe("gestor@example.com");
  });

  it("login devuelve false cuando AuthApi.login lanza error", async () => {
    authApiMocks.currentSession.mockResolvedValueOnce({
      roles: null,
      permisos: [],
      email: null,
      idUsuario: null,
    });
    authApiMocks.login.mockRejectedValueOnce(new Error("Bad credentials"));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.checkingAuth).toBe(false));

    await act(async () => {
      const success = await result.current.login("a", "b");
      expect(success).toBe(false);
    });
  });

  it("logout invoca API y limpia estado", async () => {
    authApiMocks.currentSession.mockResolvedValueOnce({
      roles: ["ADMIN"],
      permisos: [],
      email: "admin@example.com",
      idUsuario: 1,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(authApiMocks.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.email).toBeNull();
  });

  it("useAuth fuera del provider lanza error descriptivo", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth debe usarse dentro de AuthProvider",
    );
  });
});
