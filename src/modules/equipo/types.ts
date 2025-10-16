export interface EquipoSummary {
  idEquipo: number;
  codigoEquipo: string;
  nombreEquipo: string;
  estadoEquipo: boolean;
  nombreInstalacion: string;
  estadoInstalacion: boolean;
  nombreCampus: string;
  estadoCampus: boolean;
  nombreCategoriaEquipo?: string;
}

export interface CategoriaEquipo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface TipoEquipo {
  id: number;
  nombre: string;
  descripcion?: string;
  categoriaEquipo?: CategoriaEquipo;
}

export interface InstalacionOption {
  id: number;
  nombre: string;
}

export interface CreateEquipoPayload {
  codigo: string;
  tipoEquipo: { id: number };
  instalacion: { id: number };
}

export interface UpdateEquipoPayload extends CreateEquipoPayload {}

export interface CreateCategoriaEquipoPayload {
  nombre: string;
  descripcion?: string;
}

export interface CreateTipoEquipoPayload {
  nombre: string;
  descripcion?: string;
  categoriaEquipo: { id: number };
}
