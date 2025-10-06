import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Button, HStack, Heading, useDisclosure, useToast } from '@chakra-ui/react';
import GenericModal, { type FieldOption, type Field } from '../../../components/UI/GenericModal';
import { usePermisoRolEntidad, type PermisoRolEntidad as HookPermisoRolEntidad } from '../hooks/usePermisoRolEntidad';
import { apiCall, type ApiResponse } from '../../../api/base';
import { DataTable, type Column } from '../../../components/UI/DataTable';

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

const PermisosList: React.FC = () => {
  const toast = useToast();
  const { data, loading, error, fetchAll, cambiarEstado } = usePermisoRolEntidad();

  const rolModal = useDisclosure();
  const permisoModal = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<LocalItem | null>(null);

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
        apiCall<ApiResponse<Rol[]>>('/rol'),
        apiCall<ApiResponse<Permiso[]>>('/permiso'),
        apiCall<ApiResponse<Entidad[]>>('/entidad'),
      ]);

      setRolesRaw(rolesRes.data);
      setPermisosRaw(permisosRes.data);
      setEntidadesRaw(entidadesRes.data);

      setRolList(rolesRes.data.map(r => ({ value: r.nombre, label: r.nombre })));
      setPermisoList(permisosRes.data.map(p => ({ value: p.nombre, label: p.nombre })));
      setEntidadList(entidadesRes.data.map(e => ({ value: e.nombre, label: e.nombre })));
    } catch (err) {
      console.error('Error fetching options', err);
      toast({ title: 'Error cargando opciones', status: 'error', duration: 3000 });
    }
  }, [toast]);

  useEffect(() => { void fetchOptions(); }, [fetchOptions]);

  // Columnas para la tabla
  const columns: Column<HookPermisoRolEntidad>[] = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'rol', label: 'Rol', render: item => getNameFromEntity((item as any).rol) ?? '—' },
    { key: 'permiso', label: 'Permiso', render: item => getNameFromEntity((item as any).permiso) ?? '—' },
    { key: 'entidad', label: 'Entidad', render: item => getNameFromEntity((item as any).entidad) ?? '—' },
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
        <Box
          as="span"
          px={2}
          py={1}
          borderRadius="md"
          bg={(item as any).estado ? 'green.100' : 'red.100'}
          color={(item as any).estado ? 'green.800' : 'red.800'}
          fontSize="sm"
          fontWeight="medium"
        >
          {(item as any).estado ? 'Activo' : 'Inactivo'}
        </Box>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: item => (
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme={(item as any).estado ? 'red' : 'green'}
            variant="outline"
            onClick={() => cambiarEstado((item as any).id)}
          >
            {(item as any).estado ? 'Inhabilitar' : 'Habilitar'}
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => {
              // asignamos item (tipado flexible) y abrimos modal
              setSelectedItem(item as LocalItem);
              permisoModal.onOpen();
            }}
          >
            Actualizar
          </Button>
        </HStack>
      )
    }
  ], [cambiarEstado, permisoModal]);

  // Campos del modal — dejamos options value=nombre para no cambiar la UX
  const permisoFields: Field<any>[] = useMemo(() => [
    { name: 'rol', label: 'Rol', type: 'select', options: rolList, value: getNameFromEntity(selectedItem?.rol), required: true },
    { name: 'permiso', label: 'Permiso', type: 'select', options: permisoList, value: getNameFromEntity(selectedItem?.permiso), required: true },
    { name: 'entidad', label: 'Entidad', type: 'select', options: entidadList, value: getNameFromEntity(selectedItem?.entidad), required: true },
  ], [rolList, permisoList, entidadList, selectedItem]);

  const handlePermisoClose = useCallback(() => {
    permisoModal.onClose();
    setSelectedItem(null);
  }, [permisoModal]);

  // Guardar (transforma nombre -> id usando las raw lists)
  const handleSavePermiso = async (values: Record<string, any>) => {
    try {
      const rolId = getIdFromValue(values.rol, rolesRaw);
      const permisoId = getIdFromValue(values.permiso, permisosRaw);
      const entidadId = getIdFromValue(values.entidad, entidadesRaw);

      if (!rolId || !permisoId || !entidadId) {
        throw new Error('Rol, Permiso y Entidad deben estar seleccionados correctamente');
      }

      const payload = {
        rol: { id: rolId },
        permiso: { id: permisoId },
        entidad: { id: entidadId },
      };

      if (selectedItem) {
        await apiCall(`/permiso-rol-entidad/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiCall('/permiso-rol-entidad', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
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

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>Gestión de Permisos</Heading>

      <HStack mb={4} spacing={3} flexWrap="wrap">
        <Button colorScheme="blue" onClick={rolModal.onOpen}>Crear Rol</Button>
        <Button colorScheme="green" onClick={() => { setSelectedItem(null); permisoModal.onOpen(); }}>Asignar Permiso a Rol</Button>
        <Button variant="outline" onClick={fetchAll} isLoading={loading}>Actualizar</Button>
      </HStack>

      <DataTable<HookPermisoRolEntidad>
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        keyExtractor={item => item.unique} 
        emptyMessage="No hay permisos asignados"
      />

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
        // initialValues usa el NOMBRE (como antes), para que el select muestre la opción actual
        initialValues={selectedItem ? {
          rol: getNameFromEntity(selectedItem.rol),
          permiso: getNameFromEntity(selectedItem.permiso),
          entidad: getNameFromEntity(selectedItem.entidad),
        } : undefined}
        onSave={handleSavePermiso}
      />
    </Box>
  );
};

export default PermisosList;