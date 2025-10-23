// src/modules/site/hooks/useUbicacion.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { apiCall } from "../../../api/base";

type ApiResponse<T> = {
  message?: string;
  data: T;
  success?: boolean;
  status?: boolean;
};

export interface Continente {
  id: number;
  nombre: string;
  descripcion?: string;
  state?: boolean;
}
export interface Pais {
  id: number;
  nombre: string;
  descripcion?: string;
}
export interface Departamento {
  id: number;
  nombre: string;
  descripcion?: string;
}
export interface Municipio {
  id: number;
  nombre: string;
  descripcion?: string;
}
export interface Campus {
  id: number;
  nombre: string;
  descripcion?: string;
  state?: boolean;
}
export interface Instalacion {
  id: number;
  nombre: string;
  descripcion?: string;
  categoriaInstalacion?: string;
  state?: boolean;
}

export interface InstalacionCampusRow {
  unique?: string | number;
  idCategoriaInstalacion: string | number | undefined;
  nombreCategoriaInstalacion: string;
  idContinente: number;
  nombreContinente: string;
  idPais: number;
  nombrePais: string;
  idDepartamento: number;
  nombreDepartamento: string;
  idMunicipio: number;
  nombreMunicipio: string;
  idCampus: number;
  nombreCampus: string;
  idInstalacion: number;
  nombreInstalacion: string;
  descripcionInstalacion: string;
  descripcionCampus: string;
  categoriaInstalacion: string;
  estadoInstalacion: boolean;
}

export function useUbicacion() {
  const toast = useToast();

  // ===== Tabla =====
  const [rows, setRows] = useState<InstalacionCampusRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ===== Catálogos base =====
  const [continentes, setContinentes] = useState<Continente[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [categoriaInstalacion, setCategoriaInstalacion] = useState<
    { id: number; nombre: string }[]
  >([]);

  // ===== Cascada (para modales) =====
  const [paisesCascada, setPaisesCascada] = useState<Pais[]>([]);
  const [departamentosCascada, setDepartamentosCascada] = useState<
    Departamento[]
  >([]);
  const [municipiosCascada, setMunicipiosCascada] = useState<Municipio[]>([]);
  const [campusCascada, setCampusCascada] = useState<Campus[]>([]);

  // ------- Caché por clave + dedupe de llamadas + anti-stale -------
  const cachePaises = useRef<Map<number, Pais[]>>(new Map());
  const cacheDepartamentos = useRef<Map<number, Departamento[]>>(new Map());
  const cacheMunicipios = useRef<Map<number, Municipio[]>>(new Map());
  const cacheCampus = useRef<Map<number, Campus[]>>(new Map());

  const pendingPaises = useRef<Map<number, Promise<Pais[]>>>(new Map());
  const pendingDepartamentos = useRef<Map<number, Promise<Departamento[]>>>(
    new Map(),
  );
  const pendingMunicipios = useRef<Map<number, Promise<Municipio[]>>>(
    new Map(),
  );
  const pendingCampus = useRef<Map<number, Promise<Campus[]>>>(new Map());

  const latestSelection = useRef<{
    continenteId?: number;
    paisId?: number;
    deptoId?: number;
    munId?: number;
  }>({});

  // =====================
  //    FETCH PRINCIPAL
  // =====================
  const fetchInstalacionesCampus = useCallback(
    async (nombreInstalacion = "", nombreCampus = "") => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      try {
        const res = await apiCall<InstalacionCampusRow[]>(
          `/instalacion/instalacion-campus?nombreInstalacion=${encodeURIComponent(nombreInstalacion)}&nombreCampus=${encodeURIComponent(nombreCampus)}`,
          { signal: abortRef.current.signal, credentials: "include" },
        );
        const normalized = (res ?? []).map((item, index) => {
          const parts = [
            item.idInstalacion != null ? `inst-${item.idInstalacion}` : null,
            item.idCampus != null ? `campus-${item.idCampus}` : null,
            item.idMunicipio != null ? `mun-${item.idMunicipio}` : null,
            item.idDepartamento != null ? `dept-${item.idDepartamento}` : null,
          ].filter(Boolean);
          const fallbackId =
            parts.join("-") ||
            `row-${item.nombreInstalacion ?? item.nombreCampus ?? index}`;
          return {
            ...item,
            unique: `${item.unique ?? fallbackId}-idx-${index}`,
          };
        });
        setRows(normalized);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const msg = err?.message ?? "Error cargando instalaciones";
          setError(msg);
          setRows([]); // Limpiar rows en caso de error
          toast({
            title: "Error",
            description: msg,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // =====================
  //    CATÁLOGOS BASE
  // =====================
  const getContinentes = useCallback(async () => {
    const res = await apiCall<ApiResponse<Continente[]>>(`/continente`, {
      credentials: "include",
    });
    setContinentes(res?.data ?? []);
  }, []);

  const getPaises = useCallback(async () => {
    const res = await apiCall<ApiResponse<Pais[]>>(`/pais`, {
      credentials: "include",
    });
    setPaises(res?.data ?? []);
  }, []);
  const getDepartamentos = useCallback(async () => {
    const res = await apiCall<ApiResponse<Departamento[]>>(`/departamento`, {
      credentials: "include",
    });
    setDepartamentos(res?.data ?? []);
  }, []);
  const getMunicipios = useCallback(async () => {
    const res = await apiCall<ApiResponse<Municipio[]>>(`/municipio`, {
      credentials: "include",
    });
    setMunicipios(res?.data ?? []);
  }, []);
  const getCampus = useCallback(async () => {
    const res = await apiCall<ApiResponse<Campus[]>>(`/campus`, {
      credentials: "include",
    });
    setCampusList(res?.data ?? []);
  }, []);
  const getInstalaciones = useCallback(async () => {
    const res = await apiCall<ApiResponse<Instalacion[]>>(`/instalacion`, {
      credentials: "include",
    });
    setInstalaciones(res?.data ?? []);
  }, []);

  const fetchCategoriaInstalacion = useCallback(async () => {
    try {
      const res = await apiCall<ApiResponse<{ id: number; nombre: string }[]>>(
        "/categoria-instalacion",
        { credentials: "include" },
      );
      setCategoriaInstalacion(res?.data ?? []);
    } catch (err) {
      console.error("Error cargando categoria de instalación", err);
    }
  }, []);

  const refreshCatalogs = useCallback(async () => {
    await Promise.all([
      getContinentes(),
      getPaises(),
      getDepartamentos(),
      getMunicipios(),
      getCampus(),
      getInstalaciones(),
    ]);
  }, [
    getContinentes,
    getPaises,
    getDepartamentos,
    getMunicipios,
    getCampus,
    getInstalaciones,
  ]);

  // =====================
  //   HELPERS LIMPIEZA
  // =====================
  const clearFrom = useCallback(
    (level: "continente" | "pais" | "departamento" | "municipio" | "all") => {
      if (level === "all" || level === "continente") {
        setPaisesCascada([]);
        setDepartamentosCascada([]);
        setMunicipiosCascada([]);
        setCampusCascada([]);
      } else if (level === "pais") {
        setDepartamentosCascada([]);
        setMunicipiosCascada([]);
        setCampusCascada([]);
      } else if (level === "departamento") {
        setMunicipiosCascada([]);
        setCampusCascada([]);
      } else if (level === "municipio") {
        setCampusCascada([]);
      }
    },
    [],
  );

  // =====================
  //   FETCH “POR PADRE”
  // =====================
  const fetchPaisesByContinente = useCallback(
    async (continenteId: number) => {
      latestSelection.current.continenteId = continenteId;

      if (!continenteId) {
        clearFrom("continente");
        return [];
      }

      clearFrom("continente");

      const cached = cachePaises.current.get(continenteId);
      if (cached) {
        setPaisesCascada(cached);
        return cached;
      }

      const inflight = pendingPaises.current.get(continenteId);
      if (inflight) {
        const opts = await inflight;
        if (latestSelection.current.continenteId === continenteId)
          setPaisesCascada(opts);
        return opts;
      }

      const p = apiCall<ApiResponse<Pais[]>>(
        `/pais/por-continente/${continenteId}`,
        { credentials: "include" },
      )
        .then((r) => r?.data ?? [])
        .then((list) => {
          cachePaises.current.set(continenteId, list);
          pendingPaises.current.delete(continenteId);
          return list;
        })
        .catch((err) => {
          pendingPaises.current.delete(continenteId);
          throw err;
        });

      pendingPaises.current.set(continenteId, p);
      const result = await p;
      if (latestSelection.current.continenteId === continenteId)
        setPaisesCascada(result);
      return result;
    },
    [clearFrom],
  );

  const fetchDepartamentosByPais = useCallback(
    async (paisId: number) => {
      latestSelection.current.paisId = paisId;

      if (!paisId) {
        clearFrom("pais");
        return [];
      }

      clearFrom("pais");

      const cached = cacheDepartamentos.current.get(paisId);
      if (cached) {
        setDepartamentosCascada(cached);
        return cached;
      }

      const inflight = pendingDepartamentos.current.get(paisId);
      if (inflight) {
        const opts = await inflight;
        if (latestSelection.current.paisId === paisId)
          setDepartamentosCascada(opts);
        return opts;
      }

      const p = apiCall<ApiResponse<Departamento[]>>(
        `/departamento/por-pais/${paisId}`,
        { credentials: "include" },
      )
        .then((r) => r?.data ?? [])
        .then((list) => {
          cacheDepartamentos.current.set(paisId, list);
          pendingDepartamentos.current.delete(paisId);
          return list;
        })
        .catch((err) => {
          pendingDepartamentos.current.delete(paisId);
          throw err;
        });

      pendingDepartamentos.current.set(paisId, p);
      const result = await p;
      if (latestSelection.current.paisId === paisId)
        setDepartamentosCascada(result);
      return result;
    },
    [clearFrom],
  );

  const fetchMunicipiosByDepartamento = useCallback(
    async (deptoId: number) => {
      latestSelection.current.deptoId = deptoId;

      if (!deptoId) {
        clearFrom("departamento");
        return [];
      }

      clearFrom("departamento");

      const cached = cacheMunicipios.current.get(deptoId);
      if (cached) {
        setMunicipiosCascada(cached);
        return cached;
      }

      const inflight = pendingMunicipios.current.get(deptoId);
      if (inflight) {
        const opts = await inflight;
        if (latestSelection.current.deptoId === deptoId)
          setMunicipiosCascada(opts);
        return opts;
      }

      const p = apiCall<ApiResponse<Municipio[]>>(
        `/municipio/por-departamento/${deptoId}`,
        { credentials: "include" },
      )
        .then((r) => r?.data ?? [])
        .then((list) => {
          cacheMunicipios.current.set(deptoId, list);
          pendingMunicipios.current.delete(deptoId);
          return list;
        })
        .catch((err) => {
          pendingMunicipios.current.delete(deptoId);
          throw err;
        });

      pendingMunicipios.current.set(deptoId, p);
      const result = await p;
      if (latestSelection.current.deptoId === deptoId)
        setMunicipiosCascada(result);
      return result;
    },
    [clearFrom],
  );

  const fetchCampusByMunicipio = useCallback(
    async (munId: number) => {
      latestSelection.current.munId = munId;

      if (!munId) {
        clearFrom("municipio");
        return [];
      }

      clearFrom("municipio");

      const cached = cacheCampus.current.get(munId);
      if (cached) {
        setCampusCascada(cached);
        return cached;
      }

      const inflight = pendingCampus.current.get(munId);
      if (inflight) {
        const opts = await inflight;
        if (latestSelection.current.munId === munId) setCampusCascada(opts);
        return opts;
      }

      const p = apiCall<ApiResponse<Campus[]>>(
        `/campus/por-municipio/${munId}`,
        { credentials: "include" },
      )
        .then((r) => r?.data ?? [])
        .then((list) => {
          cacheCampus.current.set(munId, list);
          pendingCampus.current.delete(munId);
          return list;
        })
        .catch((err) => {
          pendingCampus.current.delete(munId);
          throw err;
        });

      pendingCampus.current.set(munId, p);
      const result = await p;
      if (latestSelection.current.munId === munId) setCampusCascada(result);
      return result;
    },
    [clearFrom],
  );

  // =====================
  //      CRUD (sin cambios)
  // =====================
  const createCampus = useCallback(
    async (payload: {
      nombre: string;
      descripcion?: string;
      municipioId: string;
    }) => {
      await apiCall(`/campus`, {
        method: "POST",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? "",
          municipio: { id: payload.municipioId },
        }),
        credentials: "include",
      });
      cacheCampus.current.clear();
      pendingCampus.current.clear();
      toast({ title: "Campus creado", status: "success", duration: 2000 });
      await getCampus();
    },
    [getCampus, toast],
  );

  const updateCampus = useCallback(
    async (
      id: number,
      payload: { nombre: string; descripcion?: string; municipioId: number },
    ) => {
      await apiCall(`/campus/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? "",
          municipio: { id: payload.municipioId },
        }),
        credentials: "include",
      });
      cacheCampus.current.clear();
      pendingCampus.current.clear();
      toast({ title: "Campus actualizado", status: "success", duration: 2000 });
      await getCampus();
    },
    [getCampus, toast],
  );

  const createInstalacion = useCallback(
    async (payload: {
      nombre: string;
      descripcion?: string;
      campusId: string;
      categoriaInstalacionId: string;
    }) => {
      await apiCall(`/instalacion`, {
        method: "POST",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? "",
          campus: { id: payload.campusId },
          categoriaInstalacion: { id: payload.categoriaInstalacionId },
        }),
        credentials: "include",
      });
      toast({ title: "Instalación creada", status: "success", duration: 2000 });
      await getInstalaciones();
    },
    [getInstalaciones, toast],
  );

  const updateInstalacion = useCallback(
    async (
      id: number,
      payload: {
        nombre: string;
        descripcion?: string;
        campusId: string;
        categoriaInstalacionId: string;
      },
    ) => {
      await apiCall(`/instalacion/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? "",
          campus: { id: payload.campusId },
          categoriaInstalacion: { id: payload.categoriaInstalacionId },
        }),
        credentials: "include",
      });
      toast({
        title: "Instalación actualizada",
        status: "success",
        duration: 2000,
      });
      await getInstalaciones();
    },
    [getInstalaciones, toast],
  );

  const cambiarEstadoInstalacion = useCallback(
    async (id: number, nuevoEstado: boolean) => {
      await apiCall(`/instalacion/${id}/cambiar-estado`, {
        method: "PUT",
        body: JSON.stringify({ estado: nuevoEstado }),
        credentials: "include",
      });
      toast({ title: "Estado actualizado", status: "success", duration: 1800 });
    },
    [toast],
  );

  // =====================
  //   CRUD CATEGORÍA INSTALACIÓN
  // =====================
  const createCategoriaInstalacion = useCallback(
    async (payload: { nombre: string; descripcion?: string }) => {
      await apiCall(`/categoria-instalacion`, {
        method: "POST",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? "",
        }),
        credentials: "include",
      });
      toast({
        title: "Categoría de instalación creada",
        status: "success",
        duration: 2000,
      });
      await fetchCategoriaInstalacion();
    },
    [fetchCategoriaInstalacion, toast],
  );

  const updateCategoriaInstalacion = useCallback(
    async (id: number, payload: { nombre: string; descripcion?: string }) => {
      await apiCall(`/categoria-instalacion/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion ?? "",
        }),
        credentials: "include",
      });
      toast({
        title: "Categoría de instalación actualizada",
        status: "success",
        duration: 2000,
      });
      await fetchCategoriaInstalacion();
    },
    [fetchCategoriaInstalacion, toast],
  );

  const deleteCategoriaInstalacion = useCallback(
    async (id: number) => {
      await apiCall(`/categoria-instalacion/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast({
        title: "Categoría de instalación eliminada",
        status: "success",
        duration: 2000,
      });
      await fetchCategoriaInstalacion();
    },
    [fetchCategoriaInstalacion, toast],
  );

  // =====================
  //  PRELOAD PARA EDICIÓN (sin cambios funcionales)
  // =====================
  const preloadCascadeForCampus = useCallback(
    async (row: InstalacionCampusRow) => {
      await fetchPaisesByContinente(row.idContinente);
      await fetchDepartamentosByPais(row.idPais);
      await fetchMunicipiosByDepartamento(row.idDepartamento);
    },
    [
      fetchPaisesByContinente,
      fetchDepartamentosByPais,
      fetchMunicipiosByDepartamento,
    ],
  );

  const preloadCascadeForInstalacion = useCallback(
    async (row: InstalacionCampusRow) => {
      await fetchPaisesByContinente(row.idContinente);
      await fetchDepartamentosByPais(row.idPais);
      await fetchMunicipiosByDepartamento(row.idDepartamento);
      await fetchCampusByMunicipio(row.idMunicipio);
    },
    [
      fetchPaisesByContinente,
      fetchDepartamentosByPais,
      fetchMunicipiosByDepartamento,
      fetchCampusByMunicipio,
    ],
  );

  // =====================
  //      EFFECTS
  // =====================
  useEffect(() => {
    // Carga tabla
    fetchInstalacionesCampus("", "");
    // ❌ Ya no cargamos continentes aquí (lazy: solo al abrir el modal)
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchInstalacionesCampus]);

  return {
    // tabla
    rows,
    loading,
    error,
    fetchInstalacionesCampus,
    // catálogos base
    continentes,
    paises,
    departamentos,
    municipios,
    campusList,
    instalaciones,
    refreshCatalogs,
    // cascada
    paisesCascada,
    departamentosCascada,
    municipiosCascada,
    campusCascada,
    fetchPaisesByContinente,
    fetchDepartamentosByPais,
    fetchMunicipiosByDepartamento,
    fetchCampusByMunicipio,
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
    updateCategoriaInstalacion,
    deleteCategoriaInstalacion,
    // setters para limpieza manual (si hace falta)
    setPaisesCascada,
    setDepartamentosCascada,
    setMunicipiosCascada,
    setCampusCascada,
    // cargar continentes SOLO al abrir modales
    getContinentes,
    // helper limpieza en bloque
    clearFrom,
  };
}
