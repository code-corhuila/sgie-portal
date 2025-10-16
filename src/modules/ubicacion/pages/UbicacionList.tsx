// src/modules/site/pages/UbicacionList.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flex,
  Button,
  ButtonGroup,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
  Badge,
  Spacer,
} from "@chakra-ui/react";
import {
  FiEdit2,
  FiMapPin,
  FiLayers,
  FiRefreshCw,
  FiSearch,
  FiToggleRight,
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from "react-icons/fi";
import { DataTable, type Column } from "../../../components/UI/DataTable";
import GenericModal, { type Field } from "../../../components/UI/GenericModal";
import { useUbicacion, type InstalacionCampusRow } from "../hooks/useUbicacion";

/** Valores del formulario.
 *  Importante: los <select> del browser entregan "string"; por eso dejamos union number|string.
 */
type CampusFormValues = {
  continenteId?: number | string;
  paisId?: number | string;
  departamentoId?: number | string;
  municipioId?: number | string;
  nombre?: string;
  descripcion?: string;
};
type InstalacionFormValues = CampusFormValues & {
  campusId?: number | string;
  categoriaInstalacionId?: number | string;
};

// type CategoriaInstalacionFormValues = {
//   nombre?: string;
//   descripcion?: string;
// };

const UbicacionList: React.FC = () => {
  const toast = useToast();

  const {
    // tabla
    rows,
    loading,
    error,
    fetchInstalacionesCampus,

    // catálogos base (continentes para el 1er select)
    continentes,

    // cascadas (usar estas en los selects dependientes)
    paisesCascada,
    departamentosCascada,
    municipiosCascada,
    campusCascada,

    // fetch dependientes (con caché + dedupe + anti-stale)
    fetchPaisesByContinente,
    fetchDepartamentosByPais,
    fetchMunicipiosByDepartamento,
    fetchCampusByMunicipio,

    // preload para edición
    preloadCascadeForCampus,
    preloadCascadeForInstalacion,
    categoriaInstalacion,
    fetchCategoriaInstalacion,

    // crud
    createCampus,
    updateCampus,
    createInstalacion,
    updateInstalacion,
    cambiarEstadoInstalacion,
    // crud categoría instalación
    createCategoriaInstalacion,

    // limpieza y utilidades

    getContinentes, // 👈 para lazy-load al abrir modal
    refreshCatalogs,
    clearFrom,
  } = useUbicacion();

  // Disclosures (modales)
  const crearCampusModal = useDisclosure();
  const editarCampusModal = useDisclosure();
  const crearInstalacionModal = useDisclosure();
  const editarInstalacionModal = useDisclosure();
  const crearCategoriaModal = useDisclosure();

  // Filtros de tabla
  const [filtroInstalacion, setFiltroInstalacion] = useState("");
  const [filtroCampus, setFiltroCampus] = useState("");
  const [filtroContinente, setFiltroContinente] = useState<string>("Todos");
  const [filtroPais, setFiltroPais] = useState<string>("Todos");
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("Todos");
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>("Todos");
  const [filtroCampusSelect, setFiltroCampusSelect] = useState<string>("Todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todos");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Fila seleccionada para edición
  const [selectedRow, setSelectedRow] = useState<InstalacionCampusRow | null>(
    null,
  );

  // ----- Crear: initialValues y key para remount controlado -----
  const [createCampusInitial, setCreateCampusInitial] = useState<
    CampusFormValues | undefined
  >(undefined);
  const [createCampusKey, setCreateCampusKey] = useState(0);

  const [createInstInitial, setCreateInstInitial] = useState<
    InstalacionFormValues | undefined
  >(undefined);
  const [createInstKey, setCreateInstKey] = useState(0);

  // ----- Editar: initialValues y key para remount controlado -----
  const [editCampusInitialValues, setEditCampusInitialValues] = useState<
    CampusFormValues | undefined
  >(undefined);
  const [editInstalacionInitialValues, setEditInstalacionInitialValues] =
    useState<InstalacionFormValues | undefined>(undefined);
  const [editCampusKey, setEditCampusKey] = useState(0);
  const [editInstalacionKey, setEditInstalacionKey] = useState(0);

  // ----- Refs para detectar cambios reales (prev → next) en onValuesChange -----
  const prevCreateCampus = useRef<CampusFormValues>({});
  const prevEditCampus = useRef<CampusFormValues>({});
  const prevCreateInst = useRef<InstalacionFormValues>({});
  const prevEditInst = useRef<InstalacionFormValues>({});

  // ===== Campos base (1er nivel: continentes) =====
  const campusFields = useMemo<Field<any>[]>(
    () => [
      {
        name: "continenteId",
        label: "Continente",
        type: "select",
        options: continentes
          .filter((c) => c.id > 0)
          .map((c) => ({ value: c.id, label: c.nombre })),
        required: true,
        placeholder: "Selecciona un continente",
      },
      {
        name: "paisId",
        label: "País",
        type: "select",
        options: [],
        required: true,
      },
      {
        name: "departamentoId",
        label: "Departamento",
        type: "select",
        options: [],
        required: true,
      },
      {
        name: "municipioId",
        label: "Municipio",
        type: "select",
        options: [],
        required: true,
      },
      //{ name: "categoriaInstalacionId", label: "Categoria Instalacion", type: "select", options: [], required: true },
      { name: "nombre", label: "Nombre", type: "text", required: true },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
    ],
    [continentes],
  );

  const instalacionFields = useMemo<Field<any>[]>(
    () => [
      {
        name: "continenteId",
        label: "Continente",
        type: "select",
        options: continentes
          .filter((c) => c.id > 0)
          .map((c) => ({ value: c.id, label: c.nombre })),
        required: true,
        placeholder: "Selecciona un continente",
      },
      {
        name: "paisId",
        label: "País",
        type: "select",
        options: [],
        required: true,
      },
      {
        name: "departamentoId",
        label: "Departamento",
        type: "select",
        options: [],
        required: true,
      },
      {
        name: "municipioId",
        label: "Municipio",
        type: "select",
        options: [],
        required: true,
      },
      {
        name: "campusId",
        label: "Campus",
        type: "select",
        options: [],
        required: true,
      },
      {
        name: "categoriaInstalacionId",
        label: "Categoría de Instalación",
        type: "select",
        options: categoriaInstalacion.map((ci) => ({
          value: ci.id,
          label: ci.nombre,
        })),
        required: true,
        placeholder: "Selecciona una categoría",
      },
      { name: "nombre", label: "Nombre", type: "text", required: true },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
    ],
    [continentes, categoriaInstalacion],
  );

  useEffect(() => {
    refreshCatalogs().catch(() => undefined);
    fetchCategoriaInstalacion().catch(() => undefined);
  }, [fetchCategoriaInstalacion, refreshCatalogs]);

  const matchesFilter = (
    filterValue: string,
    target: string | number | undefined,
  ) => {
    if (filterValue === "Todos") return true;
    if (target === undefined || target === null) return false;
    return String(target) === filterValue;
  };

  const continenteOptions = useMemo(() => {
    return Array.from(
      new Map(
        rows.map((row) => [row.idContinente, row.nombreContinente]),
      ).entries(),
    ).map(([value, label]) => ({ value: String(value), label }));
  }, [rows]);

  const paisOptions = useMemo(() => {
    return Array.from(
      new Map(rows.map((row) => [row.idPais, row.nombrePais])).entries(),
    ).map(([value, label]) => ({
      value: String(value),
      label,
    }));
  }, [rows]);

  const departamentoOptions = useMemo(() => {
    return Array.from(
      new Map(
        rows.map((row) => [row.idDepartamento, row.nombreDepartamento]),
      ).entries(),
    ).map(([value, label]) => ({ value: String(value), label }));
  }, [rows]);

  const municipioOptions = useMemo(() => {
    return Array.from(
      new Map(
        rows.map((row) => [row.idMunicipio, row.nombreMunicipio]),
      ).entries(),
    ).map(([value, label]) => ({ value: String(value), label }));
  }, [rows]);

  const campusOptions = useMemo(() => {
    return Array.from(
      new Map(rows.map((row) => [row.idCampus, row.nombreCampus])).entries(),
    ).map(([value, label]) => ({
      value: String(value),
      label,
    }));
  }, [rows]);

  const categoriaOptions = useMemo(() => {
    const map = new Map<string, string>();
    categoriaInstalacion.forEach((item) =>
      map.set(String(item.id), item.nombre),
    );
    rows
      .filter((row) => row.idCategoriaInstalacion != null)
      .forEach((row) =>
        map.set(
          String(row.idCategoriaInstalacion),
          row.nombreCategoriaInstalacion,
        ),
      );
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [categoriaInstalacion, rows]);

  const filteredRows = useMemo(
    () =>
      (rows ?? []).filter(
        (row) =>
          matchesFilter(filtroContinente, row.idContinente) &&
          matchesFilter(filtroPais, row.idPais) &&
          matchesFilter(filtroDepartamento, row.idDepartamento) &&
          matchesFilter(filtroMunicipio, row.idMunicipio) &&
          matchesFilter(filtroCampusSelect, row.idCampus) &&
          (filtroCategoria === "Todos" ||
            (row.idCategoriaInstalacion != null &&
              String(row.idCategoriaInstalacion) === filtroCategoria)),
      ),
    [
      filtroCampusSelect,
      filtroCategoria,
      filtroContinente,
      filtroDepartamento,
      filtroMunicipio,
      filtroPais,
      rows,
    ],
  );

  const totalRows = filteredRows.length;
  const totalPages = totalRows === 0 ? 1 : Math.ceil(totalRows / size);

  useEffect(() => {
    setPage(0);
  }, [
    filtroCampusSelect,
    filtroCategoria,
    filtroContinente,
    filtroDepartamento,
    filtroMunicipio,
    filtroPais,
    size,
    rows.length,
  ]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);
  const paginatedRows = useMemo(() => {
    if (totalRows === 0) return [];
    const start = page * size;
    return filteredRows.slice(start, start + size);
  }, [filteredRows, page, size, totalRows]);

  const goto = useCallback(
    (target: number) => {
      if (totalRows === 0) {
        setPage(0);
        return;
      }
      const next = Math.min(Math.max(target, 0), totalPages - 1);
      setPage(next);
    },
    [totalPages, totalRows],
  );

  const categoriaFields = useMemo<Field<any>[]>(
    () => [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
    ],
    [],
  );

  // ===== Tabla =====
  const columns: Column<InstalacionCampusRow>[] = useMemo(
    () => [
      { key: "nombreContinente", label: "Continente" },
      { key: "nombrePais", label: "País" },
      { key: "nombreDepartamento", label: "Departamento" },
      { key: "nombreMunicipio", label: "Municipio" },
      { key: "nombreCampus", label: "Campus" },
      { key: "nombreInstalacion", label: "Instalación" },
      { key: "descripcionInstalacion", label: "descripcion" },
      {
        key: "estadoInstalacion",
        label: "Estado",
        render: (r) => (
          <Badge variant={r.estadoInstalacion ? "success" : "neutral"}>
            {r.estadoInstalacion ? "Activa" : "Inactiva"}
          </Badge>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        render: (r) => (
          <HStack spacing={2} justify="flex-start">
            <Tooltip label="Editar campus">
              <IconButton
                aria-label="Editar campus"
                size="sm"
                variant="ghost"
                icon={<FiEdit2 />}
                onClick={async () => {
                  try {
                    setSelectedRow(r);
                    // Cargar continentes (lazy) + precargar cascada
                    await getContinentes();
                    await preloadCascadeForCampus(r);

                    // Initial values de edición
                    const init: CampusFormValues = {
                      continenteId: r.idContinente,
                      paisId: r.idPais,
                      departamentoId: r.idDepartamento,
                      municipioId: r.idMunicipio,
                      nombre: r.nombreCampus,
                      descripcion: r.descripcionCampus,
                    };
                    setEditCampusInitialValues(init);
                    prevEditCampus.current = init;
                    setEditCampusKey((k) => k + 1);

                    editarCampusModal.onOpen();
                  } catch (err: any) {
                    toast({
                      title: "Error preparando edición",
                      description: err?.message ?? "Error",
                      status: "error",
                    });
                  }
                }}
              />
            </Tooltip>

            <Tooltip label="Editar instalación">
              <IconButton
                aria-label="Editar instalación"
                size="sm"
                variant="ghost"
                icon={<FiLayers />}
                onClick={async () => {
                  try {
                    setSelectedRow(r);
                    await getContinentes();
                    await fetchCategoriaInstalacion();
                    await preloadCascadeForInstalacion(r);

                    const init: InstalacionFormValues = {
                      continenteId: r.idContinente,
                      paisId: r.idPais,
                      departamentoId: r.idDepartamento,
                      municipioId: r.idMunicipio,
                      campusId: r.idCampus,
                      categoriaInstalacionId: r.idCategoriaInstalacion,
                      nombre: r.nombreInstalacion,
                      descripcion: r.descripcionInstalacion,
                    };
                    setEditInstalacionInitialValues(init);
                    prevEditInst.current = init;
                    setEditInstalacionKey((k) => k + 1);

                    editarInstalacionModal.onOpen();
                  } catch (err: any) {
                    toast({
                      title: "Error preparando edición",
                      description: err?.message ?? "Error",
                      status: "error",
                    });
                  }
                }}
              />
            </Tooltip>

            <Tooltip
              label={
                r.estadoInstalacion
                  ? "Inhabilitar instalación"
                  : "Habilitar instalación"
              }
            >
              <IconButton
                aria-label="Cambiar estado"
                size="sm"
                variant="ghost"
                colorScheme={r.estadoInstalacion ? "red" : "green"}
                icon={<FiToggleRight />}
                onClick={async () => {
                  try {
                    await cambiarEstadoInstalacion(
                      r.idInstalacion,
                      !r.estadoInstalacion,
                    );
                    await fetchInstalacionesCampus(
                      filtroInstalacion,
                      filtroCampus,
                    );
                    toast({
                      title: "Estado actualizado",
                      status: "success",
                      duration: 1800,
                    });
                  } catch (err: any) {
                    toast({
                      title: "Error",
                      description:
                        err?.message ?? "No se pudo actualizar el estado",
                      status: "error",
                      duration: 4000,
                    });
                  }
                }}
              />
            </Tooltip>
          </HStack>
        ),
      },
    ],
    [
      toast,
      getContinentes,
      preloadCascadeForCampus,
      preloadCascadeForInstalacion,
      cambiarEstadoInstalacion,
      fetchInstalacionesCampus,
      filtroInstalacion,
      filtroCampus,
      editarCampusModal,
      editarInstalacionModal,
      fetchCategoriaInstalacion,
    ],
  );

  // ===== Handlers Crear =====
  const handleSaveCampus = async (values: any) => {
    try {
      const municipioId = String(values.municipioId);
      if (!municipioId) throw new Error("Debes seleccionar un municipio");
      await createCampus({
        nombre: values.nombre,
        descripcion: values.descripcion,
        municipioId,
      });
      crearCampusModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
    } catch (err: any) {
      toast({
        title: "Error al crear campus",
        description: err?.message ?? "Error",
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleSaveInstalacion = async (values: any) => {
    try {
      const campusId = String(values.campusId);
      const categoriaInstalacionId = String(values.categoriaInstalacionId);
      if (!campusId) throw new Error("Debes seleccionar un campus");
      if (!categoriaInstalacionId)
        throw new Error("Debes seleccionar una categoria de instalación");

      await createInstalacion({
        nombre: values.nombre,
        descripcion: values.descripcion,
        campusId,
        categoriaInstalacionId,
      });
      crearInstalacionModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
    } catch (err: any) {
      toast({
        title: "Error al crear instalación",
        description: err?.message ?? "Error",
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleSaveCategoriaInstalacion = async (values: any) => {
    try {
      if (!values.nombre) throw new Error("El nombre es requerido");
      await createCategoriaInstalacion({
        nombre: values.nombre,
        descripcion: values.descripcion,
      });
      crearCategoriaModal.onClose();
    } catch (err: any) {
      toast({
        title: "Error al crear categoría",
        description: err?.message ?? "Error",
        status: "error",
        duration: 4000,
      });
    }
  };

  // ===== Handlers Editar =====
  const handleEditCampus = async (values: any) => {
    try {
      if (!selectedRow?.idCampus) {
        toast({
          title: "Falta idCampus",
          description: "No se encontró el id de campus a actualizar",
          status: "warning",
          duration: 3000,
        });
        return;
      }
      const municipioId = Number(values.municipioId);
      if (!municipioId) throw new Error("Debes seleccionar un municipio");
      await updateCampus(selectedRow.idCampus, {
        nombre: values.nombre,
        descripcion: values.descripcion,
        municipioId,
      });
      editarCampusModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
      setSelectedRow(null);
      setEditCampusInitialValues(undefined);
    } catch (err: any) {
      toast({
        title: "Error al actualizar campus",
        description: err?.message ?? "Error",
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleEditInstalacion = async (values: any) => {
    try {
      if (!selectedRow?.idInstalacion) {
        toast({
          title: "Falta idInstalacion",
          description: "No se encontró el id de instalación a actualizar",
          status: "warning",
          duration: 3000,
        });
        return;
      }
      const campusId = String(values.campusId);
      const categoriaInstalacionId = String(values.categoriaInstalacionId);
      if (!campusId) throw new Error("Debes seleccionar un campus");
      if (!categoriaInstalacionId)
        throw new Error("Debes seleccionar una categoria de instalación");
      await updateInstalacion(selectedRow.idInstalacion, {
        nombre: values.nombre,
        descripcion: values.descripcion,
        campusId,
        categoriaInstalacionId,
      });
      editarInstalacionModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
      setSelectedRow(null);
      setEditInstalacionInitialValues(undefined);
    } catch (err: any) {
      toast({
        title: "Error al actualizar instalación",
        description: err?.message ?? "Error",
        status: "error",
        duration: 4000,
      });
    }
  };

  // ===== initialValues base derivados de selectedRow (por si se usan cuando no hay overrides) =====
  const initialCampusValues: CampusFormValues | undefined = selectedRow
    ? {
        continenteId: selectedRow.idContinente,
        paisId: selectedRow.idPais,
        departamentoId: selectedRow.idDepartamento,
        municipioId: selectedRow.idMunicipio,
        nombre: selectedRow.nombreCampus,
        descripcion: selectedRow.descripcionCampus,
      }
    : undefined;

  const initialInstalacionValues: InstalacionFormValues | undefined =
    selectedRow
      ? {
          continenteId: selectedRow.idContinente,
          paisId: selectedRow.idPais,
          departamentoId: selectedRow.idDepartamento,
          municipioId: selectedRow.idMunicipio,
          campusId: selectedRow.idCampus,
          categoriaInstalacionId: selectedRow.idCategoriaInstalacion,
          nombre: selectedRow.nombreInstalacion,
          descripcion: selectedRow.descripcionInstalacion,
        }
      : undefined;

  return (
    <Stack spacing={8} key="ubicacion-list-container">
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={4}
      >
        <Stack spacing={1}>
          <Heading size="lg" color="neutral.900">
            Gestión de ubicaciones
          </Heading>
          <Text fontSize="sm" color="neutral.500">
            Administra campus, instalaciones y categorías con filtros rápidos y
            acciones contextualizadas.
          </Text>
        </Stack>
        <ButtonGroup size="sm" variant="solid" flexWrap="wrap" gap={2}>
          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            variant="outline"
            onClick={() => fetchInstalacionesCampus("", "")}
            isLoading={loading}
          >
            Actualizar
          </Button>
          <Button
            leftIcon={<Icon as={FiMapPin} />}
            onClick={async () => {
              await getContinentes();
              clearFrom("all");

              const init: CampusFormValues = {
                continenteId: "",
                paisId: "",
                departamentoId: "",
                municipioId: "",
                nombre: "",
                descripcion: "",
              };
              setCreateCampusInitial(init);
              prevCreateCampus.current = init;
              setCreateCampusKey((k) => k + 1);

              crearCampusModal.onOpen();
            }}
          >
            Crear campus
          </Button>
          <Button
            leftIcon={<Icon as={FiLayers} />}
            onClick={async () => {
              await getContinentes();
              await fetchCategoriaInstalacion();
              clearFrom("all");

              const init: InstalacionFormValues = {
                continenteId: "",
                paisId: "",
                departamentoId: "",
                municipioId: "",
                campusId: "",
                categoriaInstalacionId: "",
                nombre: "",
                descripcion: "",
              };
              setCreateInstInitial(init);
              prevCreateInst.current = init;

              setCreateInstKey((k) => k + 1);
              crearInstalacionModal.onOpen();
            }}
            colorScheme="brand"
          >
            Crear instalación
          </Button>

          <Button
            leftIcon={<Icon as={FiEdit2} />}
            variant="outline"
            onClick={() => crearCategoriaModal.onOpen()}
          >
            Nueva categoría
          </Button>
        </ButtonGroup>
      </Flex>

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          align={{ base: "stretch", md: "flex-end" }}
        >
          <InputGroup maxW={{ base: "100%", md: "280px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="neutral.400" />
            </InputLeftElement>
            <Input
              key="filtro-instalacion"
              placeholder="Buscar instalación"
              value={filtroInstalacion}
              onChange={(e) => setFiltroInstalacion(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                fetchInstalacionesCampus(filtroInstalacion, filtroCampus)
              }
            />
          </InputGroup>

          <InputGroup maxW={{ base: "100%", md: "280px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="neutral.400" />
            </InputLeftElement>
            <Input
              key="filtro-campus"
              placeholder="Buscar campus"
              value={filtroCampus}
              onChange={(e) => setFiltroCampus(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                fetchInstalacionesCampus(filtroInstalacion, filtroCampus)
              }
            />
          </InputGroup>

          <ButtonGroup size="sm">
            <Button
              colorScheme="brand"
              leftIcon={<Icon as={FiSearch} />}
              onClick={() => {
                setPage(0);
                fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
              }}
            >
              Buscar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFiltroInstalacion("");
                setFiltroCampus("");
                setPage(0);
                void fetchInstalacionesCampus("", "");
              }}
            >
              Limpiar
            </Button>
          </ButtonGroup>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Continente
            </Text>
            <Select
              value={filtroContinente}
              onChange={(e) => setFiltroContinente(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {continenteOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              País
            </Text>
            <Select
              value={filtroPais}
              onChange={(e) => setFiltroPais(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {paisOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Departamento
            </Text>
            <Select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {departamentoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Municipio
            </Text>
            <Select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {municipioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Campus
            </Text>
            <Select
              value={filtroCampusSelect}
              onChange={(e) => setFiltroCampusSelect(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {campusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="neutral.500">
              Categoría de instalación
            </Text>
            <Select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {categoriaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Stack>
        </SimpleGrid>

        <Wrap spacing={3}>
          {filtroInstalacion && (
            <WrapItem key="badge-inst">
              <Tag borderRadius="full" variant="solid" colorScheme="brand">
                <TagLabel>Instalación: {filtroInstalacion}</TagLabel>
                <TagCloseButton onClick={() => setFiltroInstalacion("")} />
              </Tag>
            </WrapItem>
          )}
          {filtroCampus && (
            <WrapItem key="badge-campus-text">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>Campus: {filtroCampus}</TagLabel>
                <TagCloseButton onClick={() => setFiltroCampus("")} />
              </Tag>
            </WrapItem>
          )}
          {filtroContinente !== "Todos" && (
            <WrapItem key="badge-continente">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  Continente:{" "}
                  {continenteOptions.find(
                    (opt) => opt.value === filtroContinente,
                  )?.label ?? filtroContinente}
                </TagLabel>
                <TagCloseButton onClick={() => setFiltroContinente("Todos")} />
              </Tag>
            </WrapItem>
          )}
          {filtroPais !== "Todos" && (
            <WrapItem key="badge-pais">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  País:{" "}
                  {paisOptions.find((opt) => opt.value === filtroPais)?.label ??
                    filtroPais}
                </TagLabel>
                <TagCloseButton onClick={() => setFiltroPais("Todos")} />
              </Tag>
            </WrapItem>
          )}
          {filtroDepartamento !== "Todos" && (
            <WrapItem key="badge-departamento">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  Departamento:{" "}
                  {departamentoOptions.find(
                    (opt) => opt.value === filtroDepartamento,
                  )?.label ?? filtroDepartamento}
                </TagLabel>
                <TagCloseButton
                  onClick={() => setFiltroDepartamento("Todos")}
                />
              </Tag>
            </WrapItem>
          )}
          {filtroMunicipio !== "Todos" && (
            <WrapItem key="badge-municipio">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  Municipio:{" "}
                  {municipioOptions.find((opt) => opt.value === filtroMunicipio)
                    ?.label ?? filtroMunicipio}
                </TagLabel>
                <TagCloseButton onClick={() => setFiltroMunicipio("Todos")} />
              </Tag>
            </WrapItem>
          )}
          {filtroCampusSelect !== "Todos" && (
            <WrapItem key="badge-campus-select">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  Campus:{" "}
                  {campusOptions.find((opt) => opt.value === filtroCampusSelect)
                    ?.label ?? filtroCampusSelect}
                </TagLabel>
                <TagCloseButton
                  onClick={() => setFiltroCampusSelect("Todos")}
                />
              </Tag>
            </WrapItem>
          )}
          {filtroCategoria !== "Todos" && (
            <WrapItem key="badge-categoria">
              <Tag borderRadius="full" variant="solid" colorScheme="teal">
                <TagLabel>
                  Categoría:{" "}
                  {categoriaOptions.find((opt) => opt.value === filtroCategoria)
                    ?.label ?? filtroCategoria}
                </TagLabel>
                <TagCloseButton onClick={() => setFiltroCategoria("Todos")} />
              </Tag>
            </WrapItem>
          )}
          <WrapItem key="badge-resumen">
            <Badge variant="neutral">
              Mostrando {paginatedRows.length} de {filteredRows.length}{" "}
              coincidencias — Total: {rows.length}
            </Badge>
          </WrapItem>
        </Wrap>
      </Stack>

      <DataTable<InstalacionCampusRow>
        data={paginatedRows}
        columns={columns}
        loading={loading}
        error={error}
        keyExtractor={(item: InstalacionCampusRow) => {
          const fallback = [
            item.idInstalacion != null ? `inst-${item.idInstalacion}` : null,
            item.idCampus != null ? `campus-${item.idCampus}` : null,
            item.idMunicipio != null ? `mun-${item.idMunicipio}` : null,
            item.nombreInstalacion ? `nombre-${item.nombreInstalacion}` : null,
          ]
            .filter(Boolean)
            .join("-");
          return `ubicacion-${item.unique ?? fallback}`;
        }}
        emptyMessage="No hay registros de instalaciones/campus"
      />

      <Flex
        mt={4}
        align="center"
        justify="space-between"
        gap={4}
        display={filteredRows.length === 0 ? "none" : "flex"}
      >
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            Filas por página
          </Text>
          <Select
            size="sm"
            w="80px"
            value={size}
            onChange={(e) => {
              const nextSize = Number(e.target.value);
              setSize(nextSize);
              setPage(0);
            }}
            isDisabled={loading}
          >
            {[10, 20, 50, 100].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </HStack>

        <Spacer />

        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            {filteredRows.length === 0
              ? "0–0"
              : `${page * size + 1}–${Math.min((page + 1) * size, filteredRows.length)}`}{" "}
            de {filteredRows.length}
          </Text>
          <IconButton
            aria-label="Primera página"
            size="sm"
            variant="ghost"
            onClick={() => goto(0)}
            isDisabled={page === 0 || loading || filteredRows.length === 0}
            icon={<FiChevronsLeft />}
          />
          <IconButton
            aria-label="Anterior"
            size="sm"
            variant="ghost"
            onClick={() => goto(page - 1)}
            isDisabled={page === 0 || loading || filteredRows.length === 0}
            icon={<FiChevronLeft />}
          />
          <Button size="sm" variant="outline" isDisabled>
            {filteredRows.length === 0 ? 0 : page + 1} /{" "}
            {filteredRows.length === 0 ? 0 : totalPages}
          </Button>
          <IconButton
            aria-label="Siguiente"
            size="sm"
            variant="ghost"
            onClick={() => goto(page + 1)}
            isDisabled={
              page >= totalPages - 1 || loading || filteredRows.length === 0
            }
            icon={<FiChevronRight />}
          />
          <IconButton
            aria-label="Última página"
            size="sm"
            variant="ghost"
            onClick={() => goto(totalPages - 1)}
            isDisabled={
              page >= totalPages - 1 || loading || filteredRows.length === 0
            }
            icon={<FiChevronsRight />}
          />
        </HStack>
      </Flex>

      {/* Modal: Crear Campus */}
      <GenericModal
        key={`create-campus-${createCampusKey}`}
        isOpen={crearCampusModal.isOpen}
        onClose={crearCampusModal.onClose}
        title="Crear Campus"
        fields={[
          { ...campusFields[0] }, // Continente
          {
            ...campusFields[1],
            options: () =>
              paisesCascada.map((p) => ({ value: p.id, label: p.nombre })),
          },
          {
            ...campusFields[2],
            options: () =>
              departamentosCascada.map((d) => ({
                value: d.id,
                label: d.nombre,
              })),
          },
          {
            ...campusFields[3],
            options: () =>
              municipiosCascada.map((m) => ({ value: m.id, label: m.nombre })),
          },
          campusFields[4],
          campusFields[5],
        ]}
        initialValues={createCampusInitial}
        onValuesChange={(next) => {
          const prev = prevCreateCampus.current;

          // Cambio de continente ⇒ limpiar hijos y pedir países
          if (next.continenteId !== prev.continenteId) {
            const cont = Number(next.continenteId);
            clearFrom("continente");
            const init = {
              ...next,
              paisId: "",
              departamentoId: "",
              municipioId: "",
            };
            setCreateCampusInitial(init);
            prevCreateCampus.current = init as CampusFormValues;
            setCreateCampusKey((k) => k + 1);
            if (cont) void fetchPaisesByContinente(cont);
            return;
          }
          // Cambio de país ⇒ limpiar hijos y pedir departamentos
          if (next.paisId !== prev.paisId) {
            const pais = Number(next.paisId);
            clearFrom("pais");
            const init = { ...next, departamentoId: "", municipioId: "" };
            setCreateCampusInitial(init);
            prevCreateCampus.current = init as CampusFormValues;
            setCreateCampusKey((k) => k + 1);
            if (pais) void fetchDepartamentosByPais(pais);
            return;
          }
          // Cambio de departamento ⇒ limpiar hijos y pedir municipios
          if (next.departamentoId !== prev.departamentoId) {
            const dep = Number(next.departamentoId);
            clearFrom("departamento");
            const init = { ...next, municipioId: "" };
            setCreateCampusInitial(init);
            prevCreateCampus.current = init as CampusFormValues;
            setCreateCampusKey((k) => k + 1);
            if (dep) void fetchMunicipiosByDepartamento(dep);
            return;
          }

          // Mantener sincronizado
          prevCreateCampus.current = next as CampusFormValues;
        }}
        onSave={handleSaveCampus}
      />

      {/* Modal: Editar Campus */}
      <GenericModal
        key={`edit-campus-${editCampusKey}`}
        isOpen={editarCampusModal.isOpen}
        onClose={() => {
          editarCampusModal.onClose();
          setSelectedRow(null);
          setEditCampusInitialValues(undefined);
        }}
        title="Editar Campus"
        fields={[
          { ...campusFields[0] },
          {
            ...campusFields[1],
            options: () =>
              paisesCascada.map((p) => ({ value: p.id, label: p.nombre })),
          },
          {
            ...campusFields[2],
            options: () =>
              departamentosCascada.map((d) => ({
                value: d.id,
                label: d.nombre,
              })),
          },
          {
            ...campusFields[3],
            options: () =>
              municipiosCascada.map((m) => ({ value: m.id, label: m.nombre })),
          },
          campusFields[4],
          campusFields[5],
        ]}
        initialValues={editCampusInitialValues ?? initialCampusValues}
        onValuesChange={(next) => {
          const prev = prevEditCampus.current;

          if (next.continenteId !== prev?.continenteId) {
            const newCont = Number(next.continenteId);
            clearFrom("continente");
            setEditCampusInitialValues((p) => ({
              ...(p ?? initialCampusValues),
              continenteId: newCont,
              paisId: "",
              departamentoId: "",
              municipioId: "",
            }));
            setEditCampusKey((k) => k + 1);
            if (newCont) void fetchPaisesByContinente(newCont);
          } else if (next.paisId !== prev?.paisId) {
            const newPais = Number(next.paisId);
            clearFrom("pais");
            setEditCampusInitialValues((p) => ({
              ...(p ?? initialCampusValues),
              paisId: newPais,
              departamentoId: "",
              municipioId: "",
            }));
            setEditCampusKey((k) => k + 1);
            if (newPais) void fetchDepartamentosByPais(newPais);
          } else if (next.departamentoId !== prev?.departamentoId) {
            const newDep = Number(next.departamentoId);
            clearFrom("departamento");
            setEditCampusInitialValues((p) => ({
              ...(p ?? initialCampusValues),
              departamentoId: newDep,
              municipioId: "",
            }));
            setEditCampusKey((k) => k + 1);
            if (newDep) void fetchMunicipiosByDepartamento(newDep);
          }

          prevEditCampus.current = next as CampusFormValues;
        }}
        onSave={handleEditCampus}
      />

      {/* Modal: Crear Instalación */}
      <GenericModal
        key={`create-instalacion-${createInstKey}`}
        isOpen={crearInstalacionModal.isOpen}
        onClose={crearInstalacionModal.onClose}
        title="Crear Instalación"
        fields={[
          { ...instalacionFields[0] },
          {
            ...instalacionFields[1],
            options: () =>
              paisesCascada.map((p) => ({ value: p.id, label: p.nombre })),
          },
          {
            ...instalacionFields[2],
            options: () =>
              departamentosCascada.map((d) => ({
                value: d.id,
                label: d.nombre,
              })),
          },
          {
            ...instalacionFields[3],
            options: () =>
              municipiosCascada.map((m) => ({ value: m.id, label: m.nombre })),
          },
          {
            ...instalacionFields[4],
            options: () =>
              campusCascada.map((c) => ({ value: c.id, label: c.nombre })),
          },
          {
            ...instalacionFields[5],
            options: () =>
              categoriaInstalacion.map((ci) => ({
                value: ci.id,
                label: ci.nombre,
              })),
          },
          instalacionFields[6],
        ]}
        initialValues={createInstInitial}
        onValuesChange={(next) => {
          const prev = prevCreateInst.current;

          if (next.continenteId !== prev.continenteId) {
            const cont = Number(next.continenteId);
            clearFrom("continente");
            const init = {
              ...next,
              paisId: "",
              departamentoId: "",
              municipioId: "",
              campusId: "",
              categoriaInstalacionId: "",
            };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey((k) => k + 1);
            if (cont) void fetchPaisesByContinente(cont);
            return;
          }
          if (next.paisId !== prev.paisId) {
            const pais = Number(next.paisId);
            clearFrom("pais");
            const init = {
              ...next,
              departamentoId: "",
              municipioId: "",
              campusId: "",
              categoriaInstalacionId: "",
            };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey((k) => k + 1);
            if (pais) void fetchDepartamentosByPais(pais);
            return;
          }
          if (next.departamentoId !== prev.departamentoId) {
            const dep = Number(next.departamentoId);
            clearFrom("departamento");
            const init = {
              ...next,
              municipioId: "",
              campusId: "",
              categoriaInstalacionId: "",
            };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey((k) => k + 1);
            if (dep) void fetchMunicipiosByDepartamento(dep);
            return;
          }
          if (next.municipioId !== prev.municipioId) {
            const mun = Number(next.municipioId);
            clearFrom("municipio");
            const init = { ...next, campusId: "", categoriaInstalacionId: "" };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey((k) => k + 1);
            if (mun) void fetchCampusByMunicipio(mun);
            return;
          }

          prevCreateInst.current = next as InstalacionFormValues;
        }}
        onSave={handleSaveInstalacion}
      />

      {/* Modal: Editar Instalación */}
      <GenericModal
        key={`edit-instalacion-${editInstalacionKey}`}
        isOpen={editarInstalacionModal.isOpen}
        onClose={() => {
          editarInstalacionModal.onClose();
          setSelectedRow(null);
          setEditInstalacionInitialValues(undefined);
        }}
        title="Editar Instalación"
        fields={[
          { ...instalacionFields[0] },
          {
            ...instalacionFields[1],
            options: () =>
              paisesCascada.map((p) => ({ value: p.id, label: p.nombre })),
          },
          {
            ...instalacionFields[2],
            options: () =>
              departamentosCascada.map((d) => ({
                value: d.id,
                label: d.nombre,
              })),
          },
          {
            ...instalacionFields[3],
            options: () =>
              municipiosCascada.map((m) => ({ value: m.id, label: m.nombre })),
          },
          {
            ...instalacionFields[4],
            options: () =>
              campusCascada.map((c) => ({ value: c.id, label: c.nombre })),
          },
          {
            ...instalacionFields[5],
            options: () =>
              categoriaInstalacion.map((ci) => ({
                value: ci.id,
                label: ci.nombre,
              })),
          },
          instalacionFields[6],
          instalacionFields[7],
        ]}
        initialValues={editInstalacionInitialValues ?? initialInstalacionValues}
        onValuesChange={(next) => {
          const prev = prevEditInst.current;

          if (next.continenteId !== prev?.continenteId) {
            const newCont = Number(next.continenteId);
            clearFrom("continente");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              continenteId: newCont,
              paisId: "",
              departamentoId: "",
              municipioId: "",
              campusId: "",
              categoriaInstalacionId: "",
            }));
            setEditInstalacionKey((k) => k + 1);
            if (newCont) void fetchPaisesByContinente(newCont);
          } else if (next.paisId !== prev?.paisId) {
            const newPais = Number(next.paisId);
            clearFrom("pais");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              paisId: newPais,
              departamentoId: "",
              municipioId: "",
              campusId: "",
              categoriaInstalacionId: "",
            }));
            setEditInstalacionKey((k) => k + 1);
            if (newPais) void fetchDepartamentosByPais(newPais);
          } else if (next.departamentoId !== prev?.departamentoId) {
            const newDep = Number(next.departamentoId);
            clearFrom("departamento");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              departamentoId: newDep,
              municipioId: "",
              campusId: "",
              categoriaInstalacionId: "",
            }));
            setEditInstalacionKey((k) => k + 1);
            if (newDep) void fetchMunicipiosByDepartamento(newDep);
          } else if (next.municipioId !== prev?.municipioId) {
            const newMun = Number(next.municipioId);
            clearFrom("municipio");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              municipioId: newMun,
              campusId: "",
              categoriaInstalacionId: "",
            }));
            setEditInstalacionKey((k) => k + 1);
            if (newMun) void fetchCampusByMunicipio(newMun);
          }

          prevEditInst.current = next as InstalacionFormValues;
        }}
        onSave={handleEditInstalacion}
      />

      {/* Modal: Crear Categoría Instalación */}
      <GenericModal
        isOpen={crearCategoriaModal.isOpen}
        onClose={crearCategoriaModal.onClose}
        title="Crear Categoría de Instalación"
        fields={categoriaFields}
        initialValues={{ nombre: "", descripcion: "" }}
        onSave={handleSaveCategoriaInstalacion}
      />
    </Stack>
  );
};

export default UbicacionList;
