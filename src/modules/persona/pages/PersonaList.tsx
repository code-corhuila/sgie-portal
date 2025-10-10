// PersonasList.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  Spacer,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal, { type Field } from "../../../components/UI/GenericModal";
import SearchableFormModal, {
  type SearchConfig,
  type SearchResultField,
} from "../../../components/UI/SearchableFormModal";
import { usePersonas } from "../hooks/usePersona";
import { apiCall } from "../../../api/base";
import {
  FiEdit2,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiToggleLeft,
  FiUserPlus,
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from "react-icons/fi";

interface Rol {
  id: number;
  nombre: string;
}

interface UsuarioForm {
  email: string;
  password: string;
}

const PersonasList: React.FC = () => {
  const toast = useToast();
  const {
    data,
    loading,
    error,
    fetchAll,
    fetchPersonaByDocumento,
    createPersona,
    cambiarEstado,
  } = usePersonas();

  const personaModal = useDisclosure();
  const usuarioModal = useDisclosure();
  const editPersonaModal = useDisclosure();
  const editUsuarioModal = useDisclosure();

  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [numeroDoc, setNumeroDoc] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("Todos");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiCall<{ data: Rol[] }>("/rol", {
        credentials: "include",
      });
      setRoles(res.data);
    } catch (err) {
      console.error("Error cargando roles", err);
    }
  }, []);

  const columns: Column<any>[] = useMemo(
    () => [
      { key: "idPersona", label: "ID" },
      { key: "nombres", label: "Nombres" },
      { key: "apellidos", label: "Apellidos" },
      { key: "tipoDocumento", label: "Tipo Doc" },
      { key: "numeroIdentificacion", label: "Documento" },
      { key: "email", label: "Correo", render: (p) => p.email ?? "—" },
      {
        key: "rol",
        label: "Rol",
        render: (p) => (
          <Badge variant="info" borderRadius="full">
            {typeof p.rol === "string" ? p.rol : p.rol?.nombre ?? "—"}
          </Badge>
        ),
      },
      {
        key: "estado",
        label: "Estado",
        render: (p) => (
          <Badge variant={p.estado ? "success" : "neutral"}>
            {p.estado ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        render: (item) => (
          <HStack spacing={2}>
            <Tooltip label={item.estado ? "Inhabilitar persona" : "Habilitar persona"}>
              <IconButton
                aria-label="Cambiar estado"
                size="sm"
                variant="ghost"
                colorScheme={item.estado ? "red" : "green"}
                icon={<FiToggleLeft />}
              onClick={async () => {
                try {
                  await cambiarEstado(item.idPersona); // 👈 Llama al hook
                  await fetchAll(); // 👈 Refresca la tabla
                  toast({
                    title: `Persona ${item.estado ? "inhabilitada" : "habilitada"} correctamente`,
                    status: "success",
                    duration: 2000,
                  });
                } catch (err: any) {
                  console.error("Error cambiando estado persona:", err);
                  toast({
                    title: "Error",
                    description: err?.message ?? "No se pudo cambiar el estado",
                    status: "error",
                    duration: 4000,
                  });
                }
              }}
            />
            </Tooltip>
            <Tooltip label="Editar persona">
              <IconButton
                aria-label="Editar persona"
                size="sm"
                variant="ghost"
                icon={<FiEdit2 />}
              onClick={async () => {
                await fetchRoles();
                setSelectedItem(item);
                editPersonaModal.onOpen();
              }}
            />
            </Tooltip>
            {item.idUsuario && (
              <Tooltip label="Editar usuario">
                <IconButton
                  aria-label="Editar usuario"
                  size="sm"
                  variant="ghost"
                  icon={<FiLock />}
                onClick={() => {
                  setSelectedItem(item);
                  editUsuarioModal.onOpen();
                }}
                />
              </Tooltip>
            )}
          </HStack>
        ),
      },
    ],
    [cambiarEstado, editPersonaModal, editUsuarioModal, fetchAll, fetchRoles, toast]
  );

  // Campos para crear persona (sin valores iniciales)
  const createPersonaFields: Field<any>[] = useMemo(
    () => [
      { name: "nombres", label: "Nombres", type: "text", required: true },
      { name: "apellidos", label: "Apellidos", type: "text", required: true },
      {
        name: "tipoDocumento",
        label: "Tipo Documento",
        type: "text",
        required: true,
      },
      {
        name: "numeroIdentificacion",
        label: "Número Documento",
        type: "text",
        required: true,
      },
      {
        name: "telefonoMovil",
        label: "Teléfono",
        type: "text",
        required: true,
      },
      {
        name: "rol",
        label: "Rol",
        type: "select",
        options: roles.map((r) => ({ value: r.id, label: r.nombre })),
        required: true,
      },
    ],
    [roles]
  );

  // Campos para editar persona (CON valores iniciales)
  const editPersonaFields: Field<any>[] = useMemo(
    () => [
      {
        name: "nombres",
        label: "Nombres",
        type: "text",
        required: true,
      },
      {
        name: "apellidos",
        label: "Apellidos",
        type: "text",
        required: true,
      },
      {
        name: "tipoDocumento",
        label: "Tipo Documento",
        type: "text",
        required: true,
      },
      {
        name: "numeroIdentificacion",
        label: "Número Documento",
        type: "text",
        required: true,
      },
      {
        name: "telefonoMovil",
        label: "Teléfono",
        type: "text",
        required: true,
      },
      {
        name: "rol",
        label: "Rol",
        type: "select",
        options: roles.map((r) => ({ value: r.id, label: r.nombre })),
        required: true,
      },
    ],
    [roles]
  );

  // Campos para editar usuario
  const usuarioEditFields: Field<UsuarioForm>[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "usuario@ejemplo.com",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      required: false,
      placeholder: "Dejar vacío para mantener actual",
    },
  ];

  // Campos para crear usuario
  const usuarioCreateFields: Field<UsuarioForm>[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "usuario@ejemplo.com",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      required: true,
      placeholder: "Mínimo 8 caracteres",
    },
  ];

  const searchResultFields: SearchResultField<any>[] = [
    { key: "numeroIdentificacion", label: "Cédula" },
    { key: "nombres", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "email", label: "Email" },
  ];

  const searchConfig: SearchConfig<any> = {
    searchPlaceholder: "Ingresa número de cédula",
    searchButtonText: "Buscar Persona",
    onSearch: async (cedula: string) => {
      try {
        const response = await apiCall<any[]>(
          `/persona/persona-usuario?numeroIdentificacion=${cedula}`,
          { credentials: "include" }
        );
        return response && response.length > 0 ? response[0] : null;
      } catch {
        return null;
      }
    },
    resultFields: searchResultFields,
    idField: "idPersona",
    emptyMessage: "No se encontró ninguna persona con esa cédula",
  };

  const handleSavePersona = async (values: any) => {
    try {
      await createPersona({
        ...values,
        rol: { id: Number(values.rol) },
      });
      personaModal.onClose();
    } catch (err: any) {
      toast({
        title: "Error al crear persona",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleEditPersona = async (values: any) => {
    if (!selectedItem?.idPersona) return;

    try {
      // Construir el payload con TODOS los campos
      const payload = {
        nombres: values.nombres,
        apellidos: values.apellidos,
        tipoDocumento: values.tipoDocumento,
        numeroIdentificacion: values.numeroIdentificacion,
        telefonoMovil: values.telefonoMovil,
        rol: { id: Number(values.rol) },
      };

      console.log("Enviando actualización persona:", payload);

      await apiCall(`/persona/${selectedItem.idPersona}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        credentials: "include",
      });

      toast({
        title: "Persona actualizada",
        status: "success",
        duration: 2000,
      });

      await fetchAll();
      editPersonaModal.onClose();
      setSelectedItem(null);
    } catch (err: any) {
      toast({
        title: "Error al actualizar persona",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleEditUsuario = async (values: any) => {
    if (!selectedItem?.idUsuario) return;

    try {
      // Si no se ingresó contraseña, no la enviamos
      const payload: any = {
        email: values.email,
        persona: { id: selectedItem.idPersona }, // 👈 AÑADIDO
      };
      if (values.password && values.password.trim() !== "") {
        payload.password = values.password;
      }

      console.log("Enviando actualización usuario:", payload);

      await apiCall(`/usuario/${selectedItem.idUsuario}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        credentials: "include",
      });

      toast({
        title: "Usuario actualizado",
        status: "success",
        duration: 2000,
      });

      await fetchAll();
      editUsuarioModal.onClose();
      setSelectedItem(null);
    } catch (err: any) {
      toast({
        title: "Error al actualizar usuario",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleSaveUsuario = async (
    values: Partial<UsuarioForm>,
    personaId: number | null
  ) => {
    if (!personaId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una persona primero",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await apiCall("/usuario", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          persona: { id: personaId },
        }),
        credentials: "include",
      });

      toast({
        title: "Usuario creado",
        status: "success",
        duration: 2000,
      });

      await fetchAll();
      usuarioModal.onClose();
    } catch (err: any) {
      toast({
        title: "Error al crear usuario",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleCloseEditPersona = () => {
    editPersonaModal.onClose();
    setSelectedItem(null);
  };

  const handleCloseEditUsuario = () => {
    editUsuarioModal.onClose();
    setSelectedItem(null);
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (estadoFilter === "Todos") return data;
    const shouldBeActive = estadoFilter === "Activos";
    return data.filter((item) => Boolean(item.estado) === shouldBeActive);
  }, [data, estadoFilter]);

  const totalElements = filteredData.length;
  const totalPages = totalElements === 0 ? 1 : Math.ceil(totalElements / size);

  useEffect(() => {
    setPage(0);
  }, [estadoFilter, size, data?.length]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    if (totalElements === 0) return [];
    const start = page * size;
    return filteredData.slice(start, start + size);
  }, [filteredData, page, size, totalElements]);

  const goto = useCallback((target: number) => {
    if (totalElements === 0) {
      setPage(0);
      return;
    }
    const next = Math.min(Math.max(target, 0), totalPages - 1);
    setPage(next);
  }, [totalElements, totalPages]);

  return (
    <Stack spacing={8}>
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={4}
      >
        <Stack spacing={1}>
          <Heading size="lg" color="neutral.900">
            Gestión de personas y usuarios
          </Heading>
          <Text fontSize="sm" color="neutral.500">
            Crea personas, asigna usuarios y controla sus permisos desde un único panel.
          </Text>
        </Stack>
        <ButtonGroup size="sm" flexWrap="wrap" gap={2}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={() => {
              setPage(0);
              fetchAll();
            }}
            isLoading={loading}
          >
            Actualizar
          </Button>
          <Button
            leftIcon={<Icon as={FiUserPlus} />}
            colorScheme="brand"
            onClick={async () => {
              await fetchRoles();
              setSelectedItem(null);
              personaModal.onOpen();
            }}
          >
            Crear persona
          </Button>
          <Button
            leftIcon={<Icon as={FiLock} />}
            variant="outline"
            onClick={usuarioModal.onOpen}
          >
            Crear usuario
          </Button>
        </ButtonGroup>
      </Flex>

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          align={{ base: "stretch", md: "flex-end" }}
        >
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="neutral.400" />
            </InputLeftElement>
            <Input
              placeholder="Número de documento"
              value={numeroDoc}
              onChange={(e) => setNumeroDoc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(0), fetchPersonaByDocumento(numeroDoc))}
            />
          </InputGroup>
          <ButtonGroup size="sm">
            <Button
              colorScheme="brand"
              onClick={() => {
                setPage(0);
                fetchPersonaByDocumento(numeroDoc);
              }}
              leftIcon={<Icon as={FiSearch} />}
              isLoading={loading}
            >
              Buscar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setNumeroDoc("");
                setPage(0);
                void fetchAll();
              }}
            >
              Limpiar
            </Button>
          </ButtonGroup>
        </Stack>

        <Stack spacing={2} maxW={{ base: "100%", md: "240px" }}>
          <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
            Estado
          </Text>
          <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Activos">Activos</option>
            <option value="Inactivos">Inactivos</option>
          </Select>
        </Stack>

        <Wrap spacing={3}>
          {numeroDoc && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme="brand">
                <TagLabel>Documento: {numeroDoc}</TagLabel>
                <TagCloseButton onClick={() => setNumeroDoc("")} />
              </Tag>
            </WrapItem>
          )}
          <WrapItem>
            <Badge variant="neutral">
              Mostrando {paginatedData.length} de {filteredData.length} coincidencias
            </Badge>
          </WrapItem>
          {estadoFilter !== "Todos" && (
            <WrapItem>
              <Tag borderRadius="full" variant="solid" colorScheme={estadoFilter === "Activos" ? "brand" : "teal"}>
                <TagLabel>Estado: {estadoFilter}</TagLabel>
                <TagCloseButton onClick={() => setEstadoFilter("Todos")} />
              </Tag>
            </WrapItem>
          )}
        </Wrap>
      </Stack>

      <DataTable
        data={paginatedData}
        columns={columns}
        loading={loading}
        error={error}
        keyExtractor={(p) => p?.idPersona?.toString() ?? `persona-${Math.random().toString(36).slice(2)}`}
        emptyMessage="No hay personas registradas"
      />

      <Flex
        mt={4}
        align="center"
        justify="space-between"
        gap={4}
        display={filteredData.length === 0 ? "none" : "flex"}
      >
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            Filas por página
          </Text>
          <Select
            size="sm"
            w="80px"
            value={size}
            onChange={(e) => {
              const nextSize = Number(e.target.value);
              setSize(nextSize);
              setPage(0);
            }}
            isDisabled={loading}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </HStack>

        <Spacer />

        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            {filteredData.length === 0
              ? "0–0"
              : `${page * size + 1}–${Math.min((page + 1) * size, filteredData.length)}`} de {filteredData.length}
          </Text>
          <IconButton
            aria-label="Primera página"
            size="sm"
            variant="ghost"
            onClick={() => goto(0)}
            isDisabled={page === 0 || loading || filteredData.length === 0}
            icon={<FiChevronsLeft />}
          />
          <IconButton
            aria-label="Anterior"
            size="sm"
            variant="ghost"
            onClick={() => goto(page - 1)}
            isDisabled={page === 0 || loading || filteredData.length === 0}
            icon={<FiChevronLeft />}
          />
          <Button size="sm" variant="outline" isDisabled>
            {filteredData.length === 0 ? 0 : page + 1} / {filteredData.length === 0 ? 0 : totalPages}
          </Button>
          <IconButton
            aria-label="Siguiente"
            size="sm"
            variant="ghost"
            onClick={() => goto(page + 1)}
            isDisabled={page >= totalPages - 1 || loading || filteredData.length === 0}
            icon={<FiChevronRight />}
          />
          <IconButton
            aria-label="Última página"
            size="sm"
            variant="ghost"
            onClick={() => goto(totalPages - 1)}
            isDisabled={page >= totalPages - 1 || loading || filteredData.length === 0}
            icon={<FiChevronsRight />}
          />
        </HStack>
      </Flex>

      {/* Modal Crear Persona */}
      <GenericModal
        isOpen={personaModal.isOpen}
        onClose={() => {
          personaModal.onClose();
          setSelectedItem(null);
        }}
        title="Crear Persona"
        fields={createPersonaFields}
        onSave={handleSavePersona}
      />

      {/* Modal Editar Persona */}
      <GenericModal
        key={`edit-persona-${selectedItem?.idPersona ?? "new"}`}
        isOpen={editPersonaModal.isOpen}
        onClose={handleCloseEditPersona}
        title="Editar Persona"
        fields={editPersonaFields}
        initialValues={
          selectedItem
            ? {
                nombres: selectedItem.nombres,
                apellidos: selectedItem.apellidos,
                tipoDocumento: selectedItem.tipoDocumento,
                numeroIdentificacion: selectedItem.numeroIdentificacion,
                telefonoMovil: selectedItem.telefonoMovil,
                rol: roles.find((r) => r.nombre === selectedItem.rol)?.id ?? "",
              }
            : undefined
        }
        onSave={handleEditPersona}
      />

      {/* Modal Editar Usuario */}
      <GenericModal
        key={`edit-usuario-${selectedItem?.idUsuario ?? "new"}`}
        isOpen={editUsuarioModal.isOpen}
        onClose={handleCloseEditUsuario}
        title="Editar Usuario"
        fields={usuarioEditFields}
        initialValues={
          selectedItem
            ? {
                email: selectedItem.email ?? "",
                password: "",
              }
            : undefined
        }
        onSave={handleEditUsuario}
      />

      {/* Modal Crear Usuario con Búsqueda */}
      <SearchableFormModal<UsuarioForm, any>
        isOpen={usuarioModal.isOpen}
        onClose={usuarioModal.onClose}
        title="Crear Usuario"
        formFields={usuarioCreateFields}
        searchConfig={searchConfig}
        onSave={handleSaveUsuario}
      />
    </Stack>
  );
};

export default PersonasList;
