import { useCallback, useEffect, useMemo } from "react";
import { useToast } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonasApi } from "../../../api/persona";
import { personaKeys } from "../queryKeys";
import type {
  CreatePersonaPayload,
  CreateUsuarioPayload,
  Persona,
  Rol,
  UpdatePersonaPayload,
  UpdateUsuarioPayload,
} from "../types";

interface UsePersonaManagementParams {
  documentoBusqueda: string;
  enableRoles: boolean;
}

export const usePersonaManagement = ({
  documentoBusqueda,
  enableRoles,
}: UsePersonaManagementParams) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const personasQuery = useQuery<Persona[]>({
    queryKey: personaKeys.all,
    queryFn: PersonasApi.getAll,
  });

  const personasBusquedaQuery = useQuery<Persona[]>({
    queryKey: personaKeys.search(documentoBusqueda),
    queryFn: () => PersonasApi.searchByDocumento(documentoBusqueda),
    enabled: false,
    staleTime: 60_000,
  });

  const rolesQuery = useQuery<Rol[]>({
    queryKey: personaKeys.roles,
    queryFn: PersonasApi.getRoles,
    enabled: enableRoles,
    staleTime: 300_000,
  });

  const personasBase = personasQuery.data ?? [];
  const personasBusqueda = personasBusquedaQuery.data ?? [];

  const personas = useMemo(
    () => (documentoBusqueda ? personasBusqueda : personasBase),
    [documentoBusqueda, personasBase, personasBusqueda],
  );

  const isBaseLoading =
    personasQuery.isLoading || personasQuery.isFetching || personasQuery.isRefetching;
  const isSearchLoading = personasBusquedaQuery.isFetching;
  const isLoading = documentoBusqueda ? isSearchLoading : isBaseLoading;

  const invalidatePersonas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: personaKeys.all });
    if (documentoBusqueda) {
      queryClient.invalidateQueries({
        queryKey: personaKeys.search(documentoBusqueda),
      });
    }
  }, [documentoBusqueda, queryClient]);

  const toggleEstadoMutation = useMutation<
    void,
    Error,
    { idPersona: number; estado: boolean },
    { previous?: Persona[] }
  >({
    mutationFn: ({ idPersona, estado }) =>
      PersonasApi.toggleEstadoUsuario(idPersona, estado),
    onMutate: async ({ idPersona, estado }) => {
      await queryClient.cancelQueries({ queryKey: personaKeys.all });
      const previous = queryClient.getQueryData<Persona[]>(personaKeys.all);
      if (previous) {
        queryClient.setQueryData<Persona[]>(
          personaKeys.all,
          (prev = []) =>
            prev.map((persona) =>
              persona.idPersona === idPersona ? { ...persona, estado } : persona,
            ),
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(personaKeys.all, context.previous);
      }
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
    onSuccess: (_data, { estado }) => {
      toast({
        title: `Persona ${estado ? "habilitada" : "inhabilitada"} correctamente`,
        status: "success",
        duration: 2000,
      });
    },
    onSettled: () => {
      invalidatePersonas();
    },
  });

  const createPersonaMutation = useMutation<void, Error, CreatePersonaPayload>({
    mutationFn: PersonasApi.createPersona,
    onSuccess: () => {
      toast({ title: "Persona creada", status: "success", duration: 2000 });
      invalidatePersonas();
    },
    onError: (error) => {
      toast({
        title: "Error al crear persona",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updatePersonaMutation = useMutation<
    void,
    Error,
    { idPersona: number; payload: UpdatePersonaPayload }
  >({
    mutationFn: ({ idPersona, payload }) =>
      PersonasApi.updatePersona(idPersona, payload),
    onSuccess: () => {
      toast({
        title: "Persona actualizada",
        status: "success",
        duration: 2000,
      });
      invalidatePersonas();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar persona",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const createUsuarioMutation = useMutation<void, Error, CreateUsuarioPayload>({
    mutationFn: PersonasApi.createUsuario,
    onSuccess: () => {
      toast({ title: "Usuario creado", status: "success", duration: 2000 });
      invalidatePersonas();
    },
    onError: (error) => {
      toast({
        title: "Error al crear usuario",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const updateUsuarioMutation = useMutation<
    void,
    Error,
    { idUsuario: number; payload: UpdateUsuarioPayload }
  >({
    mutationFn: ({ idUsuario, payload }) =>
      PersonasApi.updateUsuario(idUsuario, payload),
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        status: "success",
        duration: 2000,
      });
      invalidatePersonas();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    },
  });

  const searchPersonas = useCallback(async () => {
    if (!documentoBusqueda.trim()) {
      toast({
        title: "Ingresa un documento",
        description: "Debes escribir un documento antes de buscar",
        status: "info",
        duration: 3000,
      });
      return [];
    }
    const result = await personasBusquedaQuery.refetch();
    const payload = result.data ?? [];
    if (payload.length === 0) {
      toast({
        title: "Sin resultados",
        description: "No se encontró ninguna persona con ese documento",
        status: "info",
        duration: 3000,
      });
    }
    return payload;
  }, [documentoBusqueda, personasBusquedaQuery, toast]);

  const clearBusquedaPersonas = useCallback(() => {
    if (!documentoBusqueda) {
      return;
    }
    queryClient.removeQueries({
      queryKey: personaKeys.search(documentoBusqueda),
      exact: true,
    });
  }, [documentoBusqueda, queryClient]);

  useEffect(() => {
    if (personasBusquedaQuery.error && documentoBusqueda) {
      toast({
        title: "Error al buscar persona",
        description: (personasBusquedaQuery.error as Error).message,
        status: "error",
        duration: 4000,
      });
    }
  }, [documentoBusqueda, personasBusquedaQuery.error, toast]);

  return {
    personas,
    personasBase,
    personasBusqueda,
    personasQuery,
    personasBusquedaQuery,
    rolesQuery,
    isLoading,
    isBaseLoading,
    isSearchLoading,
    searchPersonas,
    invalidatePersonas,
    toggleEstado: toggleEstadoMutation.mutate,
    createPersona: createPersonaMutation.mutateAsync,
    updatePersona: updatePersonaMutation.mutateAsync,
    createUsuario: createUsuarioMutation.mutateAsync,
    updateUsuario: updateUsuarioMutation.mutateAsync,
    clearBusquedaPersonas,
  };
};

export type UsePersonaManagementReturn = ReturnType<typeof usePersonaManagement>;
