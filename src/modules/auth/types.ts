export interface AuthUser {
  idUsuario: number;
  email: string;
  roles: string[];
  permisos: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type LoginResponse = AuthUser;

export type SessionResponse = AuthUser;
