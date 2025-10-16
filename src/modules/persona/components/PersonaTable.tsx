import { Badge, HStack, IconButton, Tooltip } from '@chakra-ui/react';
import { FiEdit2, FiLock, FiToggleLeft } from 'react-icons/fi';
import { DataTable, type Column } from '../../../components/UI/DataTable';
import type { Persona } from '../types';

interface PersonaTableProps {
  data: Persona[];
  isLoading: boolean;
  error?: string | null;
  onToggleEstado: (persona: Persona) => void;
  onEditPersona: (persona: Persona) => void;
  onEditUsuario: (persona: Persona) => void;
}

const columns: Column<Persona>[] = [
  { key: 'idPersona', label: 'ID' },
  { key: 'nombres', label: 'Nombres' },
  { key: 'apellidos', label: 'Apellidos' },
  { key: 'tipoDocumento', label: 'Tipo Doc' },
  { key: 'numeroIdentificacion', label: 'Documento' },
  {
    key: 'email',
    label: 'Correo',
    render: (persona) => persona.email ?? '—',
  },
  {
    key: 'rol',
    label: 'Rol',
    render: (persona) => (
      <Badge variant="info" borderRadius="full">
        {typeof persona.rol === 'string' ? persona.rol : persona.rol?.nombre ?? '—'}
      </Badge>
    ),
  },
  {
    key: 'estado',
    label: 'Estado',
    render: (persona) => (
      <Badge variant={persona.estado ? 'success' : 'neutral'}>
        {persona.estado ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

export function PersonaTable({
  data,
  isLoading,
  error,
  onToggleEstado,
  onEditPersona,
  onEditUsuario,
}: PersonaTableProps) {
  return (
    <DataTable
      columns={[
        ...columns,
        {
          key: 'actions',
          label: 'Acciones',
          render: (persona) => (
            <HStack spacing={2}>
              <Tooltip label={persona.estado ? 'Inhabilitar Usuario' : 'Habilitar Usuario'}>
                <IconButton
                  aria-label={`${persona.estado ? 'Inhabilitar' : 'Habilitar'} usuario ${persona.nombres}`}
                  aria-pressed={persona.estado}
                  size="sm"
                  variant="ghost"
                  colorScheme={persona.estado ? 'red' : 'green'}
                  icon={<FiToggleLeft />}
                  onClick={() => onToggleEstado(persona)}
                />
              </Tooltip>
              <Tooltip label="Editar persona">
                <IconButton
                  aria-label={`Editar persona ${persona.nombres}`}
                  size="sm"
                  variant="ghost"
                  icon={<FiEdit2 />}
                  onClick={() => onEditPersona(persona)}
                />
              </Tooltip>
              {persona.idUsuario && (
                <Tooltip label="Editar usuario">
                  <IconButton
                    aria-label={`Editar usuario de ${persona.nombres}`}
                    size="sm"
                    variant="ghost"
                    icon={<FiLock />}
                    onClick={() => onEditUsuario(persona)}
                  />
                </Tooltip>
              )}
            </HStack>
          ),
        },
      ]}
      data={data}
      loading={isLoading}
      error={error}
      keyExtractor={(persona) => persona.idPersona}
      emptyMessage="No hay personas registradas"
    />
  );
}
