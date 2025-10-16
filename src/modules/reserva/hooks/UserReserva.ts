import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { ReservaApi } from '../../../api/reserva';
import { reservaKeys } from '../queryKeys';
import type {
  CerrarReservaPayload,
  CreateReservaPayload,
  DetalleReservaEquipoPayload,
  DetalleReservaInstalacionPayload,
  EquipoCatalogo,
  HoraDisponible,
  MantenimientoEquipoPayload,
  MantenimientoInstalacionPayload,
  Paso1Values,
  Paso2Values,
  ReservaGeneral,
  ReservaGrupo,
  SimpleItem,
  TipoReserva,
  UpdateDetalleReservaEquipoPayload,
  UpdateDetalleReservaInstalacionPayload,
  UpdateMantenimientoPayload,
  UpdateReservaCorePayload,
} from '../types';

const resolveGrupoFromNombre = (nombreTipo: string): ReservaGrupo => {
  const lower = (nombreTipo || '').toLowerCase();
  const isMantenimiento = lower.includes('manten');
  const isEquipo = lower.includes('equipo');
  const isInstalacion = lower.includes('instal');
  if (isMantenimiento && isEquipo) return 'MANTENIMIENTO_EQUIPO';
  if (isMantenimiento && isInstalacion) return 'MANTENIMIENTO_INSTALACION';
  if (!isMantenimiento && isEquipo) return 'RESERVA_EQUIPO';
  return 'RESERVA_INSTALACION';
};

export function userReserva() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [currentDocumento, setCurrentDocumento] = useState<string | undefined>(undefined);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);

  const reservasQuery = useQuery<ReservaGeneral[]>({
    queryKey: reservaKeys.list(currentDocumento),
    queryFn: () => ReservaApi.getReservas(currentDocumento),
  });

  const tiposReservaQuery = useQuery<TipoReserva[]>({
    queryKey: reservaKeys.tipos,
    queryFn: ReservaApi.getTiposReserva,
    staleTime: 300_000,
  });

  const equiposQuery = useQuery<EquipoCatalogo[]>({
    queryKey: reservaKeys.equipos,
    queryFn: ReservaApi.getEquipos,
    staleTime: 300_000,
  });

  const instalacionesQuery = useQuery<SimpleItem[]>({
    queryKey: reservaKeys.instalaciones,
    queryFn: ReservaApi.getInstalaciones,
    staleTime: 300_000,
  });

  const catMtoEquipoQuery = useQuery<SimpleItem[]>({
    queryKey: reservaKeys.categoriasEquipo,
    queryFn: ReservaApi.getCategoriaMantenimientoEquipo,
    staleTime: 300_000,
  });

  const catMtoInstQuery = useQuery<SimpleItem[]>({
    queryKey: reservaKeys.categoriasInstalacion,
    queryFn: ReservaApi.getCategoriaMantenimientoInstalacion,
    staleTime: 300_000,
  });

  const data = reservasQuery.data ?? [];
  const loading = reservasQuery.isLoading || reservasQuery.isFetching;
  const error = reservasQuery.error ? (reservasQuery.error as Error).message : null;

  const tipoReservaOptions = useMemo(
    () => (tiposReservaQuery.data ?? []).map((tipo) => ({ value: tipo.id, label: tipo.nombre })),
    [tiposReservaQuery.data]
  );

  const equipoOptions = useMemo(
    () =>
      (equiposQuery.data ?? [])
        .filter((item) => item.tipoEquipo?.nombre)
        .map((item) => ({
          value: item.id,
          label: `${item.tipoEquipo.nombre} (${item.codigo})`,
        })),
    [equiposQuery.data]
  );

  const instalacionOptions = useMemo(
    () =>
      (instalacionesQuery.data ?? [])
        .filter((item) => item.nombre && item.nombre.trim() !== '')
        .map((item) => ({ value: item.id, label: item.nombre })),
    [instalacionesQuery.data]
  );

  const catMtoEquipoOptions = useMemo(
    () => (catMtoEquipoQuery.data ?? []).map((item) => ({ value: item.id, label: item.nombre })),
    [catMtoEquipoQuery.data]
  );

  const catMtoInstOptions = useMemo(
    () => (catMtoInstQuery.data ?? []).map((item) => ({ value: item.id, label: item.nombre })),
    [catMtoInstQuery.data]
  );

  const fetchAll = useCallback(
    async (numeroIdentificacion?: string) => {
      if (numeroIdentificacion === currentDocumento) {
        await reservasQuery.refetch();
      } else {
        setCurrentDocumento(numeroIdentificacion);
      }
    },
    [currentDocumento, reservasQuery]
  );

  const getHorasDisponiblesInstalacion = useCallback(
    async (fechaISO: string, idInstalacion: number, idDetalle?: number) => {
      if (!fechaISO || !idInstalacion) {
        setHorasDisponibles([]);
        return;
      }
      try {
        const list = await ReservaApi.getHorasDisponiblesInstalacion({
          fecha: fechaISO,
          idInstalacion,
          idDetalle,
        });
        setHorasDisponibles(list.map((item: HoraDisponible) => item.hora));
      } catch (err) {
        toast({
          title: 'Error obteniendo horas disponibles',
          description: (err as Error).message,
          status: 'error',
          duration: 4000,
        });
      }
    },
    [toast]
  );

  const getHorasDisponiblesEquipo = useCallback(
    async (fechaISO: string, idEquipo: number, idDetalle?: number) => {
      if (!fechaISO || !idEquipo) {
        setHorasDisponibles([]);
        return;
      }
      try {
        const list = await ReservaApi.getHorasDisponiblesEquipo({
          fecha: fechaISO,
          idEquipo,
          idDetalle,
        });
        setHorasDisponibles(list.map((item: HoraDisponible) => item.hora));
      } catch (err) {
        toast({
          title: 'Error obteniendo horas disponibles',
          description: (err as Error).message,
          status: 'error',
          duration: 4000,
        });
      }
    },
    [toast]
  );

  const invalidateReservas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: reservaKeys.list(currentDocumento) });
  }, [currentDocumento, queryClient]);

  const createReservaFlow = useCallback(
    async (personaId: number, paso1: Paso1Values, paso2: Paso2Values) => {
      const tipoSel = tiposReservaQuery.data?.find((tipo) => tipo.id === paso1.tipoReservaId);
      if (!tipoSel) throw new Error('Tipo de reserva inválido');

      const corePayload: CreateReservaPayload = {
        fechaReserva: paso1.fechaReserva ?? '',
        horaInicio: paso1.horaInicio ?? '',
        horaFin: paso1.horaFin ?? '',
        nombre: paso1.nombreReserva ?? '',
        descripcion: paso1.descripcionReserva ?? '',
        tipoReserva: { id: String(paso1.tipoReservaId) },
        persona: { id: String(personaId) },
      };

      const reservaCreada = await ReservaApi.createReserva(corePayload);
      const reservaId = reservaCreada.id;
      if (!reservaId) {
        throw new Error('No se pudo obtener el id de la reserva creada');
      }

      const grupo = resolveGrupoFromNombre(tipoSel.nombre);

      if (grupo === 'RESERVA_INSTALACION') {
        if (!paso1.idInstalacion) throw new Error('Debe seleccionar una instalación');
        const payload: DetalleReservaInstalacionPayload = {
          programaAcademico: paso2.programaAcademico ?? '',
          numeroEstudiantes: paso2.numeroEstudiantes ?? 0,
          entregaInstalacion: null,
          reserva: { id: String(reservaId) },
          instalacion: { id: String(paso1.idInstalacion) },
        };
        await ReservaApi.createDetalleInstalacion(payload);
      }

      if (grupo === 'RESERVA_EQUIPO') {
        if (!paso1.idEquipo) throw new Error('Debe seleccionar un equipo');
        const payload: DetalleReservaEquipoPayload = {
          programaAcademico: paso2.programaAcademico ?? '',
          numeroEstudiantes: paso2.numeroEstudiantes ?? 0,
          entregaEquipo: null,
          observacionesDevolucion: '',
          fechaDevolucionReal: '',
          reserva: { id: String(reservaId) },
          equipo: { id: String(paso1.idEquipo) },
          ...(paso2.idInstalacionDestino
            ? { instalacionDestino: { id: String(paso2.idInstalacionDestino) } }
            : {}),
        };
        await ReservaApi.createDetalleEquipo(payload);
      }

      if (grupo === 'MANTENIMIENTO_INSTALACION') {
        if (!paso1.idInstalacion) throw new Error('Debe seleccionar una instalación');
        const payload: MantenimientoInstalacionPayload = {
          descripcion: paso2.descripcionMantenimiento ?? '',
          reserva: { id: String(reservaId) },
          instalacion: { id: String(paso1.idInstalacion) },
          ...(paso2.categoriaMantenimientoInstalacionId
            ? { categoriaMantenimientoInstalacion: { id: String(paso2.categoriaMantenimientoInstalacionId) } }
            : {}),
        };
        await ReservaApi.createMantenimientoInstalacion(payload);
      }

      if (grupo === 'MANTENIMIENTO_EQUIPO') {
        if (!paso1.idEquipo) throw new Error('Debe seleccionar un equipo');
        const payload: MantenimientoEquipoPayload = {
          descripcion: paso2.descripcionMantenimiento ?? '',
          reserva: { id: String(reservaId) },
          equipo: { id: String(paso1.idEquipo) },
          ...(paso2.categoriaMantenimientoEquipoId
            ? { categoriaMantenimientoEquipo: { id: String(paso2.categoriaMantenimientoEquipoId) } }
            : {}),
        };
        await ReservaApi.createMantenimientoEquipo(payload);
      }

      invalidateReservas();
    },
    [invalidateReservas, tiposReservaQuery.data]
  );

  const updateReservaCore = useCallback(
    async (idReserva: number, values: Partial<Paso1Values>) => {
      const payload: UpdateReservaCorePayload = {
        nombre: values.nombreReserva,
        descripcion: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
      };
      await ReservaApi.updateReserva(idReserva, payload);
      invalidateReservas();
    },
    [invalidateReservas]
  );

  const updateDetalleReservaInstalacion = useCallback(
    async (idDetalle: number, values: any) => {
      const payload: UpdateDetalleReservaInstalacionPayload = {
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        programaAcademico: values.programaAcademico,
        numeroEstudiantes: values.numeroEstudiantes,
        idInstalacion: values.idInstalacion,
      };
      await ReservaApi.updateDetalleInstalacion(idDetalle, payload);
      invalidateReservas();
    },
    [invalidateReservas]
  );

  const updateDetalleReservaEquipo = useCallback(
    async (idDetalle: number, values: any) => {
      const payload: UpdateDetalleReservaEquipoPayload = {
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        programaAcademico: values.programaAcademico,
        numeroEstudiantes: values.numeroEstudiantes,
        idEquipo: values.idEquipo,
        idInstalacionDestino: values.idInstalacionDestino,
      };
      await ReservaApi.updateDetalleEquipo(idDetalle, payload);
      invalidateReservas();
    },
    [invalidateReservas]
  );

  const updateMantenimientoInstalacion = useCallback(
    async (idMantenimiento: number, values: any) => {
      const payload: UpdateMantenimientoPayload = {
        descripcion: values.descripcionMantenimiento,
        fechaProximaMantenimiento: values.fechaProximaMantenimiento,
        resultadoMantenimiento: values.resultadoMantenimiento,
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
      };
      await ReservaApi.updateMantenimientoInstalacion(idMantenimiento, payload);
      invalidateReservas();
    },
    [invalidateReservas]
  );

  const updateMantenimientoEquipo = useCallback(
    async (idMantenimiento: number, values: any) => {
      const payload: UpdateMantenimientoPayload = {
        descripcion: values.descripcionMantenimiento,
        fechaProximaMantenimiento: values.fechaProximaMantenimiento,
        resultadoMantenimiento: values.resultadoMantenimiento,
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
      };
      await ReservaApi.updateMantenimientoEquipo(idMantenimiento, payload);
      invalidateReservas();
    },
    [invalidateReservas]
  );

  const cerrarReserva = useCallback(
    async (idDetalle: number, tipoReserva: string, values: any) => {
      const lower = tipoReserva.toLowerCase();
      const payload: CerrarReservaPayload = {
        entregaInstalacion: values.entregaInstalacion,
        entregaEquipo: values.entregaEquipo,
        fechaProximaMantenimiento: values.fechaProximaMantenimiento,
        resultadoMantenimiento: values.resultadoMantenimiento,
      };

      if (lower.includes('instalacion') && !lower.includes('mantenimiento')) {
        await ReservaApi.cerrarDetalleInstalacion(idDetalle, payload);
      } else if (lower.includes('equipo') && !lower.includes('mantenimiento')) {
        await ReservaApi.cerrarDetalleEquipo(idDetalle, payload);
      } else if (lower.includes('mantenimiento') && lower.includes('instalacion')) {
        await ReservaApi.cerrarMantenimientoInstalacion(idDetalle, payload);
      } else if (lower.includes('mantenimiento') && lower.includes('equipo')) {
        await ReservaApi.cerrarMantenimientoEquipo(idDetalle, payload);
      }

      invalidateReservas();
    },
    [invalidateReservas]
  );

  return {
    data,
    loading,
    error,
    fetchAll,
    tipoReservaOptions,
    equipoOptions,
    instalacionOptions,
    catMtoEquipoOptions,
    catMtoInstOptions,
    horasDisponibles,
    getHorasDisponiblesEquipo,
    getHorasDisponiblesInstalacion,
    resolveGrupo: resolveGrupoFromNombre,
    createReservaFlow,
    updateReservaCore,
    updateDetalleReservaInstalacion,
    updateDetalleReservaEquipo,
    updateMantenimientoInstalacion,
    updateMantenimientoEquipo,
    cerrarReserva,
  } as const;
}
