import { Box, Stack } from "@chakra-ui/react";
import GenericModal, {
  type Field,
} from "../../../components/UI/GenericModal";
import TablePagination from "../../../components/UI/TablePagination";
import { EquipoHeader } from "./EquipoHeader";
import { EquipoFilters } from "./EquipoFilters";
import { EquipoTagSummary } from "./EquipoTagSummary";
import { EquipoStats } from "./EquipoStats";
import { EquipoTable } from "./EquipoTable";
import type { EquipoSummary } from "../types";

export interface CategoriaEquipoFormValues {
  nombre: string;
  descripcion?: string;
}

export interface TipoEquipoFormValues {
  nombre: string;
  descripcion?: string;
  categoriaEquipo: string | number;
}

export interface EquipoFormValues {
  codigo: string;
  tipoEquipo: string | number;
  instalacion: string | number;
}

interface ModalConfig<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field<T>[];
  initialValues?: Partial<T>;
  onSave: (values: Partial<T>) => Promise<void | boolean>;
  key?: string | number;
}

interface HeaderProps {
  onRefresh: () => void;
  onOpenCategoria: () => void;
  onOpenTipo: () => void;
  onOpenEquipo: () => void;
  isLoading: boolean;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface FiltersProps {
  codigo: string;
  onCodigoChange: (value: string) => void;
  onSearchByCodigo: () => void;
  onClearCodigo: () => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  tipoFilter: string;
  onTipoChange: (value: string) => void;
  instalacionFilter: string;
  onInstalacionChange: (value: string) => void;
  categoriaFilter: string;
  onCategoriaChange: (value: string) => void;
  tiposDisponibles: string[];
  instalacionesDisponibles: string[];
  categoriasDisponibles: string[];
  isSearching: boolean;
}

interface TagSummaryProps {
  codigo: string;
  statusFilter: StatusFilter;
  tipoFilter: string;
  instalacionFilter: string;
  categoriaFilter: string;
  totalVisible: number;
  totalEquipos: number;
  onClearCodigo: () => void;
  onClearStatus: () => void;
  onClearTipo: () => void;
  onClearInstalacion: () => void;
  onClearCategoria: () => void;
}

interface StatsProps {
  total: number;
  activos: number;
  enMantenimiento: number;
}

interface TableProps {
  data: EquipoSummary[];
  isLoading: boolean;
  error: string | null;
  onToggleEstado: (equipo: EquipoSummary) => void;
  onEdit: (equipo: EquipoSummary) => void;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}

interface EquipoListViewProps {
  header: HeaderProps;
  filters: FiltersProps;
  tagSummary: TagSummaryProps;
  stats: StatsProps;
  table: TableProps;
  pagination: PaginationProps;
  categoriaModal: ModalConfig<CategoriaEquipoFormValues>;
  tipoModal: ModalConfig<TipoEquipoFormValues>;
  equipoModal: ModalConfig<EquipoFormValues>;
  editEquipoModal: ModalConfig<EquipoFormValues>;
}

export const EquipoListView = ({
  header,
  filters,
  tagSummary,
  stats,
  table,
  pagination,
  categoriaModal,
  tipoModal,
  equipoModal,
  editEquipoModal,
}: EquipoListViewProps) => {
  return (
    <Stack spacing={8}>
      <EquipoHeader
        onRefresh={header.onRefresh}
        onOpenCategoria={header.onOpenCategoria}
        onOpenTipo={header.onOpenTipo}
        onOpenEquipo={header.onOpenEquipo}
        isLoading={header.isLoading}
      />

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <EquipoFilters
          codigo={filters.codigo}
          onCodigoChange={filters.onCodigoChange}
          onSearchByCodigo={filters.onSearchByCodigo}
          onClearCodigo={filters.onClearCodigo}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.onStatusChange}
          tipoFilter={filters.tipoFilter}
          onTipoChange={filters.onTipoChange}
          instalacionFilter={filters.instalacionFilter}
          onInstalacionChange={filters.onInstalacionChange}
          categoriaFilter={filters.categoriaFilter}
          onCategoriaChange={filters.onCategoriaChange}
          tiposDisponibles={filters.tiposDisponibles}
          instalacionesDisponibles={filters.instalacionesDisponibles}
          categoriasDisponibles={filters.categoriasDisponibles}
          isSearching={filters.isSearching}
        />

        <EquipoTagSummary
          codigo={tagSummary.codigo}
          statusFilter={tagSummary.statusFilter}
          tipoFilter={tagSummary.tipoFilter}
          instalacionFilter={tagSummary.instalacionFilter}
          categoriaFilter={tagSummary.categoriaFilter}
          totalVisible={tagSummary.totalVisible}
          totalEquipos={tagSummary.totalEquipos}
          onClearCodigo={tagSummary.onClearCodigo}
          onClearStatus={tagSummary.onClearStatus}
          onClearTipo={tagSummary.onClearTipo}
          onClearInstalacion={tagSummary.onClearInstalacion}
          onClearCategoria={tagSummary.onClearCategoria}
        />
      </Stack>

      <EquipoStats
        total={stats.total}
        activos={stats.activos}
        enMantenimiento={stats.enMantenimiento}
      />

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <EquipoTable
          data={table.data}
          isLoading={table.isLoading}
          error={table.error}
          onToggleEstado={table.onToggleEstado}
          onEdit={table.onEdit}
        />
        <Box>
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            isLoading={pagination.isLoading}
          />
        </Box>
      </Stack>

      <GenericModal
        isOpen={categoriaModal.isOpen}
        onClose={categoriaModal.onClose}
        title={categoriaModal.title}
        fields={categoriaModal.fields}
        onSave={categoriaModal.onSave}
      />

      <GenericModal
        isOpen={tipoModal.isOpen}
        onClose={tipoModal.onClose}
        title={tipoModal.title}
        fields={tipoModal.fields}
        onSave={tipoModal.onSave}
      />

      <GenericModal
        isOpen={equipoModal.isOpen}
        onClose={equipoModal.onClose}
        title={equipoModal.title}
        fields={equipoModal.fields}
        onSave={equipoModal.onSave}
      />

      <GenericModal
        key={editEquipoModal.key}
        isOpen={editEquipoModal.isOpen}
        onClose={editEquipoModal.onClose}
        title={editEquipoModal.title}
        fields={editEquipoModal.fields}
        initialValues={editEquipoModal.initialValues}
        onSave={editEquipoModal.onSave}
      />
    </Stack>
  );
};

export default EquipoListView;
