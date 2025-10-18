import React, { memo } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Alert,
  AlertIcon,
  Box,
  HStack,
  useBreakpointValue,
  Text,
  Stack,
  Skeleton,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { FiEdit2, FiEye, FiXCircle } from "react-icons/fi";

export interface Column<T> {
  key: keyof T | string; // 🔥 Más flexible
  label: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean; // 🔥 Ocultar columnas en móvil
}

// Helper function para convertir key a string de manera segura
const getColumnKey = <T,>(key: keyof T | string): string => {
  return typeof key === "string" ? key : String(key);
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string; // 🔥 Mensaje personalizado
}

// 🔥 MEJORA: Memoizar el componente
export const DataTable = memo(
  <T extends Record<string, any>>({
    columns,
    data,
    loading,
    error,
    onEdit,
    onDelete,
    onView,
    keyExtractor,
    emptyMessage = "No hay datos disponibles",
  }: DataTableProps<T>) => {
    const isMobile = useBreakpointValue({ base: true, lg: false });

    if (loading) {
      return (
        <Stack spacing={4}>
          <Skeleton height="48px" borderRadius="xl" />
          <Skeleton height="240px" borderRadius="xl" />
        </Stack>
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
        <Box
          textAlign="center"
          py={12}
          borderWidth={1}
          borderStyle="dashed"
          borderRadius="2xl"
          borderColor="neutral.200"
          bg="white"
        >
          <Text fontSize="md" color="neutral.500">
            {emptyMessage}
          </Text>
        </Box>
      );
    }

    // Vista móvil
    if (isMobile) {
      return (
        <Stack spacing={4}>
          {data.map((item, itemIndex) => {
            const baseKey = keyExtractor(item);
            const safeKey = `${String(baseKey)}-${itemIndex}`;

            return (
              <Box
                key={safeKey}
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="neutral.100"
                bg="white"
                boxShadow="sm"
                transition="all 0.2s ease"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
              >
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((col) => {
                    const columnKey = `${safeKey}-${getColumnKey(col.key)}`;
                    if (col.key === "actions") return null;

                    return (
                      <Stack key={columnKey} spacing={0} mb={3}>
                        <Text
                          fontSize="xs"
                          textTransform="uppercase"
                          color="neutral.500"
                          fontWeight="semibold"
                        >
                          {col.label}
                        </Text>
                        <Text fontSize="sm" color="neutral.800">
                          {col.render
                            ? col.render(item)
                            : String(item[col.key as keyof T] ?? "")}
                        </Text>
                      </Stack>
                    );
                  })}

                {(onEdit || onDelete || onView) && (
                  <HStack mt={1} spacing={2}>
                    {onView && (
                      <Tooltip label="Ver detalle">
                        <IconButton
                          aria-label="Ver detalle"
                          icon={<FiEye />}
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(item)}
                        />
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip label="Cambiar estado">
                        <IconButton
                          aria-label="Cambiar estado"
                          icon={<FiXCircle />}
                          variant="ghost"
                          colorScheme="red"
                          size="sm"
                          onClick={() => onDelete(item)}
                        />
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip label="Editar">
                        <IconButton
                          aria-label="Editar"
                          icon={<FiEdit2 />}
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                        />
                      </Tooltip>
                    )}
                  </HStack>
                )}
              </Box>
            );
          })}
        </Stack>
      );
    }

    // Vista desktop
    return (
      <TableContainer
        borderRadius="2xl"
        bg="white"
        boxShadow="md"
        borderWidth="1px"
        borderColor="neutral.100"
        overflowX="auto"
        overflowY="auto"
        maxH="60vh"
        w="full"
      >
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} zIndex={1} bg="white" boxShadow="sm">
            <Tr>
              {columns.map((col, index) => (
                <Th
                  key={`header-${getColumnKey(col.key)}-${index}`}
                  px={4}
                  py={3}
                >
                  {col.label}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, itemIndex) => {
              const baseKey = keyExtractor(item);
              const safeKey = `${String(baseKey)}-${itemIndex}`;
              return (
                <Tr
                  key={safeKey}
                  _odd={{ bg: "neutral.50" }}
                  _hover={{ bg: "brand.50" }}
                  transition="background-color 0.2s ease-in-out"
                >
                  {columns.map((col, index) => (
                    <Td
                      key={`${safeKey}-${getColumnKey(col.key)}-${index}`}
                      px={3}
                      py={2}
                    >
                      {col.render
                        ? col.render(item)
                        : String(item[col.key as keyof T] ?? "")}
                    </Td>
                  ))}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    );
  },
) as <T extends Record<string, any>>(props: DataTableProps<T>) => JSX.Element;

// 🔥 Nombre para debugging
(DataTable as React.MemoExoticComponent<typeof DataTable>).displayName =
  "DataTable";
