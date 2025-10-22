import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import type { Field, FieldOption } from "../../../components/UI/GenericModal";
import type {
  SearchConfig,
  SearchResultField,
} from "../../../components/UI/SearchableFormModal";
import { useFilterState } from "../../../hooks/useFilterState";
import { useTableManager } from "../../../hooks/useTableManager";
import {
  EMAIL_REGEX,
  PASSWORD_RULE_REGEX,
  sanitizeDigits,
} from "../../../utils/validation";
import PersonaListView, {
  type EstadoFilter,
  type PersonaFormValues,
  type UsuarioFormValues,
} from "../components/PersonaListView";
import { usePersonaManagement } from "../hooks/usePersonaManagement";
import { PersonasApi } from "../../../api/persona";
import type { Persona, Rol, UpdateUsuarioPayload } from "../types";

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

const PersonaList: React.FC = () => {
  const toast = useToast();

  const personaModal = useDisclosure();
  const usuarioModal = useDisclosure();
  const editPersonaModal = useDisclosure();
  const editUsuarioModal = useDisclosure();

  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const { filters, setFilter } = useFilterState(initialFilters);
  const documentoBusqueda = filters.documento.trim();

  const {
    personas,
    personasBase,
    personasQuery,
    personasBusquedaQuery,
    rolesQuery,
    isLoading,
    isSearchLoading,
    searchPersonas,
    invalidatePersonas,
    toggleEstado,
    createPersona,
    updatePersona,
    createUsuario,
    updateUsuario,
  } = usePersonaManagement({
    documentoBusqueda,
    enableRoles: personaModal.isOpen || editPersonaModal.isOpen,
  });

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

  const handleRefresh = () => {
    invalidatePersonas();
  };

  const handleBuscarDocumento = () => {
    void searchPersonas();
  };

  const handleLimpiarDocumento = () => {
    personasBusquedaQuery.remove();
    setFilter("documento", "");
  };

  const handleToggleEstado = (persona: Persona) => {
    toggleEstado({
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

  const closePersonaModal = useCallback(() => {
    setSelectedPersona(null);
    editPersonaModal.onClose();
  }, [editPersonaModal]);

  const closeUsuarioModal = useCallback(() => {
    setSelectedPersona(null);
    editUsuarioModal.onClose();
  }, [editUsuarioModal]);

  const handleCreatePersonaSave = useCallback(
    async (values: Partial<PersonaFormValues>) => {
      const numeroIdentificacion = sanitizeDigits(
        values.numeroIdentificacion ?? "",
        10,
      );
      const telefonoMovil = sanitizeDigits(values.telefonoMovil ?? "", 10);
      await createPersona({
        nombres: values.nombres ?? "",
        apellidos: values.apellidos ?? "",
        tipoDocumento: (values.tipoDocumento ?? "").toString(),
        numeroIdentificacion,
        telefonoMovil,
        rol: { id: Number(values.rol) },
      });
      personaModal.onClose();
    },
    [createPersona, personaModal],
  );

  const handleEditPersonaSave = useCallback(
    async (values: Partial<PersonaFormValues>) => {
      if (!selectedPersona) return false;
      const numeroIdentificacion = sanitizeDigits(
        values.numeroIdentificacion ?? "",
        10,
      );
      const telefonoMovil = sanitizeDigits(values.telefonoMovil ?? "", 10);
      await updatePersona({
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
      return true;
    },
    [closePersonaModal, selectedPersona, updatePersona],
  );

  const handleEditUsuarioSave = useCallback(
    async (values: Partial<UsuarioFormValues>) => {
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
      await updateUsuario({
        idUsuario: selectedPersona.idUsuario,
        payload,
      });
      closeUsuarioModal();
      return true;
    },
    [closeUsuarioModal, emailExists, selectedPersona, toast, updateUsuario],
  );

  const handleCreateUsuarioSave = useCallback(
    async (values: Partial<UsuarioFormValues>, personaId?: number | null) => {
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
      await createUsuario({
        email,
        password: (values.password ?? "").trim(),
        persona: { id: personaId },
      });
      usuarioModal.onClose();
    },
    [createUsuario, emailExists, toast, usuarioModal],
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

  const personaEditInitialValues = useMemo(() => {
    if (!selectedPersona) return undefined;
    return {
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
    } satisfies Partial<PersonaFormValues>;
  }, [rolesOptions, selectedPersona]);

  const usuarioEditInitialValues = useMemo(() => {
    if (!selectedPersona) return undefined;
    return {
      email: selectedPersona.email ?? "",
      password: "",
    } satisfies Partial<UsuarioFormValues>;
  }, [selectedPersona]);

  const usuarioSearchFields: SearchResultField<Persona>[] = [
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
    resultFields: usuarioSearchFields,
    idField: "idPersona",
    emptyMessage: "No se encontró ninguna persona con esa cédula",
  };

  return (
    <PersonaListView
      header={{
        onRefresh: handleRefresh,
        onOpenPersona: () => {
          if (!rolesQuery.data) {
            rolesQuery.refetch();
          }
          personaModal.onOpen();
        },
        onOpenUsuario: usuarioModal.onOpen,
        isLoading,
      }}
      filters={{
        documento: filters.documento,
        onDocumentoChange: (value) => setFilter("documento", value),
        onBuscar: handleBuscarDocumento,
        onLimpiar: handleLimpiarDocumento,
        estado: filters.estado,
        onEstadoChange: (value) => setFilter("estado", value),
        isSearching: isSearchLoading,
      }}
      table={{
        data: paginatedData,
        isLoading,
        error: personasQuery.error
          ? (personasQuery.error as Error).message
          : null,
        onToggleEstado: handleToggleEstado,
        onEditPersona: handleEditPersona,
        onEditUsuario: handleEditUsuario,
      }}
      pagination={{
        page,
        pageSize,
        totalItems,
        totalPages,
        pageSizeOptions,
        onPageChange: goto,
        onPageSizeChange: setPageSize,
        isLoading,
      }}
      personaModal={{
        isOpen: personaModal.isOpen,
        onClose: personaModal.onClose,
        title: "Crear Persona",
        fields: personaCreateFields,
        onSave: handleCreatePersonaSave,
      }}
      editPersonaModal={{
        isOpen: editPersonaModal.isOpen,
        onClose: closePersonaModal,
        title: "Editar Persona",
        fields: personaEditFields,
        onSave: handleEditPersonaSave,
      }}
      usuarioModal={{
        isOpen: usuarioModal.isOpen,
        onClose: usuarioModal.onClose,
        title: "Crear Usuario",
        formFields: usuarioCreateFields,
        searchConfig,
        onSave: handleCreateUsuarioSave,
      }}
      editUsuarioModal={{
        isOpen: editUsuarioModal.isOpen,
        onClose: closeUsuarioModal,
        title: "Editar Usuario",
        fields: usuarioEditFields,
        onSave: handleEditUsuarioSave,
      }}
      editPersonaInitialValues={personaEditInitialValues}
      editUsuarioInitialValues={usuarioEditInitialValues}
      usuarioSearchConfig={searchConfig}
      usuarioSearchFields={usuarioSearchFields}
    />
  );
};

export default PersonaList;
