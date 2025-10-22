import { PersonasApi } from "../../api/persona";
import { EquiposApi } from "../../api/equipo";
import { ReservaApi } from "../../api/reserva";
import { apiCall } from "../../api/base";

interface InstalacionDashboardRow {
  estadoInstalacion: boolean;
}

export const DashboardApi = {
  personas: () => PersonasApi.getAll(),
  equipos: () => EquiposApi.getAll(),
  reservas: () => ReservaApi.getReservas(),
  instalaciones: () =>
    apiCall<InstalacionDashboardRow[]>(
      "/instalacion/instalacion-campus?nombreInstalacion=&nombreCampus=",
    ),
};

export type { InstalacionDashboardRow };
