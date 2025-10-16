import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiRefreshCw, FiUserPlus, FiLock } from 'react-icons/fi';

interface PersonaHeaderProps {
  onRefresh: () => void;
  onOpenPersona: () => void;
  onOpenUsuario: () => void;
  isLoading: boolean;
}

export function PersonaHeader({ onRefresh, onOpenPersona, onOpenUsuario, isLoading }: PersonaHeaderProps) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'flex-start', md: 'center' }}
      justify="space-between"
      gap={4}
    >
      <Stack spacing={1}>
        <Heading size="lg" color="neutral.900">
          Gestión de personas y usuarios
        </Heading>
        <Text fontSize="sm" color="neutral.500">
          Crea personas, asigna usuarios y controla sus permisos desde un único panel.
        </Text>
      </Stack>
      <ButtonGroup size="sm" flexWrap="wrap" gap={2}>
        <Button
          leftIcon={<Icon as={FiRefreshCw} />}
          variant="outline"
          onClick={onRefresh}
          isLoading={isLoading}
        >
          Actualizar
        </Button>
        <Button leftIcon={<Icon as={FiUserPlus} />} onClick={onOpenPersona}>
          Crear persona
        </Button>
        <Button leftIcon={<Icon as={FiLock} />} onClick={onOpenUsuario} colorScheme="brand">
          Crear usuario
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
