import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Select,
  Spacer,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import GenericModal, { type FieldOption, type Field } from '../../../components/UI/GenericModal';
import { usePermisoRolEntidad, type PermisoRolEntidad as HookPermisoRolEntidad } from '../hooks/usePermisoRolEntidad';
import { apiCall, type ApiResponse } from '../../../api/base';
import { DataTable, type Column } from '../../../components/UI/DataTable';
import {
  FiEdit2,
  FiPlusCircle,
  FiRefreshCw,
  FiToggleLeft,
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from 'react-icons/fi';

/** Tipos simples */
interface Rol { id: number; nombre: string; }
interface Permiso { id: number; nombre: string; }
interface Entidad { id: number; nombre: string; }

/** Puede venir como string (nombre) o como objeto { id, nombre } */
type MaybeEntity = Rol | Permiso | Entidad | string | undefined;

/** LocalItem adapta el tipo que recibes para permitir ambas formas */
type LocalItem = Omit<HookPermisoRolEntidad, 'rol' | 'permiso' | 'entidad'> & {
  rol?: MaybeEntity;
  permiso?: MaybeEntity;
  entidad?: MaybeEntity;
};

const ENTITY_LABELS: Record<string, string> = {
  usuario: 'Usuarios',
  rol: 'Roles',
  permiso: 'Permisos',
  equipo: 'Equipos',
  instalacion: 'Instalaciones',
  campus: 'Campus',
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatEntityLabel = (raw?: string) => {
  if (!raw) return '—';
  const normalized = raw.toLowerCase();
  return ENTITY_LABELS[normalized] ?? toTitleCase(raw.replace(/_/g, ' '));
};

const PermisosList: React.FC = () => {
  const toast = useToast();
  const { data, loading, error, fetchAll, cambiarEstado } = usePermisoRolEntidad();

  const rolModal = useDisclosure();
  const permisoModal = useDisclosure();
  const confirmDialog = useDisclosure();
  const { onOpen: openConfirm } = confirmDialog;
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const [selectedItem, setSelectedItem] = useState<LocalItem | null>(null);
  const [confirmData, setConfirmData] = useState<{ item: LocalItem; nextState: boolean } | null>(null);
  const [rolFilter, setRolFilter] = useState<string>("Todos");
  const [estadoFilter, setEstadoFilter] = useState<string>("Todos");
  const [entidadFilter, setEntidadFilter] = useState<string>("Todas");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // mantenemos options como value = nombre (para no romper la UI existente)
  const [rolList, setRolList] = useState<FieldOption[]>([]);
  const [permisoList, setPermisoList] = useState<FieldOption[]>([]);
  const [entidadList, setEntidadList] = useState<FieldOption[]>([]);

  // listas "raw" para mapear nombre -> id al guardar
  const [rolesRaw, setRolesRaw] = useState<Rol[]>([]);
  const [permisosRaw, setPermisosRaw] = useState<Permiso[]>([]);
  const [entidadesRaw, setEntidadesRaw] = useState<Entidad[]>([]);

  // Helper: si value es número/objeto/ string nos devuelve el id (o null)
  const getIdFromValue = (value: any, rawList: { id: number; nombre: string }[]): number | null => {
    if (value == null) return null;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const maybeNum = Number(value);
      if (!Number.isNaN(maybeNum)) return maybeNum;
      const found = rawList.find(x => x.nombre === value);
      return found ? found.id : null;
    }
    if (typeof value === 'object') {
      if ('id' in value && (typeof value.id === 'number' || typeof value.id === 'string')) {
        const n = Number((value as any).id);
        return Number.isNaN(n) ? null : n;
      }
      if ('nombre' in value && typeof (value as any).nombre === 'string') {
        const found = rawList.find(x => x.nombre === (value as any).nombre);
        return found ? found.id : null;
      }
    }
    return null;
  };

  // Helper: obtener nombre desde MaybeEntity
const getNameFromEntity = (e?: MaybeEntity): string | undefined => {
  if (e == null) return undefined;
  if (typeof e === 'string') return e;
  if (typeof e === 'object' && 'nombre' in e) return (e as any).nombre;
  return undefined;
};


  // Carga opciones (value = nombre, label = nombre) y guardamos raw arrays
  const fetchOptions = useCallback(async () => {
    try {
      const [rolesRes, permisosRes, entidadesRes] = await Promise.all([
        apiCall<ApiResponse<Rol[]> | Rol[]>('/rol'),
        apiCall<ApiResponse<Permiso[]> | Permiso[]>('/permiso'),
        apiCall<ApiResponse<Entidad[]> | Entidad[]>('/entidad'),
      ]);

      const resolve = <T,>(res: ApiResponse<T[]> | T[] | undefined): T[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        return [];
      };

      const rolesData = resolve<Rol>(rolesRes);
      const permisosData = resolve<Permiso>(permisosRes);
      const entidadesData = resolve<Entidad>(entidadesRes);

      setRolesRaw(rolesData);
      setPermisosRaw(permisosData);
      setEntidadesRaw(entidadesData);

      setRolList(rolesData.map(r => ({ value: r.nombre, label: toTitleCase(r.nombre) })));
      setPermisoList(permisosData.map(p => ({ value: p.nombre, label: toTitleCase(p.nombre) })));
      setEntidadList(entidadesData.map(e => ({ value: e.nombre, label: formatEntityLabel(e.nombre) })));
    } catch (err) {
      console.error('Error fetching options', err);
      toast({ title: 'Error cargando opciones', status: 'error', duration: 3000 });
    }
  }, [toast]);

  useEffect(() => { void fetchOptions(); }, [fetchOptions]);

  const rolOptionsFiltered = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => getNameFromEntity(item.rol as MaybeEntity) ?? "")
            .filter((rol) => rol && rol.trim() !== "")
        )
      ),
    [data]
  );

  const entidadOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => getNameFromEntity(item.entidad as MaybeEntity) ?? "")
            .filter((ent) => ent && ent.trim() !== "")
        )
      ).map((entidad) => ({ value: entidad, label: formatEntityLabel(entidad) })),
    [data]
  );

  const totalElements = useMemo(() => data.length, [data]);

  const filteredData = useMemo(() => {
    let result = data;

    if (rolFilter !== "Todos") {
      result = result.filter(
        (item) => (getNameFromEntity(item.rol as MaybeEntity) ?? item.rol) === rolFilter
      );
    }

    if (estadoFilter === "Activos") {
      result = result.filter((item) => item.estado);
    } else if (estadoFilter === "Inactivos") {
      result = result.filter((item) => !item.estado);
    }

    if (entidadFilter !== "Todas") {
      result = result.filter(
        (item) => (getNameFromEntity(item.entidad as MaybeEntity) ?? item.entidad) === entidadFilter
      );
    }

    return result;
  }, [data, estadoFilter, entidadFilter, rolFilter]);

  const totalFiltered = filteredData.length;
  const totalPages = totalFiltered === 0 ? 1 : Math.ceil(totalFiltered / size);

  useEffect(() => {
    setPage(0);
  }, [rolFilter, estadoFilter, entidadFilter, size, data.length]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    if (totalFiltered === 0) return [];
    const start = page * size;
    return filteredData.slice(start, start + size);
  }, [filteredData, page, size, totalFiltered]);

  // Columnas para la tabla
  const columns: Column<HookPermisoRolEntidad>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    {
      key: 'rol',
      label: 'Rol',
      render: item => (
        <Badge variant="info" borderRadius="full">
          {(() => {
            const name = getNameFromEntity((item as any).rol);
            return name ? toTitleCase(name) : '—';
          })()}
        </Badge>
      )
    },
    {
      key: 'permiso',
      label: 'Permiso',
      render: item => (
        <Badge variant="neutral" borderRadius="full">
          {(() => {
            const name = getNameFromEntity((item as any).permiso);
            return name ? toTitleCase(name) : '—';
          })()}
        </Badge>
      )
    },
    {
      key: 'entidad',
      label: 'Entidad',
      render: item => (
        <Badge variant="neutral" borderRadius="full">
          {formatEntityLabel(getNameFromEntity((item as any).entidad))}
        </Badge>
      )
    },
    {
      key: 'nombreCompleto',
      label: 'Nombre Completo',
      render: item => `${(item as any).nombres ?? ''} ${(item as any).apellidos ?? ''}`.trim(),
      hideOnMobile: true
    },
    {
      key: 'estado',
      label: 'Estado',
      render: item => (
        <Badge variant={(item as any).estado ? 'success' : 'neutral'}>
          {(item as any).estado ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: item => (
        <HStack spacing={2}>
          <Tooltip label={(item as any).estado ? 'Inhabilitar asignación' : 'Habilitar asignación'}>
            <IconButton
              aria-label="Cambiar estado"
              size="sm"
              variant="ghost"
              colorScheme={(item as any).estado ? 'red' : 'green'}
              icon={<FiToggleLeft />}
              onClick={() => {
                setConfirmData({ item: item as LocalItem, nextState: !(item as any).estado });
                openConfirm();
              }}
            />
          </Tooltip>
          <Tooltip label="Actualizar permiso">
            <IconButton
              aria-label="Actualizar permiso"
              size="sm"
              variant="ghost"
              icon={<FiEdit2 />}
            onClick={() => {
              // asignamos item (tipado flexible) y abrimos modal
              setSelectedItem(item as LocalItem);
              permisoModal.onOpen();
            }}
            />
          </Tooltip>
        </HStack>
      )
    }
  ], [permisoModal, openConfirm]);

  // Campos del modal — dejamos options value=nombre para no cambiar la UX
  const permisoFields: Field<any>[] = useMemo(() => [
    { name: 'rol', label: 'Rol', type: 'select', options: rolList, value: getNameFromEntity(selectedItem?.rol), required: true },
    {
      name: 'permiso',
      label: 'Permisos',
      type: 'multiselect',
      options: permisoList,
      value: selectedItem ? [getNameFromEntity(selectedItem.permiso)].filter(Boolean) : [],
      required: true,
      placeholder: 'Selecciona uno o varios permisos',
    },
    { name: 'entidad', label: 'Entidad', type: 'select', options: entidadList, value: getNameFromEntity(selectedItem?.entidad), required: true },
  ], [entidadList, permisoList, rolList, selectedItem]);

  const handlePermisoClose = useCallback(() => {
    permisoModal.onClose();
    setSelectedItem(null);
  }, [permisoModal]);

  // Guardar (transforma nombre -> id usando las raw lists)
  const handleSavePermiso = async (values: Record<string, any>) => {
    try {
      const rolId = getIdFromValue(values.rol, rolesRaw);
      const entidadId = getIdFromValue(values.entidad, entidadesRaw);
      const permisosSeleccionados = Array.isArray(values.permiso)
        ? values.permiso
        : values.permiso != null && values.permiso !== ''
          ? [values.permiso]
          : [];

      if (!rolId || !entidadId || permisosSeleccionados.length === 0) {
        throw new Error('Rol, Permisos y Entidad deben estar seleccionados correctamente');
      }

      const permisosIds = permisosSeleccionados
        .map((permiso) => getIdFromValue(permiso, permisosRaw))
        .filter((id): id is number => typeof id === 'number');

      if (permisosIds.length === 0) {
        throw new Error('Debes seleccionar al menos un permiso válido');
      }

      const basePayload = {
        rol: { id: rolId },
        entidad: { id: entidadId },
      };

      if (selectedItem) {
        const [firstPermiso, ...extraPermisos] = permisosIds;

        await apiCall(`/permiso-rol-entidad/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...basePayload,
            permiso: { id: firstPermiso },
          }),
        });

        for (const permisoId of extraPermisos) {
          await apiCall('/permiso-rol-entidad', {
            method: 'POST',
            body: JSON.stringify({
              ...basePayload,
              permiso: { id: permisoId },
            }),
          });
        }
      } else {
        for (const permisoId of permisosIds) {
          await apiCall('/permiso-rol-entidad', {
            method: 'POST',
            body: JSON.stringify({
              ...basePayload,
              permiso: { id: permisoId },
            }),
          });
        }
      }

      await fetchAll();
      handlePermisoClose();
      toast({ title: 'Guardado correctamente', status: 'success', duration: 2000 });
    } catch (err: any) {
      console.error('Error guardando permiso-rol-entidad:', err);
      toast({ title: 'Error', description: err?.message ?? 'Error al guardar', status: 'error', duration: 4000 });
      throw err;
    }
  };

  const goto = useCallback((target: number) => {
    if (totalFiltered === 0) {
      setPage(0);
      return;
    }
    const next = Math.min(Math.max(target, 0), totalPages - 1);
    setPage(next);
  }, [totalFiltered, totalPages]);

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
            onClick={() => fetchAll()}
            isLoading={loading}
          >
            Actualizar
          </Button>
          <Button leftIcon={<Icon as={FiPlusCircle} />} onClick={rolModal.onOpen}>
            Crear rol
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

      <Text fontSize="sm" color="gray.600" mb={3}>
        Registros totales: {totalElements}
      </Text>

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
              value={rolFilter}
              onChange={(e) => setRolFilter(e.target.value)}
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
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
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
            <Select value={entidadFilter} onChange={(e) => setEntidadFilter(e.target.value)}>
              <option value="Todas">Todas</option>
              {entidadOptions.map((ent) => (
                <option key={ent.value} value={ent.value}>
                  {ent.label}
                </option>
              ))}
            </Select>
          </Stack>
        </Flex>

        <Badge variant="neutral" w="fit-content">
          Mostrando {paginatedData.length} de {totalFiltered} coincidencias — Total: {totalElements}
        </Badge>
      </Stack>

      <DataTable<HookPermisoRolEntidad>
        data={paginatedData}
        columns={columns}
        loading={loading}
        error={error}
        keyExtractor={(item) => item.unique}
        emptyMessage="No hay permisos asignados"
      />

      <Flex
        mt={4}
        align="center"
        justify="space-between"
        gap={4}
        display={totalFiltered === 0 ? 'none' : 'flex'}
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
              const s = Number(e.target.value);
              setSize(s);
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
            {totalFiltered === 0
              ? '0–0'
              : `${page * size + 1}–${Math.min((page + 1) * size, totalFiltered)}`} de {totalFiltered}
          </Text>

          <IconButton
            aria-label="Primera página"
            size="sm"
            variant="ghost"
            onClick={() => goto(0)}
            isDisabled={page === 0 || loading || totalFiltered === 0}
            icon={<FiChevronsLeft />}
          />
          <IconButton
            aria-label="Anterior"
            size="sm"
            variant="ghost"
            onClick={() => goto(page - 1)}
            isDisabled={page === 0 || loading || totalFiltered === 0}
            icon={<FiChevronLeft />}
          />
          <Button size="sm" variant="outline" isDisabled>
            {totalFiltered === 0 ? 0 : page + 1} / {totalFiltered === 0 ? 0 : totalPages}
          </Button>
          <IconButton
            aria-label="Siguiente"
            size="sm"
            variant="ghost"
            onClick={() => goto(page + 1)}
            isDisabled={page >= totalPages - 1 || loading || totalFiltered === 0}
            icon={<FiChevronRight />}
          />
          <IconButton
            aria-label="Última página"
            size="sm"
            variant="ghost"
            onClick={() => goto(totalPages - 1)}
            isDisabled={page >= totalPages - 1 || loading || totalFiltered === 0}
            icon={<FiChevronsRight />}
          />
        </HStack>
      </Flex>

      {/* Modal Crear Rol */}
      <GenericModal
        isOpen={rolModal.isOpen}
        onClose={rolModal.onClose}
        title="Crear Rol"
        fields={[
          { name: 'nombre', label: 'Nombre', type: 'text', required: true },
          { name: 'descripcion', label: 'Descripción', type: 'text' },
        ]}
        onSave={async (values) => {
          await apiCall('/rol', { method: 'POST', body: JSON.stringify(values) });
          await Promise.all([fetchAll(), fetchOptions()]);
        }}
      />

      {/* Modal Asignar / Actualizar Permiso */}
      <GenericModal
        key={selectedItem?.id ?? 'new'}
        isOpen={permisoModal.isOpen}
        onClose={handlePermisoClose}
        title={selectedItem ? 'Actualizar Permiso a Rol' : 'Asignar Permiso a Rol'}
        fields={permisoFields}
        initialValues={selectedItem ? {
          rol: getNameFromEntity(selectedItem.rol),
          permiso: [getNameFromEntity(selectedItem.permiso)].filter(Boolean),
          entidad: getNameFromEntity(selectedItem.entidad),
        } : undefined}
        onSave={handleSavePermiso}
      />

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
              ? `¿Seguro deseas ${confirmData.nextState ? "habilitar" : "inhabilitar"} la asignación del rol ${getNameFromEntity(confirmData.item.rol)}?`
              : "Confirma la acción solicitada."}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} variant="ghost" onClick={() => {
              confirmDialog.onClose();
              setConfirmData(null);
            }}>
              Cancelar
            </Button>
            <Button
              colorScheme="brand"
              ml={3}
              onClick={async () => {
                if (!confirmData) return;
                await cambiarEstado(confirmData.item.id);
                await fetchAll();
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
