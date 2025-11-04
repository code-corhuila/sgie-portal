import { useCallback, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EquiposApi } from "../../../api/equipo";
import { equipoKeys } from "../queryKeys";
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

interface UseEquipoManagementParams {
  codigoBusqueda: string;
  enableCategorias: boolean;
  enableTipos: boolean;
  enableInstalaciones: boolean;
}

export const useEquipoManagement = ({
  codigoBusqueda,
  enableCategorias,
  enableTipos,
  enableInstalaciones,
}: UseEquipoManagementParams) => {
  const toast = useToast();
  const queryClient = useQueryClient();

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
    enabled: enableCategorias,
    staleTime: 300_000,
  });

  const tiposQuery = useQuery<TipoEquipo[]>({
    queryKey: equipoKeys.types,
    queryFn: EquiposApi.getTipos,
    enabled: enableTipos,
    staleTime: 300_000,
  });

  const instalacionesQuery = useQuery<InstalacionOption[]>({
    queryKey: equipoKeys.instalaciones,
    queryFn: EquiposApi.getInstalaciones,
    enabled: enableInstalaciones,
    staleTime: 300_000,
  });

  const equiposBase = equiposQuery.data ?? [];
  const equiposBusqueda = searchQuery.data ?? [];
  const equipos = codigoBusqueda ? equiposBusqueda : equiposBase;

  const isBaseLoading =
    equiposQuery.isLoading || equiposQuery.isFetching || equiposQuery.isRefetching;
  const isSearchLoading = searchQuery.isFetching;
  const isLoading = codigoBusqueda ? isSearchLoading : isBaseLoading;

  const invalidateEquipos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: equipoKeys.all });
    if (codigoBusqueda) {
      queryClient.invalidateQueries({
        queryKey: equipoKeys.search(codigoBusqueda),
      });
    }
  }, [codigoBusqueda, queryClient]);

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
      invalidateEquipos();
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
      invalidateEquipos();
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
    onError: (error, variables, context) => {
      if (context?.previousEquipos) {
        queryClient.setQueryData(equipoKeys.all, context.previousEquipos);
      }
      if (variables.codigo && context?.previousBusqueda) {
        queryClient.setQueryData(
          equipoKeys.search(variables.codigo),
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
    onSettled: (_data, _error, variables) => {
      invalidateEquipos();
      if (variables.codigo) {
        queryClient.invalidateQueries({
          queryKey: equipoKeys.search(variables.codigo),
        });
      }
    },
  });

  const searchEquipos = useCallback(async () => {
    if (!codigoBusqueda.trim()) {
      toast({
        title: "Ingresa un código",
        description: "Debes escribir un código antes de buscar",
        status: "info",
        duration: 3000,
      });
      return [];
    }
    const result = await searchQuery.refetch();
    const payload = result.data ?? [];
    if (payload.length === 0) {
      toast({
        title: "Sin resultados",
        description: "No se encontró ningún equipo con ese código",
        status: "info",
        duration: 3000,
      });
    }
    return payload;
  }, [codigoBusqueda, searchQuery, toast]);

  const clearBusquedaEquipos = useCallback(() => {
    if (!codigoBusqueda) {
      return;
    }
    queryClient.removeQueries({
      queryKey: equipoKeys.search(codigoBusqueda),
      exact: true,
    });
  }, [codigoBusqueda, queryClient]);

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

  return {
    equipos,
    equiposBase,
    equiposBusqueda,
    equiposQuery,
    searchQuery,
    categoriasQuery,
    tiposQuery,
    instalacionesQuery,
    isLoading,
    isSearchLoading,
    searchEquipos,
    invalidateEquipos,
    createCategoria: createCategoriaMutation.mutateAsync,
    createTipo: createTipoMutation.mutateAsync,
    createEquipo: createEquipoMutation.mutateAsync,
    updateEquipo: updateEquipoMutation.mutateAsync,
    toggleEstado: toggleEstadoMutation.mutate,
    clearBusquedaEquipos,
  };
};

export type UseEquipoManagementReturn = ReturnType<typeof useEquipoManagement>;
