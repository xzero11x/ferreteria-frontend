// Servicio de API para gestión de ventas
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

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
  fecha: string;
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
  detalles: VentaDetalleInput[];
};

export async function listVentas() {
  return http.get<Venta[]>(endpoints.ventas.list());
}

export async function createVenta(data: VentaCreateInput) {
  return http.post<Venta>(endpoints.ventas.create(), data);
}
