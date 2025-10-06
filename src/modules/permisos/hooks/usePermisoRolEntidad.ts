import { useState, useCallback, useEffect, useRef } from 'react';
import { apiCall } from '../../../api/base';
import { useToast } from '@chakra-ui/react';

export interface PermisoRolEntidad {
  unique: string; 
  id: number;
  estado: boolean;
  rol: string;
  permiso: string;
  entidad: string;
  nombres: string;
  apellidos: string;
}

export function usePermisoRolEntidad() {
  const [data, setData] = useState<PermisoRolEntidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  // 🔥 MEJORA: Prevenir race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall<PermisoRolEntidad[]>(
        '/permiso-rol-entidad/todos-permisos-rol-entidad',
        { signal: abortControllerRef.current.signal }
      );

      const formatted = response.map(item => ({
        ...item,
        id: Number(item.id),
      }));

      setData(formatted);
    } catch (err: any) {
      // 🔥 No mostrar error si fue cancelación
      if (err.name !== 'AbortError') {
        const errorMsg = err.message || 'Error al cargar datos';
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 🔥 MEJORA: Manejo de errores con toast
const cambiarEstado = useCallback(async (id: number) => {
  try {
    // Encontrar el item actual para saber su estado
    const currentItem = data.find(item => item.id === id);
    if (!currentItem) {
      toast({
        title: 'Error',
        description: 'Item no encontrado',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Enviar el body que el backend espera
    await apiCall(`/permiso-rol-entidad/${id}/cambiar-estado`, { 
      method: 'PUT',
      body: JSON.stringify({ 
        estado: !currentItem.estado  // Toggle del estado
      })
    });
    
    // Actualización optimista del estado local
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, estado: !item.estado } : item
    ));
    
    toast({
      title: 'Estado actualizado',
      status: 'success',
      duration: 2000,
    });
  } catch (err: any) {
    console.error('Error completo:', err); // Para debugging
    toast({
      title: 'Error al cambiar estado',
      description: err.message || 'Error desconocido',
      status: 'error',
      duration: 4000,
    });
    await fetchAll();
  }
}, [data, fetchAll, toast]);

  const updateItem = useCallback(async (id: number, body: Partial<PermisoRolEntidad>) => {
    try {
      await apiCall(`/permiso-rol-entidad/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      await fetchAll();
      
      toast({
        title: 'Actualizado correctamente',
        status: 'success',
        duration: 2000,
      });
    } catch (err: any) {
      toast({
        title: 'Error al actualizar',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
      throw err;
    }
  }, [fetchAll, toast]);

  // 🔥 Cargar datos al montar
  useEffect(() => {
    fetchAll();
    
    // Cleanup: cancelar peticiones pendientes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAll]);

  return { 
    data, 
    loading, 
    error, 
    fetchAll, 
    cambiarEstado, 
    updateItem 
  };
}