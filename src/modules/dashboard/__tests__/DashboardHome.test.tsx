import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import DashboardHome from "../pages/DashboardHome";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";

const useQueriesMock = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<
    typeof import("@tanstack/react-query")
  >("@tanstack/react-query");
  return {
    ...actual,
    useQueries: (...args: unknown[]) => useQueriesMock(...args),
  };
});

describe("DashboardHome", () => {
  beforeEach(() => {
    useQueriesMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-10-05T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra métricas calculadas cuando todas las consultas entregan datos", () => {
    useQueriesMock.mockReturnValue([
      {
        data: [
          { estado: true },
          { estado: true },
          { estado: false },
        ],
        isLoading: false,
        isError: false,
      },
      {
        data: [
          { estadoEquipo: true },
          { estadoEquipo: false },
          { estadoEquipo: true },
        ],
        isLoading: false,
        isError: false,
      },
      {
        data: [
          {
            estadoReserva: "true",
            fechaReserva: "2024-10-05T00:00:00Z",
            horaFinReserva: "10:00:00",
          },
          {
            estadoReserva: "false",
            fechaReserva: "2024-10-05T00:00:00Z",
            horaFinReserva: "12:00:00",
          },
          {
            estadoReserva: "true",
            fechaReserva: "2024-10-04T00:00:00Z",
            horaFinReserva: "09:00:00",
          },
        ],
        isLoading: false,
        isError: false,
      },
      {
        data: [
          { estadoInstalacion: true },
          { estadoInstalacion: false },
        ],
        isLoading: false,
        isError: false,
      },
    ]);

    const { container, queryByRole } = renderWithProviders(<DashboardHome />);

    const numbers = Array.from(
      container.querySelectorAll(".chakra-stat__number"),
    ).map((node) => node.textContent?.trim());

    expect(numbers).toEqual(["2", "2", "2", "1", "1"]);
    expect(queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra alerta cuando alguna consulta tiene error", () => {
    useQueriesMock.mockReturnValue([
      { data: [], isLoading: false, isError: true },
      { data: [], isLoading: false, isError: false },
      { data: [], isLoading: false, isError: false },
      { data: [], isLoading: false, isError: false },
    ]);

    const { getByText } = renderWithProviders(<DashboardHome />);

    expect(
      getByText(
        /No se pudieron cargar todas las métricas/i,
      ),
    ).toBeInTheDocument();
  });
});
