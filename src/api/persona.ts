import { apiCall, unwrapApiEnvelope, type ApiEnvelope } from "./base";
import type {
  CreatePersonaPayload,
  CreateUsuarioPayload,
  Persona,
  Rol,
  UpdatePersonaPayload,
  UpdateUsuarioPayload,
} from "../modules/persona/types";

const asArray = <T>(payload: ApiEnvelope<T[]> | T[]): T[] =>
  unwrapApiEnvelope(payload);

export const PersonasApi = {
  async getAll(): Promise<Persona[]> {
    const response = await apiCall<ApiEnvelope<Persona[]> | Persona[]>(
      "/persona/persona-usuario?numeroIdentificacion=",
    );
    return asArray(response);
  },

  async searchByDocumento(numeroIdentificacion: string): Promise<Persona[]> {
    const response = await apiCall<ApiEnvelope<Persona[]> | Persona[]>(
      `/persona/persona-usuario?numeroIdentificacion=${encodeURIComponent(numeroIdentificacion)}`,
    );
    return asArray(response);
  },

  async toggleEstadoUsuario(idPersona: number, estado: boolean): Promise<void> {
    await apiCall(`/usuario/${idPersona}/cambiar-estado`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
      skipJson: true,
    });
  },

  async createPersona(payload: CreatePersonaPayload): Promise<void> {
    await apiCall("/persona", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updatePersona(
    idPersona: number,
    payload: UpdatePersonaPayload,
  ): Promise<void> {
    await apiCall(`/persona/${idPersona}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async getRoles(): Promise<Rol[]> {
    const response = await apiCall<ApiEnvelope<Rol[]> | { data: Rol[] }>(
      "/rol",
    );
    return asArray(response as ApiEnvelope<Rol[]> | Rol[]);
  },

  async createUsuario(payload: CreateUsuarioPayload): Promise<void> {
    await apiCall("/usuario", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updateUsuario(
    idUsuario: number,
    payload: UpdateUsuarioPayload,
  ): Promise<void> {
    await apiCall(`/usuario/${idUsuario}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },
};
