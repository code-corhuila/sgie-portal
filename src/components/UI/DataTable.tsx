import React, { memo } from 'react';
import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner,
  Alert, AlertIcon, Box, Button, HStack, useBreakpointValue, Text,
} from '@chakra-ui/react';

export interface Column<T> {
  key: keyof T | string; // 🔥 Más flexible
  label: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean; // 🔥 Ocultar columnas en móvil
}

// Helper function para convertir key a string de manera segura
const getColumnKey = <T,>(key: keyof T | string): string => {
  return typeof key === 'string' ? key : String(key);
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string; // 🔥 Mensaje personalizado
}

// 🔥 MEJORA: Memoizar el componente
export const DataTable = memo(<T extends Record<string, any>>({
  columns,
  data,
  loading,
  error,
  onEdit,
  onDelete,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" thickness="4px" color="blue.500" />
        <Text mt={4}>Cargando...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  // 🔥 MEJORA: Manejo de datos vacíos
  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.500">{emptyMessage}</Text>
      </Box>
    );
  }

  // Vista móvil
  if (isMobile) {
    return (
      <Box>
        {data.map(item => (
          <Box 
            key={keyExtractor(item)} 
            p={4} 
            mb={3} 
            borderWidth={1} 
            borderRadius="lg"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map(col => {
                // 🔥 No mostrar columna de acciones en cards
                if (col.key === 'actions') return null;
                
                return (
                  <Box key={`${keyExtractor(item)}-${getColumnKey(col.key)}`} mb={2}>
                    <strong>{col.label}:</strong>{' '}
                    {col.render 
                      ? col.render(item) 
                      : String(item[col.key as keyof T] ?? '')}
                  </Box>
                );
              })}
            
            {(onEdit || onDelete) && (
              <HStack mt={3} spacing={2}>
                {onEdit && (
                  <Button size="sm" colorScheme="blue" onClick={() => onEdit(item)}>
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" colorScheme="red" onClick={() => onDelete(item)}>
                    Eliminar
                  </Button>
                )}
              </HStack>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  // Vista desktop
  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            {columns.map((col, index) => (
              <Th key={`header-${getColumnKey(col.key)}-${index}`}>{col.label}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map(item => (
            <Tr key={keyExtractor(item)} _hover={{ bg: 'gray.50' }}>
              {columns.map((col, index) => (
                <Td key={`${keyExtractor(item)}-${getColumnKey(col.key)}-${index}`}>
                  {col.render 
                    ? col.render(item) 
                    : String(item[col.key as keyof T] ?? '')}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}) as <T extends Record<string, any>>(props: DataTableProps<T>) => JSX.Element;

// 🔥 Nombre para debugging
(DataTable as React.MemoExoticComponent<typeof DataTable>).displayName = 'DataTable';