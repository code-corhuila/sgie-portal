import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spacer,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GenericModal, {
  type Field,
  type FieldOption,
} from "../../../components/UI/GenericModal";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import { PermisosApi } from "../../../api/permisos";
import { permisosKeys } from "../queryKeys";
import type {
  CreatePermisoRolEntidadPayload,
  Entidad,
  Permiso,
  PermisoRolEntidad,
  Rol,
  UpdatePermisoRolEntidadPayload,
} from "../types";
import { useFilterState } from "../../../hooks/useFilterState";
import { useTableManager } from "../../../hooks/useTableManager";
import {
  FiEdit2,
  FiPlusCircle,
  FiRefreshCw,
  FiToggleLeft,
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from "react-icons/fi";

interface PermisoFormValues {
  rol: string | number | undefined;
  permiso: Array<string | number>;
  entidad: string | number | undefined;
}

const ENTITY_LABELS: Record<string, string> = {
  usuario: "Usuarios",
  rol: "Roles",
  permiso: "Permisos",
  equipo: "Equipos",
  instalacion: "Instalaciones",
  campus: "Campus",
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatEntityLabel = (raw?: string) => {
  if (!raw) return "—";
  const normalized = raw.toLowerCase();
  return ENTITY_LABELS[normalized] ?? toTitleCase(raw.replace(/_/g, " "));
};

const toOption = (
  item: { id: number; nombre: string },
  formatter: (value: string) => string = toTitleCase,
): FieldOption => ({
  value: item.id,
  label: formatter(item.nombre),
});

const getNameFromEntity = (
  value: Rol | Permiso | Entidad | string | undefined,
): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if ("nombre" in value && typeof value.nombre === "string") {
    return value.nombre;
  }
  return undefined;
};

const getIdFromValue = (
  value: any,
  list: { id: number; nombre: string }[],
): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
    const found = list.find((item) => item.nombre === value);
    return found ? found.id : null;
  }
  if (
    typeof value === "object" &&
    "id" in value &&
    (typeof value.id === "number" || typeof value.id === "string")
  ) {
    const numeric = Number(value.id);
    return Number.isNaN(numeric) ? null : numeric;
  }
  if (
    typeof value === "object" &&
    "nombre" in value &&
    typeof value.nombre === "string"
  ) {
    const found = list.find((item) => item.nombre === value.nombre);
    return found ? found.id : null;
  }
  return null;
};

const resolveIdFromItem = (
  idCandidate: string | number | undefined,
  fallback: any,
  catalog: { id: number; nombre: string }[],
): number | null => {
  if (idCandidate !== undefined && idCandidate !== null) {
    const numeric = Number(idCandidate);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  return getIdFromValue(fallback, catalog);
};

const getEntityIdentifier = (
  value: Rol | Permiso | Entidad | string | undefined,
  fallback?: string,
): string | undefined => {
  if (!value) return fallback;
  if (typeof value === "string") {
    return value;
  }
  if ("id" in value && value.id != null) {
    return String(value.id);
  }
  return fallback;
};

const buildPermisoRowKey = (item: PermisoRolEntidad): string => {
  const rolKey =
    getEntityIdentifier(item.rol as Rol | string | undefined, item.idRol) ??
    item.nombres ??
    "rol";
  const permisoKey = getEntityIdentifier(
    item.permiso as Permiso | string | undefined,
    item.idPermiso,
  );
  const entidadKey = getEntityIdentifier(
    item.entidad as Entidad | string | undefined,
    item.idEntidad,
  );
  const baseKey =
    item.unique ??
    (item.id != null ? String(item.id) : undefined) ??
    `${rolKey}-${permisoKey ?? "permiso"}-${entidadKey ?? "entidad"}`;

  return `permiso-${baseKey}-${rolKey}-${permisoKey ?? "permiso"}-${
    entidadKey ?? "entidad"
  }`;
};

const PermisosList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const rolModal = useDisclosure();
  const permisoModal = useDisclosure();
  const editarRolModal = useDisclosure();
  const confirmDialog = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const [selectedItem, setSelectedItem] = useState<PermisoRolEntidad | null>(
    null,
  );
  const [confirmData, setConfirmData] = useState<{
    item: PermisoRolEntidad;
    nextState: boolean;
  } | null>(null);
  const [selectedRolId, setSelectedRolId] = useState<number | "">("");
  const [editRolNombre, setEditRolNombre] = useState("");
  const [editRolDescripcion, setEditRolDescripcion] = useState("");

  const { filters, setFilter } = useFilterState({
    rol: "Todos",
    estado: "Todos",
    entidad: "Todas",
  });

  const permisosQuery = useQuery<PermisoRolEntidad[]>({
    queryKey: permisosKeys.all,
    queryFn: PermisosApi.getAll,
  });

  const rolesQuery = useQuery<Rol[]>({
    queryKey: permisosKeys.roles,
    queryFn: PermisosApi.getRoles,
    staleTime: 300_000,
  });

  const permisosCatalogQuery = useQuery<Permiso[]>({
    queryKey: permisosKeys.permisos,
    queryFn: PermisosApi.getPermisos,
    staleTime: 300_000,
  });

  const entidadesQuery = useQuery<Entidad[]>({
    queryKey: permisosKeys.entidades,
    queryFn: PermisosApi.getEntidades,
    staleTime: 300_000,
  });

  const data = useMemo(
    () => permisosQuery.data ?? [],
    [permisosQuery.data],
  );

  useEffect(() => {
    if (
      !editarRolModal.isOpen ||
      !rolesQuery.data ||
      rolesQuery.data.length === 0
    ) {
      return;
    }
    const roleToLoad =
      (selectedRolId !== "" &&
        rolesQuery.data.find((rol) => rol.id === selectedRolId)) ??
      rolesQuery.data[0];
    if (!roleToLoad) return;
    setSelectedRolId(roleToLoad.id);
    setEditRolNombre(roleToLoad.nombre ?? "");
    setEditRolDescripcion(roleToLoad.descripcion ?? "");
  }, [editarRolModal.isOpen, rolesQuery.data, selectedRolId]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const rolName = getNameFromEntity(item.rol as any);
      const entidadName = getNameFromEntity(item.entidad as any);
      const estadoOk =
        filters.estado === "Todos" ||
        (filters.estado === "Activos" && item.estado) ||
        (filters.estado === "Inactivos" && !item.estado);
      const rolOk = filters.rol === "Todos" || rolName === filters.rol;
      const entidadOk =
        filters.entidad === "Todas" || entidadName === filters.entidad;
      return estadoOk && rolOk && entidadOk;
    });
  }, [data, filters.entidad, filters.estado, filters.rol]);

  const tableManager = useTableManager(filteredData, {
    totalItems: filteredData.length,
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

  const rolOptionsFiltered = useMemo(() => {
    return Array.from(
      new Set(
        data
          .map((item) => getNameFromEntity(item.rol as any) ?? "")
          .filter((rol) => rol && rol.trim() !== ""),
      ),
    );
  }, [data]);

  const entidadOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => getNameFromEntity(item.entidad as any) ?? "")
            .filter((ent) => ent && ent.trim() !== ""),
        ),
      ).map((entidad) => ({
        value: entidad,
        label: formatEntityLabel(entidad),
      })),
    [data],
  );

  const toggleEstadoMutation = useMutation<
    void,
    Error,
    { id: number; nextState: boolean },
    { previous?: PermisoRolEntidad[] }
  >({
    mutationFn: ({ id, nextState }) => PermisosApi.toggleEstado(id, nextState),
    onMutate: async ({ id, nextState }) => {
      await queryClient.cancelQueries({ queryKey: permisosKeys.all });
      const previous = queryClient.getQueryData<PermisoRolEntidad[]>(
        permisosKeys.all,
      );
      if (previous) {
        queryClient.setQueryData<PermisoRolEntidad[]>(
          permisosKeys.all,
          (prev = []) =>
            prev.map((item) =>
              item.id === id ? { ...item, estado: nextState } : item,
            ),
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(permisosKeys.all, context.previous);
      }
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
    onSuccess: (_data, { nextState }) => {
      toast({
        title: `Asignación ${nextState ? "habilitada" : "inhabilitada"} correctamente`,
        status: "success",
        duration: 2000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: permisosKeys.all });
    },
  });

  const updatePermisoMutation = useMutation<
    void,
    Error,
    { id: number; payload: UpdatePermisoRolEntidadPayload }
  >({
    mutationFn: ({ id, payload }) => PermisosApi.update(id, payload),
    onSuccess: () => {
      toast({
        title: "Permiso actualizado",
        status: "success",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: permisosKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar permiso",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createPermisoMutation = useMutation<
    void,
    Error,
    CreatePermisoRolEntidadPayload
  >({
    mutationFn: (payload) => PermisosApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permisosKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al asignar permiso",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createRolMutation = useMutation<
    void,
    Error,
    { nombre: string; descripcion?: string }
  >({
    mutationFn: (payload) => PermisosApi.createRol(payload),
    onSuccess: () => {
      toast({ title: "Rol creado", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: permisosKeys.roles });
      queryClient.invalidateQueries({ queryKey: permisosKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al crear rol",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updateRolMutation = useMutation<
    void,
    Error,
    { id: number; nombre: string; descripcion?: string }
  >({
    mutationFn: ({ id, nombre, descripcion }) =>
      PermisosApi.updateRol(id, { nombre, descripcion }),
    onSuccess: () => {
      toast({ title: "Rol actualizado", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: permisosKeys.roles });
      queryClient.invalidateQueries({ queryKey: permisosKeys.all });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar rol",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const rolOptions = useMemo(
    () => (rolesQuery.data ?? []).map((rol) => toOption(rol)),
    [rolesQuery.data],
  );
  const permisoOptions = useMemo(
    () =>
      (permisosCatalogQuery.data ?? []).map((permiso) =>
        toOption(permiso, (value) => toTitleCase(value)),
      ),
    [permisosCatalogQuery.data],
  );
  const entidadOptionsCatalog = useMemo(
    () =>
      (entidadesQuery.data ?? []).map((entidad) =>
        toOption(entidad, formatEntityLabel),
      ),
    [entidadesQuery.data],
  );

  const permisoFields: Field<PermisoFormValues>[] = useMemo(
    () => [
      {
        name: "rol",
        label: "Rol",
        type: "select",
        options: rolOptions,
        required: true,
      },
      {
        name: "permiso",
        label: "Permisos",
        type: "multiselect",
        options: permisoOptions,
        required: true,
        placeholder: "Selecciona uno o varios permisos",
      },
      {
        name: "entidad",
        label: "Entidad",
        type: "select",
        options: entidadOptionsCatalog,
        required: true,
      },
    ],
    [entidadOptionsCatalog, permisoOptions, rolOptions],
  );

  const permisoInitialValues = useMemo(() => {
    if (!selectedItem) return undefined;

    const rolesRaw = rolesQuery.data ?? [];
    const permisosRaw = permisosCatalogQuery.data ?? [];
    const entidadesRaw = entidadesQuery.data ?? [];

    const rolId = selectedItem.idRol
      ? Number(selectedItem.idRol)
      : getIdFromValue(selectedItem.rol as any, rolesRaw);

    const entidadId = selectedItem.idEntidad
      ? Number(selectedItem.idEntidad)
      : getIdFromValue(selectedItem.entidad as any, entidadesRaw);

    const permisosIds = selectedItem.idPermiso
      ? [Number(selectedItem.idPermiso)].filter((value) => !Number.isNaN(value))
      : [getIdFromValue(selectedItem.permiso as any, permisosRaw)].filter(
          (id): id is number => typeof id === "number",
        );

    return {
      rol: rolId ?? "",
      permiso: permisosIds.length > 0 ? permisosIds : [],
      entidad: entidadId ?? "",
    } satisfies PermisoFormValues;
  }, [
    selectedItem,
    rolesQuery.data,
    permisosCatalogQuery.data,
    entidadesQuery.data,
  ]);

  const rolFields: Field<{ nombre: string; descripcion?: string }>[] = [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "descripcion", label: "Descripción", type: "text" },
  ];

  const handleToggleEstado = (item: PermisoRolEntidad) => {
    setConfirmData({ item, nextState: !item.estado });
    confirmDialog.onOpen();
  };

  const handleEditPermiso = (item: PermisoRolEntidad) => {
    setSelectedItem(item);
    permisoModal.onOpen();
  };

  const handleClosePermisoModal = () => {
    setSelectedItem(null);
    permisoModal.onClose();
  };

  const handleCloseEditarRol = () => {
    setSelectedRolId("");
    setEditRolNombre("");
    setEditRolDescripcion("");
    editarRolModal.onClose();
  };

  const isLoading = permisosQuery.isLoading || permisosQuery.isFetching;

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
            Gestión de permisos y roles
          </Heading>
          <Text fontSize="sm" color="neutral.500">
            Administra qué acciones puede ejecutar cada rol dentro del sistema.
          </Text>
        </Stack>
        <ButtonGroup size="sm" flexWrap="wrap" gap={2}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={() => permisosQuery.refetch()}
            isLoading={isLoading}
          >
            Actualizar
          </Button>
          <Button
            leftIcon={<Icon as={FiPlusCircle} />}
            onClick={rolModal.onOpen}
          >
            Crear rol
          </Button>
          <Button
            leftIcon={<Icon as={FiEdit2} />}
            variant="outline"
            onClick={async () => {
              if (!rolesQuery.data || rolesQuery.data.length === 0) {
                const result = await rolesQuery.refetch();
                if (!result.data || result.data.length === 0) {
                  toast({
                    title: "No hay roles disponibles para editar",
                    status: "info",
                    duration: 3000,
                  });
                  return;
                }
              }
              editarRolModal.onOpen();
            }}
          >
            Editar rol
          </Button>
          <Button
            colorScheme="brand"
            leftIcon={<Icon as={FiEdit2} />}
            onClick={() => {
              setSelectedItem(null);
              permisoModal.onOpen();
            }}
          >
            Asignar permiso
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
        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <Stack flex={1}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Filtrar por rol
            </Text>
            <Select
              value={filters.rol}
              onChange={(event) => setFilter("rol", event.target.value)}
            >
              <option value="Todos">Todos</option>
              {rolOptionsFiltered.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </Select>
          </Stack>

          <Stack flex={1}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Estado
            </Text>
            <Select
              value={filters.estado}
              onChange={(event) => setFilter("estado", event.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Activos">Activos</option>
              <option value="Inactivos">Inactivos</option>
            </Select>
          </Stack>

          <Stack flex={1}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Filtrar por entidad
            </Text>
            <Select
              value={filters.entidad}
              onChange={(event) => setFilter("entidad", event.target.value)}
            >
              <option value="Todas">Todas</option>
              {entidadOptions.map((ent) => (
                <option key={ent.value} value={ent.value}>
                  {ent.label}
                </option>
              ))}
            </Select>
          </Stack>
        </Flex>

        <Text fontSize="sm" color="gray.600">
          Registros totales: {data.length}
        </Text>
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
        <DataTable
          columns={
            [
              { key: "id", label: "ID" },
              {
                key: "rol",
                label: "Rol",
                render: (item) => (
                  <Badge variant="info" borderRadius="full">
                    {(() => {
                      const name = getNameFromEntity((item as any).rol);
                      return name ? toTitleCase(name) : "—";
                    })()}
                  </Badge>
                ),
              },
              {
                key: "permiso",
                label: "Permiso",
                render: (item) => (
                  <Badge variant="neutral" borderRadius="full">
                    {(() => {
                      const name = getNameFromEntity((item as any).permiso);
                      return name ? toTitleCase(name) : "—";
                    })()}
                  </Badge>
                ),
              },
              {
                key: "entidad",
                label: "Entidad",
                render: (item) => (
                  <Badge variant="neutral" borderRadius="full">
                    {formatEntityLabel(
                      getNameFromEntity((item as any).entidad),
                    )}
                  </Badge>
                ),
              },
              {
                key: "nombreCompleto",
                label: "Nombre Completo",
                render: (item) =>
                  `${(item as any).nombres ?? ""} ${(item as any).apellidos ?? ""}`.trim(),
                hideOnMobile: true,
              },
              {
                key: "estado",
                label: "Estado",
                render: (item) => (
                  <Badge variant={(item as any).estado ? "success" : "neutral"}>
                    {(item as any).estado ? "Activo" : "Inactivo"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                label: "Acciones",
                render: (item) => (
                  <HStack spacing={2}>
                    <Tooltip
                      label={
                        (item as any).estado
                          ? "Inhabilitar asignación"
                          : "Habilitar asignación"
                      }
                    >
                      <IconButton
                        aria-label={`${(item as any).estado ? "Inhabilitar" : "Habilitar"} asignación del rol ${getNameFromEntity((item as any).rol) ?? ""}`}
                        aria-pressed={(item as any).estado}
                        size="sm"
                        variant="ghost"
                        colorScheme={(item as any).estado ? "red" : "green"}
                        icon={<FiToggleLeft />}
                        onClick={() =>
                          handleToggleEstado(item as PermisoRolEntidad)
                        }
                      />
                    </Tooltip>
                    <Tooltip label="Actualizar permiso">
                      <IconButton
                        aria-label="Actualizar permiso"
                        size="sm"
                        variant="ghost"
                        icon={<FiEdit2 />}
                        onClick={() =>
                          handleEditPermiso(item as PermisoRolEntidad)
                        }
                      />
                    </Tooltip>
                  </HStack>
                ),
              },
            ] as Column<PermisoRolEntidad>[]
          }
          data={paginatedData}
          loading={isLoading}
          error={
            permisosQuery.error ? (permisosQuery.error as Error).message : null
          }
          keyExtractor={buildPermisoRowKey}
          emptyMessage="No hay asignaciones registradas"
        />

        <Flex direction={{ base: "column", md: "row" }} align="center" gap={4}>
          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.600">
              {totalItems === 0
                ? "0–0"
                : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalItems)}`}{" "}
              de {totalItems}
            </Text>

            <IconButton
              aria-label="Primera página"
              size="sm"
              variant="ghost"
              onClick={() => goto(0)}
              isDisabled={page === 0 || isLoading || totalItems === 0}
              icon={<FiChevronsLeft />}
            />
            <IconButton
              aria-label="Anterior"
              size="sm"
              variant="ghost"
              onClick={() => goto(page - 1)}
              isDisabled={page === 0 || isLoading || totalItems === 0}
              icon={<FiChevronLeft />}
            />
            <Button size="sm" variant="outline" isDisabled>
              {totalItems === 0 ? 0 : page + 1} /{" "}
              {totalItems === 0 ? 0 : totalPages}
            </Button>
            <IconButton
              aria-label="Siguiente"
              size="sm"
              variant="ghost"
              onClick={() => goto(page + 1)}
              isDisabled={
                page >= totalPages - 1 || isLoading || totalItems === 0
              }
              icon={<FiChevronRight />}
            />
            <IconButton
              aria-label="Última página"
              size="sm"
              variant="ghost"
              onClick={() => goto(totalPages - 1)}
              isDisabled={
                page >= totalPages - 1 || isLoading || totalItems === 0
              }
              icon={<FiChevronsRight />}
            />
          </HStack>

          <Spacer />

          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.600">
              Filas por página
            </Text>
            <Select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              isDisabled={isLoading}
              size="sm"
              maxW="80px"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>
      </Stack>

      <GenericModal
        isOpen={rolModal.isOpen}
        onClose={rolModal.onClose}
        title="Crear Rol"
        fields={rolFields}
        onSave={async (values) => {
          await createRolMutation.mutateAsync({
            nombre: values.nombre ?? "",
            descripcion: values.descripcion ?? "",
          });
          rolModal.onClose();
        }}
      />

      <GenericModal
        key={selectedItem?.id ?? "new"}
        isOpen={permisoModal.isOpen}
        onClose={handleClosePermisoModal}
        title={
          selectedItem ? "Actualizar Permiso a Rol" : "Asignar Permiso a Rol"
        }
        fields={permisoFields}
        initialValues={permisoInitialValues}
        onSave={async (values) => {
          const rolesRaw = rolesQuery.data ?? [];
          const permisosRaw = permisosCatalogQuery.data ?? [];
          const entidadesRaw = entidadesQuery.data ?? [];

          const rolId = getIdFromValue(values.rol, rolesRaw);
          const entidadId = getIdFromValue(values.entidad, entidadesRaw);
          const permisosSeleccionados = Array.isArray(values.permiso)
            ? values.permiso
            : values.permiso != null
              ? [values.permiso]
              : [];

          if (!rolId || !entidadId || permisosSeleccionados.length === 0) {
            throw new Error(
              "Rol, Permisos y Entidad deben estar seleccionados correctamente",
            );
          }

          const permisosIds = permisosSeleccionados
            .map((permiso) => getIdFromValue(permiso, permisosRaw))
            .filter((id): id is number => typeof id === "number");

          if (permisosIds.length === 0) {
            throw new Error("Debes seleccionar al menos un permiso válido");
          }

          const uniquePermisosIds = Array.from(new Set(permisosIds));

          const duplicatedPermisos = uniquePermisosIds.filter((permisoId) =>
            data.some((item) => {
              if (selectedItem && item.id === selectedItem.id) {
                return false;
              }
              const existingRolId = resolveIdFromItem(
                item.idRol,
                item.rol,
                rolesRaw,
              );
              const existingEntidadId = resolveIdFromItem(
                item.idEntidad,
                item.entidad,
                entidadesRaw,
              );
              const existingPermisoId = resolveIdFromItem(
                item.idPermiso,
                item.permiso,
                permisosRaw,
              );
              if (
                existingRolId == null ||
                existingEntidadId == null ||
                existingPermisoId == null
              ) {
                return false;
              }
              return (
                existingRolId === rolId &&
                existingEntidadId === entidadId &&
                existingPermisoId === permisoId
              );
            }),
          );

          if (duplicatedPermisos.length > 0) {
            const duplicatedLabels = duplicatedPermisos
              .map((permisoId) => {
                const permisoInfo = permisosRaw.find(
                  (permiso) => permiso.id === permisoId,
                );
                return permisoInfo ? toTitleCase(permisoInfo.nombre) : null;
              })
              .filter((label): label is string => Boolean(label))
              .join(", ");

            toast({
              title: "Permiso ya asignado",
              description:
                duplicatedLabels.length > 0
                  ? `El rol seleccionado ya tiene asignado ${duplicatedLabels} sobre esta entidad.`
                  : "El rol seleccionado ya tiene asignado uno de los permisos elegidos sobre esta entidad.",
              status: "warning",
              duration: 4000,
            });
            return false;
          }

          const basePayload = {
            rol: { id: rolId },
            entidad: { id: entidadId },
          } satisfies Omit<CreatePermisoRolEntidadPayload, "permiso">;

          if (selectedItem) {
            const [firstPermiso, ...extraPermisos] = uniquePermisosIds;

            await updatePermisoMutation.mutateAsync({
              id: selectedItem.id,
              payload: {
                ...basePayload,
                permiso: { id: firstPermiso },
              },
            });

            if (extraPermisos.length > 0) {
              await Promise.all(
                extraPermisos.map((permisoId) =>
                  createPermisoMutation.mutateAsync({
                    ...basePayload,
                    permiso: { id: permisoId },
                  }),
                ),
              );
            }
          } else {
            await Promise.all(
              uniquePermisosIds.map((permisoId) =>
                createPermisoMutation.mutateAsync({
                  ...basePayload,
                  permiso: { id: permisoId },
                }),
              ),
            );
            toast({
              title: "Permiso asignado",
              status: "success",
              duration: 2000,
            });
          }

          await queryClient.invalidateQueries({ queryKey: permisosKeys.all });
          handleClosePermisoModal();
        }}
      />

      <Modal
        isOpen={editarRolModal.isOpen}
        onClose={handleCloseEditarRol}
        closeOnOverlayClick={!updateRolMutation.isPending}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar rol</ModalHeader>
          <ModalCloseButton isDisabled={updateRolMutation.isPending} />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Rol</FormLabel>
                <Select
                  value={selectedRolId}
                  onChange={(event) => {
                    const nextId = Number(event.target.value);
                    setSelectedRolId(nextId);
                    const role = rolesQuery.data?.find(
                      (rol) => rol.id === nextId,
                    );
                    setEditRolNombre(role?.nombre ?? "");
                    setEditRolDescripcion(role?.descripcion ?? "");
                  }}
                >
                  {(rolesQuery.data ?? []).map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {toTitleCase(rol.nombre)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input
                  value={editRolNombre}
                  onChange={(event) => setEditRolNombre(event.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Input
                  value={editRolDescripcion}
                  onChange={(event) =>
                    setEditRolDescripcion(event.target.value)
                  }
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleCloseEditarRol}
              isDisabled={updateRolMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                if (!selectedRolId) {
                  toast({
                    title: "Selecciona un rol",
                    status: "warning",
                    duration: 3000,
                  });
                  return;
                }
                try {
                  await updateRolMutation.mutateAsync({
                    id: selectedRolId,
                    nombre: editRolNombre,
                    descripcion: editRolDescripcion,
                  });
                  handleCloseEditarRol();
                } catch (err) {
                  console.error("Error actualizando rol", err);
                }
              }}
              isLoading={updateRolMutation.isPending}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={confirmDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          confirmDialog.onClose();
          setConfirmData(null);
        }}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="semibold">
            Confirmar cambio de estado
          </AlertDialogHeader>

          <AlertDialogBody>
            {confirmData
              ? `¿Seguro deseas ${confirmData.nextState ? "habilitar" : "inhabilitar"} la asignación del rol ${getNameFromEntity(confirmData.item.rol as any)}?`
              : "Confirma la acción solicitada."}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              variant="ghost"
              onClick={() => {
                confirmDialog.onClose();
                setConfirmData(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="brand"
              ml={3}
              onClick={async () => {
                if (!confirmData) return;
                await toggleEstadoMutation.mutateAsync({
                  id: confirmData.item.id,
                  nextState: confirmData.nextState,
                });
                confirmDialog.onClose();
                setConfirmData(null);
              }}
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
};

export default PermisosList;
