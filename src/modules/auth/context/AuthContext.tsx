import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthApi } from "../../../api/auth";
import { setupInterceptor } from "../../../utils/interceptor";
import type { ApiError } from "../../../api/base";
import { AuthContext } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const resetSession = useCallback(() => {
    setRole(null);
    setPermissions([]);
    setEmail(null);
    setUserId(null);
  }, []);

  const validateSession = useCallback(async () => {
    try {
      const session = await AuthApi.currentSession();
      setRole(session.roles?.[0] ?? null);
      setPermissions(session.permisos ?? []);
      setEmail(session.email ?? null);
      setUserId(session.idUsuario ?? null);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status !== 401) {
        console.error("Error validando sesión", error);
      }
      resetSession();
    } finally {
      setCheckingAuth(false);
    }
  }, [resetSession]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    const unsubscribe = setupInterceptor(() => {
      resetSession();
    });
    return unsubscribe;
  }, [resetSession]);

  const login = async (email: string, password: string): Promise<void> => {
    // No se atrapa el error aquí a propósito: el backend distingue
    // credenciales inválidas (401) de bloqueo por rate limiting (429), y
    // Login.tsx necesita ese detalle para mostrar el mensaje correcto.
    const data = await AuthApi.login({ email, password });
    setRole(data.roles?.[0] ?? null);
    setPermissions(data.permisos ?? []);
    setEmail(data.email ?? null);
    setUserId(data.idUsuario ?? null);
  };

  const logout = async () => {
    try {
      await AuthApi.logout();
    } finally {
      resetSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        permissions,
        email,
        userId,
        login,
        logout,
        checkingAuth,
        isAuthenticated: !!role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
