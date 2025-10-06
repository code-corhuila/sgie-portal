// src/modules/site/pages/UbicacionList.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
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

    // limpieza y utilidades

    getContinentes, // 👈 para lazy-load al abrir modal
    clearFrom,
  } = useUbicacion();

  // Disclosures (modales)
  const crearCampusModal = useDisclosure();
  const editarCampusModal = useDisclosure();
  const crearInstalacionModal = useDisclosure();
  const editarInstalacionModal = useDisclosure();

  // Filtros de tabla
  const [filtroInstalacion, setFiltroInstalacion] = useState("");
  const [filtroCampus, setFiltroCampus] = useState("");

  // Fila seleccionada para edición
  const [selectedRow, setSelectedRow] = useState<InstalacionCampusRow | null>(null);

  // ----- Crear: initialValues y key para remount controlado -----
  const [createCampusInitial, setCreateCampusInitial] = useState<CampusFormValues | undefined>(undefined);
  const [createCampusKey, setCreateCampusKey] = useState(0);

  const [createInstInitial, setCreateInstInitial] = useState<InstalacionFormValues | undefined>(undefined);
  const [createInstKey, setCreateInstKey] = useState(0);

  // ----- Editar: initialValues y key para remount controlado -----
  const [editCampusInitialValues, setEditCampusInitialValues] = useState<CampusFormValues | undefined>(undefined);
  const [editInstalacionInitialValues, setEditInstalacionInitialValues] = useState<InstalacionFormValues | undefined>(undefined);
  const [editCampusKey, setEditCampusKey] = useState(0);
  const [editInstalacionKey, setEditInstalacionKey] = useState(0);

  // ----- Refs para detectar cambios reales (prev → next) en onValuesChange -----
  const prevCreateCampus = useRef<CampusFormValues>({});
  const prevEditCampus = useRef<CampusFormValues>({});
  const prevCreateInst = useRef<InstalacionFormValues>({});
  const prevEditInst = useRef<InstalacionFormValues>({});

  // ===== Campos base (1er nivel: continentes) =====
  const campusFields = useMemo<Field<any>[]>(() => [
    {
      name: "continenteId",
      label: "Continente",
      type: "select",
      options: continentes.map(c => ({ value: c.id, label: c.nombre })),
      required: true,
      placeholder: "Selecciona un continente",
    },
    { name: "paisId", label: "País", type: "select", options: [], required: true },
    { name: "departamentoId", label: "Departamento", type: "select", options: [], required: true },
    { name: "municipioId", label: "Municipio", type: "select", options: [], required: true },
    //{ name: "categoriaInstalacionId", label: "Categoria Instalacion", type: "select", options: [], required: true },
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "descripcion", label: "Descripción", type: "textarea", required: false },
  ], [continentes]);

  const instalacionFields = useMemo<Field<any>[]>(() => [
    {
      name: "continenteId",
      label: "Continente",
      type: "select",
      options: continentes.map(c => ({ value: c.id, label: c.nombre })),
      required: true,
      placeholder: "Selecciona un continente",
    },
    { name: "paisId", label: "País", type: "select", options: [], required: true },
    { name: "departamentoId", label: "Departamento", type: "select", options: [], required: true },
    { name: "municipioId", label: "Municipio", type: "select", options: [], required: true },
    { name: "campusId", label: "Campus", type: "select", options: [], required: true },
      {
    name: "categoriaInstalacionId",
    label: "Categoría de Instalación",
    type: "select",
    options: categoriaInstalacion.map(ci => ({ value: ci.id, label: ci.nombre })),
    required: true,
    placeholder: "Selecciona una categoría"
      },
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "descripcion", label: "Descripción", type: "textarea", required: false },
  ], [continentes,categoriaInstalacion]);

  // ===== Tabla =====
  const columns: Column<InstalacionCampusRow>[] = useMemo(() => [
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
        <Box
          as="span"
          px={2}
          py={1}
          borderRadius="md"
          bg={r.estadoInstalacion ? "green.100" : "red.100"}
          color={r.estadoInstalacion ? "green.800" : "red.800"}
          fontSize="sm"
          fontWeight="medium"
        >
          {r.estadoInstalacion ? "Activa" : "Inactiva"}
        </Box>
      )
    },
    {
      key: "actions",
      label: "Acciones",
      render: (r) => (
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
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
                setEditCampusKey(k => k + 1);

                editarCampusModal.onOpen();
              } catch (err: any) {
                toast({ title: "Error preparando edición", description: err?.message ?? "Error", status: "error" });
              }
            }}
          >
            Editar Campus
          </Button>

          <Button
            size="sm"
            colorScheme="purple"
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
                setEditInstalacionKey(k => k + 1);

                editarInstalacionModal.onOpen();
              } catch (err: any) {
                toast({ title: "Error preparando edición", description: err?.message ?? "Error", status: "error" });
              }
            }}
          >
            Editar Instalación
          </Button>

          <Button
            size="sm"
            colorScheme={r.estadoInstalacion ? "red" : "green"}
            variant="outline"
            onClick={async () => {
              try {
                await cambiarEstadoInstalacion(r.idInstalacion, !r.estadoInstalacion);
                await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
                toast({ title: "Estado actualizado", status: "success", duration: 1800 });
              } catch (err: any) {
                toast({
                  title: "Error",
                  description: err?.message ?? "No se pudo actualizar el estado",
                  status: "error",
                  duration: 4000,
                });
              }
            }}
          >
            {r.estadoInstalacion ? "Inhabilitar" : "Habilitar"}
          </Button>
        </HStack>
      )
    }
  ], [
    toast,
    getContinentes,
    preloadCascadeForCampus,
    preloadCascadeForInstalacion,
    cambiarEstadoInstalacion,
    fetchInstalacionesCampus,
    filtroInstalacion,
    filtroCampus
  ]);

  // ===== Handlers Crear =====
  const handleSaveCampus = async (values: any) => {
    try {
      const municipioId = String(values.municipioId);
      if (!municipioId) throw new Error("Debes seleccionar un municipio");
      await createCampus({ nombre: values.nombre, descripcion: values.descripcion, municipioId });
      crearCampusModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
    } catch (err: any) {
      toast({ title: "Error al crear campus", description: err?.message ?? "Error", status: "error", duration: 4000 });
    }
  };

  const handleSaveInstalacion = async (values: any) => {
    try {
      const campusId = String(values.campusId);
      const categoriaInstalacionId = String(values.categoriaInstalacionId);
      if (!campusId) throw new Error("Debes seleccionar un campus");
      if (!categoriaInstalacionId) throw new Error("Debes seleccionar una categoria de instalación");

      await createInstalacion({ nombre: values.nombre, descripcion: values.descripcion, campusId, categoriaInstalacionId, });
      crearInstalacionModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
    } catch (err: any) {
      toast({ title: "Error al crear instalación", description: err?.message ?? "Error", status: "error", duration: 4000 });
    }
  };

  // ===== Handlers Editar =====
  const handleEditCampus = async (values: any) => {
    try {
      if (!selectedRow?.idCampus) {
        toast({ title: "Falta idCampus", description: "No se encontró el id de campus a actualizar", status: "warning", duration: 3000 });
        return;
      }
      const municipioId = Number(values.municipioId);
      if (!municipioId) throw new Error("Debes seleccionar un municipio");
      await updateCampus(selectedRow.idCampus, { nombre: values.nombre, descripcion: values.descripcion, municipioId });
      editarCampusModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
      setSelectedRow(null);
      setEditCampusInitialValues(undefined);
    } catch (err: any) {
      toast({ title: "Error al actualizar campus", description: err?.message ?? "Error", status: "error", duration: 4000 });
    }
  };

  const handleEditInstalacion = async (values: any) => {
    try {
      if (!selectedRow?.idInstalacion) {
        toast({ title: "Falta idInstalacion", description: "No se encontró el id de instalación a actualizar", status: "warning", duration: 3000 });
        return;
      }
      const campusId = String(values.campusId);
      const categoriaInstalacionId = String(values.categoriaInstalacionId);
      if (!campusId) throw new Error("Debes seleccionar un campus");
      if (!categoriaInstalacionId) throw new Error("Debes seleccionar una categoria de instalación");
      await updateInstalacion(selectedRow.idInstalacion, { nombre: values.nombre, descripcion: values.descripcion, campusId, categoriaInstalacionId, });
      editarInstalacionModal.onClose();
      await fetchInstalacionesCampus(filtroInstalacion, filtroCampus);
      setSelectedRow(null);
      setEditInstalacionInitialValues(undefined);
    } catch (err: any) {
      toast({ title: "Error al actualizar instalación", description: err?.message ?? "Error", status: "error", duration: 4000 });
    }
  };

  // ===== initialValues base derivados de selectedRow (por si se usan cuando no hay overrides) =====
  const initialCampusValues: CampusFormValues | undefined = selectedRow ? {
    continenteId: selectedRow.idContinente,
    paisId: selectedRow.idPais,
    departamentoId: selectedRow.idDepartamento,
    municipioId: selectedRow.idMunicipio,
    nombre: selectedRow.nombreCampus,
    descripcion:selectedRow.descripcionCampus,
  } : undefined;

  const initialInstalacionValues: InstalacionFormValues | undefined = selectedRow ? {
    continenteId: selectedRow.idContinente,
    paisId: selectedRow.idPais,
    departamentoId: selectedRow.idDepartamento,
    municipioId: selectedRow.idMunicipio,
    campusId: selectedRow.idCampus,
    categoriaInstalacionId: selectedRow.idCategoriaInstalacion,
    nombre: selectedRow.nombreInstalacion,
    descripcion: selectedRow.descripcionInstalacion,
  } : undefined;

  return (
    <Box p={4} w="100%" maxW="100%">
      <Heading size="lg" mb={4}>Gestión de Ubicación</Heading>

      {/* Buscador */}
      <HStack mb={4} spacing={2}>
        <Input
          placeholder="Nombre instalación (opcional)"
          value={filtroInstalacion}
          onChange={(e) => setFiltroInstalacion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchInstalacionesCampus(filtroInstalacion, filtroCampus)}
        />
        <Input
          placeholder="Nombre campus (opcional)"
          value={filtroCampus}
          onChange={(e) => setFiltroCampus(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchInstalacionesCampus(filtroInstalacion, filtroCampus)}
        />
        <Button colorScheme="blue" onClick={() => fetchInstalacionesCampus(filtroInstalacion, filtroCampus)}>
          Buscar
        </Button>
      </HStack>

      {/* Acciones */}
      <HStack mb={4} spacing={2} flexWrap="wrap">
        {/* CREAR CAMPUS */}
        <Button
          colorScheme="green"
          onClick={async () => {
            // Lazy-load de continentes y limpiar cascada
            await getContinentes();
            clearFrom("all");

            // Inicial vacío y remount para crear
            const init: CampusFormValues = { continenteId: "", paisId: "", departamentoId: "", municipioId: "", nombre: "", descripcion: "" };
            setCreateCampusInitial(init);
            prevCreateCampus.current = init;
            setCreateCampusKey(k => k + 1);

            crearCampusModal.onOpen();
          }}
        >
          Crear Campus
        </Button>

        {/* CREAR INSTALACIÓN */}
        <Button
          colorScheme="purple"
          onClick={async () => {
            await getContinentes();
            await fetchCategoriaInstalacion();
            clearFrom("all");

            const init: InstalacionFormValues = { continenteId: "", paisId: "", departamentoId: "", municipioId: "", campusId: "", categoriaInstalacionId: "", nombre: "", descripcion: "" };
            setCreateInstInitial(init);
            prevCreateInst.current = init;
            
            setCreateInstKey(k => k + 1);
            crearInstalacionModal.onOpen();
          }}
        >
          Crear Instalación
        </Button>

        <Button variant="outline" onClick={() => fetchInstalacionesCampus("", "")} isLoading={loading}>
          Actualizar
        </Button>
      </HStack>

      {/* Tabla */}
      <DataTable<InstalacionCampusRow>
        data={rows ?? []}
        columns={columns}
        loading={loading}
        error={error}
        //keyExtractor={(r) => r.idInstalacion}
keyExtractor={(item) => {
  let key;
  if (item.idInstalacion) key = `inst-${item.idInstalacion}`;
  else if (item.idCampus) key = `campus-${item.idCampus}`;
  else key = [
    item.nombreContinente,
    item.nombrePais,
    item.nombreDepartamento,
    item.nombreMunicipio,
    item.nombreCampus,
    item.nombreInstalacion,
  ].filter(Boolean).join('-') || Math.random().toString(36).substr(2, 9);

  console.log('Key generated:', key);
  return key;
}}

        emptyMessage="No hay registros de instalaciones/campus"
      />

      {/* Modal: Crear Campus */}
      <GenericModal
        key={createCampusKey}
        isOpen={crearCampusModal.isOpen}
        onClose={crearCampusModal.onClose}
        title="Crear Campus"
        fields={[
          { ...campusFields[0] }, // Continente
          { ...campusFields[1], options: () => paisesCascada.map(p => ({ value: p.id, label: p.nombre })) },
          { ...campusFields[2], options: () => departamentosCascada.map(d => ({ value: d.id, label: d.nombre })) },
          { ...campusFields[3], options: () => municipiosCascada.map(m => ({ value: m.id, label: m.nombre })) },
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
            const init = { ...next, paisId: "", departamentoId: "", municipioId: "" };
            setCreateCampusInitial(init);
            prevCreateCampus.current = init as CampusFormValues;
            setCreateCampusKey(k => k + 1);
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
            setCreateCampusKey(k => k + 1);
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
            setCreateCampusKey(k => k + 1);
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
        key={editCampusKey}
        isOpen={editarCampusModal.isOpen}
        onClose={() => {
          editarCampusModal.onClose();
          setSelectedRow(null);
          setEditCampusInitialValues(undefined);
        }}
        title="Editar Campus"
        fields={[
          { ...campusFields[0] },
          { ...campusFields[1], options: () => paisesCascada.map(p => ({ value: p.id, label: p.nombre })) },
          { ...campusFields[2], options: () => departamentosCascada.map(d => ({ value: d.id, label: d.nombre })) },
          { ...campusFields[3], options: () => municipiosCascada.map(m => ({ value: m.id, label: m.nombre })) },
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
              continenteId: newCont, paisId: "", departamentoId: "", municipioId: ""
            }));
            setEditCampusKey(k => k + 1);
            if (newCont) void fetchPaisesByContinente(newCont);
          } else if (next.paisId !== prev?.paisId) {
            const newPais = Number(next.paisId);
            clearFrom("pais");
            setEditCampusInitialValues((p) => ({
              ...(p ?? initialCampusValues),
              paisId: newPais, departamentoId: "", municipioId: ""
            }));
            setEditCampusKey(k => k + 1);
            if (newPais) void fetchDepartamentosByPais(newPais);
          } else if (next.departamentoId !== prev?.departamentoId) {
            const newDep = Number(next.departamentoId);
            clearFrom("departamento");
            setEditCampusInitialValues((p) => ({
              ...(p ?? initialCampusValues),
              departamentoId: newDep, municipioId: ""
            }));
            setEditCampusKey(k => k + 1);
            if (newDep) void fetchMunicipiosByDepartamento(newDep);
          }

          prevEditCampus.current = next as CampusFormValues;
        }}
        onSave={handleEditCampus}
      />

      {/* Modal: Crear Instalación */}
      <GenericModal
        key={createInstKey}
        isOpen={
          crearInstalacionModal.isOpen
          
        }
        onClose={crearInstalacionModal.onClose}
        title="Crear Instalación"
        fields={[
          { ...instalacionFields[0] },
          { ...instalacionFields[1], options: () => paisesCascada.map(p => ({ value: p.id, label: p.nombre })) },
          { ...instalacionFields[2], options: () => departamentosCascada.map(d => ({ value: d.id, label: d.nombre })) },
          { ...instalacionFields[3], options: () => municipiosCascada.map(m => ({ value: m.id, label: m.nombre })) },
          { ...instalacionFields[4], options: () => campusCascada.map(c => ({ value: c.id, label: c.nombre })) },
          { ...instalacionFields[5],options: () => categoriaInstalacion.map(ci => ({ value: ci.id, label: ci.nombre })) },
           instalacionFields[6],
        ]}
        initialValues={createInstInitial}
        onValuesChange={(next) => {
          const prev = prevCreateInst.current;

          if (next.continenteId !== prev.continenteId) {
            const cont = Number(next.continenteId);
            clearFrom("continente");
            const init = { ...next, paisId: "", departamentoId: "", municipioId: "", campusId: "", categoriaInstalacionId: "" };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey(k => k + 1);
            if (cont) void fetchPaisesByContinente(cont);
            return;
          }
          if (next.paisId !== prev.paisId) {
            const pais = Number(next.paisId);
            clearFrom("pais");
            const init = { ...next, departamentoId: "", municipioId: "", campusId: "", categoriaInstalacionId: ""  };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey(k => k + 1);
            if (pais) void fetchDepartamentosByPais(pais);
            return;
          }
          if (next.departamentoId !== prev.departamentoId) {
            const dep = Number(next.departamentoId);
            clearFrom("departamento");
            const init = { ...next, municipioId: "", campusId: "", categoriaInstalacionId: ""  };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey(k => k + 1);
            if (dep) void fetchMunicipiosByDepartamento(dep);
            return;
          }
          if (next.municipioId !== prev.municipioId) {
            const mun = Number(next.municipioId);
            clearFrom("municipio");
            const init = { ...next, campusId: "", categoriaInstalacionId: ""  };
            setCreateInstInitial(init as InstalacionFormValues);
            prevCreateInst.current = init as InstalacionFormValues;
            setCreateInstKey(k => k + 1);
            if (mun) void fetchCampusByMunicipio(mun);
            return;
          }

          prevCreateInst.current = next as InstalacionFormValues;
        }}
        onSave={handleSaveInstalacion}
      />

      {/* Modal: Editar Instalación */}
      <GenericModal
        key={editInstalacionKey}
        isOpen={editarInstalacionModal.isOpen}
        onClose={() => {
          editarInstalacionModal.onClose();
          setSelectedRow(null);
          setEditInstalacionInitialValues(undefined);
        }}
        title="Editar Instalación"
        fields={[
          { ...instalacionFields[0] },
          { ...instalacionFields[1], options: () => paisesCascada.map(p => ({ value: p.id, label: p.nombre })) },
          { ...instalacionFields[2], options: () => departamentosCascada.map(d => ({ value: d.id, label: d.nombre })) },
          { ...instalacionFields[3], options: () => municipiosCascada.map(m => ({ value: m.id, label: m.nombre })) },
          { ...instalacionFields[4], options: () => campusCascada.map(c => ({ value: c.id, label: c.nombre })) },
          { ...instalacionFields[5],options: () => categoriaInstalacion.map(ci => ({ value: ci.id, label: ci.nombre })) },
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
              continenteId: newCont, paisId: "", departamentoId: "", municipioId: "", campusId: "", categoriaInstalacionId: ""
            }));
            setEditInstalacionKey(k => k + 1);
            if (newCont) void fetchPaisesByContinente(newCont);
          } else if (next.paisId !== prev?.paisId) {
            const newPais = Number(next.paisId);
            clearFrom("pais");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              paisId: newPais, departamentoId: "", municipioId: "", campusId: "", categoriaInstalacionId: ""
            }));
            setEditInstalacionKey(k => k + 1);
            if (newPais) void fetchDepartamentosByPais(newPais);
          } else if (next.departamentoId !== prev?.departamentoId) {
            const newDep = Number(next.departamentoId);
            clearFrom("departamento");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              departamentoId: newDep, municipioId: "", campusId: "", categoriaInstalacionId: ""
            }));
            setEditInstalacionKey(k => k + 1);
            if (newDep) void fetchMunicipiosByDepartamento(newDep);
          } else if (next.municipioId !== prev?.municipioId) {
            const newMun = Number(next.municipioId);
            clearFrom("municipio");
            setEditInstalacionInitialValues((p) => ({
              ...(p ?? initialInstalacionValues),
              municipioId: newMun, campusId: "", categoriaInstalacionId: ""
            }));
            setEditInstalacionKey(k => k + 1);
            if (newMun) void fetchCampusByMunicipio(newMun);
          }

          prevEditInst.current = next as InstalacionFormValues;
        }}
        onSave={handleEditInstalacion}
      />
    </Box>
  );
};

export default UbicacionList;