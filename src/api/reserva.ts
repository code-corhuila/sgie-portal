import { apiCall, unwrapApiEnvelope, type ApiEnvelope } from "./base";
import type {
  CerrarReservaPayload,
  CreateReservaPayload,
  DetalleReservaEquipoPayload,
  DetalleReservaInstalacionPayload,
  EquipoCatalogo,
  HoraDisponible,
  MantenimientoEquipoPayload,
  MantenimientoInstalacionPayload,
  ReservaGeneral,
  SimpleItem,
  TipoReserva,
  UpdateDetalleReservaEquipoPayload,
  UpdateDetalleReservaInstalacionPayload,
  UpdateMantenimientoPayload,
  UpdateReservaCorePayload,
} from "../modules/reserva/types";

const asArray = <T>(payload: ApiEnvelope<T[]> | T[]): T[] =>
  unwrapApiEnvelope(payload);

export const ReservaApi = {
  async getReservas(numeroIdentificacion?: string): Promise<ReservaGeneral[]> {
    const query = numeroIdentificacion
      ? `?numeroIdentificacion=${encodeURIComponent(numeroIdentificacion)}`
      : "";
    const response = await apiCall<
      ApiEnvelope<ReservaGeneral[]> | ReservaGeneral[]
    >(`/reserva/reservas-mantenimientos${query}`);
    return asArray(response);
  },

  async getTiposReserva(): Promise<TipoReserva[]> {
    const response = await apiCall<ApiEnvelope<TipoReserva[]> | TipoReserva[]>(
      "/tipo-reserva",
    );
    return asArray(response);
  },

  async getEquipos(): Promise<EquipoCatalogo[]> {
    const response = await apiCall<
      ApiEnvelope<EquipoCatalogo[]> | EquipoCatalogo[]
    >("/equipo");
    return asArray(response);
  },

  async getInstalaciones(): Promise<SimpleItem[]> {
    const response = await apiCall<ApiEnvelope<SimpleItem[]> | SimpleItem[]>(
      "/instalacion",
    );
    return asArray(response);
  },

  async getCategoriaMantenimientoEquipoId(): Promise<SimpleItem[]> {
    const response = await apiCall<ApiEnvelope<SimpleItem[]> | SimpleItem[]>(
      "/categoria-mantenimiento-equipo",
    );
    return asArray(response);
  },

  async getCategoriaMantenimientoInstalacion(): Promise<SimpleItem[]> {
    const response = await apiCall<ApiEnvelope<SimpleItem[]> | SimpleItem[]>(
      "/categoria-mantenimiento-instalacion",
    );
    return asArray(response);
  },

  async getHorasDisponiblesInstalacion(params: {
    fecha: string;
    idInstalacion: number;
    idDetalle?: number;
    origen?: string;
  }): Promise<HoraDisponible[]> {
    const search = new URLSearchParams({
      fecha: params.fecha,
      idInstalacion: String(params.idInstalacion),
    });
    if (params.idDetalle) {
      search.set("idDetalle", String(params.idDetalle));
    }
    if (params.origen) {
      search.set("origen", params.origen);
    }

    const response = await apiCall<
      ApiEnvelope<HoraDisponible[]> | HoraDisponible[]
    >(`/reserva/horas-disponibles-instalacion?${search.toString()}`);
    return asArray(response);
  },

  async getHorasDisponiblesEquipo(params: {
    fecha: string;
    idEquipo: number;
    idDetalle?: number;
    origen?: string;
  }): Promise<HoraDisponible[]> {
    const search = new URLSearchParams({
      fecha: params.fecha,
      idEquipo: String(params.idEquipo),
    });
    if (params.idDetalle) {
      search.set("idDetalle", String(params.idDetalle));
    }
    if (params.origen) {
      search.set("origen", params.origen);
    }

    const response = await apiCall<
      ApiEnvelope<HoraDisponible[]> | HoraDisponible[]
    >(`/reserva/horas-disponibles-equipo?${search.toString()}`);
    return asArray(response);
  },

  async createReserva(payload: CreateReservaPayload): Promise<{ id: number }> {
    const response = await apiCall<
      ApiEnvelope<{ id: number }> | { id: number }
    >("/reserva", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapApiEnvelope(response);
  },

  async createDetalleInstalacion(
    payload: DetalleReservaInstalacionPayload,
  ): Promise<void> {
    await apiCall("/detalle-reserva-instalacion", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async createDetalleEquipo(
    payload: DetalleReservaEquipoPayload,
  ): Promise<void> {
    await apiCall("/detalle-reserva-equipo", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async createMantenimientoInstalacion(
    payload: MantenimientoInstalacionPayload,
  ): Promise<void> {
    await apiCall("/mantenimiento-instalacion", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async createMantenimientoEquipo(
    payload: MantenimientoEquipoPayload,
  ): Promise<void> {
    await apiCall("/mantenimiento-equipo", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updateReserva(
    idReserva: number,
    payload: UpdateReservaCorePayload,
  ): Promise<void> {
    await apiCall(`/reserva/${idReserva}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updateDetalleInstalacion(
    idDetalle: number,
    payload: UpdateDetalleReservaInstalacionPayload,
  ): Promise<void> {
    await apiCall(
      `/detalle-reserva-instalacion/${idDetalle}/actualizar-detalle-reserva`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async updateDetalleEquipo(
    idDetalle: number,
    payload: UpdateDetalleReservaEquipoPayload,
  ): Promise<void> {
    await apiCall(
      `/detalle-reserva-equipo/${idDetalle}/actualizar-detalle-reserva-equipo`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async updateMantenimientoInstalacion(
    idMantenimiento: number,
    payload: UpdateMantenimientoPayload,
  ): Promise<void> {
    await apiCall(
      `/mantenimiento-instalacion/${idMantenimiento}/actualizar-mantenimiento-instalacion`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async updateMantenimientoEquipo(
    idMantenimiento: number,
    payload: UpdateMantenimientoPayload,
  ): Promise<void> {
    await apiCall(
      `/mantenimiento-equipo/${idMantenimiento}/actualizar-mantenimiento-equipo`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async cerrarDetalleInstalacion(
    idDetalle: number,
    payload: CerrarReservaPayload,
  ): Promise<void> {
    await apiCall(
      `/detalle-reserva-instalacion/${idDetalle}/cerrar-detalle-reserva-instalacion`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async cerrarDetalleEquipo(
    idDetalle: number,
    payload: CerrarReservaPayload,
  ): Promise<void> {
    await apiCall(
      `/detalle-reserva-equipo/${idDetalle}/cerrar-detalle-reserva-equipo`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async cerrarMantenimientoInstalacion(
    idMantenimiento: number,
    payload: CerrarReservaPayload,
  ): Promise<void> {
    await apiCall(
      `/mantenimiento-instalacion/${idMantenimiento}/cerrar-mantenimiento-instalacion`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },

  async cerrarMantenimientoEquipo(
    idMantenimiento: number,
    payload: CerrarReservaPayload,
  ): Promise<void> {
    await apiCall(
      `/mantenimiento-equipo/${idMantenimiento}/cerrar-mantenimiento-equipo`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        skipJson: true,
      },
    );
  },
};
