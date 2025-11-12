// Servicio de API para gestión de productos del inventario
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

// Búsqueda asíncrona de productos por término (nombre, SKU, código).
// Si el backend no soporta el parámetro `search`, retornará la lista completa; el componente puede filtrar localmente.
export async function searchProductos(searchTerm: string) {
  const url = `${endpoints.productos.list()}?search=${encodeURIComponent(searchTerm)}`;
  return http.get<Producto[]>(url);
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
