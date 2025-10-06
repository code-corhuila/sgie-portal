import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

type AuthContextType = {
  role: string | null;
  permissions: string[];
  email: string | null;
  userId: number | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkingAuth: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const validateSession = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8080/v1/api/usuario/me", {
        method: "GET",
        credentials: "include", // IMPORTANTE: incluir cookies
      });
      
      if (!res.ok) {
        setRole(null);
        setPermissions([]);
        setEmail(null);
        setUserId(null);
      } else {
        const data = await res.json();
        setRole(data.roles?.[0] || null);
        setPermissions(data.permisos || []);
        setEmail(data.email || null);
        setUserId(data.idUsuario || null);
      }
    } catch {
      setRole(null);
      setPermissions([]);
      setEmail(null);
      setUserId(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:8080/v1/api/usuario/login", {
        method: "POST",
        credentials: "include", // IMPORTANTE: para recibir la cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      // No guardamos el token, solo actualizamos el estado
      setRole(data.roles?.[0] || null);
      setPermissions(data.permisos || []);
      setEmail(data.email || null);
      setUserId(data.idUsuario || null);
      
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:8080/v1/api/usuario/logout", {
        method: "POST",
        credentials: "include", // IMPORTANTE: para limpiar la cookie
      });
    } finally {
      setRole(null);
      setPermissions([]);
      setEmail(null);
      setUserId(null);
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
        isAuthenticated: !!role 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}