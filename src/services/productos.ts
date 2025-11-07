import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

export type Producto = {
  id: number;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  precio_venta: string;
  costo_compra: string | null;
  stock: number;
  stock_minimo: number | null;
  categoria_id: number | null;
  categoria?: { nombre: string | null } | null;
};

export type ProductoCreateInput = {
  nombre: string;
  precio_venta: number;
  stock: number;
  sku?: string | null;
  descripcion?: string | null;
  costo_compra?: number | null;
  stock_minimo?: number | null;
  categoria_id?: number | null;
};

export type ProductoUpdateInput = Partial<ProductoCreateInput> & {
  nombre?: string;
};

export async function listProductos() {
  return http.get<Producto[]>(endpoints.productos.list());
}

export async function createProducto(data: ProductoCreateInput) {
  return http.post<Producto>(endpoints.productos.create(), data);
}

export async function updateProducto(id: number, data: ProductoUpdateInput) {
  return http.put<Producto>(endpoints.productos.update(id), data);
}

export async function deactivateProducto(id: number) {
  return http.patch<{ message: string }>(endpoints.productos.deactivate(id));
}
