import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FiFilter, FiLayers, FiPlusCircle, FiRefreshCw } from "react-icons/fi";
import type { ReactNode } from "react";

interface EquipoHeaderProps {
  onRefresh: () => void;
  onOpenCategoria: () => void;
  onOpenTipo: () => void;
  onOpenEquipo: () => void;
  isLoading: boolean;
  extraActions?: ReactNode;
}

export function EquipoHeader({
  onRefresh,
  onOpenCategoria,
  onOpenTipo,
  onOpenEquipo,
  isLoading,
  extraActions,
}: EquipoHeaderProps) {
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      align={{ base: "flex-start", md: "center" }}
      justify="space-between"
      gap={4}
    >
      <Stack spacing={1}>
        <Heading size="lg" color="neutral.900">
          Gestión de equipos
        </Heading>
        <Text fontSize="sm" color="neutral.500">
          Controla el parque tecnológico con filtros rápidos y acciones de
          mantenimiento.
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
        <Button leftIcon={<Icon as={FiLayers} />} onClick={onOpenCategoria}>
          Categoría
        </Button>
        <Button
          leftIcon={<Icon as={FiFilter} />}
          onClick={onOpenTipo}
          variant="outline"
        >
          Tipo
        </Button>
        <Button
          colorScheme="brand"
          leftIcon={<Icon as={FiPlusCircle} />}
          onClick={onOpenEquipo}
        >
          Nuevo equipo
        </Button>
        {extraActions}
      </ButtonGroup>
    </Flex>
  );
}
