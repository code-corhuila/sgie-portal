import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { apiCall, type ApiResponse } from '../../../api/base';

export type ReservaGrupo =
  | 'RESERVA_INSTALACION'
  | 'RESERVA_EQUIPO'
  | 'MANTENIMIENTO_INSTALACION'
  | 'MANTENIMIENTO_EQUIPO';

export interface TipoReserva {
  id: number;
  nombre: string;
  requiereAprobacion?: boolean;
}

export interface HoraDisponibleDTO {
  hora: string; // "HH:mm" o "HH:mm:ss"
}

/** Coincide con IReservaGeneralDTO del backend */
export interface ReservaGeneral {
  // Identificadores principales
  idReserva: number;
  idDetalleRerservaEquipo?: number | null;
  idDetalleRerservaInstalacion?: number | null;
  idMantenimientoEquipo?: number | null;
  idMantenimientoInstalacion?: number | null;

  // Datos de la reserva
  tipoReserva: string;
  nombreReserva: string;
  descripcionReserva?: string | null;
  fechaReserva: string;          // ISO (yyyy-MM-dd)
  horaInicioReserva: string;     // "HH:mm[:ss]"
  horaFinReserva: string;        // idem
  idTipoReserva?: number | null;

  // Persona asociada
  idPersona: number;
  nombrePersona: string;
  numeroIdentificacion: string;

  // Información adicional
  nombreInstalacion?: string | null;
  nombreEquipo?: string | null;

  // Campos específicos de detalle de reserva
  programaAcademico?: string | null;
  numeroEstudiantes?: number | null;
  idInstalacionDestino?: number | null;

  // Campos específicos de mantenimiento
  tipoMantenimiento?: string | null;
  descripcionMantenimiento?: string | null;
  idCategoriaMantenimiento?: number | null;
  estadoMantenimiento?: string | null;

  // Estados generales
  estadoReserva: string | boolean;
  estadoDetalle?: string | null;
}

/** Para selects */
export interface SimpleItem { id: number; nombre: string; }

/** Estructura temporal de equipos (hasta que funcione @JsonView) */
export interface EquipoAPI {
  id: number;
  codigo: string;
  instalacion: {
    id: number;
    nombre: string;
  };
  tipoEquipo: {
    id: number;
    nombre: string;
  };
}

/** Valores del Paso 1 (reserva core + selección recurso/fecha/horas) */
export interface Paso1Values {
  tipoReservaId?: number;
  tipoReservaNombre?: string; // para UX
  nombreReserva?: string;
  descripcionReserva?: string;
  fechaReserva?: string; // yyyy-MM-dd
  horaInicio?: string;   // HH:mm[:ss]
  horaFin?: string;      // HH:mm[:ss]
  idEquipo?: number;
  idInstalacion?: number;
}

/** Valores del Paso 2 (dinámico según grupo) */
export interface Paso2Values {
  // Detalle instalación
  programaAcademico?: string;
  numeroEstudiantes?: number;
  // Destino (para equipo)
  idInstalacionDestino?: number;

  // Mantenimientos
  descripcionMantenimiento?: string;
  // Estos NO se envían en creación; se usan al cerrar:
  fechaProximaMantenimiento?: string; // yyyy-MM-dd (omitido en creación)
  resultadoMantenimiento?: string;

  // Categorías (requeridas en mantenimiento)
  categoriaMantenimientoInstalacionId?: number;
  categoriaMantenimientoEquipoId?: number;
}

export function userReserva() {
  const toast = useToast();

  /** Tabla */
  const [data, setData] = useState<ReservaGeneral[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** Catálogos */
  const [tiposReserva, setTiposReserva] = useState<TipoReserva[]>([]);
  const [equipos, setEquipos] = useState<EquipoAPI[]>([]);
  const [instalaciones, setInstalaciones] = useState<SimpleItem[]>([]);
  const [catMtoEquipo, setCatMtoEquipo] = useState<SimpleItem[]>([]);
  const [catMtoInst, setCatMtoInst] = useState<SimpleItem[]>([]);

  /** Disponibilidad */
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);

  const [selectedPersona, setSelectedPersona] = useState<any>(null);

  /** Helpers grupo según nombre */
  const resolveGrupo = useCallback((nombreTipo: string): ReservaGrupo => {
    const n = (nombreTipo || '').toLowerCase();
    const isMantenimiento = n.includes('manten');
    const isEquipo = n.includes('equipo');
    const isInstalacion = n.includes('instal');
    if (isMantenimiento && isEquipo) return 'MANTENIMIENTO_EQUIPO';
    if (isMantenimiento && isInstalacion) return 'MANTENIMIENTO_INSTALACION';
    if (!isMantenimiento && isEquipo) return 'RESERVA_EQUIPO';
    return 'RESERVA_INSTALACION';
  }, []);

  /** Fetch tabla */
  const fetchAll = useCallback(async (numeroIdentificacion?: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const query = numeroIdentificacion
        ? `?numeroIdentificacion=${encodeURIComponent(numeroIdentificacion)}`
        : '';
      const response = await apiCall<ApiResponse<ReservaGeneral[]>>(
        `/reserva/reservas-mantenimientos${query}`,
        { signal: abortRef.current.signal }
      );

      const list = (response as any).data ?? (response as any);
      setData(
        (list ?? []).map((r: any, idx: number) => ({
          ...r,
          _key: `${r.nombreReserva}-${r.numeroIdentificacion}-${r.fechaReserva}-${r.horaInicioReserva}-${idx}`,
        }))
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const msg = err.message || 'Error al cargar reservas';
        setError(msg);
        toast({ title: 'Error', description: msg, status: 'error', duration: 4000, isClosable: true });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /** Fetch catálogos (incluye categorías de mantenimiento) */
  const ensureData = <T,>(resp: ApiResponse<T> | T): T =>
  (resp as any)?.data ?? (resp as T);

const fetchCatalogs = useCallback(async () => {
  const results = await Promise.allSettled([
    apiCall<ApiResponse<TipoReserva[]>>('/tipo-reserva'),
    apiCall<ApiResponse<EquipoAPI[]>>('/equipo'),
    apiCall<ApiResponse<SimpleItem[]>>('/instalacion'),
    apiCall<ApiResponse<SimpleItem[]>>('/categoria-mantenimiento-equipo'),
    apiCall<ApiResponse<SimpleItem[]>>('/categoria-mantenimiento-instalacion'),
  ]);

  // 0: tipos-reserva
  if (results[0].status === 'fulfilled') {
    const tipos = ensureData(results[0].value);
    setTiposReserva(tipos as any);
  } else {
    // AUN si falla, mostramos toast, pero no bloqueamos lo demás
    toast({
      title: 'Catálogo: tipos de reserva',
      description: (results[0] as PromiseRejectedResult).reason?.message ?? 'No se pudo cargar',
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
  }

  // 1: equipos
  if (results[1].status === 'fulfilled') {
    setEquipos(ensureData(results[1].value) as any);
  } else {
    toast({
      title: 'Catálogo: equipos',
      description: (results[1] as PromiseRejectedResult).reason?.message ?? 'No se pudo cargar',
      status: 'warning',
    });
  }

  // 2: instalaciones
  if (results[2].status === 'fulfilled') {
    setInstalaciones(ensureData(results[2].value) as any);
  } else {
    toast({
      title: 'Catálogo: instalaciones',
      description: (results[2] as PromiseRejectedResult).reason?.message ?? 'No se pudo cargar',
      status: 'warning',
    });
  }

  // 3: categorías mto equipo
  if (results[3].status === 'fulfilled') {
    setCatMtoEquipo(ensureData(results[3].value) as any);
  } else {
    toast({
      title: 'Catálogo: categorías mto equipo',
      description: (results[3] as PromiseRejectedResult).reason?.message ?? 'No se pudo cargar',
      status: 'info',
    });
  }

  // 4: categorías mto instalación
  if (results[4].status === 'fulfilled') {
    setCatMtoInst(ensureData(results[4].value) as any);
  } else {
    toast({
      title: 'Catálogo: categorías mto instalación',
      description: (results[4] as PromiseRejectedResult).reason?.message ?? 'No se pudo cargar',
      status: 'info',
    });
  }
}, [toast]);

  useEffect(() => {
    void fetchAll();
    void fetchCatalogs();
    return () => abortRef.current?.abort();
  }, [fetchAll, fetchCatalogs]);

  /** Disponibilidad */
  const getHorasDisponiblesInstalacion = useCallback(
    async (fechaISO: string, idInstalacion: number, idDetalle?: number) => {
      if (!fechaISO || !idInstalacion) return setHorasDisponibles([]);
      const qs = new URLSearchParams({ fecha: fechaISO, idInstalacion: String(idInstalacion) });
      if (idDetalle) qs.append('idDetalle', String(idDetalle));

      const list = await apiCall<HoraDisponibleDTO[]>(
        `/reserva/horas-disponibles-instalacion?${qs.toString()}`
      );
      setHorasDisponibles((list ?? []).map(h => h.hora));
    },
    []
  );

  const getHorasDisponiblesEquipo = useCallback(
    async (fechaISO: string, idEquipo: number, idDetalle?: number) => {
      if (!fechaISO || !idEquipo) return setHorasDisponibles([]);
      const qs = new URLSearchParams({ fecha: fechaISO, idEquipo: String(idEquipo) });
      if (idDetalle) qs.append('idDetalle', String(idDetalle));

      const list = await apiCall<HoraDisponibleDTO[]>(
        `/reserva/horas-disponibles-equipo?${qs.toString()}`
      );
      setHorasDisponibles((list ?? []).map(h => h.hora));
    },
    []
  );

  /** Crear flujo completo */
  const createReservaFlow = useCallback(
    async (personaId: number, paso1: Paso1Values, paso2: Paso2Values) => {
      // 1) Crear RESERVA core
      const tipoSel = tiposReserva.find(t => t.id === paso1.tipoReservaId);
      if (!tipoSel) throw new Error('Tipo de reserva inválido');

      const corePayload = {
        fechaReserva: paso1.fechaReserva,
        horaInicio: paso1.horaInicio,
        horaFin: paso1.horaFin,
        nombre: paso1.nombreReserva,
        descripcion: paso1.descripcionReserva,
        tipoReserva: { id: String(paso1.tipoReservaId) },
        persona: { id: String(personaId) }, // 👈 requerido por tu backend
      };

      const reservaCreada = await apiCall<any>('/reserva', {
        method: 'POST',
        body: JSON.stringify(corePayload),
      });

      const reservaId = (reservaCreada?.id as number) ?? (reservaCreada?.data?.id as number);
      if (!reservaId) {
        throw new Error('No se pudo obtener el id de la reserva creada');
      }

      // 2) Crear asociado según grupo
      const grupo = resolveGrupo(tipoSel.nombre);

      if (grupo === 'RESERVA_INSTALACION') {
        if (!paso1.idInstalacion) throw new Error('Debe seleccionar una instalación');
        const payload = {
          programaAcademico: paso2.programaAcademico ?? '',
          numeroEstudiantes: paso2.numeroEstudiantes ?? 0,
          entregaInstalacion: null, // 👈 oculto en creación
          reserva: { id: String(reservaId) },
          instalacion: { id: String(paso1.idInstalacion) },
        };
        await apiCall('/detalle-reserva-instalacion', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (grupo === 'RESERVA_EQUIPO') {
        if (!paso1.idEquipo) throw new Error('Debe seleccionar un equipo');
        const payload = {
          programaAcademico: paso2.programaAcademico ?? '',
          numeroEstudiantes: paso2.numeroEstudiantes ?? 0,
          entregaEquipo: null, // 👈 oculto en creación
          observacionesDevolucion: '',
          fechaDevolucionReal: '',
          reserva: { id: String(reservaId) },
          equipo: { id: String(paso1.idEquipo) },
          ...(paso2.idInstalacionDestino
            ? { instalacionDestino: { id: String(paso2.idInstalacionDestino) } }
            : {}),
        };
        await apiCall('/detalle-reserva-equipo', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (grupo === 'MANTENIMIENTO_INSTALACION') {
        if (!paso1.idInstalacion) throw new Error('Debe seleccionar una instalación');
        const payload: any = {
          descripcion: paso2.descripcionMantenimiento ?? '',
          // NO enviar fechaProximaMantenimiento ni resultadoMantenimiento en creación
          reserva: { id: String(reservaId) },
          instalacion: { id: String(paso1.idInstalacion) },
          ...(paso2.categoriaMantenimientoInstalacionId
            ? { categoriaMantenimientoInstalacion: { id: String(paso2.categoriaMantenimientoInstalacionId) } }
            : {}),
        };
        await apiCall('/mantenimiento-instalacion', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (grupo === 'MANTENIMIENTO_EQUIPO') {
        if (!paso1.idEquipo) throw new Error('Debe seleccionar un equipo');
        const payload: any = {
          descripcion: paso2.descripcionMantenimiento ?? '',
          // NO enviar fechaProximaMantenimiento ni resultadoMantenimiento en creación
          reserva: { id: String(reservaId) },
          equipo: { id: String(paso1.idEquipo) },
          ...(paso2.categoriaMantenimientoEquipoId
            ? { categoriaMantenimientoEquipo: { id: String(paso2.categoriaMantenimientoEquipoId) } }
            : {}),
        };
        await apiCall('/mantenimiento-equipo', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    [resolveGrupo, tiposReserva]
  );

  /** Update (solo core por ahora) */
  const updateReservaCore = useCallback(
    async (idReserva: number, values: Partial<Paso1Values>) => {
      const payload: any = {
        nombre: values.nombreReserva,
        descripcion: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
      };
      await apiCall(`/reserva/${idReserva}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    []
  );

  /** Actualizar detalle de reserva instalación */
  const updateDetalleReservaInstalacion = useCallback(
    async (idDetalle: number, values: any) => {
      const payload = {
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        programaAcademico: values.programaAcademico,
        numeroEstudiantes: values.numeroEstudiantes,
        idInstalacion: values.idInstalacion,
      };
      await apiCall(`/detalle-reserva-instalacion/${idDetalle}/actualizar-detalle-reserva`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    []
  );

  /** Actualizar detalle de reserva equipo */
  const updateDetalleReservaEquipo = useCallback(
    async (idDetalle: number, values: any) => {
      const payload = {
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
      await apiCall(`/detalle-reserva-equipo/${idDetalle}/actualizar-detalle-reserva-equipo`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    []
  );

  /** Actualizar mantenimiento instalación */
  const updateMantenimientoInstalacion = useCallback(
    async (idMantenimiento: number, values: any) => {
      const payload = {
        descripcion: values.descripcionMantenimiento,
        fechaProximaMantenimiento: values.fechaProximaMantenimiento,
        resultadoMantenimiento: values.resultadoMantenimiento,
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
      };
      await apiCall(`/mantenimiento-instalacion/${idMantenimiento}/actualizar-mantenimiento-instalacion`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    []
  );

  /** Actualizar mantenimiento equipo */
  const updateMantenimientoEquipo = useCallback(
    async (idMantenimiento: number, values: any) => {
      const payload = {
        descripcion: values.descripcionMantenimiento,
        fechaProximaMantenimiento: values.fechaProximaMantenimiento,
        resultadoMantenimiento: values.resultadoMantenimiento,
        nombreReserva: values.nombreReserva,
        descripcionReserva: values.descripcionReserva,
        fechaReserva: values.fechaReserva,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
      };
      await apiCall(`/mantenimiento-equipo/${idMantenimiento}/actualizar-mantenimiento-equipo`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    []
  );

  /** Cerrar reserva según su tipo */
  const cerrarReserva = useCallback(
    async (idDetalle: number, tipoReserva: string, values: any) => {
      const tipoReservaLower = tipoReserva.toLowerCase();
      
      if (tipoReservaLower.includes('instalacion') && !tipoReservaLower.includes('mantenimiento')) {
        // Cerrar préstamo de instalación
        await apiCall(`/detalle-reserva-instalacion/${idDetalle}/cerrar-detalle-reserva-instalacion`, {
          method: 'PUT',
          body: JSON.stringify({
            entregaInstalacion: values.entregaInstalacion
          }),
        });
      } else if (tipoReservaLower.includes('equipo') && !tipoReservaLower.includes('mantenimiento')) {
        // Cerrar préstamo de equipo
        await apiCall(`/detalle-reserva-equipo/${idDetalle}/cerrar-detalle-reserva-equipo`, {
          method: 'PUT',
          body: JSON.stringify({
            entregaEquipo: values.entregaEquipo
          }),
        });
      } else if (tipoReservaLower.includes('mantenimiento')) {
        // Cerrar mantenimiento
        if (tipoReservaLower.includes('instalacion')) {
          await apiCall(`/mantenimiento-instalacion/${idDetalle}/cerrar-mantenimiento-instalacion`, {
            method: 'PUT',
            body: JSON.stringify({
              fechaProximaMantenimiento: values.fechaProximaMantenimiento,
              resultadoMantenimiento: values.resultadoMantenimiento
            }),
          });
        } else {
          await apiCall(`/mantenimiento-equipo/${idDetalle}/cerrar-mantenimiento-equipo`, {
            method: 'PUT',
            body: JSON.stringify({
              fechaProximaMantenimiento: values.fechaProximaMantenimiento,
              resultadoMantenimiento: values.resultadoMantenimiento
            }),
          });
        }
      }
    },
    []
  );

  /** Opciones para selects */
  const tipoReservaOptions = useMemo(
    () => tiposReserva.map(t => ({ value: t.id, label: t.nombre })),
    [tiposReserva]
  );
  const equipoOptions = useMemo(
    () => equipos
      .filter(e => e.tipoEquipo?.nombre && e.tipoEquipo.nombre.trim() !== '')
      .map(e => ({ 
        value: e.id, 
        label: `${e.tipoEquipo.nombre} (${e.codigo})`
      })),
    [equipos]
  );
  const instalacionOptions = useMemo(
    () => instalaciones
      .filter(i => i.nombre && i.nombre.trim() !== '') // Filtrar instalaciones sin nombre
      .map(i => ({ value: i.id, label: i.nombre })),
    [instalaciones]
  );
  const catMtoEquipoOptions = useMemo(
    () => catMtoEquipo.map(c => ({ value: c.id, label: c.nombre })),
    [catMtoEquipo]
  );
  const catMtoInstOptions = useMemo(
    () => catMtoInst.map(c => ({ value: c.id, label: c.nombre })),
    [catMtoInst]
  );

  return {
    // tabla
    data, loading, error, fetchAll,

    // catálogos
    tiposReserva, tipoReservaOptions,
    equipos, equipoOptions,
    instalaciones, instalacionOptions,
    catMtoEquipoOptions, catMtoInstOptions,

    // disponibilidad
    horasDisponibles,
    getHorasDisponiblesEquipo,
    getHorasDisponiblesInstalacion,

    // helpers
    resolveGrupo,

    // acciones
    createReservaFlow,
    updateReservaCore,
    updateDetalleReservaInstalacion,
    updateDetalleReservaEquipo,
    updateMantenimientoInstalacion,
    updateMantenimientoEquipo,
    cerrarReserva,

    // persona seleccionada
    selectedPersona, setSelectedPersona,
  };
}