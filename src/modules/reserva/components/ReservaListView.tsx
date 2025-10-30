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
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal from "../../../components/UI/GenericModal";
import GenericMultiStepModal from "../../../components/UI/GenericMultiStepModal";
import type { Field } from "../../../components/UI/GenericModal";
import type { ReservaGeneral } from "../types";

interface HeaderProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onRefresh: () => void;
  onCreate: () => void;
  isLoading: boolean;
  summary: { visible: number; total: number };
}

interface TableProps {
  columns: Column<ReservaGeneral>[];
  data: ReservaGeneral[];
  loading: boolean;
  error: string | null;
}

interface PaginationProps {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  isLoading: boolean;
}

interface MultiStepConfig {
  isOpen: boolean;
  onClose: () => void;
  modalTitle: string;
  saveButtonText?: string;
  cancelButtonText?: string;
  steps: Parameters<typeof GenericMultiStepModal>[0]["steps"];
  onStepValuesChange?: Parameters<typeof GenericMultiStepModal>[0]["onStepValuesChange"];
  renderStepHeader?: Parameters<typeof GenericMultiStepModal>[0]["renderStepHeader"];
  renderStepFooter?: Parameters<typeof GenericMultiStepModal>[0]["renderStepFooter"];
  renderStepSummary?: Parameters<typeof GenericMultiStepModal>[0]["renderStepSummary"];
  onSubmit?: Parameters<typeof GenericMultiStepModal>[0]["onSubmit"];
}

interface GenericModalConfig {
  key?: string | number;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field<Record<string, unknown>>[];
  initialValues?: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void | boolean>;
}

interface ReservaListViewProps {
  header: HeaderProps;
  table: TableProps;
  pagination: PaginationProps;
  createModal: MultiStepConfig;
  editModal: MultiStepConfig;
  closeModal: GenericModalConfig;
}

export const ReservaListView = ({
  header,
  table,
  pagination,
  createModal,
  editModal,
  closeModal,
}: ReservaListViewProps) => {
  const from = pagination.totalItems === 0 ? 0 : pagination.page * pagination.size + 1;
  const to =
    pagination.totalItems === 0
      ? 0
      : Math.min((pagination.page + 1) * pagination.size, pagination.totalItems);

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
            Reservas y mantenimientos
          </Heading>
          <Text fontSize="sm" color="neutral.500">
            Gestiona agendas, evita solapes y mantén el histórico de reservas actualizado.
          </Text>
        </Stack>
        <ButtonGroup size="sm" flexWrap="wrap" gap={2}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={header.onRefresh}
            isLoading={header.isLoading}
          >
            Actualizar
          </Button>
          <Button
            colorScheme="brand"
            leftIcon={<Icon as={FiPlusCircle} />}
            onClick={header.onCreate}
          >
            Nueva reserva
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
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          align={{ base: "stretch", md: "flex-end" }}
        >
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="neutral.400" />
            </InputLeftElement>
            <Input
              placeholder="Filtrar por número de identificación"
              value={header.filterValue}
              onChange={(e) => header.onFilterChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && header.onSearch()}
            />
          </InputGroup>
          <ButtonGroup size="sm">
            <Button
              onClick={header.onSearch}
              isLoading={header.isLoading}
              leftIcon={<Icon as={FiSearch} />}
            >
              Buscar
            </Button>
            <Button variant="ghost" onClick={header.onClear}>
              Limpiar
            </Button>
          </ButtonGroup>
        </Flex>
        <Badge variant="neutral" w="fit-content">
          Mostrando {header.summary.visible} de {header.summary.total}
        </Badge>
      </Stack>

      <DataTable
        columns={table.columns}
        data={table.data}
        loading={table.loading}
        error={table.error}
        keyExtractor={(row) => row.idReserva}
        emptyMessage="No hay reservas"
      />

      {header.summary.total > 0 ? (
        <Flex mt={4} align="center" justify="space-between" gap={4}>
          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.600">
              Filas por página
            </Text>
            <Select
              size="sm"
              w="90px"
              value={pagination.size}
              onChange={(e) => pagination.onSizeChange(Number(e.target.value))}
              isDisabled={pagination.isLoading}
            >
              {[10, 20, 50, 100].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </HStack>

          <Spacer />

          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.600">
              {from}–{to} de {pagination.totalItems}
            </Text>
            <IconButton
              aria-label="Primera página"
              size="sm"
              variant="ghost"
              onClick={() => pagination.onPageChange(0)}
              isDisabled={pagination.page === 0 || pagination.isLoading}
              icon={<FiChevronsLeft />}
            />
            <IconButton
              aria-label="Anterior"
              size="sm"
              variant="ghost"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              isDisabled={pagination.page === 0 || pagination.isLoading}
              icon={<FiChevronLeft />}
            />
            <Button size="sm" variant="outline" isDisabled>
              {pagination.totalItems === 0 ? 0 : pagination.page + 1} / {pagination.totalPages}
            </Button>
            <IconButton
              aria-label="Siguiente"
              size="sm"
              variant="ghost"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              isDisabled={
                pagination.page >= pagination.totalPages - 1 || pagination.isLoading
              }
              icon={<FiChevronRight />}
            />
            <IconButton
              aria-label="Última página"
              size="sm"
              variant="ghost"
              onClick={() => pagination.onPageChange(pagination.totalPages - 1)}
              isDisabled={
                pagination.page >= pagination.totalPages - 1 || pagination.isLoading
              }
              icon={<FiChevronsRight />}
            />
          </HStack>
        </Flex>
      ) : null}

      <GenericMultiStepModal {...createModal} />
      <GenericMultiStepModal {...editModal} />
      <GenericModal {...closeModal} />
    </Stack>
  );
};

export default ReservaListView;
