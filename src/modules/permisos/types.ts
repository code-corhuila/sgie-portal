export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Permiso {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Entidad {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface PermisoRolEntidad {
  id: number;
  estado: boolean;
  rol: Rol | string;
  permiso: Permiso | string;
  entidad: Entidad | string;
  nombres: string;
  apellidos: string;
  unique?: string;
  idRol?: string;
  idEntidad?: string;
  idPermiso?: string;
}

export interface CreatePermisoRolEntidadPayload {
  rol: { id: number };
  permiso: { id: number };
  entidad: { id: number };
}

export interface UpdatePermisoRolEntidadPayload
  extends CreatePermisoRolEntidadPayload {}
