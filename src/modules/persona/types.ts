export interface Rol {
  id: number;
  nombre: string;
}

export interface Persona {
  idPersona: number;
  nombres: string;
  apellidos: string;
  estado: boolean;
  tipoDocumento?: string;
  numeroIdentificacion?: string;
  telefonoMovil?: string;
  rol?: Rol | string;
  email?: string;
  idUsuario?: number;
}

export interface Usuario {
  idUsuario: number;
  email: string;
  estado: boolean;
  persona: { id: number };
}

export interface CreatePersonaPayload {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroIdentificacion: string;
  telefonoMovil: string;
  rol: { id: number };
}

export type UpdatePersonaPayload = CreatePersonaPayload;

export interface CreateUsuarioPayload {
  email: string;
  password: string;
  persona: { id: number };
}

export interface UpdateUsuarioPayload {
  email: string;
  password?: string;
  persona: { id: number };
}
