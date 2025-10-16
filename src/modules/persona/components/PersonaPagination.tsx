import { Button, HStack, IconButton, Select, Text } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface PersonaPaginationProps {
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}

export function PersonaPagination({
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: PersonaPaginationProps) {
  return (
    <HStack spacing={4} justify="space-between">
      <HStack spacing={2}>
        <Text fontSize="sm" color="gray.600">
          Filas por página
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
        <Text fontSize="sm" color="gray.600">
          {totalItems === 0 ? '0–0' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalItems)}`} de {totalItems}
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
}
