// Contexto de autenticación para gestionar el estado del usuario
import { createContext, useContext, useEffect, useState } from "react";
import { getStoredUser, setStoredUser, type AuthUser } from "./user";

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUserState(stored);
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    setStoredUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

