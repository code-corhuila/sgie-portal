import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Stack, useDisclosure, useToast } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GenericModal, {
  type Field,
  type FieldOption,
} from "../../../components/UI/GenericModal";
import SearchableFormModal, {
  type SearchConfig,
  type SearchResultField,
} from "../../../components/UI/SearchableFormModal";
import { useFilterState } from "../../../hooks/useFilterState";
import { useTableManager } from "../../../hooks/useTableManager";
import { PersonasApi } from "../../../api/persona";
import { personaKeys } from "../queryKeys";
import { PersonaHeader } from "../components/PersonaHeader";
import { PersonaFilters } from "../components/PersonaFilters";
import { PersonaTable } from "../components/PersonaTable";
import { PersonaPagination } from "../components/PersonaPagination";
import type {
  CreatePersonaPayload,
  CreateUsuarioPayload,
  Persona,
  Rol,
  UpdatePersonaPayload,
  UpdateUsuarioPayload,
} from "../types";

interface PersonaFormValues {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroIdentificacion: string;
  telefonoMovil: string;
  rol: string | number;
}

interface UsuarioFormValues {
  email: string;
  password: string;
}

type EstadoFilter = "Todos" | "Activos" | "Inactivos";

const initialFilters = {
  documento: "",
  estado: "Todos" as EstadoFilter,
};

const toOption = (rol: Rol) => ({ value: rol.id, label: rol.nombre });

const DOCUMENTO_OPTIONS: FieldOption[] = [
  { value: "CÉDULA DE CIUDADANÍA", label: "CÉDULA DE CIUDADANÍA" },
  { value: "PASAPORTE", label: "PASAPORTE" },
  { value: "TARJETA DE IDENTIDAD", label: "TARJETA DE IDENTIDAD" },
  { value: "REGISTRO CIVIL", label: "REGISTRO CIVIL" },
  { value: "CÉDULA DE EXTRANJERÍA", label: "CÉDULA DE EXTRANJERÍA" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PASSWORD_RULE_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

const sanitizeDigits = (value: string, maxLength?: number) => {
  const digits = value.replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
};

const PersonaList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const personaModal = useDisclosure();
  const usuarioModal = useDisclosure();
  const editPersonaModal = useDisclosure();
  const editUsuarioModal = useDisclosure();

  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const { filters, setFilter } = useFilterState(initialFilters);
  const documentoBusqueda = filters.documento.trim();

  const personasQuery = useQuery<Persona[]>({
    queryKey: personaKeys.all,
    queryFn: PersonasApi.getAll,
  });

  const personasBusquedaQuery = useQuery<Persona[]>({
    queryKey: personaKeys.search(documentoBusqueda),
    queryFn: () => PersonasApi.searchByDocumento(documentoBusqueda),
    enabled: false,
    staleTime: 60_000,
  });

  const rolesQuery = useQuery<Rol[]>({
    queryKey: personaKeys.roles,
    queryFn: PersonasApi.getRoles,
    enabled: personaModal.isOpen || editPersonaModal.isOpen,
    staleTime: 300_000,
  });

  const personasBase = personasQuery.data ?? [];
  const personasBusqueda = personasBusquedaQuery.data ?? [];
  const personas = documentoBusqueda ? personasBusqueda : personasBase;

  const filteredPersonas = useMemo(() => {
    return personas.filter((persona) => {
      if (filters.estado === "Activos") {
        return persona.estado;
      }
      if (filters.estado === "Inactivos") {
        return !persona.estado;
      }
      return true;
    });
  }, [filters.estado, personas]);

  const tableManager = useTableManager(filteredPersonas, {
    totalItems: filteredPersonas.length,
  });
  const {
    page,
    pageSize,
    data: paginatedData,
    totalItems,
    totalPages,
    pageSizeOptions,
    goto,
    setPageSize,
  } = tableManager;

  useEffect(() => {
    goto(0);
  }, [filters.estado, filters.documento, goto]);

  const rolesOptions = useMemo(
    () => (rolesQuery.data ?? []).map(toOption),
    [rolesQuery.data],
  );

  const toggleEstadoMutation = useMutation<
    void,
    Error,
    { idPersona: number; estado: boolean },
    { previous?: Persona[] }
  >({
    mutationFn: ({ idPersona, estado }) =>
      PersonasApi.toggleEstadoUsuario(idPersona, estado),
    onMutate: async ({ idPersona, estado }) => {
      await queryClient.cancelQueries({ queryKey: personaKeys.all });
      const previous = queryClient.getQueryData<Persona[]>(personaKeys.all);
      if (previous) {
        queryClient.setQueryData<Persona[]>(personaKeys.all, (prev = []) =>
          prev.map((persona) =>
            persona.idPersona === idPersona ? { ...persona, estado } : persona,
          ),
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(personaKeys.all, context.previous);
      }
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
    onSuccess: (_data, { estado }) => {
      toast({
        title: `Persona ${estado ? "habilitada" : "inhabilitada"} correctamente`,
        status: "success",
        duration: 2000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.all });
      if (documentoBusqueda) {
        queryClient.invalidateQueries({
          queryKey: personaKeys.search(documentoBusqueda),
        });
      }
    },
  });

  const createPersonaMutation = useMutation<void, Error, CreatePersonaPayload>({
    mutationFn: PersonasApi.createPersona,
    onSuccess: () => {
      toast({ title: "Persona creada", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: personaKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al crear persona",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updatePersonaMutation = useMutation<
    void,
    Error,
    { idPersona: number; payload: UpdatePersonaPayload }
  >({
    mutationFn: ({ idPersona, payload }) =>
      PersonasApi.updatePersona(idPersona, payload),
    onSuccess: () => {
      toast({
        title: "Persona actualizada",
        status: "success",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: personaKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar persona",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createUsuarioMutation = useMutation<void, Error, CreateUsuarioPayload>({
    mutationFn: PersonasApi.createUsuario,
    onSuccess: () => {
      toast({ title: "Usuario creado", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: personaKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al crear usuario",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updateUsuarioMutation = useMutation<
    void,
    Error,
    { idUsuario: number; payload: UpdateUsuarioPayload }
  >({
    mutationFn: ({ idUsuario, payload }) =>
      PersonasApi.updateUsuario(idUsuario, payload),
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        status: "success",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: personaKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const personasDataLoading =
    personasQuery.isLoading || personasQuery.isFetching;
  const personasSearchLoading = personasBusquedaQuery.isFetching;
  const isLoading = documentoBusqueda
    ? personasSearchLoading
    : personasDataLoading;

  useEffect(() => {
    if (personasBusquedaQuery.error && documentoBusqueda) {
      toast({
        title: "Error al buscar persona",
        description: (personasBusquedaQuery.error as Error).message,
        status: "error",
        duration: 4000,
      });
    }
  }, [documentoBusqueda, personasBusquedaQuery.error, toast]);

  const documentExists = useCallback(
    (documentValue: string, ignorePersonaId?: number | null) => {
      const normalized = sanitizeDigits(documentValue);
      if (!normalized) return false;
      return personasBase.some(
        (persona) =>
          sanitizeDigits(persona.numeroIdentificacion ?? "") === normalized &&
          persona.idPersona !== ignorePersonaId,
      );
    },
    [personasBase],
  );

  const emailExists = useCallback(
    (emailValue: string, ignorePersonaId?: number | null) => {
      const normalized = emailValue.trim().toLowerCase();
      if (!normalized) return false;
      return personasBase.some((persona) => {
        if (!persona.email) return false;
        return (
          persona.email.trim().toLowerCase() === normalized &&
          persona.idPersona !== ignorePersonaId
        );
      });
    },
    [personasBase],
  );

  const buildPersonaFields = useCallback(
    (ignorePersonaId?: number | null): Field<PersonaFormValues>[] => [
      { name: "nombres", label: "Nombres", type: "text", required: true },
      { name: "apellidos", label: "Apellidos", type: "text", required: true },
      {
        name: "tipoDocumento",
        label: "Tipo Documento",
        type: "select",
        options: DOCUMENTO_OPTIONS,
        required: true,
      },
      {
        name: "numeroIdentificacion",
        label: "Número Documento",
        type: "text",
        required: true,
        helperText: "Solo números, máximo 10 dígitos",
        format: (value) => sanitizeDigits(value, 10),
        validate: (value) => {
          const numero = typeof value === "string" ? value : "";
          if (!numero) {
            return "El número de documento es obligatorio";
          }
          if (numero.length < 1) {
            return "Debe tener al menos 1 dígito";
          }
          if (numero.length > 10) {
            return "Debe tener máximo 10 dígitos";
          }
          if (!/^\d+$/.test(numero)) {
            return "Solo se permiten números";
          }
          if (documentExists(numero, ignorePersonaId ?? null)) {
            return "Ya existe una persona con este número de documento";
          }
          return null;
        },
      },
      {
        name: "telefonoMovil",
        label: "Teléfono",
        type: "text",
        required: true,
        helperText: "Debe tener exactamente 10 dígitos",
        format: (value) => sanitizeDigits(value, 10),
        validate: (value) => {
          const telefono = typeof value === "string" ? value : "";
          if (!telefono) {
            return "El teléfono es obligatorio";
          }
          if (telefono.length !== 10) {
            return "El teléfono debe tener exactamente 10 dígitos";
          }
          return null;
        },
      },
      {
        name: "rol",
        label: "Rol",
        type: "select",
        options: rolesOptions,
        required: true,
      },
    ],
    [documentExists, rolesOptions],
  );

  const personaCreateFields = useMemo(
    () => buildPersonaFields(null),
    [buildPersonaFields],
  );

  const personaEditFields = useMemo(
    () => buildPersonaFields(selectedPersona?.idPersona ?? null),
    [buildPersonaFields, selectedPersona?.idPersona],
  );

  const usuarioCreateFields = useMemo<Field<UsuarioFormValues>[]>(
    () => [
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "usuario@ejemplo.com",
        normalize: true,
        normalization: { toUpperCase: false },
        validate: (value) => {
          const email = typeof value === "string" ? value : "";
          if (!email) {
            return "El email es obligatorio";
          }
          if (!EMAIL_REGEX.test(email)) {
            return "Ingresa un email válido";
          }
          if (emailExists(email)) {
            return "Ya existe un usuario con este correo";
          }
          return null;
        },
      },
      {
        name: "password",
        label: "Contraseña",
        type: "password",
        required: true,
        placeholder: "Debe incluir mayúscula y caracter especial",
        helperText: "Incluye al menos una mayúscula y un caracter especial",
        validate: (value) => {
          const password = typeof value === "string" ? value : "";
          if (!password) {
            return "La contraseña es obligatoria";
          }
          if (!PASSWORD_RULE_REGEX.test(password)) {
            return "Incluye al menos una mayúscula y un caracter especial";
          }
          return null;
        },
      },
    ],
    [emailExists],
  );

  const usuarioEditFields = useMemo<Field<UsuarioFormValues>[]>(
    () => [
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "usuario@ejemplo.com",
        normalize: true,
        normalization: { toUpperCase: false },
        validate: (value) => {
          const email = typeof value === "string" ? value : "";
          if (!email) {
            return "El email es obligatorio";
          }
          if (!EMAIL_REGEX.test(email)) {
            return "Ingresa un email válido";
          }
          if (emailExists(email, selectedPersona?.idPersona ?? null)) {
            return "Ya existe un usuario con este correo";
          }
          return null;
        },
      },
      {
        name: "password",
        label: "Contraseña",
        type: "password",
        required: false,
        placeholder: "Dejar vacío para mantener actual",
        helperText:
          "Si actualizas la contraseña debe incluir mayúscula y caracter especial",
        validate: (value) => {
          const password = typeof value === "string" ? value : "";
          if (!password) {
            return null;
          }
          if (!PASSWORD_RULE_REGEX.test(password)) {
            return "Incluye al menos una mayúscula y un caracter especial";
          }
          return null;
        },
      },
    ],
    [emailExists, selectedPersona?.idPersona],
  );

  const searchResultFields: SearchResultField<Persona>[] = [
    { key: "numeroIdentificacion", label: "Cédula" },
    { key: "nombres", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "email", label: "Email" },
  ];

  const searchConfig: SearchConfig<Persona> = {
    searchPlaceholder: "Ingresa número de cédula",
    searchButtonText: "Buscar Persona",
    onSearch: async (cedula: string) => {
      const result = await PersonasApi.searchByDocumento(cedula);
      return result.length > 0 ? result[0] : null;
    },
    resultFields: searchResultFields,
    idField: "idPersona",
    emptyMessage: "No se encontró ninguna persona con esa cédula",
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: personaKeys.all });
    if (documentoBusqueda) {
      queryClient.invalidateQueries({
        queryKey: personaKeys.search(documentoBusqueda),
      });
    }
  };

  const handleBuscarDocumento = () => {
    if (!documentoBusqueda) {
      toast({
        title: "Ingresa un documento",
        description: "Debes escribir un documento antes de buscar",
        status: "info",
        duration: 3000,
      });
      return;
    }
    personasBusquedaQuery.refetch();
  };

  const handleLimpiarDocumento = () => {
    if (filters.documento) {
      queryClient.removeQueries({
        queryKey: personaKeys.search(filters.documento.trim()),
        exact: true,
      });
    }
    setFilter("documento", "");
  };

  const handleToggleEstado = (persona: Persona) => {
    toggleEstadoMutation.mutate({
      idPersona: persona.idPersona,
      estado: !persona.estado,
    });
  };

  const handleEditPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    editPersonaModal.onOpen();
  };

  const handleEditUsuario = (persona: Persona) => {
    setSelectedPersona(persona);
    editUsuarioModal.onOpen();
  };

  const closePersonaModal = () => {
    setSelectedPersona(null);
    editPersonaModal.onClose();
  };

  const closeUsuarioModal = () => {
    setSelectedPersona(null);
    editUsuarioModal.onClose();
  };

  return (
    <Stack spacing={8}>
      <PersonaHeader
        onRefresh={handleRefresh}
        onOpenPersona={() => {
          if (!rolesQuery.data) {
            rolesQuery.refetch();
          }
          personaModal.onOpen();
        }}
        onOpenUsuario={usuarioModal.onOpen}
        isLoading={isLoading}
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
          onDocumentoChange={(value) => setFilter("documento", value)}
          onBuscar={handleBuscarDocumento}
          onLimpiar={handleLimpiarDocumento}
          estadoFilter={filters.estado}
          onEstadoChange={(value) => setFilter("estado", value)}
          isSearching={personasBusquedaQuery.isFetching}
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
          data={paginatedData}
          isLoading={isLoading}
          error={
            personasQuery.error ? (personasQuery.error as Error).message : null
          }
          onToggleEstado={handleToggleEstado}
          onEditPersona={handleEditPersona}
          onEditUsuario={handleEditUsuario}
        />
        <Box>
          <PersonaPagination
            page={page}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={goto}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        </Box>
      </Stack>

      <GenericModal
        isOpen={personaModal.isOpen}
        onClose={personaModal.onClose}
        title="Crear Persona"
        fields={personaCreateFields}
        onSave={async (values) => {
          const numeroIdentificacion = sanitizeDigits(
            values.numeroIdentificacion ?? "",
            10,
          );
          const telefonoMovil = sanitizeDigits(
            values.telefonoMovil ?? "",
            10,
          );
          await createPersonaMutation.mutateAsync({
            nombres: values.nombres ?? "",
            apellidos: values.apellidos ?? "",
            tipoDocumento: (values.tipoDocumento ?? "").toString(),
            numeroIdentificacion,
            telefonoMovil,
            rol: { id: Number(values.rol) },
          });
          personaModal.onClose();
        }}
      />

      <GenericModal
        key={`edit-persona-${selectedPersona?.idPersona ?? "new"}`}
        isOpen={editPersonaModal.isOpen}
        onClose={closePersonaModal}
        title="Editar Persona"
        fields={personaEditFields}
        initialValues={
          selectedPersona
            ? {
                nombres: selectedPersona.nombres,
                apellidos: selectedPersona.apellidos,
                tipoDocumento: selectedPersona.tipoDocumento
                  ? selectedPersona.tipoDocumento.toUpperCase()
                  : "",
                numeroIdentificacion: sanitizeDigits(
                  selectedPersona.numeroIdentificacion ?? "",
                  10,
                ),
                telefonoMovil: sanitizeDigits(
                  selectedPersona.telefonoMovil ?? "",
                  10,
                ),
                rol:
                  rolesOptions.find(
                    (option) =>
                      option.label ===
                      (typeof selectedPersona.rol === "string"
                        ? selectedPersona.rol
                        : selectedPersona.rol?.nombre),
                  )?.value ?? "",
              }
            : undefined
        }
        onSave={async (values) => {
          if (!selectedPersona) return false;
          const numeroIdentificacion = sanitizeDigits(
            values.numeroIdentificacion ?? "",
            10,
          );
          const telefonoMovil = sanitizeDigits(
            values.telefonoMovil ?? "",
            10,
          );
          await updatePersonaMutation.mutateAsync({
            idPersona: selectedPersona.idPersona,
            payload: {
              nombres: values.nombres ?? "",
              apellidos: values.apellidos ?? "",
              tipoDocumento: (values.tipoDocumento ?? "").toString(),
              numeroIdentificacion,
              telefonoMovil,
              rol: { id: Number(values.rol) },
            },
          });
          closePersonaModal();
        }}
      />

      <GenericModal
        key={`edit-usuario-${selectedPersona?.idUsuario ?? "new"}`}
        isOpen={editUsuarioModal.isOpen}
        onClose={closeUsuarioModal}
        title="Editar Usuario"
        fields={usuarioEditFields}
        initialValues={
          selectedPersona
            ? {
                email: selectedPersona.email ?? "",
                password: "",
              }
            : undefined
        }
        onSave={async (values) => {
          if (!selectedPersona?.idUsuario) return false;
          const email = (values.email ?? "").trim();
          if (emailExists(email, selectedPersona.idPersona)) {
            toast({
              title: "Email duplicado",
              description: "Ya existe un usuario registrado con este correo",
              status: "error",
              duration: 3000,
            });
            return false;
          }
          const payload: UpdateUsuarioPayload = {
            email,
            persona: { id: selectedPersona.idPersona },
          };
          if (values.password && values.password.trim() !== "") {
            payload.password = values.password.trim();
          }
          await updateUsuarioMutation.mutateAsync({
            idUsuario: selectedPersona.idUsuario,
            payload,
          });
          closeUsuarioModal();
        }}
      />

      <SearchableFormModal<UsuarioFormValues, Persona>
        isOpen={usuarioModal.isOpen}
        onClose={usuarioModal.onClose}
        title="Crear Usuario"
        formFields={usuarioCreateFields}
        searchConfig={searchConfig}
        onSave={async (values, personaId) => {
          if (!personaId) {
            toast({
              title: "Error",
              description: "Debes seleccionar una persona primero",
              status: "error",
              duration: 3000,
            });
            return;
          }
          const email = (values.email ?? "").trim();
          if (emailExists(email, personaId)) {
            toast({
              title: "Email duplicado",
              description: "Ya existe un usuario registrado con este correo",
              status: "error",
              duration: 3000,
            });
            return;
          }
          await createUsuarioMutation.mutateAsync({
            email,
            password: (values.password ?? "").trim(),
            persona: { id: personaId },
          });
          usuarioModal.onClose();
        }}
      />
    </Stack>
  );
};

export default PersonaList;
