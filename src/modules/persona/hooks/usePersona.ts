// usePersona.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiCall } from '../../../api/base';
import { useToast } from '@chakra-ui/react';

export interface Persona {
  idPersona: number;
  nombres: string;
  apellidos: string;
  estado: boolean;
  rol?: { id: number; nombre: string };
  numeroIdentificacion?: string;
  tipoDocumento?: string;
  telefonoMovil?: string;
}

export interface Usuario{
  idUsuario: number;
  email?: string;
  password: string;
  estado: boolean;
  
}

export function usePersonas() {
  const [data, setData] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await apiCall<Persona[]>(
        `/persona/persona-usuario?numeroIdentificacion=`,
        {
          signal: abortControllerRef.current.signal,
          credentials: 'include',
        }
      );
      setData(res);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const msg = err.message || 'Error al cargar personas';
        setError(msg);
        toast({
          title: 'Error',
          description: msg,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Función para buscar por número de documento
  const fetchPersonaByDocumento = useCallback(async (numeroDoc: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiCall<Persona[]>(
        `/persona/persona-usuario?numeroIdentificacion=${numeroDoc}`,
        { credentials: 'include' }
      );
      setData(res);
      
      if (res.length === 0) {
        toast({
          title: 'Sin resultados',
          description: 'No se encontró ninguna persona con ese documento',
          status: 'info',
          duration: 3000,
        });
      }
    } catch (err: any) {
      const msg = err.message || 'Error en búsqueda';
      setError(msg);
      toast({
        title: 'Error en búsqueda',
        description: msg,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cambiarEstado = useCallback(async (id: number) => {
    try {
      const currentItem = data.find(item => item.idPersona === id);
      if (!currentItem) {
        toast({
          title: 'Error',
          description: 'Persona no encontrada',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      await apiCall(`/usuario/${id}/cambiar-estado`, {
        method: 'PUT',
        body: JSON.stringify({
          estado: !currentItem.estado
        }),
        credentials: 'include',
      });

      // Actualización optimista
      setData(prev => prev.map(item =>
        item.idPersona === id ? { ...item, estado: !item.estado } : item
      ));

      toast({
        title: 'Estado actualizado',
        status: 'success',
        duration: 2000,
      });
    } catch (err: any) {
      toast({
        title: 'Error al cambiar estado',
        description: err.message || 'Error desconocido',
        status: 'error',
        duration: 4000,
      });
      await fetchAll();
    }
  }, [data, fetchAll, toast]);

  const createPersona = useCallback(async (body: any) => {
    await apiCall('/persona', {
      method: 'POST',
      body: JSON.stringify(body),
      credentials: 'include',
    });
    await fetchAll();
    toast({
      title: 'Persona creada',
      status: 'success',
      duration: 2000,
    });
  }, [fetchAll, toast]);

  useEffect(() => {
    fetchAll();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    fetchAll,
    fetchPersonaByDocumento, // ← Exportar la función
    cambiarEstado,
    createPersona,
  };
}