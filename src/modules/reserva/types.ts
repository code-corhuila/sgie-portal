export type ReservaGrupo =
  | "RESERVA_INSTALACION"
  | "RESERVA_EQUIPO"
  | "MANTENIMIENTO_INSTALACION"
  | "MANTENIMIENTO_EQUIPO";

export interface TipoReserva {
  id: number;
  nombre: string;
  requiereAprobacion?: boolean;
}

export interface HoraDisponible {
  hora: string;
}

export interface ReservaGeneral {
  idReserva: number;
  idDetalleRerservaEquipo?: number | null;
  idDetalleRerservaInstalacion?: number | null;
  idMantenimientoEquipo?: number | null;
  idMantenimientoInstalacion?: number | null;
  tipoReserva: string;
  nombreReserva: string;
  descripcionReserva?: string | null;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  idTipoReserva?: number | null;
  idPersona: number;
  nombrePersona: string;
  numeroIdentificacion: string;
  nombreInstalacion?: string | null;
  nombreEquipo?: string | null;
  programaAcademico?: string | null;
  numeroEstudiantes?: number | null;
  idInstalacionDestino?: number | null;
  tipoMantenimiento?: string | null;
  descripcionMantenimiento?: string | null;
  idCategoriaMantenimiento?: number | null;
  estadoMantenimiento?: string | null;
  estadoReserva: string | boolean;
  estadoDetalle?: string | null;
}

export interface SimpleItem {
  id: number;
  nombre: string;
}

export interface EquipoCatalogo {
  id: number;
  codigo: string;
  instalacion: SimpleItem;
  tipoEquipo: SimpleItem;
}

export interface Paso1Values {
  tipoReservaId?: number;
  tipoReservaNombre?: string;
  nombreReserva?: string;
  descripcionReserva?: string;
  fechaReserva?: string;
  horaInicio?: string;
  horaFin?: string;
  idEquipo?: number;
  idInstalacion?: number;
}

export interface Paso2Values {
  programaAcademico?: string;
  numeroEstudiantes?: number;
  idInstalacionDestino?: number;
  descripcionMantenimiento?: string;
  fechaProximaMantenimiento?: string;
  resultadoMantenimiento?: string;
  categoriaMantenimientoInstalacionId?: number;
  categoriaMantenimientoEquipoId?: number;
}

export interface CreateReservaPayload {
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  nombre: string;
  descripcion?: string;
  tipoReserva: { id: string };
  persona: { id: string };
}

export interface UpdateReservaCorePayload {
  nombre?: string;
  descripcion?: string;
  fechaReserva?: string;
  horaInicio?: string;
  horaFin?: string;
  tipoReserva?: { id: string };
  persona?: { id: string };
}

export interface UpdateDetalleReservaInstalacionPayload {
  nombreReserva?: string;
  descripcionReserva?: string;
  fechaReserva?: string;
  horaInicio?: string;
  horaFin?: string;
  programaAcademico?: string;
  numeroEstudiantes?: number;
  idInstalacion?: number;
}

export interface UpdateDetalleReservaEquipoPayload {
  nombreReserva?: string;
  descripcionReserva?: string;
  fechaReserva?: string;
  horaInicio?: string;
  horaFin?: string;
  programaAcademico?: string;
  numeroEstudiantes?: number;
  idEquipo?: number;
  idInstalacionDestino?: number;
}

export interface UpdateMantenimientoPayload {
  descripcion?: string;
  fechaProximaMantenimiento?: string;
  resultadoMantenimiento?: string;
  nombreReserva?: string;
  descripcionReserva?: string;
  fechaReserva?: string;
  horaInicio?: string;
  horaFin?: string;
}

export interface CerrarReservaPayload {
  entregaInstalacion?: string;
  entregaEquipo?: string;
  fechaProximaMantenimiento?: string;
  resultadoMantenimiento?: string;
}

export interface DetalleReservaInstalacionPayload {
  programaAcademico?: string;
  numeroEstudiantes?: number;
  entregaInstalacion?: string | null;
  reserva: { id: string };
  instalacion: { id: string };
}

export interface DetalleReservaEquipoPayload {
  programaAcademico?: string;
  numeroEstudiantes?: number;
  entregaEquipo?: string | null;
  observacionesDevolucion?: string;
  fechaDevolucionReal?: string;
  reserva: { id: string };
  equipo: { id: string };
  instalacionDestino?: { id: string };
}

export interface MantenimientoInstalacionPayload {
  descripcion?: string;
  reserva: { id: string };
  instalacion: { id: string };
  categoriaMantenimientoInstalacion?: { id: string };
}

export interface MantenimientoEquipoPayload {
  descripcion?: string;
  reserva: { id: string };
  equipo: { id: string };
  categoriaMantenimientoEquipo?: { id: string };
}
