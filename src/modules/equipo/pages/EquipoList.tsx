import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, useDisclosure, useToast } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GenericModal, { type Field } from "../../../components/UI/GenericModal";
import { EquiposApi } from "../../../api/equipo";
import { equipoKeys } from "../queryKeys";
import { useFilterState } from "../../../hooks/useFilterState";
import { useTableManager } from "../../../hooks/useTableManager";
import { EquipoHeader } from "../components/EquipoHeader";
import { EquipoFilters } from "../components/EquipoFilters";
import { EquipoTagSummary } from "../components/EquipoTagSummary";
import { EquipoStats } from "../components/EquipoStats";
import { EquipoTable } from "../components/EquipoTable";
import { EquipoPagination } from "../components/EquipoPagination";
import type {
  CategoriaEquipo,
  CreateCategoriaEquipoPayload,
  CreateEquipoPayload,
  CreateTipoEquipoPayload,
  EquipoSummary,
  InstalacionOption,
  TipoEquipo,
  UpdateEquipoPayload,
} from "../types";

interface TipoEquipoFormValues {
  nombre: string;
  descripcion?: string;
  categoriaEquipo: string | number;
}

interface EquipoFormValues {
  codigo: string;
  tipoEquipo: string | number;
  instalacion: string | number;
}

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
  const queryClient = useQueryClient();
  const categoriaModal = useDisclosure();
  const tipoModal = useDisclosure();
  const equipoModal = useDisclosure();
  const editModal = useDisclosure();

  const [selectedEquipo, setSelectedEquipo] = useState<EquipoSummary | null>(
    null,
  );

  const { filters, setFilter } = useFilterState(initialFilters);
  const codigoBusqueda = filters.codigo.trim();

  const equiposQuery = useQuery<EquipoSummary[]>({
    queryKey: equipoKeys.all,
    queryFn: EquiposApi.getAll,
  });

  const searchQuery = useQuery<EquipoSummary[]>({
    queryKey: equipoKeys.search(codigoBusqueda),
    queryFn: () => EquiposApi.searchByCodigo(codigoBusqueda),
    enabled: false,
    staleTime: 60_000,
  });

  const categoriasQuery = useQuery<CategoriaEquipo[]>({
    queryKey: equipoKeys.categories,
    queryFn: EquiposApi.getCategorias,
    enabled: categoriaModal.isOpen || tipoModal.isOpen,
    staleTime: 300_000,
  });

  const tiposQuery = useQuery<TipoEquipo[]>({
    queryKey: equipoKeys.types,
    queryFn: EquiposApi.getTipos,
    enabled: tipoModal.isOpen || equipoModal.isOpen || editModal.isOpen,
    staleTime: 300_000,
  });

  const instalacionesQuery = useQuery<InstalacionOption[]>({
    queryKey: equipoKeys.instalaciones,
    queryFn: EquiposApi.getInstalaciones,
    enabled: equipoModal.isOpen || editModal.isOpen,
    staleTime: 300_000,
  });

  const equiposBase = useMemo(
    () => equiposQuery.data ?? [],
    [equiposQuery.data],
  );
  const equiposBusqueda = useMemo(
    () => searchQuery.data ?? [],
    [searchQuery.data],
  );
  const equipos = codigoBusqueda ? equiposBusqueda : equiposBase;

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

  const totalEquipos = equiposBase.length;
  const activos = equiposBase.filter((item) => item.estadoEquipo).length;
  const enMantenimiento = equiposBase.filter(
    (item) => !item.estadoInstalacion || !item.estadoCampus,
  ).length;

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

  const createCategoriaMutation = useMutation<
    void,
    Error,
    CreateCategoriaEquipoPayload
  >({
    mutationFn: EquiposApi.createCategoria,
    onSuccess: () => {
      toast({
        title: "Categoría de equipo creada",
        status: "success",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: equipoKeys.categories });
    },
    onError: (error) => {
      toast({
        title: "Error al crear categoría de equipo",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createTipoMutation = useMutation<void, Error, CreateTipoEquipoPayload>({
    mutationFn: EquiposApi.createTipo,
    onSuccess: () => {
      toast({
        title: "Tipo de equipo creado",
        status: "success",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: equipoKeys.types });
    },
    onError: (error) => {
      toast({
        title: "Error al crear tipo de equipo",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createEquipoMutation = useMutation<void, Error, CreateEquipoPayload>({
    mutationFn: EquiposApi.createEquipo,
    onSuccess: () => {
      toast({ title: "Equipo creado", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: equipoKeys.all });
      if (codigoBusqueda) {
        queryClient.invalidateQueries({
          queryKey: equipoKeys.search(codigoBusqueda),
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error al crear equipo",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updateEquipoMutation = useMutation<
    void,
    Error,
    { idEquipo: number; payload: UpdateEquipoPayload }
  >({
    mutationFn: ({ idEquipo, payload }) =>
      EquiposApi.updateEquipo(idEquipo, payload),
    onSuccess: () => {
      toast({ title: "Equipo actualizado", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: equipoKeys.all });
      if (codigoBusqueda) {
        queryClient.invalidateQueries({
          queryKey: equipoKeys.search(codigoBusqueda),
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar equipo",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const toggleEstadoMutation = useMutation<
    void,
    Error,
    { idEquipo: number; nextEstado: boolean; codigo?: string },
    { previousEquipos?: EquipoSummary[]; previousBusqueda?: EquipoSummary[] }
  >({
    mutationFn: ({ idEquipo, nextEstado }) =>
      EquiposApi.toggleEstado(idEquipo, nextEstado),
    onMutate: async ({ idEquipo, nextEstado, codigo }) => {
      await queryClient.cancelQueries({ queryKey: equipoKeys.all });
      const previousEquipos = queryClient.getQueryData<EquipoSummary[]>(
        equipoKeys.all,
      );
      if (previousEquipos) {
        queryClient.setQueryData<EquipoSummary[]>(equipoKeys.all, (prev = []) =>
          prev.map((item) =>
            item.idEquipo === idEquipo
              ? { ...item, estadoEquipo: nextEstado }
              : item,
          ),
        );
      }
      let previousBusqueda: EquipoSummary[] | undefined;
      if (codigo) {
        await queryClient.cancelQueries({
          queryKey: equipoKeys.search(codigo),
        });
        previousBusqueda = queryClient.getQueryData<EquipoSummary[]>(
          equipoKeys.search(codigo),
        );
        if (previousBusqueda) {
          queryClient.setQueryData<EquipoSummary[]>(
            equipoKeys.search(codigo),
            (prev = []) =>
              prev.map((item) =>
                item.idEquipo === idEquipo
                  ? { ...item, estadoEquipo: nextEstado }
                  : item,
              ),
          );
        }
      }
      return { previousEquipos, previousBusqueda };
    },
    onError: (error, _variables, context) => {
      if (context?.previousEquipos) {
        queryClient.setQueryData(equipoKeys.all, context.previousEquipos);
      }
      if (_variables.codigo && context?.previousBusqueda) {
        queryClient.setQueryData(
          equipoKeys.search(_variables.codigo),
          context.previousBusqueda,
        );
      }
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
    onSuccess: (_data, { nextEstado }) => {
      toast({
        title: `Equipo ${nextEstado ? "habilitado" : "inhabilitado"} correctamente`,
        status: "success",
        duration: 2000,
      });
    },
    onSettled: (_data, _error, { codigo }) => {
      queryClient.invalidateQueries({ queryKey: equipoKeys.all });
      if (codigo) {
        queryClient.invalidateQueries({ queryKey: equipoKeys.search(codigo) });
      }
    },
  });

  const isLoadingBase = equiposQuery.isLoading || equiposQuery.isFetching;
  const isLoadingSearch = searchQuery.isFetching;
  const isLoading = codigoBusqueda ? isLoadingSearch : isLoadingBase;

  useEffect(() => {
    if (searchQuery.error && codigoBusqueda) {
      toast({
        title: "Error buscando equipo",
        description: (searchQuery.error as Error).message,
        status: "error",
        duration: 4000,
      });
    }
  }, [codigoBusqueda, searchQuery.error, toast]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: equipoKeys.all });
    if (codigoBusqueda) {
      queryClient.invalidateQueries({
        queryKey: equipoKeys.search(codigoBusqueda),
      });
    }
  };

  const handleSearchByCodigo = () => {
    if (!codigoBusqueda) {
      toast({
        title: "Ingresa un código",
        description: "Debes escribir un código antes de buscar",
        status: "info",
        duration: 3000,
      });
      return;
    }
    searchQuery.refetch();
  };

  const handleClearCodigo = () => {
    if (filters.codigo) {
      queryClient.removeQueries({
        queryKey: equipoKeys.search(filters.codigo.trim()),
        exact: true,
      });
    }
    setFilter("codigo", "");
  };

  const categoriaFields: Field<CreateCategoriaEquipoPayload>[] = useMemo(
    () => [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "text" },
    ],
    [],
  );

  const tipoFields: Field<TipoEquipoFormValues>[] = useMemo(
    () => [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "text" },
      {
        name: "categoriaEquipo",
        label: "Categoría",
        type: "select",
        required: true,
        options: categoriaOptions,
      },
    ],
    [categoriaOptions],
  );

  const equipoFields: Field<EquipoFormValues>[] = useMemo(
    () => [
      { name: "codigo", label: "Código", type: "text", required: true },
      {
        name: "tipoEquipo",
        label: "Tipo de Equipo",
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
    [instalacionOptions, tipoOptions],
  );

  const equipoEditFields: Field<EquipoFormValues>[] = equipoFields;

  const handleToggleEstado = (equipo: EquipoSummary) => {
    toggleEstadoMutation.mutate({
      idEquipo: equipo.idEquipo,
      nextEstado: !equipo.estadoEquipo,
      codigo: codigoBusqueda || undefined,
    });
  };

  const handleOpenEdit = (equipo: EquipoSummary) => {
    setSelectedEquipo(equipo);
    editModal.onOpen();
  };

  const handleCloseEdit = () => {
    setSelectedEquipo(null);
    editModal.onClose();
  };

  return (
    <Stack spacing={8}>
      <EquipoHeader
        onRefresh={handleRefresh}
        onOpenCategoria={categoriaModal.onOpen}
        onOpenTipo={() => {
          if (!categoriasQuery.data) {
            categoriasQuery.refetch();
          }
          tipoModal.onOpen();
        }}
        onOpenEquipo={() => {
          if (!tiposQuery.data) {
            tiposQuery.refetch();
          }
          if (!instalacionesQuery.data) {
            instalacionesQuery.refetch();
          }
          equipoModal.onOpen();
        }}
        isLoading={isLoading}
      />

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <EquipoFilters
          codigo={filters.codigo}
          onCodigoChange={(value) => setFilter("codigo", value)}
          onSearchByCodigo={handleSearchByCodigo}
          onClearCodigo={handleClearCodigo}
          statusFilter={filters.status}
          onStatusChange={(value) => setFilter("status", value)}
          tipoFilter={filters.tipo}
          onTipoChange={(value) => setFilter("tipo", value)}
          instalacionFilter={filters.instalacion}
          onInstalacionChange={(value) => setFilter("instalacion", value)}
          categoriaFilter={filters.categoria}
          onCategoriaChange={(value) => setFilter("categoria", value)}
          tiposDisponibles={tiposDisponibles}
          instalacionesDisponibles={instalacionesDisponibles}
          categoriasDisponibles={categoriasDisponibles}
          isSearching={searchQuery.isFetching}
        />

        <EquipoTagSummary
          codigo={filters.codigo}
          statusFilter={filters.status}
          tipoFilter={filters.tipo}
          instalacionFilter={filters.instalacion}
          categoriaFilter={filters.categoria}
          totalVisible={totalItems}
          totalEquipos={totalEquipos}
          onClearCodigo={handleClearCodigo}
          onClearStatus={() => setFilter("status", "ALL")}
          onClearTipo={() => setFilter("tipo", "Todos")}
          onClearInstalacion={() => setFilter("instalacion", "Todos")}
          onClearCategoria={() => setFilter("categoria", "Todos")}
        />
      </Stack>

      <EquipoStats
        total={totalEquipos}
        activos={activos}
        enMantenimiento={enMantenimiento}
      />

      <Stack
        spacing={4}
        borderWidth="1px"
        borderRadius="2xl"
        borderColor="neutral.100"
        bg="white"
        boxShadow="md"
        p={6}
      >
        <EquipoTable
          data={paginatedData}
          isLoading={isLoading}
          error={
            equiposQuery.error ? (equiposQuery.error as Error).message : null
          }
          onToggleEstado={handleToggleEstado}
          onEdit={handleOpenEdit}
        />
        <Box>
          <EquipoPagination
            page={page}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={goto}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        </Box>
      </Stack>

      <GenericModal
        isOpen={categoriaModal.isOpen}
        onClose={categoriaModal.onClose}
        title="Crear Categoría de Equipo"
        fields={categoriaFields}
        onSave={async (values) => {
          await createCategoriaMutation.mutateAsync({
            nombre: values.nombre ?? "",
            descripcion: values.descripcion ?? "",
          });
          categoriaModal.onClose();
        }}
      />

      <GenericModal
        isOpen={tipoModal.isOpen}
        onClose={tipoModal.onClose}
        title="Crear Tipo de Equipo"
        fields={tipoFields}
        onSave={async (values) => {
          await createTipoMutation.mutateAsync({
            nombre: values.nombre ?? "",
            descripcion: values.descripcion ?? "",
            categoriaEquipo: { id: Number(values.categoriaEquipo) },
          });
          tipoModal.onClose();
        }}
      />

      <GenericModal
        isOpen={equipoModal.isOpen}
        onClose={equipoModal.onClose}
        title="Crear Equipo"
        fields={equipoFields}
        onSave={async (values) => {
          await createEquipoMutation.mutateAsync({
            codigo: values.codigo ?? "",
            tipoEquipo: { id: Number(values.tipoEquipo) },
            instalacion: { id: Number(values.instalacion) },
          });
          equipoModal.onClose();
        }}
      />

      <GenericModal
        key={`edit-equipo-${selectedEquipo?.idEquipo ?? "new"}`}
        isOpen={editModal.isOpen}
        onClose={handleCloseEdit}
        title="Editar Equipo"
        fields={equipoEditFields}
        initialValues={
          selectedEquipo
            ? {
                codigo: selectedEquipo.codigoEquipo,
                tipoEquipo:
                  tipoOptions.find(
                    (option) => option.label === selectedEquipo.nombreEquipo,
                  )?.value ?? "",
                instalacion:
                  instalacionOptions.find(
                    (option) =>
                      option.label === selectedEquipo.nombreInstalacion,
                  )?.value ?? "",
              }
            : undefined
        }
        onSave={async (values) => {
          if (!selectedEquipo) return;
          await updateEquipoMutation.mutateAsync({
            idEquipo: selectedEquipo.idEquipo,
            payload: {
              codigo: values.codigo ?? "",
              tipoEquipo: { id: Number(values.tipoEquipo) },
              instalacion: { id: Number(values.instalacion) },
            },
          });
          handleCloseEdit();
        }}
      />
    </Stack>
  );
};

export default EquipoList;
