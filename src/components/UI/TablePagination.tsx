import { Button, HStack, IconButton, Select, Text } from "@chakra-ui/react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: number[];
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  label?: string;
}

export const TablePagination = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  label = "Filas por página",
}: TablePaginationProps) => {
  const from = totalItems === 0 ? 0 : page * pageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);

  return (
    <HStack spacing={4} justify="space-between" w="full">
      <HStack spacing={2}>
        <Text fontSize="sm" color="neutral.600">
          {label}
        </Text>
        <Select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          isDisabled={isLoading}
          maxW="80px"
          size="sm"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </HStack>

      <HStack spacing={2}>
        <Text fontSize="sm" color="neutral.600">
          {from}–{to} de {totalItems}
        </Text>
        <IconButton
          aria-label="Primera página"
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(0)}
          isDisabled={page === 0 || isLoading || totalItems === 0}
          icon={<FiChevronsLeft />}
        />
        <IconButton
          aria-label="Anterior"
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(page - 1)}
          isDisabled={page === 0 || isLoading || totalItems === 0}
          icon={<FiChevronLeft />}
        />
        <Button size="sm" variant="outline" isDisabled>
          {totalItems === 0 ? 0 : page + 1} / {totalItems === 0 ? 0 : totalPages}
        </Button>
        <IconButton
          aria-label="Siguiente"
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(page + 1)}
          isDisabled={page >= totalPages - 1 || isLoading || totalItems === 0}
          icon={<FiChevronRight />}
        />
        <IconButton
          aria-label="Última página"
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(totalPages - 1)}
          isDisabled={page >= totalPages - 1 || isLoading || totalItems === 0}
          icon={<FiChevronsRight />}
        />
      </HStack>
    </HStack>
  );
};

export default TablePagination;
