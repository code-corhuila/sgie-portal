import { apiCall, unwrapApiEnvelope, type ApiEnvelope } from "./base";
import type {
  CreatePermisoRolEntidadPayload,
  Entidad,
  Permiso,
  PermisoRolEntidad,
  Rol,
  UpdatePermisoRolEntidadPayload,
} from "../modules/permisos/types";

const asArray = <T>(payload: ApiEnvelope<T[]> | T[]): T[] =>
  unwrapApiEnvelope(payload);

export const PermisosApi = {
  async getAll(): Promise<PermisoRolEntidad[]> {
    const response = await apiCall<
      ApiEnvelope<PermisoRolEntidad[]> | PermisoRolEntidad[]
    >("/permiso-rol-entidad/todos-permisos-rol-entidad");
    return asArray(response);
  },

  async toggleEstado(id: number, estado: boolean): Promise<void> {
    await apiCall(`/permiso-rol-entidad/${id}/cambiar-estado`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
      skipJson: true,
    });
  },

  async update(
    id: number,
    payload: UpdatePermisoRolEntidadPayload,
  ): Promise<void> {
    await apiCall(`/permiso-rol-entidad/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async create(payload: CreatePermisoRolEntidadPayload): Promise<void> {
    await apiCall("/permiso-rol-entidad", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async getRoles(): Promise<Rol[]> {
    const response = await apiCall<ApiEnvelope<Rol[]> | Rol[]>("/rol");
    return asArray(response);
  },

  async createRol(payload: {
    nombre: string;
    descripcion?: string;
  }): Promise<void> {
    await apiCall("/rol", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updateRol(
    id: number,
    payload: { nombre: string; descripcion?: string },
  ): Promise<void> {
    await apiCall(`/rol/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async getPermisos(): Promise<Permiso[]> {
    const response = await apiCall<ApiEnvelope<Permiso[]> | Permiso[]>(
      "/permiso",
    );
    return asArray(response);
  },

  async getEntidades(): Promise<Entidad[]> {
    const response = await apiCall<ApiEnvelope<Entidad[]> | Entidad[]>(
      "/entidad",
    );
    return asArray(response);
  },
};
