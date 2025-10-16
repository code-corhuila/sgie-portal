import {
  Button,
  ButtonGroup,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';

interface PersonaFiltersProps {
  documento: string;
  onDocumentoChange: (value: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  estadoFilter: 'Todos' | 'Activos' | 'Inactivos';
  onEstadoChange: (value: 'Todos' | 'Activos' | 'Inactivos') => void;
  isSearching: boolean;
}

export function PersonaFilters({
  documento,
  onDocumentoChange,
  onBuscar,
  onLimpiar,
  estadoFilter,
  onEstadoChange,
  isSearching,
}: PersonaFiltersProps) {
  return (
    <Stack spacing={4}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        align={{ base: 'stretch', md: 'flex-end' }}
      >
        <InputGroup maxW={{ base: '100%', md: '320px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="neutral.400" />
          </InputLeftElement>
          <Input
            placeholder="Número de documento"
            value={documento}
            onChange={(event) => onDocumentoChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onBuscar()}
          />
        </InputGroup>
        <ButtonGroup size="sm">
          <Button
            colorScheme="brand"
            leftIcon={<Icon as={FiSearch} />}
            onClick={onBuscar}
            isLoading={isSearching}
          >
            Buscar
          </Button>
          <Button variant="ghost" onClick={onLimpiar}>
            Limpiar
          </Button>
        </ButtonGroup>
      </Stack>

      <Stack spacing={2} maxW="240px">
        <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
          Estado
        </Text>
        <Select value={estadoFilter} onChange={(event) => onEstadoChange(event.target.value as PersonaFiltersProps['estadoFilter'])}>
          <option value="Todos">Todos</option>
          <option value="Activos">Activos</option>
          <option value="Inactivos">Inactivos</option>
        </Select>
      </Stack>
    </Stack>
  );
}
