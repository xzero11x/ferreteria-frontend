import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

export type Proveedor = {
  id: number;
  nombre: string;
  ruc_identidad: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tenant_id: number;
  isActive: boolean;
};

export type ProveedorCreateInput = {
  nombre: string;
  ruc_identidad?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
};

export type ProveedorUpdateInput = Partial<ProveedorCreateInput> & {
  nombre?: string;
};

export async function listProveedores() {
  return http.get<Proveedor[]>(endpoints.proveedores.list());
}

export async function createProveedor(data: ProveedorCreateInput) {
  return http.post<Proveedor>(endpoints.proveedores.create(), data);
}

export async function updateProveedor(id: number, data: ProveedorUpdateInput) {
  return http.put<Proveedor>(endpoints.proveedores.update(id), data);
}

export async function deactivateProveedor(id: number) {
  return http.patch<{ message: string }>(endpoints.proveedores.deactivate(id));
}
