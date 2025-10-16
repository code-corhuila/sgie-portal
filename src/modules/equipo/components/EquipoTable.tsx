import { Badge, HStack, IconButton, Tooltip } from '@chakra-ui/react';
import { FiCpu, FiToggleLeft } from 'react-icons/fi';
import { DataTable, type Column } from '../../../components/UI/DataTable';
import type { EquipoSummary } from '../types';

interface EquipoTableProps {
  data: EquipoSummary[];
  isLoading: boolean;
  error?: string | null;
  onToggleEstado: (equipo: EquipoSummary) => void;
  onEdit: (equipo: EquipoSummary) => void;
}

const columns: Column<EquipoSummary>[] = [
  { key: 'codigoEquipo', label: 'Código' },
  { key: 'nombreEquipo', label: 'Tipo de Equipo' },
  {
    key: 'nombreInstalacion',
    label: 'Instalación',
    render: (item) => (
      <Badge variant="info" borderRadius="full">
        {item.nombreInstalacion}
      </Badge>
    ),
  },
  {
    key: 'nombreCampus',
    label: 'Campus',
    render: (item) => (
      <Badge variant="neutral" borderRadius="full">
        {item.nombreCampus}
      </Badge>
    ),
  },
  {
    key: 'nombreCategoriaEquipo',
    label: 'Categoría',
    render: (item) => (
      <Badge variant="neutral" borderRadius="full">
        {item.nombreCategoriaEquipo ?? '—'}
      </Badge>
    ),
  },
  {
    key: 'estadoEquipo',
    label: 'Estado',
    render: (item) => (
      <Badge variant={item.estadoEquipo ? 'success' : 'neutral'}>
        {item.estadoEquipo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

export function EquipoTable({ data, isLoading, error, onToggleEstado, onEdit }: EquipoTableProps) {
  return (
    <DataTable
      columns={[
        ...columns,
        {
          key: 'actions',
          label: 'Acciones',
          render: (item) => (
            <HStack spacing={2}>
              <Tooltip label={item.estadoEquipo ? 'Inhabilitar equipo' : 'Habilitar equipo'}>
                <IconButton
                  aria-label={`${item.estadoEquipo ? 'Inhabilitar' : 'Habilitar'} equipo ${item.codigoEquipo}`}
                  aria-pressed={item.estadoEquipo}
                  size="sm"
                  variant="ghost"
                  colorScheme={item.estadoEquipo ? 'red' : 'green'}
                  icon={<FiToggleLeft />}
                  onClick={() => onToggleEstado(item)}
                />
              </Tooltip>
              <Tooltip label="Editar equipo">
                <IconButton
                  aria-label={`Editar equipo ${item.codigoEquipo}`}
                  size="sm"
                  variant="ghost"
                  icon={<FiCpu />}
                  onClick={() => onEdit(item)}
                />
              </Tooltip>
            </HStack>
          ),
        },
      ]}
      data={data}
      loading={isLoading}
      error={error}
      keyExtractor={(item) => item.idEquipo}
      emptyMessage="No hay equipos registrados"
    />
  );
}
