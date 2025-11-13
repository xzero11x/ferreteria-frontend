// Servicio de API para gestión de ajustes de inventario
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginatedResponse } from "@/types/api";

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

export async function listAjustes() {
  return http.get<PaginatedResponse<Ajuste>>(endpoints.inventario.ajustes.list());
}

export async function createAjuste(data: AjusteCreateInput) {
  return http.post<Ajuste>(endpoints.inventario.ajustes.create(), data);
}
