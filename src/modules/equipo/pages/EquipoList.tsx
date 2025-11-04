import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import type { Field } from "../../../components/UI/GenericModal";
import { useFilterState } from "../../../hooks/useFilterState";
import { useTableManager } from "../../../hooks/useTableManager";
import { useNormalizedInput } from "../../../hooks/useNormalizedInput";
import EquipoListView, {
  type CategoriaEquipoFormValues,
  type EquipoFormValues,
  type TipoEquipoFormValues,
} from "../components/EquipoListView";
import { useEquipoManagement } from "../hooks/useEquipoManagement";
import type { EquipoSummary } from "../types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const initialFilters = {
  codigo: "",
  status: "ALL" as StatusFilter,
  tipo: "Todos",
  instalacion: "Todos",
  categoria: "Todos",
};

const toOption = (item: { id: number; nombre: string }) => ({
  value: item.id,
  label: item.nombre,
});

const EquipoList: React.FC = () => {
  const toast = useToast();
  const categoriaModal = useDisclosure();
  const tipoModal = useDisclosure();
  const equipoModal = useDisclosure();
  const editModal = useDisclosure();

  const [selectedEquipo, setSelectedEquipo] = useState<EquipoSummary | null>(
    null,
  );

  const { normalize } = useNormalizedInput();

  const { filters, setFilter } = useFilterState(initialFilters);
  const codigoBusqueda = filters.codigo.trim();

  const {
    equipos,
    equiposBase,
    equiposQuery,
    categoriasQuery,
    tiposQuery,
    instalacionesQuery,
    isLoading,
    isSearchLoading,
    searchEquipos,
    invalidateEquipos,
    createCategoria,
    createTipo,
    createEquipo,
    updateEquipo,
    toggleEstado,
    clearBusquedaEquipos,
  } = useEquipoManagement({
    codigoBusqueda,
    enableCategorias: categoriaModal.isOpen || tipoModal.isOpen,
    enableTipos: tipoModal.isOpen || equipoModal.isOpen || editModal.isOpen,
    enableInstalaciones: equipoModal.isOpen || editModal.isOpen,
  });

  const tiposDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          equiposBase
            .map((item) => item.nombreEquipo)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [equiposBase],
  );

  const instalacionesDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          equiposBase
            .map((item) => item.nombreInstalacion)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [equiposBase],
  );

  const categoriasDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          equiposBase
            .map((item) => item.nombreCategoriaEquipo)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [equiposBase],
  );

  const categoriaOptions = useMemo(
    () => (categoriasQuery.data ?? []).map(toOption),
    [categoriasQuery.data],
  );

  const tipoOptions = useMemo(
    () => (tiposQuery.data ?? []).map(toOption),
    [tiposQuery.data],
  );

  const instalacionOptions = useMemo(
    () => (instalacionesQuery.data ?? []).map(toOption),
    [instalacionesQuery.data],
  );

  const normalizeTextValue = useCallback(
    (value: string | null | undefined) =>
      (normalize(value ?? "", "submit") as string),
    [normalize],
  );

  const categoriaNameById = useMemo(() => {
    const map = new Map<number, string>();
    (categoriasQuery.data ?? []).forEach((categoria) => {
      if (categoria.nombre) {
        map.set(categoria.id, normalizeTextValue(categoria.nombre));
      }
    });
    return map;
  }, [categoriasQuery.data, normalizeTextValue]);

  const categoriaNameSet = useMemo(
    () =>
      new Set(
        Array.from(categoriaNameById.values()).filter(
          (nombre) => nombre && nombre.trim() !== "",
        ),
      ),
    [categoriaNameById],
  );

  const tipoNameById = useMemo(() => {
    const map = new Map<number, string>();
    (tiposQuery.data ?? []).forEach((tipo) => {
      if (tipo.nombre) {
        map.set(tipo.id, normalizeTextValue(tipo.nombre));
      }
    });
    return map;
  }, [normalizeTextValue, tiposQuery.data]);

  const tipoNameSet = useMemo(
    () =>
      new Set(
        Array.from(tipoNameById.values()).filter(
          (nombre) => nombre && nombre.trim() !== "",
        ),
      ),
    [tipoNameById],
  );

  const equipoCodigoById = useMemo(() => {
    const map = new Map<number, string>();
    equiposBase.forEach((equipo) => {
      if (equipo.codigoEquipo) {
        map.set(equipo.idEquipo, normalizeTextValue(equipo.codigoEquipo));
      }
    });
    return map;
  }, [equiposBase, normalizeTextValue]);

  const equipoCodigoSet = useMemo(
    () =>
      new Set(
        Array.from(equipoCodigoById.values()).filter(
          (codigo) => codigo && codigo.trim() !== "",
        ),
      ),
    [equipoCodigoById],
  );

  const validateCategoriaNombre = useCallback(
    (value: unknown, ignoreId?: number | null) => {
      const raw = typeof value === "string" ? value : "";
      const normalized = normalizeTextValue(raw);
      if (!normalized) {
        return "El nombre es obligatorio";
      }
      if (ignoreId != null) {
        const current = categoriaNameById.get(ignoreId);
        if (current === normalized) {
          return null;
        }
      }
      if (categoriaNameSet.has(normalized)) {
        return "Ya existe una categoría con este nombre";
      }
      return null;
    },
    [categoriaNameById, categoriaNameSet, normalizeTextValue],
  );

  const validateTipoNombre = useCallback(
    (value: unknown, ignoreId?: number | null) => {
      const raw = typeof value === "string" ? value : "";
      const normalized = normalizeTextValue(raw);
      if (!normalized) {
        return "El nombre es obligatorio";
      }
      if (ignoreId != null) {
        const current = tipoNameById.get(ignoreId);
        if (current === normalized) {
          return null;
        }
      }
      if (tipoNameSet.has(normalized)) {
        return "Ya existe un tipo de equipo con este nombre";
      }
      return null;
    },
    [normalizeTextValue, tipoNameById, tipoNameSet],
  );

  const validateEquipoCodigo = useCallback(
    (value: unknown, ignoreId?: number | null) => {
      const raw = typeof value === "string" ? value : "";
      const normalized = normalizeTextValue(raw);
      if (!normalized) {
        return "El código es obligatorio";
      }
      if (ignoreId != null) {
        const current = equipoCodigoById.get(ignoreId);
        if (current === normalized) {
          return null;
        }
      }
      if (equipoCodigoSet.has(normalized)) {
        return "Ya existe un equipo con este código";
      }
      return null;
    },
    [equipoCodigoById, equipoCodigoSet, normalizeTextValue],
  );

  const categoriaFields = useMemo<Field<CategoriaEquipoFormValues>[]>(
    () => [
      {
        name: "nombre",
        label: "Nombre",
        type: "text",
        required: true,
        helperText: "Debe ser único dentro de las categorías registradas",
        validate: (value) => validateCategoriaNombre(value),
      },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
    ],
    [validateCategoriaNombre],
  );

  const tipoFields = useMemo<Field<TipoEquipoFormValues>[]>(
    () => [
      {
        name: "nombre",
        label: "Nombre",
        type: "text",
        required: true,
        helperText: "Debe ser único dentro de los tipos registrados",
        validate: (value) => validateTipoNombre(value),
      },
      {
        name: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: false,
      },
      {
        name: "categoriaEquipo",
        label: "Categoría",
        type: "select",
        options: categoriaOptions,
        required: true,
      },
    ],
    [categoriaOptions, validateTipoNombre],
  );

  const equipoFields = useMemo<Field<EquipoFormValues>[]>(
    () => [
      {
        name: "codigo",
        label: "Código",
        type: "text",
        required: true,
        validate: (value) => validateEquipoCodigo(value),
      },
      {
        name: "tipoEquipo",
        label: "Tipo de equipo",
        type: "select",
        options: tipoOptions,
        required: true,
      },
      {
        name: "instalacion",
        label: "Instalación",
        type: "select",
        options: instalacionOptions,
        required: true,
      },
    ],
    [instalacionOptions, tipoOptions, validateEquipoCodigo],
  );

  const equipoFieldsForEdit = useMemo<Field<EquipoFormValues>[]>(
    () => [
      {
        name: "codigo",
        label: "Código",
        type: "text",
        required: true,
        validate: (value) =>
          validateEquipoCodigo(value, selectedEquipo?.idEquipo ?? null),
      },
      {
        name: "tipoEquipo",
        label: "Tipo de equipo",
        type: "select",
        options: tipoOptions,
        required: true,
      },
      {
        name: "instalacion",
        label: "Instalación",
        type: "select",
        options: instalacionOptions,
        required: true,
      },
    ],
    [
      instalacionOptions,
      selectedEquipo?.idEquipo,
      tipoOptions,
      validateEquipoCodigo,
    ],
  );

  const filteredEquipos = useMemo(() => {
    return equipos.filter((item) => {
      const statusOk =
        filters.status === "ALL" ||
        (filters.status === "ACTIVE" && item.estadoEquipo) ||
        (filters.status === "INACTIVE" && !item.estadoEquipo);
      const tipoOk =
        filters.tipo === "Todos" || item.nombreEquipo === filters.tipo;
      const instalacionOk =
        filters.instalacion === "Todos" ||
        item.nombreInstalacion === filters.instalacion;
      const categoriaOk =
        filters.categoria === "Todos" ||
        item.nombreCategoriaEquipo === filters.categoria;

      return statusOk && tipoOk && instalacionOk && categoriaOk;
    });
  }, [
    equipos,
    filters.categoria,
    filters.instalacion,
    filters.status,
    filters.tipo,
  ]);

  const totalEquipos = equiposBase.length;
  const activos = equiposBase.filter((item) => item.estadoEquipo).length;
  const enMantenimiento = equiposBase.filter(
    (item) => !item.estadoInstalacion || !item.estadoCampus,
  ).length;

  const tableManager = useTableManager(filteredEquipos, {
    totalItems: filteredEquipos.length,
  });
  const {
    page,
    pageSize,
    data: paginatedData,
    totalItems,
    totalPages,
    pageSizeOptions,
    goto,
    setPageSize,
  } = tableManager;

  useEffect(() => {
    goto(0);
  }, [
    filters.categoria,
    filters.instalacion,
    filters.status,
    filters.tipo,
    filters.codigo,
    goto,
  ]);

  const handleRefresh = () => {
    invalidateEquipos();
  };

  const handleSearchByCodigo = () => {
    void searchEquipos();
  };

  const handleClearCodigo = () => {
    clearBusquedaEquipos();
    setFilter("codigo", "");
  };

  const handleToggleEstado = (equipo: EquipoSummary) => {
    toggleEstado({
      idEquipo: equipo.idEquipo,
      nextEstado: !equipo.estadoEquipo,
      codigo: codigoBusqueda || undefined,
    });
  };

  const handleOpenEdit = (equipo: EquipoSummary) => {
    setSelectedEquipo(equipo);
    editModal.onOpen();
  };

  const handleCloseEdit = useCallback(() => {
    setSelectedEquipo(null);
    editModal.onClose();
  }, [editModal]);

  const editEquipoInitialValues = useMemo(() => {
    if (!selectedEquipo) return undefined;
    return {
      codigo: selectedEquipo.codigoEquipo,
      tipoEquipo:
        tipoOptions.find(
          (option) => option.label === selectedEquipo.nombreEquipo,
        )?.value ?? "",
      instalacion:
        instalacionOptions.find(
          (option) => option.label === selectedEquipo.nombreInstalacion,
        )?.value ?? "",
    } satisfies Partial<EquipoFormValues>;
  }, [instalacionOptions, selectedEquipo, tipoOptions]);

  const handleSaveCategoria = useCallback(
    async (values: Partial<CategoriaEquipoFormValues>) => {
      const rawNombre = values.nombre ?? "";
      const validationError = validateCategoriaNombre(rawNombre);
      if (validationError) {
        toast({
          title: "Validación de categoría",
          description: validationError,
          status: "error",
          duration: 3000,
        });
        return false;
      }
      await createCategoria({
        nombre: normalizeTextValue(rawNombre),
        descripcion: values.descripcion ?? "",
      });
      categoriaModal.onClose();
      return true;
    },
    [categoriaModal, createCategoria, normalizeTextValue, toast, validateCategoriaNombre],
  );

  const handleSaveTipo = useCallback(
    async (values: Partial<TipoEquipoFormValues>) => {
      const rawNombre = values.nombre ?? "";
      const validationError = validateTipoNombre(rawNombre);
      if (validationError) {
        toast({
          title: "Validación de tipo de equipo",
          description: validationError,
          status: "error",
          duration: 3000,
        });
        return false;
      }
      await createTipo({
        nombre: normalizeTextValue(rawNombre),
        descripcion: values.descripcion ?? "",
        categoriaEquipo: { id: Number(values.categoriaEquipo) },
      });
      tipoModal.onClose();
      return true;
    },
    [createTipo, normalizeTextValue, tipoModal, toast, validateTipoNombre],
  );

  const handleSaveEquipo = useCallback(
    async (values: Partial<EquipoFormValues>) => {
      const rawCodigo = values.codigo ?? "";
      const validationError = validateEquipoCodigo(rawCodigo);
      if (validationError) {
        toast({
          title: "Validación de equipo",
          description: validationError,
          status: "error",
          duration: 3000,
        });
        return false;
      }
      await createEquipo({
        codigo: normalizeTextValue(rawCodigo),
        tipoEquipo: { id: Number(values.tipoEquipo) },
        instalacion: { id: Number(values.instalacion) },
      });
      equipoModal.onClose();
      return true;
    },
    [createEquipo, equipoModal, normalizeTextValue, toast, validateEquipoCodigo],
  );

  const handleSaveEquipoEdit = useCallback(
    async (values: Partial<EquipoFormValues>) => {
      if (!selectedEquipo) return false;
      const rawCodigo = values.codigo ?? "";
      const validationError = validateEquipoCodigo(
        rawCodigo,
        selectedEquipo.idEquipo,
      );
      if (validationError) {
        toast({
          title: "Validación de equipo",
          description: validationError,
          status: "error",
          duration: 3000,
        });
        return false;
      }
      await updateEquipo({
        idEquipo: selectedEquipo.idEquipo,
        payload: {
          codigo: normalizeTextValue(rawCodigo),
          tipoEquipo: { id: Number(values.tipoEquipo) },
          instalacion: { id: Number(values.instalacion) },
        },
      });
      handleCloseEdit();
      return true;
    },
    [handleCloseEdit, normalizeTextValue, selectedEquipo, toast, updateEquipo, validateEquipoCodigo],
  );

  return (
    <EquipoListView
      header={{
        onRefresh: handleRefresh,
        onOpenCategoria: categoriaModal.onOpen,
        onOpenTipo: () => {
          if (!categoriasQuery.data) {
            categoriasQuery.refetch();
          }
          tipoModal.onOpen();
        },
        onOpenEquipo: () => {
          if (!tiposQuery.data) {
            tiposQuery.refetch();
          }
          if (!instalacionesQuery.data) {
            instalacionesQuery.refetch();
          }
          equipoModal.onOpen();
        },
        isLoading,
      }}
      filters={{
        codigo: filters.codigo,
        onCodigoChange: (value) => setFilter("codigo", value),
        onSearchByCodigo: handleSearchByCodigo,
        onClearCodigo: handleClearCodigo,
        statusFilter: filters.status,
        onStatusChange: (value) => setFilter("status", value),
        tipoFilter: filters.tipo,
        onTipoChange: (value) => setFilter("tipo", value),
        instalacionFilter: filters.instalacion,
        onInstalacionChange: (value) => setFilter("instalacion", value),
        categoriaFilter: filters.categoria,
        onCategoriaChange: (value) => setFilter("categoria", value),
        tiposDisponibles,
        instalacionesDisponibles,
        categoriasDisponibles,
        isSearching: isSearchLoading,
      }}
      tagSummary={{
        codigo: filters.codigo,
        statusFilter: filters.status,
        tipoFilter: filters.tipo,
        instalacionFilter: filters.instalacion,
        categoriaFilter: filters.categoria,
        totalVisible: totalItems,
        totalEquipos,
        onClearCodigo: handleClearCodigo,
        onClearStatus: () => setFilter("status", "ALL"),
        onClearTipo: () => setFilter("tipo", "Todos"),
        onClearInstalacion: () => setFilter("instalacion", "Todos"),
        onClearCategoria: () => setFilter("categoria", "Todos"),
      }}
      stats={{
        total: totalEquipos,
        activos,
        enMantenimiento,
      }}
      table={{
        data: paginatedData,
        isLoading,
        error: equiposQuery.error
          ? (equiposQuery.error as Error).message
          : null,
        onToggleEstado: handleToggleEstado,
        onEdit: handleOpenEdit,
      }}
      pagination={{
        page,
        pageSize,
        totalItems,
        totalPages,
        pageSizeOptions,
        onPageChange: goto,
        onPageSizeChange: setPageSize,
        isLoading,
      }}
      categoriaModal={{
        isOpen: categoriaModal.isOpen,
        onClose: categoriaModal.onClose,
        title: "Crear Categoría de Equipo",
        fields: categoriaFields,
        onSave: handleSaveCategoria,
      }}
      tipoModal={{
        isOpen: tipoModal.isOpen,
        onClose: tipoModal.onClose,
        title: "Crear Tipo de Equipo",
        fields: tipoFields,
        onSave: handleSaveTipo,
      }}
      equipoModal={{
        isOpen: equipoModal.isOpen,
        onClose: equipoModal.onClose,
        title: "Crear Equipo",
        fields: equipoFields,
        onSave: handleSaveEquipo,
      }}
      editEquipoModal={{
        isOpen: editModal.isOpen,
        onClose: handleCloseEdit,
        title: "Editar Equipo",
        fields: equipoFieldsForEdit,
        initialValues: editEquipoInitialValues,
        onSave: handleSaveEquipoEdit,
        key: `edit-equipo-${selectedEquipo?.idEquipo ?? "new"}`,
      }}
    />
  );
};

export default EquipoList;
