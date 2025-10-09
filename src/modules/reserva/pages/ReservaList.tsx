import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  useDisclosure,
  useToast,
  Text,
  VStack,
  Stack,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal from "../../../components/UI/GenericModal";
import GenericMultiStepModal from "../../../components/UI/GenericMultiStepModal";
import {
  type Field,
  type FieldOption,
} from "../../../components/UI/GenericModal";
import { apiCall, type ApiResponse } from "../../../api/base";
import {
  userReserva,
  type ReservaGeneral,
  type Paso1Values,
  type Paso2Values,
} from "../hooks/UserReserva";

// ---- Helpers de tiempo ----
const normalize = (t: string) => (t?.length === 5 ? `${t}:00` : t); // "HH:mm" -> "HH:mm:ss"
const add1h = (t: string) => {
  const [hh, mm, ss] = normalize(t).split(":").map(Number);
  const d = new Date(2000, 0, 1, hh, mm, ss);
  d.setHours(d.getHours() + 1);
  return d.toTimeString().slice(0, 8); // "HH:mm:ss"
};

// ---- Tipo local de Persona (búsqueda) ----
type Persona = {
  idPersona: number;
  nombres: string;
  numeroIdentificacion: string;
  apellidos?: string;
};

const ReservaList: React.FC = () => {
  const toast = useToast();

  const {
    data,
    loading,
    error,
    fetchAll,
    tipoReservaOptions,
    equipoOptions,
    instalacionOptions,
    // categorías (para mantenimiento)
    catMtoEquipoOptions,
    catMtoInstOptions,
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
  } = userReserva();

  /** Filtro por número de identificación */
  const [filtroNI, setFiltroNI] = useState("");
  const onBuscar = useCallback(() => {
    void fetchAll(filtroNI.trim() || undefined);
  }, [fetchAll, filtroNI]);

  /** Crear / Editar */
  const crearModal = useDisclosure();
  const editarReservaModal = useDisclosure();
  const cerrarReservaModal = useDisclosure();

  const [paso1, setPaso1] = useState<Paso1Values>({});
  const [paso2, setPaso2] = useState<Paso2Values>({});
  
  // Estados para edición de reserva
  const [editingReservaPaso1, setEditingReservaPaso1] = useState<Paso1Values>({});
  const [editingReservaPaso2, setEditingReservaPaso2] = useState<Paso2Values>({});
  
  const [closingReserva, setClosingReserva] = useState<{
    idReserva?: number;
    tipoReserva?: string;
    values: any;
  } | null>(null);
  const [selectedRow, setSelectedRow] = useState<ReservaGeneral | null>(null);

  // ---- Búsqueda de persona (paso 1) ----
  const [docQuery, setDocQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(
    null
  );

  // Estados para búsqueda de persona en modal de edición
  const [editingDocQuery, setEditingDocQuery] = useState("");
  const [editingIsSearching, setEditingIsSearching] = useState(false);
  const [editingSearchResults, setEditingSearchResults] = useState<Persona[]>([]);
  const [editingSelectedPersonaId, setEditingSelectedPersonaId] = useState<number | null>(null);

  //buscar persona (NO auto-seleccionar)
  const handleBuscarPersona = useCallback(async () => {
    if (!docQuery.trim()) {
      toast({ title: "Ingresa un documento", status: "warning" });
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiCall<ApiResponse<Persona[]>>(
        `/persona/persona-usuario?numeroIdentificacion=${encodeURIComponent(docQuery)}`,
        { credentials: "include" }
      );
      const list = (response as any).data ?? (response as any);
      setSearchResults(list ?? []);
      setSelectedPersonaId(null); // 👈 exigir selección explícita
      if (!list || list.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontró ninguna persona con ese documento",
          status: "info",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error en búsqueda",
        description: err?.message || "",
        status: "error",
      });
    } finally {
      setIsSearching(false);
    }
  }, [docQuery, toast]);

  // Buscar persona para modales de edición
  const handleBuscarPersonaEdicion = useCallback(async () => {
    if (!editingDocQuery.trim()) {
      toast({ title: "Ingresa un documento", status: "warning" });
      return;
    }
    setEditingIsSearching(true);
    try {
      const response = await apiCall<ApiResponse<Persona[]>>(
        `/persona/persona-usuario?numeroIdentificacion=${encodeURIComponent(editingDocQuery)}`,
        { credentials: "include" }
      );
      const list = (response as any).data ?? (response as any);
      setEditingSearchResults(list ?? []);
      setEditingSelectedPersonaId(null); // 👈 exigir selección explícita
      if (!list || list.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontró ninguna persona con ese documento",
          status: "info",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error en búsqueda",
        description: err?.message || "",
        status: "error",
      });
    } finally {
      setEditingIsSearching(false);
    }
  }, [editingDocQuery, toast]);

  /** Precargar datos para edición */
  const precargarDatosEdicion = useCallback(async (reserva: ReservaGeneral) => {
    // Preferir idTipoReserva provisto por backend; fallback por nombre
    const tipoReservaId = reserva.idTipoReserva
      ?? tipoReservaOptions.find(t => t.label === reserva.tipoReserva)?.value;
    if (!tipoReservaId) {
      toast({ title: "Error", description: "No se pudo encontrar el tipo de reserva", status: "error" });
      return;
    }

    // Determinar el grupo usando el nombre del tipo
    const grupo = resolveGrupo(reserva.tipoReserva);
    
    // Precargar datos del paso 1
    const paso1Data: Paso1Values = {
      tipoReservaId,
      nombreReserva: reserva.nombreReserva,
      descripcionReserva: reserva.descripcionReserva || "",
      fechaReserva: reserva.fechaReserva,
      horaInicio: reserva.horaInicioReserva,
      horaFin: reserva.horaFinReserva,
    };

    // Precargar recurso según el tipo
    if (grupo === 'RESERVA_EQUIPO' || grupo === 'MANTENIMIENTO_EQUIPO') {
      // Buscar el equipo por nombre (más flexible)
      const equipo = equipoOptions.find(e => 
        e.label.toLowerCase().includes((reserva.nombreEquipo || '').toLowerCase()) ||
        e.label.includes(reserva.nombreEquipo || '')
      );
      if (equipo) {
        paso1Data.idEquipo = equipo.value;
      } else {
        console.warn('No se encontró equipo:', reserva.nombreEquipo, 'en opciones:', equipoOptions);
      }
    } else if (grupo === 'RESERVA_INSTALACION' || grupo === 'MANTENIMIENTO_INSTALACION') {
      // Buscar la instalación por nombre (más flexible)
      const instalacion = instalacionOptions.find(i => 
        i.label.toLowerCase() === (reserva.nombreInstalacion || '').toLowerCase() ||
        i.label.includes(reserva.nombreInstalacion || '')
      );
      if (instalacion) {
        paso1Data.idInstalacion = instalacion.value;
      } else {
        console.warn('No se encontró instalación:', reserva.nombreInstalacion, 'en opciones:', instalacionOptions);
      }
    }

    // Precargar datos del paso 2
    const paso2Data: Paso2Values = {};

    if (grupo === 'RESERVA_INSTALACION' || grupo === 'RESERVA_EQUIPO') {
      paso2Data.programaAcademico = reserva.programaAcademico || "";
      paso2Data.numeroEstudiantes = reserva.numeroEstudiantes || 0;
      
      if (grupo === 'RESERVA_EQUIPO' && reserva.idInstalacionDestino) {
        paso2Data.idInstalacionDestino = reserva.idInstalacionDestino;
      }
    } else if (grupo === 'MANTENIMIENTO_INSTALACION' || grupo === 'MANTENIMIENTO_EQUIPO') {
      paso2Data.descripcionMantenimiento = reserva.descripcionMantenimiento || "";
      if (reserva.idCategoriaMantenimiento) {
        if (grupo === 'MANTENIMIENTO_INSTALACION') {
          paso2Data.categoriaMantenimientoInstalacionId = reserva.idCategoriaMantenimiento;
        } else {
          paso2Data.categoriaMantenimientoEquipoId = reserva.idCategoriaMantenimiento;
        }
      }
    }

    setEditingReservaPaso1(paso1Data);
    setEditingReservaPaso2(paso2Data);

    // Precargar persona y selección explícita
    setEditingDocQuery(reserva.numeroIdentificacion);
    setEditingSearchResults([{
      idPersona: reserva.idPersona,
      nombres: reserva.nombrePersona,
      numeroIdentificacion: reserva.numeroIdentificacion,
      apellidos: ""
    }]);
    setEditingSelectedPersonaId(reserva.idPersona);

    // Consultar disponibilidad automáticamente para cargar las horas
    try {
      if (grupo === 'RESERVA_EQUIPO' || grupo === 'MANTENIMIENTO_EQUIPO') {
        if (paso1Data.idEquipo && paso1Data.fechaReserva) {
          const idDetalle = grupo === 'RESERVA_EQUIPO' ? reserva.idDetalleRerservaEquipo : reserva.idMantenimientoEquipo;
          await getHorasDisponiblesEquipo(paso1Data.fechaReserva, paso1Data.idEquipo, idDetalle || undefined);
        }
      } else {
        if (paso1Data.idInstalacion && paso1Data.fechaReserva) {
          const idDetalle = grupo === 'RESERVA_INSTALACION' ? reserva.idDetalleRerservaInstalacion : reserva.idMantenimientoInstalacion;
          await getHorasDisponiblesInstalacion(paso1Data.fechaReserva, paso1Data.idInstalacion, idDetalle || undefined);
        }
      }
    } catch (error) {
      console.warn('Error consultando disponibilidad:', error);
    }
  }, [tipoReservaOptions, equipoOptions, instalacionOptions, resolveGrupo, getHorasDisponiblesEquipo, getHorasDisponiblesInstalacion, toast]);

  /** Limpiar datos al cambiar tipo de reserva */
  const limpiarDatosAlCambiarTipo = useCallback(() => {
    setEditingReservaPaso1(prev => ({
      ...prev,
      idEquipo: undefined,
      idInstalacion: undefined,
      horaInicio: undefined,
      horaFin: undefined,
    }));
    setEditingReservaPaso2({});
    // No podemos limpiar horasDisponibles aquí porque no tenemos acceso directo
    // Se limpiará automáticamente cuando se consulte disponibilidad
  }, []);

  /** Campos paso 1 (dinámicos según selección de tipo) */
  const step1Fields: Field<any>[] = useMemo<Field<any>[]>(() => {
    const tipoSel = tipoReservaOptions.find(
      (t) => t.value === paso1.tipoReservaId
    );
    const grupo = tipoSel ? resolveGrupo(tipoSel.label) : null;

    const common: Field<any>[] = [
      {
        name: "tipoReservaId",
        label: "Tipo de Reserva",
        type: "select",
        required: true,
        options: tipoReservaOptions as FieldOption[],
      },
      {
        name: "nombreReserva",
        label: "Nombre de la reserva",
        type: "text",
        required: true,
      },
      {
        name: "descripcionReserva",
        label: "Descripción de la reserva",
        type: "textarea",
      },
      {
        name: "fechaReserva",
        label: "Fecha de la reserva",
        type: "date",
        required: true,
      },
    ];

    const recursoField: Field<any>[] = !grupo
      ? []
      : grupo === "RESERVA_EQUIPO" || grupo === "MANTENIMIENTO_EQUIPO"
        ? [
            {
              name: "idEquipo",
              label: "Equipo",
              type: "select",
              required: true,
              options: equipoOptions as FieldOption[],
            },
          ]
        : [
            {
              name: "idInstalacion",
              label: "Instalación",
              type: "select",
              required: true,
              options: instalacionOptions as FieldOption[],
            },
          ];

    // ⚠️ OJO: NO incluimos horaInicio/horaFin aquí. Los mostramos en el footer
    // después de presionar "Buscar disponibilidad", con la regla de contigüidad.
    return [...common, ...recursoField];
  }, [
    equipoOptions,
    instalacionOptions,
    paso1.tipoReservaId,
    resolveGrupo,
    tipoReservaOptions,
  ]);

  /** Campos paso 1 para editar reserva (dinámicos según selección de tipo) */
  const editReservaStep1Fields: Field<any>[] = useMemo<Field<any>[]>(() => {
    const tipoSel = tipoReservaOptions.find(
      (t) => t.value === editingReservaPaso1.tipoReservaId
    );
    const grupo = tipoSel ? resolveGrupo(tipoSel.label) : null;

    const common: Field<any>[] = [
      {
        name: "tipoReservaId",
        label: "Tipo de Reserva",
        type: "select",
        required: true,
        options: tipoReservaOptions as FieldOption[],
      },
      {
        name: "nombreReserva",
        label: "Nombre de la reserva",
        type: "text",
        required: true,
      },
      {
        name: "descripcionReserva",
        label: "Descripción de la reserva",
        type: "textarea",
      },
      {
        name: "fechaReserva",
        label: "Fecha de la reserva",
        type: "date",
        required: true,
      },
    ];

    const recursoField: Field<any>[] = !grupo
      ? []
      : grupo === "RESERVA_EQUIPO" || grupo === "MANTENIMIENTO_EQUIPO"
        ? [
            {
              name: "idEquipo",
              label: "Equipo",
              type: "select",
              required: true,
              options: equipoOptions as FieldOption[],
            },
          ]
        : [
            {
              name: "idInstalacion",
              label: "Instalación",
              type: "select",
              required: true,
              options: instalacionOptions as FieldOption[],
            },
          ];

    return [...common, ...recursoField];
  }, [
    equipoOptions,
    instalacionOptions,
    editingReservaPaso1.tipoReservaId,
    resolveGrupo,
    tipoReservaOptions,
  ]);

  /** Campos paso 2 (según grupo) */
  const step2Fields: Field<any>[] = useMemo<Field<any>[]>(() => {
    const tipoSel = tipoReservaOptions.find(
      (t) => t.value === paso1.tipoReservaId
    );
    const grupo = tipoSel ? resolveGrupo(tipoSel.label) : null;

    if (!grupo) return [];

    if (grupo === "RESERVA_INSTALACION") {
      return [
        {
          name: "programaAcademico",
          label: "Programa Académico",
          type: "text",
          required: true,
        },
        {
          name: "numeroEstudiantes",
          label: "Número de Estudiantes",
          type: "number",
          required: true,
        },
      ];
    }
    if (grupo === "RESERVA_EQUIPO") {
      return [
        {
          name: "programaAcademico",
          label: "Programa Académico",
          type: "text",
          required: true,
        },
        {
          name: "numeroEstudiantes",
          label: "Número de Estudiantes",
          type: "number",
          required: true,
        },
        {
          name: "idInstalacionDestino",
          label: "Instalación Destino",
          type: "select",
          options: instalacionOptions as FieldOption[],
        },
      ];
    }
    if (grupo === "MANTENIMIENTO_INSTALACION") {
      return [
        {
          name: "descripcionMantenimiento",
          label: "Descripción del mantenimiento",
          type: "textarea",
        },
        {
          name: "categoriaMantenimientoInstalacionId",
          label: "Categoría mantenimiento",
          type: "select",
          required: true,
          options: catMtoInstOptions as FieldOption[],
        },
      ];
    }
    if (grupo === "MANTENIMIENTO_EQUIPO") {
      return [
        {
          name: "descripcionMantenimiento",
          label: "Descripción del mantenimiento",
          type: "textarea",
        },
        {
          name: "categoriaMantenimientoEquipoId",
          label: "Categoría mantenimiento",
          type: "select",
          required: true,
          options: catMtoEquipoOptions as FieldOption[],
        },
      ];
    }
    return [];
  }, [
    catMtoEquipoOptions,
    catMtoInstOptions,
    instalacionOptions,
    paso1.tipoReservaId,
    resolveGrupo,
    tipoReservaOptions,
  ]);

  /** Campos paso 2 para editar reserva (según grupo) */
  const editReservaStep2Fields: Field<any>[] = useMemo<Field<any>[]>(() => {
    const tipoSel = tipoReservaOptions.find(
      (t) => t.value === editingReservaPaso1.tipoReservaId
    );
    const grupo = tipoSel ? resolveGrupo(tipoSel.label) : null;

    if (!grupo) return [];

    if (grupo === "RESERVA_INSTALACION") {
      return [
        {
          name: "programaAcademico",
          label: "Programa Académico",
          type: "text",
          required: true,
        },
        {
          name: "numeroEstudiantes",
          label: "Número de Estudiantes",
          type: "number",
          required: true,
        },
      ];
    }
    if (grupo === "RESERVA_EQUIPO") {
      return [
        {
          name: "programaAcademico",
          label: "Programa Académico",
          type: "text",
          required: true,
        },
        {
          name: "numeroEstudiantes",
          label: "Número de Estudiantes",
          type: "number",
          required: true,
        },
        {
          name: "idInstalacionDestino",
          label: "Instalación Destino",
          type: "select",
          options: instalacionOptions as FieldOption[],
        },
      ];
    }
    if (grupo === "MANTENIMIENTO_INSTALACION") {
      return [
        {
          name: "descripcionMantenimiento",
          label: "Descripción del mantenimiento",
          type: "textarea",
        },
        {
          name: "categoriaMantenimientoInstalacionId",
          label: "Categoría mantenimiento",
          type: "select",
          required: true,
          options: catMtoInstOptions as FieldOption[],
        },
      ];
    }
    if (grupo === "MANTENIMIENTO_EQUIPO") {
      return [
        {
          name: "descripcionMantenimiento",
          label: "Descripción del mantenimiento",
          type: "textarea",
        },
        {
          name: "categoriaMantenimientoEquipoId",
          label: "Categoría mantenimiento",
          type: "select",
          required: true,
          options: catMtoEquipoOptions as FieldOption[],
        },
      ];
    }
    return [];
  }, [
    catMtoEquipoOptions,
    catMtoInstOptions,
    instalacionOptions,
    editingReservaPaso1.tipoReservaId,
    resolveGrupo,
    tipoReservaOptions,
  ]);

  /** Acciones para Tabla */
  const columns: Column<ReservaGeneral>[] = useMemo(
    () => [
      { key: "tipoReserva", label: "Tipo" },
      { key: "nombreReserva", label: "Reserva" },
      { key: "nombrePersona", label: "Persona" },
      { key: "numeroIdentificacion", label: "N° ID" },
      { key: "nombreInstalacion", label: "Instalación", hideOnMobile: true },
      { key: "fechaReserva", label: "Fecha" },
      { key: "horaInicioReserva", label: "Inicio", hideOnMobile: true },
      { key: "horaFinReserva", label: "Fin", hideOnMobile: true },
      { key: "nombreEquipo", label: "Equipo/Tipo", hideOnMobile: true },
      { key: "tipoMantenimiento", label: "Tipo Mto.", hideOnMobile: true },
      {
        key: "estadoReserva",
        label: "Estado Reserva",
        render: (r) => {
          const v = r.estadoReserva;
          const isTrue = String(v) === "true";
          return (
            <Box
              as="span"
              px={2}
              py={1}
              borderRadius="md"
              bg={isTrue ? "green.100" : "red.100"}
              color={isTrue ? "green.800" : "red.800"}
              fontSize="sm"
            >
              {isTrue ? "Activa" : "Cerrada"}
            </Box>
          );
        },
      },
      {
        key: "estadoDetalle",
        label: "Estado Detalle/Mto",
        render: (r) => {
          const v = r.estadoDetalle ?? r.estadoMantenimiento;
          if (v == null) return "—";
          const isTrue = String(v) === "true";
          return (
            <Box
              as="span"
              px={2}
              py={1}
              borderRadius="md"
              bg={isTrue ? "green.100" : "red.100"}
              color={isTrue ? "green.800" : "red.800"}
              fontSize="sm"
            >
              {isTrue ? "Abierto" : "Cerrado"}
            </Box>
          );
        },
      },
      {
        key: "actions",
        label: "Acciones",
        render: (r) => (
          <HStack>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={async () => {
                setSelectedRow(r);
                await precargarDatosEdicion(r);
                editarReservaModal.onOpen();
              }}
            >
              Editar reserva
            </Button>

              <Button
                size="sm"
              colorScheme="red"
                variant="ghost"
                onClick={() => {
                  setSelectedRow(r);
                setClosingReserva({
                  idReserva: r.idReserva,
                  tipoReserva: r.tipoReserva,
                  values: {}
                });
                cerrarReservaModal.onOpen();
              }}
            >
              Cerrar reserva
              </Button>
          </HStack>
        ),
      },
    ],
    [toast]
  );

  /** Consultar disponibilidad (botón en paso 1) */
  const handleConsultarDisponibilidad = useCallback(async () => {
    try {
      const tipoSel = tipoReservaOptions.find(
        (t) => t.value === paso1.tipoReservaId
      );
      if (!tipoSel) {
        toast({ title: "Selecciona tipo de reserva", status: "warning" });
        return;
      }
      if (!paso1.fechaReserva) {
        toast({ title: "Selecciona fecha", status: "warning" });
        return;
      }

      const grupo = resolveGrupo(tipoSel.label);
      if (grupo === "RESERVA_EQUIPO" || grupo === "MANTENIMIENTO_EQUIPO") {
        if (!paso1.idEquipo) {
          toast({ title: "Selecciona equipo", status: "warning" });
          return;
        }
        await getHorasDisponiblesEquipo(paso1.fechaReserva, paso1.idEquipo);
      } else {
        if (!paso1.idInstalacion) {
          toast({ title: "Selecciona instalación", status: "warning" });
          return;
        }
        await getHorasDisponiblesInstalacion(
          paso1.fechaReserva,
          paso1.idInstalacion
        );
      }

      // Limpia selección de horas al refrescar disponibilidad
      setPaso1((prev) => ({
        ...prev,
        horaInicio: undefined,
        horaFin: undefined,
      }));

      toast({
        title: "Disponibilidad cargada",
        status: "success",
        duration: 1500,
      });
    } catch (err: any) {
      toast({
        title: "Error consultando disponibilidad",
        description: err.message,
        status: "error",
      });
    }
  }, [
    getHorasDisponiblesEquipo,
    getHorasDisponiblesInstalacion,
    paso1.fechaReserva,
    paso1.idEquipo,
    paso1.idInstalacion,
    paso1.tipoReservaId,
    resolveGrupo,
    tipoReservaOptions,
    toast,
  ]);

  /** Consultar disponibilidad para editar reserva */
  const handleConsultarDisponibilidadEdicion = useCallback(async (idDetalle?: number) => {
    try {
      const tipoSel = tipoReservaOptions.find(
        (t) => t.value === editingReservaPaso1.tipoReservaId
      );
      if (!tipoSel) {
        toast({ title: "Selecciona tipo de reserva", status: "warning" });
        return;
      }
      if (!editingReservaPaso1.fechaReserva) {
        toast({ title: "Selecciona fecha", status: "warning" });
        return;
      }

      const grupo = resolveGrupo(tipoSel.label);
      if (grupo === "RESERVA_EQUIPO" || grupo === "MANTENIMIENTO_EQUIPO") {
        if (!editingReservaPaso1.idEquipo) {
          toast({ title: "Selecciona equipo", status: "warning" });
          return;
        }
        await getHorasDisponiblesEquipo(editingReservaPaso1.fechaReserva, editingReservaPaso1.idEquipo, idDetalle);
      } else {
        if (!editingReservaPaso1.idInstalacion) {
          toast({ title: "Selecciona instalación", status: "warning" });
          return;
        }
        await getHorasDisponiblesInstalacion(
          editingReservaPaso1.fechaReserva,
          editingReservaPaso1.idInstalacion,
          idDetalle
        );
      }

      // Limpia selección de horas al refrescar disponibilidad
      setEditingReservaPaso1((prev) => ({
        ...prev,
        horaInicio: undefined,
        horaFin: undefined,
      }));

      toast({
        title: "Disponibilidad cargada",
        status: "success",
        duration: 1500,
      });
    } catch (err: any) {
      toast({
        title: "Error consultando disponibilidad",
        description: err.message,
        status: "error",
      });
    }
  }, [
    getHorasDisponiblesEquipo,
    getHorasDisponiblesInstalacion,
    editingReservaPaso1.fechaReserva,
    editingReservaPaso1.idEquipo,
    editingReservaPaso1.idInstalacion,
    editingReservaPaso1.tipoReservaId,
    resolveGrupo,
    tipoReservaOptions,
    toast,
  ]);

  // ---- Opciones de hora con regla de contigüidad ----
  const horaInicioOptions: FieldOption[] = useMemo(
    () =>
      (horasDisponibles ?? []).map((h) => {
        const hhmmss = normalize(h);
        return { value: hhmmss, label: hhmmss.slice(0, 5) };
      }),
    [horasDisponibles]
  );

  const horaFinOptions: FieldOption[] = useMemo(() => {
    const start = paso1.horaInicio ? normalize(paso1.horaInicio) : null;
    if (!start) return [];
    const avail = new Set((horasDisponibles ?? []).map(normalize));
    // Construye la cadena contigua: start+1, +2, ... mientras exista en disponibilidad
    const res: FieldOption[] = [];
    let cursor = add1h(start);
    while (avail.has(cursor)) {
      res.push({ value: cursor, label: cursor.slice(0, 5) });
      cursor = add1h(cursor);
    }
    return res;
  }, [horasDisponibles, paso1.horaInicio]);

  // Opciones de hora para editar reserva
  const editReservaHoraInicioOptions: FieldOption[] = useMemo(
    () =>
      (horasDisponibles ?? []).map((h) => {
        const hhmmss = normalize(h);
        return { value: hhmmss, label: hhmmss.slice(0, 5) };
      }),
    [horasDisponibles]
  );

  const editReservaHoraFinOptions: FieldOption[] = useMemo(() => {
    const start = editingReservaPaso1.horaInicio ? normalize(editingReservaPaso1.horaInicio) : null;
    if (!start) return [];
    const avail = new Set((horasDisponibles ?? []).map(normalize));
    // Construye la cadena contigua: start+1, +2, ... mientras exista en disponibilidad
    const res: FieldOption[] = [];
    let cursor = add1h(start);
    while (avail.has(cursor)) {
      res.push({ value: cursor, label: cursor.slice(0, 5) });
      cursor = add1h(cursor);
    }
    return res;
  }, [horasDisponibles, editingReservaPaso1.horaInicio]);

  /** Guardar edición de reserva multi-paso */
  const handleEditarReserva = useCallback(
    async (allValues: Record<number, Record<string, any>>) => {
      if (!selectedRow?.idReserva) return;
      
      try {
        const paso1Values = allValues[0] as Paso1Values;
        const paso2Values = allValues[1] as Paso2Values;
        
        // Validar persona seleccionada
        if (!editingSelectedPersonaId) {
          toast({
            title: 'Selecciona una persona',
            description: 'Busca y selecciona una persona por documento',
            status: 'warning',
          });
          throw new Error('Persona requerida');
        }

        // Actualizar reserva core
        await updateReservaCore(selectedRow.idReserva, paso1Values);
        
        // Actualizar asociado según el tipo
        const tipoReserva = selectedRow.tipoReserva.toLowerCase();
        
        // Determinar el ID del asociado según el tipo
        let idAsociado: number | null = null;
        if (tipoReserva.includes('instalacion') && !tipoReserva.includes('mantenimiento')) {
          idAsociado = selectedRow.idDetalleRerservaInstalacion || null;
        } else if (tipoReserva.includes('equipo') && !tipoReserva.includes('mantenimiento')) {
          idAsociado = selectedRow.idDetalleRerservaEquipo || null;
        } else if (tipoReserva.includes('mantenimiento')) {
          if (tipoReserva.includes('instalacion')) {
            idAsociado = selectedRow.idMantenimientoInstalacion || null;
          } else {
            idAsociado = selectedRow.idMantenimientoEquipo || null;
          }
        }
        
        if (idAsociado) {
          if (tipoReserva.includes('instalacion') && !tipoReserva.includes('mantenimiento')) {
            await updateDetalleReservaInstalacion(idAsociado, { ...paso1Values, ...paso2Values });
          } else if (tipoReserva.includes('equipo') && !tipoReserva.includes('mantenimiento')) {
            await updateDetalleReservaEquipo(idAsociado, { ...paso1Values, ...paso2Values });
          } else if (tipoReserva.includes('mantenimiento')) {
            if (tipoReserva.includes('instalacion')) {
              await updateMantenimientoInstalacion(idAsociado, { ...paso1Values, ...paso2Values });
            } else {
              await updateMantenimientoEquipo(idAsociado, { ...paso1Values, ...paso2Values });
            }
          }
        }

        toast({ 
          title: "Reserva actualizada", 
          description: "La reserva se ha actualizado exitosamente",
          status: "success" 
        });
        editarReservaModal.onClose();
        await fetchAll();
      } catch (error: any) {
        toast({
          title: "Error al actualizar reserva",
          description: error?.message || "Ocurrió un error inesperado",
          status: "error",
        });
      }
    },
    [selectedRow, editingSelectedPersonaId, updateReservaCore, updateDetalleReservaInstalacion, updateDetalleReservaEquipo, updateMantenimientoInstalacion, updateMantenimientoEquipo, editarReservaModal, fetchAll, toast]
  );

  /** Cerrar reserva */
  const handleCerrarReserva = useCallback(
    async (values: any) => {
      if (!closingReserva?.idReserva || !closingReserva?.tipoReserva || !selectedRow) return;
      
      try {
        const tipoReserva = closingReserva.tipoReserva.toLowerCase();
        
        // Determinar el ID del asociado según el tipo
        let idDetalle: number | null = null;
        if (tipoReserva.includes('instalacion') && !tipoReserva.includes('mantenimiento')) {
          idDetalle = selectedRow.idDetalleRerservaInstalacion || null;
        } else if (tipoReserva.includes('equipo') && !tipoReserva.includes('mantenimiento')) {
          idDetalle = selectedRow.idDetalleRerservaEquipo || null;
        } else if (tipoReserva.includes('mantenimiento')) {
          if (tipoReserva.includes('instalacion')) {
            idDetalle = selectedRow.idMantenimientoInstalacion || null;
          } else {
            idDetalle = selectedRow.idMantenimientoEquipo || null;
          }
        }
        
        if (!idDetalle) {
          toast({
            title: "ID del asociado no disponible",
            description: "No se pudo determinar el ID del detalle o mantenimiento",
            status: "warning",
          });
          return;
        }
        
        await cerrarReserva(idDetalle, closingReserva.tipoReserva, values);
        toast({ 
          title: "Reserva cerrada", 
          description: "La reserva se ha cerrado exitosamente",
          status: "success" 
        });
        cerrarReservaModal.onClose();
        setClosingReserva(null);
      await fetchAll();
      } catch (error: any) {
        toast({
          title: "Error al cerrar reserva",
          description: error?.message || "Ocurrió un error inesperado",
          status: "error",
        });
      }
    },
    [closingReserva, selectedRow, cerrarReserva, cerrarReservaModal, fetchAll, toast]
  );


  /** Campos del modal de cerrar reserva (dinámicos según tipo) */
  const cerrarReservaFields: Field<any>[] = useMemo(() => {
    if (!closingReserva?.tipoReserva) return [];

    const tipoReserva = closingReserva.tipoReserva.toLowerCase();
    
    if (tipoReserva.includes('instalacion') && !tipoReserva.includes('mantenimiento')) {
      // Préstamo de instalación
      return [
        {
          name: "entregaInstalacion",
          label: "Entrega instalación",
          type: "textarea",
        required: true,
          placeholder: "Comentario sobre la devolución de la instalación"
        }
      ];
    } else if (tipoReserva.includes('equipo') && !tipoReserva.includes('mantenimiento')) {
      // Préstamo de equipo
      return [
        {
          name: "entregaEquipo",
          label: "Entrega equipo",
          type: "textarea",
          required: true,
          placeholder: "Comentario sobre la devolución del equipo"
        }
      ];
    } else if (tipoReserva.includes('mantenimiento')) {
      // Mantenimiento (instalación o equipo)
      return [
        {
          name: "fechaProximaMantenimiento",
          label: "Fecha próximo mantenimiento",
          type: "date",
          required: true
        },
        {
          name: "resultadoMantenimiento",
          label: "Resultado mantenimiento",
          type: "textarea",
          required: true,
          placeholder: "Descripción del resultado del mantenimiento"
        }
      ];
    }
    
    return [];
  }, [closingReserva?.tipoReserva]);

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Reservas
      </Heading>

      <HStack mb={4} spacing={3} flexWrap="wrap">
        <Input
          placeholder="Filtrar por número de identificación"
          value={filtroNI}
          onChange={(e) => setFiltroNI(e.target.value)}
          maxW="320px"
        />
        <Button onClick={onBuscar} isLoading={loading} variant="outline">
          Buscar
        </Button>
        <Button colorScheme="blue" onClick={crearModal.onOpen}>
          Crear Reserva
        </Button>
        <Button variant="ghost" onClick={() => fetchAll()} isLoading={loading}>
          Actualizar
        </Button>
      </HStack>

      <DataTable<ReservaGeneral>
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        keyExtractor={(r) => (r as any)._key ?? r.idReserva ?? r.nombreReserva}
        emptyMessage="No hay reservas"
      />

      {/* Modal: Crear Reserva (Multi-step) */}
      <GenericMultiStepModal
        isOpen={crearModal.isOpen}
        onClose={() => {
          crearModal.onClose();
          setDocQuery("");
          setPaso1({});
          setPaso2({});
        }}
        modalTitle="Crear Reserva"
        saveButtonText="Guardar"
        steps={[
          {
            title: "Datos de la reserva",
            fields: step1Fields,
            initialValues: paso1,
            onSave: async (values) => {
              setPaso1((prev) => ({ ...prev, ...(values as Paso1Values) }));
            },
          },
          {
            title: "Información asociada",
            fields: step2Fields,
            initialValues: paso2,
            onSave: async (values) => {
              setPaso2((prev) => ({ ...prev, ...(values as Paso2Values) }));
            },
          },
        ]}
        onStepValuesChange={useCallback((idx: number, values: Record<string, any>) => {
          if (idx === 0) setPaso1(values as Paso1Values);
          if (idx === 1) setPaso2(values as Paso2Values);
        }, [])}
        // 🔎 Header del paso 1: búsqueda por documento + persona seleccionada
        renderStepHeader={(idx) =>
          idx === 0 ? (
            <VStack align="stretch" mb={3} spacing={3}>
              <Text fontWeight="semibold">
                Persona (buscar y seleccionar por documento)
              </Text>
              <HStack>
                <Input
                  placeholder="Número de documento"
                  value={docQuery}
                  onChange={(e) => setDocQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarPersona()}
                />
                <Button
                  onClick={handleBuscarPersona}
                  isLoading={isSearching}
                  colorScheme="blue"
                >
                  Buscar
                </Button>
              </HStack>

              {/* Resultado: lista seleccionable */}
              {searchResults.length > 0 ? (
                <Box borderWidth={1} borderRadius="md" p={3} bg="gray.50">
                  <Text fontSize="sm" mb={2}>
                    Resultados ({searchResults.length}) — selecciona una
                    persona:
                  </Text>
                  <RadioGroup
                    value={selectedPersonaId ? String(selectedPersonaId) : ""}
                    onChange={(val) => setSelectedPersonaId(Number(val))}
                  >
                    <Stack spacing={2}>
                      {searchResults.map((p) => (
                        <Radio key={p.idPersona} value={String(p.idPersona)}>
                          <Text>
                            <b>
                              {p.nombres} {p.apellidos ?? ""}
                            </b>{" "}
                            — {p.numeroIdentificacion} (ID: {p.idPersona})
                          </Text>
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  Busca por documento y selecciona una persona.
                </Text>
              )}
            </VStack>
          ) : null
        }
        // ⚙️ Footer del paso 1: botón de disponibilidad + selects de horas (regla contigua)
        renderStepFooter={(idx) =>
          idx === 0 ? (
            <VStack align="stretch" mt={2} spacing={3}>
              <Button
                size="sm"
                variant="outline"
                onClick={handleConsultarDisponibilidad}
              >
                Buscar disponibilidad
              </Button>
              <Text fontSize="sm" color="gray.500">
                Selecciona tipo, fecha y (equipo o instalación), luego busca
                disponibilidad para cargar horas.
              </Text>

              <HStack>
                <FormControl isRequired>
                  <FormLabel>Hora inicio</FormLabel>
                  <Select
                    placeholder={horaInicioOptions.length ? "Seleccionar" : "—"}
                    value={paso1.horaInicio ?? ""}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      setPaso1((prev) => ({
                        ...prev,
                        horaInicio: val,
                        horaFin: undefined,
                      }));
                    }}
                    isDisabled={horaInicioOptions.length === 0}
                  >
                    {horaInicioOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Hora fin</FormLabel>
                  <Select
                    placeholder={horaFinOptions.length ? "Seleccionar" : "—"}
                    value={paso1.horaFin ?? ""}
                    onChange={(e) =>
                      setPaso1((prev) => ({
                        ...prev,
                        horaFin: e.target.value || undefined,
                      }))
                    }
                    isDisabled={
                      !paso1.horaInicio || horaFinOptions.length === 0
                    }
                  >
                    {horaFinOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <Text fontSize="sm" color="gray.500">
                La hora fin solo permite bloques contiguos a partir de la hora
                inicio (12:00 → 13:00 → 14:00…).
              </Text>
            </VStack>
          ) : null
        }
        // ✅ Al presionar Guardar, ejecuta onSave de cada paso y luego este onSubmit:
onSubmit={async () => {
  // Validación de persona seleccionada
  if (!selectedPersonaId) {
    toast({
      title: 'Selecciona una persona',
      description: 'Busca y selecciona una persona por documento',
      status: 'warning',
    });
    throw new Error('Persona requerida');
  }

  // Validación de campos requeridos del paso 1
  const paso1Errors: string[] = [];
  if (!paso1.tipoReservaId) paso1Errors.push('Tipo de reserva');
  if (!paso1.nombreReserva?.trim()) paso1Errors.push('Nombre de la reserva');
  if (!paso1.fechaReserva) paso1Errors.push('Fecha de la reserva');
  if (!paso1.horaInicio || !paso1.horaFin) paso1Errors.push('Horas de inicio y fin');
  
  // Validar recurso según el tipo
  const tipoSel = tipoReservaOptions.find(t => t.value === paso1.tipoReservaId);
  const grupo = tipoSel ? resolveGrupo(tipoSel.label) : null;
  if (grupo === 'RESERVA_EQUIPO' || grupo === 'MANTENIMIENTO_EQUIPO') {
    if (!paso1.idEquipo) paso1Errors.push('Equipo');
  } else if (grupo === 'RESERVA_INSTALACION' || grupo === 'MANTENIMIENTO_INSTALACION') {
    if (!paso1.idInstalacion) paso1Errors.push('Instalación');
  }

  if (paso1Errors.length > 0) {
    toast({
      title: 'Campos requeridos del paso 1',
      description: `Completa: ${paso1Errors.join(', ')}`,
      status: 'warning',
    });
    throw new Error('Campos del paso 1 requeridos');
  }

  // Validación de campos requeridos del paso 2
  const paso2Errors: string[] = [];
  if (grupo === 'RESERVA_INSTALACION' || grupo === 'RESERVA_EQUIPO') {
    if (!paso2.programaAcademico?.trim()) paso2Errors.push('Programa académico');
    if (!paso2.numeroEstudiantes || paso2.numeroEstudiantes <= 0) paso2Errors.push('Número de estudiantes');
  } else if (grupo === 'MANTENIMIENTO_INSTALACION') {
    if (!paso2.categoriaMantenimientoInstalacionId) paso2Errors.push('Categoría de mantenimiento');
  } else if (grupo === 'MANTENIMIENTO_EQUIPO') {
    if (!paso2.categoriaMantenimientoEquipoId) paso2Errors.push('Categoría de mantenimiento');
  }

  if (paso2Errors.length > 0) {
    toast({
      title: 'Campos requeridos del paso 2',
      description: `Completa: ${paso2Errors.join(', ')}`,
      status: 'warning',
    });
    throw new Error('Campos del paso 2 requeridos');
  }

  await createReservaFlow(selectedPersonaId, paso1, paso2); // 👈 usa la selección explícita
  await fetchAll();
}}
      />


      {/* Modal: Cerrar Reserva */}
      <GenericModal
        isOpen={cerrarReservaModal.isOpen}
        onClose={() => {
          cerrarReservaModal.onClose();
          setClosingReserva(null);
        }}
        title="Cerrar Reserva"
        fields={cerrarReservaFields}
        initialValues={closingReserva?.values ?? {}}
        onSave={handleCerrarReserva}
        saveButtonText="Cerrar Reserva"
        cancelButtonText="Cancelar"
      />

      {/* Modal: Editar Reserva (Multi-step) */}
      <GenericMultiStepModal
        isOpen={editarReservaModal.isOpen}
        onClose={() => {
          editarReservaModal.onClose();
          setEditingReservaPaso1({});
          setEditingReservaPaso2({});
          setEditingDocQuery("");
          setEditingSearchResults([]);
          setEditingSelectedPersonaId(null);
        }}
        modalTitle="Editar Reserva"
        saveButtonText="Actualizar"
        steps={[
          {
            title: "Datos de la reserva",
            fields: editReservaStep1Fields,
            initialValues: editingReservaPaso1,
            onSave: async (values) => {
              setEditingReservaPaso1((prev) => ({ ...prev, ...(values as Paso1Values) }));
            },
          },
          {
            title: "Información asociada",
            fields: editReservaStep2Fields,
            initialValues: editingReservaPaso2,
            onSave: async (values) => {
              setEditingReservaPaso2((prev) => ({ ...prev, ...(values as Paso2Values) }));
            },
          },
        ]}
        onStepValuesChange={useCallback((idx: number, values: Record<string, any>) => {
          if (idx === 0) {
            const newValues = values as Paso1Values;
            const oldTipoReservaId = editingReservaPaso1.tipoReservaId;
            
            // Si cambió el tipo de reserva, limpiar todos los datos
            if (oldTipoReservaId && newValues.tipoReservaId !== oldTipoReservaId) {
              limpiarDatosAlCambiarTipo();
              setEditingReservaPaso1(newValues);
              return;
            }
            
            setEditingReservaPaso1(newValues);
            
            // Si cambió fecha, equipo o instalación, consultar disponibilidad automáticamente
            const changedDate = newValues.fechaReserva !== editingReservaPaso1.fechaReserva;
            const changedEquipo = newValues.idEquipo !== editingReservaPaso1.idEquipo;
            const changedInstalacion = newValues.idInstalacion !== editingReservaPaso1.idInstalacion;
            
            if (changedDate || changedEquipo || changedInstalacion) {
              // Determinar el ID del detalle para excluir de la consulta
              let idDetalle: number | undefined;
              if (selectedRow) {
                const tipoReserva = selectedRow.tipoReserva.toLowerCase();
                if (tipoReserva.includes('instalacion') && !tipoReserva.includes('mantenimiento')) {
                  idDetalle = selectedRow.idDetalleRerservaInstalacion || undefined;
                } else if (tipoReserva.includes('equipo') && !tipoReserva.includes('mantenimiento')) {
                  idDetalle = selectedRow.idDetalleRerservaEquipo || undefined;
                } else if (tipoReserva.includes('mantenimiento')) {
                  if (tipoReserva.includes('instalacion')) {
                    idDetalle = selectedRow.idMantenimientoInstalacion || undefined;
                  } else {
                    idDetalle = selectedRow.idMantenimientoEquipo || undefined;
                  }
                }
              }
              
              // Consultar disponibilidad automáticamente
              setTimeout(() => {
                handleConsultarDisponibilidadEdicion(idDetalle);
              }, 100);
            }
          }
          if (idx === 1) setEditingReservaPaso2(values as Paso2Values);
        }, [editingReservaPaso1, limpiarDatosAlCambiarTipo, selectedRow, handleConsultarDisponibilidadEdicion])}
        // 🔎 Header del paso 1: búsqueda por documento + persona seleccionada
        renderStepHeader={(idx) =>
          idx === 0 ? (
            <VStack align="stretch" mb={3} spacing={3}>
              <Text fontWeight="semibold">
                Persona (buscar y seleccionar por documento)
              </Text>
              <HStack>
                <Input
                  placeholder="Número de documento"
                  value={editingDocQuery}
                  onChange={(e) => setEditingDocQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarPersonaEdicion()}
                />
                <Button
                  onClick={handleBuscarPersonaEdicion}
                  isLoading={editingIsSearching}
                  colorScheme="blue"
                >
                  Buscar
                </Button>
              </HStack>

              {/* Resultado: lista seleccionable */}
              {editingSearchResults.length > 0 ? (
                <Box borderWidth={1} borderRadius="md" p={3} bg="gray.50">
                  <Text fontSize="sm" mb={2}>
                    Resultados ({editingSearchResults.length}) — selecciona una
                    persona:
                  </Text>
                  <RadioGroup
                    value={editingSelectedPersonaId ? String(editingSelectedPersonaId) : ""}
                    onChange={(val) => setEditingSelectedPersonaId(Number(val))}
                  >
                    <Stack spacing={2}>
                      {editingSearchResults.map((p) => (
                        <Radio key={p.idPersona} value={String(p.idPersona)}>
                          <Text>
                            <b>
                              {p.nombres} {p.apellidos ?? ""}
                            </b>{" "}
                            — {p.numeroIdentificacion} (ID: {p.idPersona})
                          </Text>
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  Busca por documento y selecciona una persona.
                </Text>
              )}
            </VStack>
          ) : null
        }
        // ⚙️ Footer del paso 1: botón de disponibilidad + selects de horas (regla contigua)
        renderStepFooter={(idx) =>
          idx === 0 ? (
            <VStack align="stretch" mt={2} spacing={3}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Determinar el ID del detalle para excluir de la consulta
                  let idDetalle: number | undefined;
                  if (selectedRow) {
                    const tipoReserva = selectedRow.tipoReserva.toLowerCase();
                    if (tipoReserva.includes('instalacion') && !tipoReserva.includes('mantenimiento')) {
                      idDetalle = selectedRow.idDetalleRerservaInstalacion || undefined;
                    } else if (tipoReserva.includes('equipo') && !tipoReserva.includes('mantenimiento')) {
                      idDetalle = selectedRow.idDetalleRerservaEquipo || undefined;
                    } else if (tipoReserva.includes('mantenimiento')) {
                      if (tipoReserva.includes('instalacion')) {
                        idDetalle = selectedRow.idMantenimientoInstalacion || undefined;
                      } else {
                        idDetalle = selectedRow.idMantenimientoEquipo || undefined;
                      }
                    }
                  }
                  handleConsultarDisponibilidadEdicion(idDetalle);
                }}
              >
                Buscar disponibilidad
              </Button>
              <Text fontSize="sm" color="gray.500">
                Selecciona tipo, fecha y (equipo o instalación), luego busca
                disponibilidad para cargar horas.
              </Text>

              <HStack>
                <FormControl isRequired>
                  <FormLabel>Hora inicio</FormLabel>
                  <Select
                    placeholder={editReservaHoraInicioOptions.length ? "Seleccionar" : "—"}
                    value={editingReservaPaso1.horaInicio ?? ""}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      setEditingReservaPaso1((prev) => ({
                        ...prev,
                        horaInicio: val,
                        horaFin: undefined,
                      }));
                    }}
                    isDisabled={editReservaHoraInicioOptions.length === 0}
                  >
                    {editReservaHoraInicioOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Hora fin</FormLabel>
                  <Select
                    placeholder={editReservaHoraFinOptions.length ? "Seleccionar" : "—"}
                    value={editingReservaPaso1.horaFin ?? ""}
                    onChange={(e) =>
                      setEditingReservaPaso1((prev) => ({
                        ...prev,
                        horaFin: e.target.value || undefined,
                      }))
                    }
                    isDisabled={
                      !editingReservaPaso1.horaInicio || editReservaHoraFinOptions.length === 0
                    }
                  >
                    {editReservaHoraFinOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <Text fontSize="sm" color="gray.500">
                La hora fin solo permite bloques contiguos a partir de la hora
                inicio (12:00 → 13:00 → 14:00…).
              </Text>
            </VStack>
          ) : null
        }
        onSubmit={handleEditarReserva}
      />
    </Box>
  );
};

export default ReservaList;
