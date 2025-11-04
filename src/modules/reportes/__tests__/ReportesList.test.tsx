import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import ReportesList from "../pages/ReportesList";

const toastSpy = vi.fn();

vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual<typeof import("@chakra-ui/react")>(
    "@chakra-ui/react",
  );
  return {
    ...actual,
    useToast: () => toastSpy,
  };
});

describe("ReportesList", () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;
  const originalCreateElement = document.createElement.bind(document);
  const createdAnchors: HTMLAnchorElement[] = [];

  beforeEach(() => {
    toastSpy.mockReset();
    global.fetch = vi.fn();
    window.URL.createObjectURL = vi.fn(() => "blob:mock");
    window.URL.revokeObjectURL = vi.fn();
    document.createElement = vi
      .fn((tagName: string) => {
        const element = originalCreateElement(tagName) as HTMLElement;
        if (tagName === "a") {
          const anchor = element as HTMLAnchorElement;
          anchor.click = vi.fn();
          anchor.remove = vi.fn();
          Object.defineProperty(anchor, "href", {
            configurable: true,
            writable: true,
            value: "",
          });
          Object.defineProperty(anchor, "download", {
            configurable: true,
            writable: true,
            value: "",
          });
          createdAnchors.push(anchor);
        }
        return element;
      }) as unknown as typeof document.createElement;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
    createdAnchors.length = 0;
  });

  it("advierte cuando no se ha seleccionado un reporte", async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = renderWithProviders(<ReportesList />);

    const downloadButton = getByRole("button", { name: "Descargar" });
    expect(downloadButton).toBeDisabled();
    expect(
      getByText("Selecciona un reporte para habilitar la descarga."),
    ).toBeInTheDocument();

    await user.click(downloadButton);
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it("invoca descarga para reporte con número de identificación", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(["contenido"])),
    });

    const { getByLabelText, getByRole } = renderWithProviders(<ReportesList />);

    await user.selectOptions(
      getByLabelText("Tipo de reporte"),
      "Reserva",
    );
    await user.type(
      getByLabelText("Número de identificación (opcional)"),
      "12345",
    );
    await user.selectOptions(getByLabelText("Formato"), "CSV");

    await user.click(getByRole("button", { name: "Descargar" }));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "http://localhost:8080/v1/api/reserva/reporte/csv?modo=stream&numeroIdentificacion=12345",
      ),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
    );
  });

  it("muestra toast de error cuando la descarga falla", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Fallo"),
    });

    const { getByLabelText, getByRole } = renderWithProviders(<ReportesList />);

    await user.selectOptions(
      getByLabelText("Tipo de reporte"),
      "Reserva",
    );

    await user.click(getByRole("button", { name: "Descargar" }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
    });

    expect(toastSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });
});
