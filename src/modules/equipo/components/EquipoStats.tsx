import { SimpleGrid, Stack, Text } from "@chakra-ui/react";

interface EquipoStatsProps {
  total: number;
  activos: number;
  enMantenimiento: number;
}

export function EquipoStats({
  total,
  activos,
  enMantenimiento,
}: EquipoStatsProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      <Stack
        spacing={1}
        borderWidth="1px"
        borderColor="neutral.100"
        borderRadius="xl"
        bg="neutral.50"
        p={4}
      >
        <Text fontSize="sm" color="neutral.600">
          Equipos totales
        </Text>
        <Text fontWeight="semibold" fontSize="xl">
          {total}
        </Text>
      </Stack>
      <Stack
        spacing={1}
        borderWidth="1px"
        borderColor="neutral.100"
        borderRadius="xl"
        bg="brand.50"
        p={4}
      >
        <Text fontSize="sm" color="brand.700">
          Equipos activos
        </Text>
        <Text fontWeight="semibold" fontSize="xl">
          {activos}
        </Text>
      </Stack>
      <Stack
        spacing={1}
        borderWidth="1px"
        borderColor="neutral.100"
        borderRadius="xl"
        bg="teal.50"
        p={4}
      >
        <Text fontSize="sm" color="teal.700">
          En mantenimiento
        </Text>
        <Text fontWeight="semibold" fontSize="xl">
          {enMantenimiento}
        </Text>
      </Stack>
    </SimpleGrid>
  );
}
