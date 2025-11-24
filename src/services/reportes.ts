// Servicio de API para reportes y análisis
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";

export type TipoMovimientoKardex = 'venta' | 'compra' | 'ajuste_entrada' | 'ajuste_salida';

export type MovimientoKardex = {
  fecha: string; // ISO string
  tipo: TipoMovimientoKardex;
  cantidad: number;
  referencia: string;
  motivo?: string;
  responsable?: string;
  precio_unitario?: number;
  saldo: number;
};

export type ProductoKardex = {
  id: number;
  nombre: string;
  sku: string | null;
  stock: number;
};

export type KardexCompleto = {
  producto: ProductoKardex;
  stockActual: number;
  totalMovimientos: number;
  movimientos: MovimientoKardex[];
};

export async function getKardexCompleto(productoId: number) {
  return http.get<KardexCompleto>(endpoints.reportes.kardex(productoId));
}
