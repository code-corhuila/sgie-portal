import {
  Stack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Skeleton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { dashboardKeys } from "../queryKeys";
import { DashboardApi, type InstalacionDashboardRow } from "../api";
import type { Persona } from "../../persona/types";
import type { EquipoSummary } from "../../equipo/types";
import type { ReservaGeneral } from "../../reserva/types";

type SummaryKey = "personas" | "equipos" | "reservas" | "instalaciones";

interface SummaryCard {
  key: SummaryKey;
  label: string;
  helper: string;
}

const summaryCards: SummaryCard[] = [
  {
    key: "personas",
    label: "Personas activas",
    helper: "Usuarios habilitados en el sistema",
  },
  {
    key: "equipos",
    label: "Equipos disponibles",
    helper: "Inventario con estado operativo",
  },
  {
    key: "reservas",
    label: "Reservas hoy",
    helper: "Solicitudes agendadas para la fecha actual",
  },
  {
    key: "instalaciones",
    label: "Instalaciones operativas",
    helper: "Espacios disponibles para uso",
  },
];

function DashboardHome() {
  const queries = useQueries({
    queries: [
      {
        queryKey: dashboardKeys.personas,
        queryFn: DashboardApi.personas,
        staleTime: 120_000,
      },
      {
        queryKey: dashboardKeys.equipos,
        queryFn: DashboardApi.equipos,
        staleTime: 120_000,
      },
      {
        queryKey: dashboardKeys.reservas,
        queryFn: DashboardApi.reservas,
        staleTime: 120_000,
      },
      {
        queryKey: dashboardKeys.instalaciones,
        queryFn: DashboardApi.instalaciones,
        staleTime: 120_000,
      },
    ],
  }) as [
    UseQueryResult<Persona[]>,
    UseQueryResult<EquipoSummary[]>,
    UseQueryResult<ReservaGeneral[]>,
    UseQueryResult<InstalacionDashboardRow[]>,
  ];

  const [personasQuery, equiposQuery, reservasQuery, instalacionesQuery] =
    queries;

  const todayIso = useMemo(
    () => new Date().toISOString().slice(0, 10),
    [],
  );

  const personasActivas = useMemo(() => {
    if (!personasQuery.data) return null;
    return personasQuery.data.filter((persona) => persona.estado).length;
  }, [personasQuery.data]);

  const equiposDisponibles = useMemo(() => {
    if (!equiposQuery.data) return null;
    return equiposQuery.data.filter((equipo) => equipo.estadoEquipo).length;
  }, [equiposQuery.data]);

  const reservasHoy = useMemo(() => {
    if (!reservasQuery.data) return null;
    return reservasQuery.data.filter((reserva) => {
      const fecha = reserva.fechaReserva?.slice(0, 10);
      return fecha === todayIso;
    }).length;
  }, [reservasQuery.data, todayIso]);

  const instalacionesOperativas = useMemo(() => {
    if (!instalacionesQuery.data) return null;
    return instalacionesQuery.data.filter(
      (row) => row.estadoInstalacion,
    ).length;
  }, [instalacionesQuery.data]);

  const stats = useMemo(
    () =>
      summaryCards.map((card) => {
        switch (card.key) {
          case "personas":
            return {
              ...card,
              loading: personasQuery.isLoading,
              error: personasQuery.isError,
              value: personasActivas,
            };
          case "equipos":
            return {
              ...card,
              loading: equiposQuery.isLoading,
              error: equiposQuery.isError,
              value: equiposDisponibles,
            };
          case "reservas":
            return {
              ...card,
              loading: reservasQuery.isLoading,
              error: reservasQuery.isError,
              value: reservasHoy,
            };
          case "instalaciones":
          default:
            return {
              ...card,
              loading: instalacionesQuery.isLoading,
              error: instalacionesQuery.isError,
              value: instalacionesOperativas,
            };
        }
      }),
    [
      equiposDisponibles,
      equiposQuery.isError,
      equiposQuery.isLoading,
      instalacionesOperativas,
      instalacionesQuery.isError,
      instalacionesQuery.isLoading,
      personasActivas,
      personasQuery.isError,
      personasQuery.isLoading,
      reservasHoy,
      reservasQuery.isError,
      reservasQuery.isLoading,
    ],
  );

  const anyError = stats.some((stat) => stat.error);

  return (
    <Stack spacing={8}>
      <Stack spacing={1}>
        <Heading size="lg" color="neutral.900">
          Panel general
        </Heading>
        <Text color="neutral.600">
          Selecciona una sección del menú para gestionar la información o consultar los recursos disponibles.
        </Text>
      </Stack>

      {anyError ? (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          No se pudieron cargar todas las métricas. Reintenta más tarde o navega a cada módulo para revisar el detalle.
        </Alert>
      ) : null}

      <SimpleGrid minChildWidth="180px" spacing={4}>
        {stats.map((card) => (
          <Box
            key={card.key}
            borderWidth="1px"
            borderRadius="2xl"
            borderColor="neutral.100"
            bg="white"
            p={6}
            boxShadow="sm"
          >
            <Stat>
              <StatLabel color="neutral.500">{card.label}</StatLabel>
              <Skeleton isLoaded={!card.loading}>
                <StatNumber color="neutral.900" fontSize="2xl">
                  {card.error
                    ? "—"
                    : card.value != null
                      ? card.value.toLocaleString("es-CO")
                      : "—"}
                </StatNumber>
              </Skeleton>
              <StatHelpText color="neutral.500">{card.helper}</StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default DashboardHome;
