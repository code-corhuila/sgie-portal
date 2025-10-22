import { Stack, Box } from "@chakra-ui/react";
import GenericModal, { type Field } from "../../../components/UI/GenericModal";
import SearchableFormModal, {
  type SearchConfig,
  type SearchResultField,
} from "../../../components/UI/SearchableFormModal";
import TablePagination from "../../../components/UI/TablePagination";
import { PersonaHeader } from "./PersonaHeader";
import { PersonaFilters } from "./PersonaFilters";
import { PersonaTable } from "./PersonaTable";
import type { Persona } from "../types";

export type EstadoFilter = "Todos" | "Activos" | "Inactivos";

export interface PersonaFormValues {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroIdentificacion: string;
  telefonoMovil: string;
  rol: string | number;
}

export interface UsuarioFormValues {
  email: string;
  password: string;
}

interface ModalConfig<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field<T>[];
  initialValues?: Partial<T>;
  onSave: (values: Partial<T>) => Promise<void | boolean>;
}

interface UsuarioModalConfig {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formFields: Field<UsuarioFormValues>[];
  searchConfig: SearchConfig<Persona>;
  onSave: (
    values: Partial<UsuarioFormValues>,
    personaId?: number | null,
  ) => Promise<void>;
}

interface EditUsuarioModalConfig {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field<UsuarioFormValues>[];
  initialValues?: Partial<UsuarioFormValues>;
  onSave: (values: Partial<UsuarioFormValues>) => Promise<void | boolean>;
}

interface PersonaListViewProps {
  header: {
    onRefresh: () => void;
    onOpenPersona: () => void;
    onOpenUsuario: () => void;
    isLoading: boolean;
  };
  filters: {
    documento: string;
    onDocumentoChange: (value: string) => void;
    onBuscar: () => void;
    onLimpiar: () => void;
    estado: EstadoFilter;
    onEstadoChange: (value: EstadoFilter) => void;
    isSearching: boolean;
  };
  table: {
    data: Persona[];
    isLoading: boolean;
    error: string | null;
    onToggleEstado: (persona: Persona) => void;
    onEditPersona: (persona: Persona) => void;
    onEditUsuario: (persona: Persona) => void;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    pageSizeOptions: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isLoading: boolean;
  };
  personaModal: ModalConfig<PersonaFormValues>;
  editPersonaModal: ModalConfig<PersonaFormValues>;
  usuarioModal: UsuarioModalConfig;
  editUsuarioModal: EditUsuarioModalConfig;
  personaInitialValues?: Partial<PersonaFormValues>;
  editPersonaInitialValues?: Partial<PersonaFormValues>;
  editUsuarioInitialValues?: Partial<UsuarioFormValues>;
  usuarioSearchConfig: SearchConfig<Persona>;
  usuarioSearchFields: SearchResultField<Persona>[];
}

export const PersonaListView = ({
  header,
  filters,
  table,
  pagination,
  personaModal,
  editPersonaModal,
  usuarioModal,
  editUsuarioModal,
  personaInitialValues,
  editPersonaInitialValues,
  editUsuarioInitialValues,
  usuarioSearchConfig,
  usuarioSearchFields,
}: PersonaListViewProps) => {
  return (
    <Stack spacing={8}>
      <PersonaHeader
        onRefresh={header.onRefresh}
        onOpenPersona={header.onOpenPersona}
        onOpenUsuario={header.onOpenUsuario}
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
        <PersonaFilters
          documento={filters.documento}
          onDocumentoChange={filters.onDocumentoChange}
          onBuscar={filters.onBuscar}
          onLimpiar={filters.onLimpiar}
          estadoFilter={filters.estado}
          onEstadoChange={filters.onEstadoChange}
          isSearching={filters.isSearching}
        />
      </Stack>

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <PersonaTable
          data={table.data}
          isLoading={table.isLoading}
          error={table.error}
          onToggleEstado={table.onToggleEstado}
          onEditPersona={table.onEditPersona}
          onEditUsuario={table.onEditUsuario}
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
        isOpen={personaModal.isOpen}
        onClose={personaModal.onClose}
        title={personaModal.title}
        fields={personaModal.fields}
        initialValues={personaInitialValues}
        onSave={personaModal.onSave}
      />

      <GenericModal
        isOpen={editPersonaModal.isOpen}
        onClose={editPersonaModal.onClose}
        title={editPersonaModal.title}
        fields={editPersonaModal.fields}
        initialValues={editPersonaInitialValues}
        onSave={editPersonaModal.onSave}
      />

      <GenericModal
        isOpen={editUsuarioModal.isOpen}
        onClose={editUsuarioModal.onClose}
        title={editUsuarioModal.title}
        fields={editUsuarioModal.fields}
        initialValues={editUsuarioInitialValues}
        onSave={editUsuarioModal.onSave}
      />

      <SearchableFormModal<UsuarioFormValues, Persona>
        isOpen={usuarioModal.isOpen}
        onClose={usuarioModal.onClose}
        title={usuarioModal.title}
        formFields={usuarioModal.formFields}
        searchConfig={{
          ...usuarioSearchConfig,
          resultFields: usuarioSearchFields,
        }}
        onSave={usuarioModal.onSave}
      />
    </Stack>
  );
};

export default PersonaListView;
