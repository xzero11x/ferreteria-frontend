import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

export type Cliente = {
  id: number;
  nombre: string;
  documento_identidad: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tenant_id: number;
  isActive: boolean;
};

export type ClienteCreateInput = {
  nombre: string;
  documento_identidad?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
};

export type ClienteUpdateInput = Partial<ClienteCreateInput> & {
  nombre?: string;
};

export async function listClientes() {
  return http.get<Cliente[]>(endpoints.clientes.list());
}

export async function createCliente(data: ClienteCreateInput) {
  return http.post<Cliente>(endpoints.clientes.create(), data);
}

export async function updateCliente(id: number, data: ClienteUpdateInput) {
  return http.put<Cliente>(endpoints.clientes.update(id), data);
}

export async function deactivateCliente(id: number) {
  return http.patch<{ message: string }>(endpoints.clientes.deactivate(id));
}
