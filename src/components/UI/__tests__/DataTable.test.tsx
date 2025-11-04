import { describe, it, expect, vi } from "vitest";
vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual<typeof import("@chakra-ui/react")>(
    "@chakra-ui/react",
  );
  return {
    ...actual,
    useBreakpointValue: () => true,
  };
});
import { fireEvent } from "@testing-library/react";
import { DataTable, type Column } from "../DataTable";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";

type Row = { id: number; nombre: string; estado: string };

const buildColumns = (): Column<Row>[] => [
  { key: "nombre", label: "Nombre" },
  { key: "estado", label: "Estado" },
];

describe("DataTable", () => {
  it("muestra skeleton mientras carga", () => {
    const { container } = renderWithProviders(
      <DataTable<Row>
        columns={buildColumns()}
        data={[]}
        loading
        keyExtractor={(item) => item.id}
      />,
      { withRouter: false },
    );

    const skeletons = container.querySelectorAll(".chakra-skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it("muestra alerta cuando hay error", () => {
    const { getByText } = renderWithProviders(
      <DataTable<Row>
        columns={buildColumns()}
        data={[]}
        error="Falló"
        keyExtractor={(item) => item.id}
      />,
      { withRouter: false },
    );

    expect(getByText("Falló")).toBeInTheDocument();
  });

  it("muestra mensaje vacío cuando no hay datos", () => {
    const { getByText } = renderWithProviders(
      <DataTable<Row>
        columns={buildColumns()}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="Sin registros"
      />,
      { withRouter: false },
    );

    expect(getByText("Sin registros")).toBeInTheDocument();
  });

  it("renderiza filas y ejecuta acciones", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onView = vi.fn();

    const rows: Row[] = [
      { id: 1, nombre: "Reserva 1", estado: "Activa" },
      { id: 2, nombre: "Reserva 2", estado: "Cerrada" },
    ];

    const columns: Column<Row>[] = [
      ...buildColumns(),
      {
        key: "actions",
        label: "Acciones",
        render: (item) => (
          <div>
            <button type="button" aria-label={`ver-${item.id}`}>
              Ver
            </button>
          </div>
        ),
      },
    ];

    const { getByText, getAllByLabelText } = renderWithProviders(
      <DataTable<Row>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.id}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />,
      { withRouter: false },
    );

    expect(getByText("Reserva 1")).toBeInTheDocument();
    expect(getByText("Reserva 2")).toBeInTheDocument();

    const [viewButton] = getAllByLabelText("Ver detalle");
    fireEvent.click(viewButton);
    expect(onView).toHaveBeenCalledWith(rows[0]);

    const [editButton] = getAllByLabelText("Editar");
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(rows[0]);

    const [deleteButton] = getAllByLabelText("Cambiar estado");
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(rows[0]);
  });
});
