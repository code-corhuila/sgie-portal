import { apiCall, unwrapApiEnvelope, type ApiEnvelope } from "./base";
import type {
  Campus,
  Continente,
  Departamento,
  Instalacion,
  InstalacionCampusRow,
  Municipio,
  Pais,
} from "../modules/ubicacion/types";

const asArray = <T>(payload: ApiEnvelope<T[]> | T[]): T[] =>
  unwrapApiEnvelope(payload);

export const UbicacionApi = {
  async getInstalacionesCampus(params: {
    nombreInstalacion?: string;
    nombreCampus?: string;
  }): Promise<InstalacionCampusRow[]> {
    const search = new URLSearchParams({
      nombreInstalacion: params.nombreInstalacion ?? "",
      nombreCampus: params.nombreCampus ?? "",
    });
    const response = await apiCall<
      ApiEnvelope<InstalacionCampusRow[]> | InstalacionCampusRow[]
    >(`/instalacion/instalacion-campus?${search.toString()}`);
    return asArray(response);
  },

  async getContinentes(): Promise<Continente[]> {
    const response = await apiCall<ApiEnvelope<Continente[]> | Continente[]>(
      "/continente",
    );
    return asArray(response);
  },

  async getPaises(): Promise<Pais[]> {
    const response = await apiCall<ApiEnvelope<Pais[]> | Pais[]>("/pais");
    return asArray(response);
  },

  async getDepartamentos(): Promise<Departamento[]> {
    const response = await apiCall<
      ApiEnvelope<Departamento[]> | Departamento[]
    >("/departamento");
    return asArray(response);
  },

  async getMunicipios(): Promise<Municipio[]> {
    const response = await apiCall<ApiEnvelope<Municipio[]> | Municipio[]>(
      "/municipio",
    );
    return asArray(response);
  },

  async getCampus(): Promise<Campus[]> {
    const response = await apiCall<ApiEnvelope<Campus[]> | Campus[]>("/campus");
    return asArray(response);
  },

  async getInstalaciones(): Promise<Instalacion[]> {
    const response = await apiCall<ApiEnvelope<Instalacion[]> | Instalacion[]>(
      "/instalacion",
    );
    return asArray(response);
  },

  async getCategoriaInstalacion(): Promise<
    Array<{ id: number; nombre: string }>
  > {
    const response = await apiCall<
      | ApiEnvelope<Array<{ id: number; nombre: string }>>
      | Array<{ id: number; nombre: string }>
    >("/categoria-instalacion");
    return asArray(response);
  },

  async getPaisesPorContinente(id: number): Promise<Pais[]> {
    const response = await apiCall<ApiEnvelope<Pais[]> | Pais[]>(
      `/pais/por-continente/${id}`,
    );
    return asArray(response);
  },

  async getDepartamentosPorPais(id: number): Promise<Departamento[]> {
    const response = await apiCall<
      ApiEnvelope<Departamento[]> | Departamento[]
    >(`/departamento/por-pais/${id}`);
    return asArray(response);
  },

  async getMunicipiosPorDepartamento(id: number): Promise<Municipio[]> {
    const response = await apiCall<ApiEnvelope<Municipio[]> | Municipio[]>(
      `/municipio/por-departamento/${id}`,
    );
    return asArray(response);
  },

  async getCampusPorMunicipio(id: number): Promise<Campus[]> {
    const response = await apiCall<ApiEnvelope<Campus[]> | Campus[]>(
      `/campus/por-municipio/${id}`,
    );
    return asArray(response);
  },

  async createCampus(payload: {
    nombre: string;
    descripcion?: string;
    municipioId: string;
  }): Promise<void> {
    await apiCall("/campus", {
      method: "POST",
      body: JSON.stringify({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? "",
        municipio: { id: payload.municipioId },
      }),
      skipJson: true,
    });
  },

  async updateCampus(
    id: number,
    payload: { nombre: string; descripcion?: string; municipioId: number },
  ): Promise<void> {
    await apiCall(`/campus/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? "",
        municipio: { id: payload.municipioId },
      }),
      skipJson: true,
    });
  },

  async createInstalacion(payload: {
    nombre: string;
    descripcion?: string;
    campusId: string;
    categoriaInstalacionId: string;
  }): Promise<void> {
    await apiCall("/instalacion", {
      method: "POST",
      body: JSON.stringify({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? "",
        campus: { id: payload.campusId },
        categoriaInstalacion: { id: payload.categoriaInstalacionId },
      }),
      skipJson: true,
    });
  },

  async updateInstalacion(
    id: number,
    payload: {
      nombre: string;
      descripcion?: string;
      campusId: string;
      categoriaInstalacionId: string;
    },
  ): Promise<void> {
    await apiCall(`/instalacion/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        nombre: payload.nombre,
        descripcion: payload.descripcion ?? "",
        campus: { id: payload.campusId },
        categoriaInstalacion: { id: payload.categoriaInstalacionId },
      }),
      skipJson: true,
    });
  },

  async toggleEstadoInstalacion(id: number, estado: boolean): Promise<void> {
    await apiCall(`/instalacion/${id}/cambiar-estado`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
      skipJson: true,
    });
  },

  async createCategoriaInstalacion(payload: {
    nombre: string;
    descripcion?: string;
  }): Promise<void> {
    await apiCall("/categoria-instalacion", {
      method: "POST",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async updateCategoriaInstalacion(
    id: number,
    payload: { nombre: string; descripcion?: string },
  ): Promise<void> {
    await apiCall(`/categoria-instalacion/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      skipJson: true,
    });
  },

  async deleteCategoriaInstalacion(id: number): Promise<void> {
    await apiCall(`/categoria-instalacion/${id}`, {
      method: "DELETE",
      skipJson: true,
    });
  },
};
