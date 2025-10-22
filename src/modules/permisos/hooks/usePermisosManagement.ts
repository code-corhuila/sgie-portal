import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PermisosApi } from "../../../api/permisos";
import { permisosKeys } from "../queryKeys";
import type {
  CreatePermisoRolEntidadPayload,
  PermisoRolEntidad,
  UpdatePermisoRolEntidadPayload,
} from "../types";

export const usePermisosManagement = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const asignacionesQuery = useQuery<PermisoRolEntidad[]>({
    queryKey: permisosKeys.all,
    queryFn: PermisosApi.getAll,
  });

  const rolesQuery = useQuery({
    queryKey: permisosKeys.roles,
    queryFn: PermisosApi.getRoles,
    staleTime: 300_000,
  });

  const permisosQuery = useQuery({
    queryKey: permisosKeys.permisos,
    queryFn: PermisosApi.getPermisos,
    staleTime: 300_000,
  });

  const entidadesQuery = useQuery({
    queryKey: permisosKeys.entidades,
    queryFn: PermisosApi.getEntidades,
    staleTime: 300_000,
  });

  const data = asignacionesQuery.data ?? [];

  const invalidateAsignaciones = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: permisosKeys.all });
  }, [queryClient]);

  const toggleEstadoMutation = useMutation<
    void,
    Error,
    { id: number; nextState: boolean },
    { previous?: PermisoRolEntidad[] }
  >({
    mutationFn: ({ id, nextState }) => PermisosApi.toggleEstado(id, nextState),
    onMutate: async ({ id, nextState }) => {
      await queryClient.cancelQueries({ queryKey: permisosKeys.all });
      const previous = queryClient.getQueryData<PermisoRolEntidad[]>(
        permisosKeys.all,
      );
      if (previous) {
        queryClient.setQueryData<PermisoRolEntidad[]>(
          permisosKeys.all,
          (prev = []) =>
            prev.map((item) =>
              item.id === id ? { ...item, estado: nextState } : item,
            ),
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(permisosKeys.all, context.previous);
      }
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
    onSuccess: (_data, { nextState }) => {
      toast({
        title: `Asignación ${nextState ? "habilitada" : "inhabilitada"} correctamente`,
        status: "success",
        duration: 2000,
      });
    },
    onSettled: () => {
      invalidateAsignaciones();
    },
  });

  const updatePermisoMutation = useMutation<
    void,
    Error,
    { id: number; payload: UpdatePermisoRolEntidadPayload }
  >({
    mutationFn: ({ id, payload }) => PermisosApi.update(id, payload),
    onSuccess: () => {
      toast({
        title: "Permiso actualizado",
        status: "success",
        duration: 2000,
      });
      invalidateAsignaciones();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar permiso",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createPermisoMutation = useMutation<
    void,
    Error,
    CreatePermisoRolEntidadPayload
  >({
    mutationFn: (payload) => PermisosApi.create(payload),
    onSuccess: () => {
      invalidateAsignaciones();
    },
    onError: (error) => {
      toast({
        title: "Error al asignar permiso",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createRolMutation = useMutation<
    void,
    Error,
    { nombre: string; descripcion?: string }
  >({
    mutationFn: (payload) => PermisosApi.createRol(payload),
    onSuccess: () => {
      toast({ title: "Rol creado", status: "success", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: permisosKeys.roles });
      invalidateAsignaciones();
    },
    onError: (error) => {
      toast({
        title: "Error al crear rol",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updateRolMutation = useMutation<
    void,
    Error,
    { id: number; payload: { nombre: string; descripcion?: string } }
  >({
    mutationFn: ({ id, payload }) => PermisosApi.updateRol(id, payload),
    onSuccess: () => {
      toast({
        title: "Rol actualizado",
        status: "success",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: permisosKeys.roles });
      invalidateAsignaciones();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar rol",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  return {
    data,
    asignacionesQuery,
    rolesQuery,
    permisosQuery,
    entidadesQuery,
    toggleEstado: toggleEstadoMutation.mutateAsync,
    updateAsignacion: updatePermisoMutation.mutateAsync,
    createAsignacion: createPermisoMutation.mutateAsync,
    createRol: createRolMutation.mutateAsync,
    updateRol: updateRolMutation.mutateAsync,
    updateRolPending: updateRolMutation.isPending,
    invalidateAsignaciones,
  };
};

export type UsePermisosManagementReturn = ReturnType<
  typeof usePermisosManagement
>;
