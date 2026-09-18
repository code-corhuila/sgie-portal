import { createContext } from "react";

export type AuthContextValue = {
  role: string | null;
  permissions: string[];
  email: string | null;
  userId: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkingAuth: boolean;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

