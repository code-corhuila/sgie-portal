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
  unique: string | number;
  idCategoriaInstalacion?: number | string;
  nombreCategoriaInstalacion?: string;
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
