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

export interface LoginResponse extends AuthUser {}

export interface SessionResponse extends AuthUser {}
