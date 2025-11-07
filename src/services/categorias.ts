import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

export type Categoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tenant_id: number;
  isActive: boolean;
};

export type CategoriaCreateInput = {
  nombre: string;
  descripcion?: string | null;
};

export type CategoriaUpdateInput = {
  nombre?: string;
  descripcion?: string | null;
};

export async function listCategorias() {
  return http.get<Categoria[]>(endpoints.categorias.list());
}

export async function createCategoria(data: CategoriaCreateInput) {
  return http.post<Categoria>(endpoints.categorias.create(), data);
}

export async function updateCategoria(id: number, data: CategoriaUpdateInput) {
  return http.put<Categoria>(endpoints.categorias.update(id), data);
}

export async function deactivateCategoria(id: number) {
  return http.patch<{ message: string }>(endpoints.categorias.deactivate(id));
}
