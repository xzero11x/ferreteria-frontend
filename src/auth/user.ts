// Gestión de datos del usuario autenticado en localStorage
import { USER_KEY } from "../config/env";

export type AuthUser = {
  id?: string | number;
  email?: string;
  rol?: string;
  name?: string;
  avatar?: string;
};

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}