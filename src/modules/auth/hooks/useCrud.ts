import { useState, useEffect, useCallback } from "react";
import {
  apiCall,
  unwrapApiEnvelope,
  type ApiEnvelope,
} from "../../../api/base";

interface UseCrudOptions {
  autoFetch?: boolean;
}

export function useCrud<T extends { id: number }>(
  endpoint: string,
  options: UseCrudOptions = { autoFetch: true },
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall<ApiEnvelope<T[]> | T[]>(endpoint);
      const payload = unwrapApiEnvelope(response);
      if (payload) {
        setData(payload);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const create = async (item: Omit<T, "id">): Promise<T | null> => {
    try {
      const response = await apiCall<ApiEnvelope<T> | T>(endpoint, {
        method: "POST",
        body: JSON.stringify(item),
      });
      const payload = unwrapApiEnvelope(response);
      await fetchAll();
      return payload ?? null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear";
      setError(errorMessage);
      throw err;
    }
  };

  const update = async (id: number, item: Partial<T>): Promise<T | null> => {
    try {
      const response = await apiCall<ApiEnvelope<T> | T>(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(item),
      });

      const payload = unwrapApiEnvelope(response);
      await fetchAll();
      return payload ?? null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar";
      setError(errorMessage);
      throw err;
    }
  };

  const remove = async (id: number): Promise<void> => {
    try {
      await apiCall(`${endpoint}/${id}`, {
        method: "DELETE",
      });
      await fetchAll();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar";
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (options.autoFetch) {
      fetchAll();
    }
  }, [fetchAll, options.autoFetch]);

  return {
    data,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
}
