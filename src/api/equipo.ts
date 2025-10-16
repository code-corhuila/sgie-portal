import { apiCall, unwrapApiEnvelope, type ApiEnvelope } from "./base";
import type {
  CategoriaEquipo,
  CreateCategoriaEquipoPayload,
  CreateEquipoPayload,
  CreateTipoEquipoPayload,
  EquipoSummary,
  InstalacionOption,
  TipoEquipo,
  UpdateEquipoPayload,
} from "../modules/equipo/types";

const asArray = <T>(payload: ApiEnvelope<T[]> | T[]): T[] =>
  unwrapApiEnvelope(payload);

export const EquiposApi = {
  async getAll(): Promise<EquipoSummary[]> {
    const response = await apiCall<
      ApiEnvelope<EquipoSummary[]> | EquipoSummary[]
    >("/equipo/equipo-instalacion");
    return asArray(response);
  },

  async searchByCodigo(codigo: string): Promise<EquipoSummary[]> {
    const response = await apiCall<
      ApiEnvelope<EquipoSummary[]> | EquipoSummary[]
    >(`/equipo/equipo-instalacion?codigoEquipo=${encodeURIComponent(codigo)}`);
    return asArray(response);
  },

  async toggleEstado(idEquipo: number, estado: boolean): Promise<void> {
    await apiCall(`/equipo/${idEquipo}/cambiar-estado`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
      skipJson: true,
    });
  },

  async createEquipo(payload: CreateEquipoPayload): Promise<void> {
    await apiCall("/equipo", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updateEquipo(
    idEquipo: number,
    payload: UpdateEquipoPayload,
  ): Promise<void> {
    await apiCall(`/equipo/${idEquipo}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async getCategorias(): Promise<CategoriaEquipo[]> {
    const response = await apiCall<
      ApiEnvelope<CategoriaEquipo[]> | CategoriaEquipo[]
    >("/categoria-equipo");
    return asArray(response);
  },

  async createCategoria(payload: CreateCategoriaEquipoPayload): Promise<void> {
    await apiCall("/categoria-equipo", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async getTipos(): Promise<TipoEquipo[]> {
    const response = await apiCall<ApiEnvelope<TipoEquipo[]> | TipoEquipo[]>(
      "/tipo-equipo",
    );
    return asArray(response);
  },

  async createTipo(payload: CreateTipoEquipoPayload): Promise<void> {
    await apiCall("/tipo-equipo", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async getInstalaciones(): Promise<InstalacionOption[]> {
    const response = await apiCall<
      ApiEnvelope<InstalacionOption[]> | InstalacionOption[]
    >("/instalacion");
    return asArray(response);
  },
};
