import {
  Button,
  ButtonGroup,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";

interface EquipoFiltersProps {
  codigo: string;
  onCodigoChange: (value: string) => void;
  onSearchByCodigo: () => void;
  onClearCodigo: () => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusChange: (value: "ALL" | "ACTIVE" | "INACTIVE") => void;
  tipoFilter: string;
  onTipoChange: (value: string) => void;
  instalacionFilter: string;
  onInstalacionChange: (value: string) => void;
  categoriaFilter: string;
  onCategoriaChange: (value: string) => void;
  tiposDisponibles: string[];
  instalacionesDisponibles: string[];
  categoriasDisponibles: string[];
  isSearching: boolean;
}

export function EquipoFilters({
  codigo,
  onCodigoChange,
  onSearchByCodigo,
  onClearCodigo,
  statusFilter,
  onStatusChange,
  tipoFilter,
  onTipoChange,
  instalacionFilter,
  onInstalacionChange,
  categoriaFilter,
  onCategoriaChange,
  tiposDisponibles,
  instalacionesDisponibles,
  categoriasDisponibles,
  isSearching,
}: EquipoFiltersProps) {
  return (
    <Stack spacing={4}>
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={4}
        align={{ base: "stretch", md: "flex-end" }}
      >
        <InputGroup maxW={{ base: "100%", md: "320px" }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="neutral.400" />
          </InputLeftElement>
          <Input
            placeholder="Código de equipo"
            value={codigo}
            onChange={(e) => onCodigoChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchByCodigo()}
          />
        </InputGroup>
        <ButtonGroup size="sm">
          <Button
            colorScheme="brand"
            leftIcon={<Icon as={FiSearch} />}
            onClick={onSearchByCodigo}
            isLoading={isSearching}
          >
            Buscar
          </Button>
          <Button variant="ghost" onClick={onClearCodigo}>
            Limpiar
          </Button>
        </ButtonGroup>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Stack spacing={2}>
          <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
            Estado
          </Text>
          <Select
            value={statusFilter}
            onChange={(e) =>
              onStatusChange(e.target.value as typeof statusFilter)
            }
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </Select>
        </Stack>
        <Stack spacing={2}>
          <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
            Tipo de equipo
          </Text>
          <Select
            value={tipoFilter}
            onChange={(e) => onTipoChange(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {tiposDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </Select>
        </Stack>
        <Stack spacing={2}>
          <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
            Instalación
          </Text>
          <Select
            value={instalacionFilter}
            onChange={(e) => onInstalacionChange(e.target.value)}
          >
            <option value="Todos">Todas</option>
            {instalacionesDisponibles.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </Select>
        </Stack>
        <Stack spacing={2}>
          <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
            Categoría
          </Text>
          <Select
            value={categoriaFilter}
            onChange={(e) => onCategoriaChange(e.target.value)}
          >
            <option value="Todos">Todas</option>
            {categoriasDisponibles.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </Select>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
