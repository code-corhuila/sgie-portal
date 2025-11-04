import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import Login from "../pages/Login";
import { AuthContext, type AuthContextValue } from "../context/context";

const buildContextValue = (
  overrides?: Partial<AuthContextValue>,
): AuthContextValue => ({
  role: null,
  permissions: [],
  email: null,
  userId: null,
  login: vi.fn(),
  logout: vi.fn(),
  checkingAuth: false,
  isAuthenticated: false,
  ...overrides,
});

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it("renderiza los campos principales", () => {
    const contextValue = buildContextValue();
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>,
    );

    expect(getByText("Bienvenido")).toBeInTheDocument();
    expect(
      getByPlaceholderText("usuario@corhuila.edu.co"),
    ).toBeInTheDocument();
    expect(getByPlaceholderText("Ingresa tu contraseña")).toBeInTheDocument();
  });

  it("navega al dashboard cuando login es exitoso", async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(true);
    const contextValue = buildContextValue({ login: loginMock });

    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <AuthContext.Provider value={contextValue}>
        <Login />
      </AuthContext.Provider>,
    );

    await user.type(
      getByPlaceholderText("usuario@corhuila.edu.co"),
      "user@example.com",
    );
    await user.type(
      getByPlaceholderText("Ingresa tu contraseña"),
      "Secret123!",
    );
    await user.click(getByRole("button", { name: "Iniciar sesión" }));

    expect(loginMock).toHaveBeenCalledWith("user@example.com", "Secret123!");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("muestra mensaje de error si las credenciales son inválidas", async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(false);
    const contextValue = buildContextValue({ login: loginMock });

    const { getByPlaceholderText, getByRole, findByText } =
      renderWithProviders(
        <AuthContext.Provider value={contextValue}>
          <Login />
        </AuthContext.Provider>,
      );

    await user.type(
      getByPlaceholderText("usuario@corhuila.edu.co"),
      "bad@example.com",
    );
    await user.type(
      getByPlaceholderText("Ingresa tu contraseña"),
      "wrong",
    );
    await user.click(getByRole("button", { name: "Iniciar sesión" }));

    expect(await findByText(/Credenciales inválidas/)).toBeInTheDocument();
  });
});
