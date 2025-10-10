import { useState, useCallback, useEffect, useRef } from "react";
import { apiCall } from "../../../api/base";
import { useToast } from "@chakra-ui/react";

export interface Equipo {
  codigoEquipo: string;
  nombreEquipo: string;
  estadoEquipo: boolean;
  nombreInstalacion: string;
  estadoInstalacion: boolean;
  nombreCampus: string;
  estadoCampus: boolean;
  nombreCategoriaEquipo?: string;
  idEquipo?: number;
}

export function useEquipos() {
  const [data, setData] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ==============================
  // 📦 Cargar equipos
  // ==============================
  const fetchAll = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await apiCall<Equipo[]>("/equipo/equipo-instalacion", {
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });
      setData(res);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const msg = err.message || "Error al cargar equipos";
        setError(msg);
        toast({
          title: "Error",
          description: msg,
          status: "error",
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ==============================
  // 🔍 Buscar por código
  // ==============================
  const fetchByCodigo = useCallback(async (codigo: string) => {
    if (!codigo) return fetchAll();

    setLoading(true);
    try {
      const res = await apiCall<Equipo[]>(
        `/equipo/equipo-instalacion?codigoEquipo=${codigo}`,
        { credentials: "include" }
      );
      setData(res);

      if (res.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontró ningún equipo con ese código",
          status: "info",
          duration: 3000,
        });
      }
    } catch (err: any) {
      const msg = err.message || "Error al buscar equipo";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        status: "error",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchAll]);

  // ==============================
  // 🧱 Crear categoría de equipo
  // ==============================
  const createCategoriaEquipo = useCallback(
    async (body: any) => {
      try {
        await apiCall("/categoria-equipo", {
          method: "POST",
          body: JSON.stringify(body),
          credentials: "include",
        });
        toast({
          title: "Categoría de equipo creada",
          status: "success",
          duration: 2000,
        });
      } catch (err: any) {
        toast({
          title: "Error al crear categoría de equipo",
          description: err.message || "Error desconocido",
          status: "error",
          duration: 4000,
        });
      }
    },
    [toast]
  );

  // ==============================
  // ⚙️ Crear tipo de equipo
  // ==============================
  const createTipoEquipo = useCallback(
    async (body: any) => {
      try {
        await apiCall("/tipo-equipo", {
          method: "POST",
          body: JSON.stringify(body),
          credentials: "include",
        });
        toast({
          title: "Tipo de equipo creado",
          status: "success",
          duration: 2000,
        });
      } catch (err: any) {
        toast({
          title: "Error al crear tipo de equipo",
          description: err.message || "Error desconocido",
          status: "error",
          duration: 4000,
        });
      }
    },
    [toast]
  );

  // ==============================
  // 🖥️ Crear equipo
  // ==============================
  const createEquipo = useCallback(
    async (body: any) => {
      try {
        await apiCall("/equipo", {
          method: "POST",
          body: JSON.stringify(body),
          credentials: "include",
        });
        toast({
          title: "Equipo creado",
          status: "success",
          duration: 2000,
        });
        await fetchAll();
      } catch (err: any) {
        toast({
          title: "Error al crear equipo",
          description: err.message || "Error desconocido",
          status: "error",
          duration: 4000,
        });
      }
    },
    [fetchAll, toast]
  );

  const cambiarEstado = useCallback(async (id: number, estado: boolean) => {
  try {
    await apiCall(`/equipo/${id}/cambiar-estado`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
      credentials: "include",
    });
  } catch (err: any) {
    throw new Error(err.message || "Error al cambiar estado del equipo");
  }
}, []);

  useEffect(() => {
    fetchAll();
    return () => abortControllerRef.current?.abort();
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    fetchAll,
    fetchByCodigo,
    createEquipo,
    createCategoriaEquipo,
    createTipoEquipo,
    cambiarEstado
  };
}
