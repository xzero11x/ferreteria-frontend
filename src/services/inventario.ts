// Servicio de API para gestión de ajustes de inventario
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginatedResponse, PaginationParams } from "@/types/api";

export type Ajuste = {
  id: number;
  producto_id: number;
  tipo: "entrada" | "salida";
  cantidad: number;
  motivo: string | null;
  usuario_id: number;
  created_at: string; // ✅ Campo real que envía el backend
  producto?: {
    nombre: string;
    sku: string | null;
    stock?: number;
  };
  usuario?: {
    nombre: string;
    email: string;
  };
};

export type AjusteCreateInput = {
  producto_id: number;
  tipo: "entrada" | "salida";
  cantidad: number;
  motivo: string;
};

// Parámetros de filtrado para ajustes
export type AjusteFilterParams = PaginationParams & {
  tipo?: "entrada" | "salida";
  producto_id?: number;
};

export async function listAjustes(params: AjusteFilterParams = {}) {
  const { page, limit, q, tipo, producto_id } = params;
  const qs = new URLSearchParams();
  if (page != null) qs.set("page", String(page));
  if (limit != null) qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  if (tipo) qs.set("tipo", tipo);
  if (producto_id != null) qs.set("producto_id", String(producto_id));
  const url = `${endpoints.inventario.ajustes.list()}${qs.toString() ? `?${qs.toString()}` : ""}`;
  return http.get<PaginatedResponse<Ajuste>>(url);
}

export async function createAjuste(data: AjusteCreateInput) {
  return http.post<Ajuste>(endpoints.inventario.ajustes.create(), data);
}
