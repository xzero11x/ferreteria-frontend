import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

export type RolUsuario = "admin" | "empleado";

export type Usuario = {
  id: number;
  email: string;
  nombre: string | null;
  rol: RolUsuario;
  isActive?: boolean;
};

export type UsuarioCreateInput = {
  email: string;
  password: string;
  nombre?: string | null;
  rol?: RolUsuario;
};

export type UsuarioUpdateInput = {
  email?: string;
  password?: string;
  nombre?: string | null;
  rol?: RolUsuario;
};

export async function listUsuarios() {
  return http.get<Usuario[]>(endpoints.usuarios.list());
}

export async function createUsuario(data: UsuarioCreateInput) {
  return http.post<Usuario>(endpoints.usuarios.create(), data);
}

export async function updateUsuario(id: number, data: UsuarioUpdateInput) {
  return http.put<Usuario>(endpoints.usuarios.update(id), data);
}

export async function deactivateUsuario(id: number) {
  return http.patch<{ message: string }>(endpoints.usuarios.deactivate(id));
}
