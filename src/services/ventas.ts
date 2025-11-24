// Servicio de API para gestión de ventas
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginatedResponse, PaginationParams } from "@/types/api";

export type VentaDetalle = {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  producto?: {
    nombre: string;
    sku: string | null;
  };
};

export type Venta = {
  id: number;
  cliente_id: number | null;
  usuario_id: number;
  // Algunos backends retornan `created_at`; mantenemos `fecha` como compatibilidad
  fecha?: string;
  created_at?: string;
  metodo_pago?: string;
  total: string;
  tenant_id: number;
  cliente?: {
    nombre: string;
    documento_identidad: string | null;
  } | null;
  usuario?: {
    nombre: string;
    email: string;
  };
  detalles?: VentaDetalle[];
};

export type VentaDetalleInput = {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
};

export type VentaCreateInput = {
  cliente_id?: number | null;
  metodo_pago: string;
  detalles: VentaDetalleInput[];
};

export async function listVentas(params: PaginationParams = {}): Promise<PaginatedResponse<Venta>> {
  const { page, limit, q, cliente_id, fecha_inicio, fecha_fin } = params;
  const qs = new URLSearchParams();
  if (page != null) qs.set("page", String(page));
  if (limit != null) qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  if (cliente_id != null) qs.set("cliente_id", String(cliente_id));
  if (fecha_inicio) qs.set("fecha_inicio", fecha_inicio);
  if (fecha_fin) qs.set("fecha_fin", fecha_fin);
  const url = `${endpoints.ventas.list()}${qs.toString() ? `?${qs.toString()}` : ""}`;
  return http.get<PaginatedResponse<Venta>>(url);
}

export async function getVentaById(id: number): Promise<Venta> {
  return http.get<Venta>(`/api/ventas/${id}`);
}

export async function createVenta(data: VentaCreateInput) {
  return http.post<Venta>(endpoints.ventas.create(), data);
}
