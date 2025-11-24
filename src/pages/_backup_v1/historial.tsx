import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Printer, Ban, Search, FileText, Receipt, Building2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGetApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import { useGetApiTenantConfiguracion } from "@/api/generated/tenant/tenant";
import type { Venta } from "@/api/generated/model";

type PaginationParams = {
  page?: number;
  limit?: number;
  q?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
};

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} ${hora}`;
}

function prettyPago(value?: string) {
  if (!value) return "—";
  const v = value.toLowerCase();
  if (v === "efectivo") return "Efectivo";
  if (v === "tarjeta") return "Tarjeta";
  if (v === "yape") return "Yape";
  return value;
}

export default function HistorialVentasPage() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  const listRef = useRef<HTMLDivElement | null>(null);

  // Obtener configuración del tenant para el encabezado del ticket
  const { data: configTenant } = useGetApiTenantConfiguracion();

  // Debounce del search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Hook para ventas
  const { data: ventasResponse, isLoading: loading } = useGetApiVentas({
    page,
    limit,
    q: debouncedSearch || undefined,
    fecha_inicio: fecha || undefined,
    fecha_fin: fecha || undefined,
  });

  const ventasData = ventasResponse?.data ?? [];
  const getDate = (v: Venta) => v.created_at ?? "1970-01-01T00:00:00Z";
  const ventas = [...ventasData].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
  const totalPages = ventasResponse?.meta?.totalPages ?? 1;
  const totalRecords = ventasResponse?.meta?.total ?? 0;

  // Actualizar selectedIndex cuando cambian las ventas
  useEffect(() => {
    setSelectedIndex(ventas.length > 0 ? 0 : -1);
  }, [ventas]);

  const filteredVentas = useMemo(() => ventas, [ventas]);

  useEffect(() => {
    // Mantener selección válida cuando cambian los filtros
    if (filteredVentas.length === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex < 0 || selectedIndex >= filteredVentas.length) {
      setSelectedIndex(0);
    }
  }, [filteredVentas, selectedIndex]);

  function handleRowClick(idx: number) {
    setSelectedIndex(idx);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (filteredVentas.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredVentas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  const selectedVenta = selectedIndex >= 0 ? filteredVentas[selectedIndex] : undefined;

  const totalVendido = filteredVentas.reduce((sum, v) => sum + Number(v.total), 0);
  const cantidadVentas = filteredVentas.length;
  const totalEfectivo = filteredVentas
    .filter((v) => (v.metodo_pago ?? "").toLowerCase() === "efectivo")
    .reduce((sum, v) => sum + Number(v.total), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 -my-3 md:-my-3 h-[calc(100svh-var(--header-height))] md:h-[calc(100svh-var(--header-height)-1rem)] overflow-hidden">
      {/* Barra superior: métricas y filtros */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] items-start gap-3 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-3">
              <div className="text-sm text-muted-foreground">Total Vendido</div>
              <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalVendido)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <div className="text-sm text-muted-foreground">Efectivo</div>
              <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalEfectivo)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <div className="text-sm text-muted-foreground">Cantidad</div>
              <div className="text-2xl font-bold tabular-nums">{cantidadVentas}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-2 items-center">
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, vendedor o ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end mt-1">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Siguiente
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Mostrar</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">Total: {totalRecords}</span>
        </div>
      </div>

      {/* Vista dividida fija: izquierda lista 60%, derecha ticket 40% */}
      <div
        className="grid h-full min-h-0 overflow-hidden gap-0"
        style={{ gridTemplateColumns: "60% 40%" }}
      >
        {/* Bloque Izquierdo: Lista compacta de ventas */}
        <div className="min-w-0 min-h-0 pr-4 h-full flex flex-col">
          <div
            ref={listRef}
            className="flex-1 min-h-0"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Fecha:Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-left">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVentas.map((v, idx) => {
                    const isSelected = idx === selectedIndex;
                    // Formato SUNAT: SERIE-CORRELATIVO (ej: F001-000045)
                    const comprobante = v.serie && v.numero_comprobante 
                      ? `${v.serie.codigo}-${String(v.numero_comprobante).padStart(6, '0')}`
                      : `#${v.id}`;
                    return (
                      <TableRow
                        key={v.id}
                        onClick={() => handleRowClick(idx)}
                        className={
                          isSelected
                            ? "cursor-pointer bg-muted/60 hover:bg-muted"
                            : "cursor-pointer hover:bg-muted/40"
                        }
                      >
                        <TableCell className="font-mono font-semibold">{comprobante}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatFechaHora(v.created_at)}</TableCell>
                        <TableCell className="truncate max-w-[20ch]">{v.cliente?.nombre ?? "Público"}</TableCell>
                        <TableCell className="truncate max-w-[12ch]">{prettyPago(v.metodo_pago || undefined)}</TableCell>
                        <TableCell className="text-left font-medium tabular-nums">{formatCurrency(v.total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        {/* Bloque Derecho: Ticket permanente */}
        <div className="min-w-0 min-h-0 h-full flex flex-col border-l">
          <div className="flex-1 min-h-0 overflow-hidden">
            {!selectedVenta ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No hay ventas registradas para mostrar
              </div>
            ) : (
              <div className="h-full grid grid-rows-[auto,1fr,auto]">
                {/* Cabecera del ticket con datos de la empresa */}
                <div className="px-4 py-3 border-b bg-muted/30">
                  {/* Datos de la empresa */}
                  <div className="text-center space-y-1 mb-3">
                    <div className="font-bold text-base">{configTenant?.nombre_empresa ?? "Ferretería"}</div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {(configTenant?.configuracion as any)?.empresa?.ruc && (
                        <div>RUC: {(configTenant.configuracion as any).empresa.ruc}</div>
                      )}
                      {(configTenant?.configuracion as any)?.empresa?.direccion && (
                        <div className="line-clamp-2">{(configTenant.configuracion as any).empresa.direccion}</div>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        {(configTenant?.configuracion as any)?.empresa?.telefono && (
                          <span>Tel: {(configTenant.configuracion as any).empresa.telefono}</span>
                        )}
                        {(configTenant?.configuracion as any)?.empresa?.email && (
                          <span>{(configTenant.configuracion as any).empresa.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Tipo de comprobante con icono */}
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {selectedVenta.serie?.tipo_comprobante === 'FACTURA' && <FileText className="size-4" />}
                      {selectedVenta.serie?.tipo_comprobante === 'BOLETA' && <Receipt className="size-4" />}
                      <span className="text-sm font-semibold uppercase">
                        {selectedVenta.serie?.tipo_comprobante?.replace('_', ' ') ?? "COMPROBANTE DE VENTA"}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-lg">
                      {selectedVenta.serie && selectedVenta.numero_comprobante 
                        ? `${selectedVenta.serie.codigo}-${String(selectedVenta.numero_comprobante).padStart(8, '0')}`
                        : `#${String(selectedVenta.id).padStart(6, "0")}`}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Información de la venta */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="ml-1 font-medium">{new Date(selectedVenta.created_at).toLocaleDateString('es-PE')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora:</span>
                      <span className="ml-1 font-medium">{new Date(selectedVenta.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vendedor:</span>
                      <span className="ml-1 font-medium truncate">{selectedVenta.usuario?.nombre ?? selectedVenta.usuario?.email ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pago:</span>
                      <span className="ml-1 font-medium">{prettyPago(selectedVenta.metodo_pago || undefined)}</span>
                    </div>
                  </div>
                </div>

                {/* Detalles y productos */}
                <ScrollArea className="px-4 py-3">
                  <div className="space-y-3">
                    {/* Cliente (estilo ticket) */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Cliente</div>
                      <div className="text-sm">
                        <div className="font-medium">{selectedVenta.cliente?.nombre ?? "CLIENTE VARIOS"}</div>
                        {selectedVenta.cliente?.documento_identidad && (
                          <div className="text-xs text-muted-foreground">
                            Doc: {selectedVenta.cliente.documento_identidad}
                          </div>
                        )}
                        {selectedVenta.cliente?.direccion && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {selectedVenta.cliente.direccion}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Lista de productos (estilo ticket) */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Detalle de Venta</div>
                      <div className="space-y-3">
                        {(selectedVenta.detalles ?? []).map((d, idx) => {
                          const subtotal = d.precio_unitario * d.cantidad;
                          const valorSinIgv = d.valor_unitario * d.cantidad;
                          const igvLinea = d.igv_total ?? 0;
                          const formatCant = (cant: number) => {
                            // Formatear según decimales
                            return cant % 1 === 0 ? cant.toString() : cant.toFixed(3).replace(/\.?0+$/, '');
                          };
                          
                          return (
                            <div key={d.id} className="space-y-1 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium leading-tight">{d.producto?.nombre ?? `Producto #${d.producto_id}`}</div>
                                  {d.producto?.sku && (
                                    <div className="text-xs text-muted-foreground">SKU: {d.producto.sku}</div>
                                  )}
                                </div>
                                <div className="text-right font-medium tabular-nums shrink-0">
                                  {formatCurrency(subtotal)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div>
                                  {formatCant(d.cantidad)} × {formatCurrency(d.precio_unitario)}
                                  {d.producto?.unidad_medida && ` ${d.producto.unidad_medida.codigo}`}
                                </div>
                                <div className="tabular-nums">
                                  Base: {formatCurrency(valorSinIgv)} + IGV({d.tasa_igv ?? 0}%): {formatCurrency(igvLinea)}
                                </div>
                              </div>
                              {idx < (selectedVenta.detalles?.length ?? 0) - 1 && (
                                <div className="border-b border-dashed my-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Totales con desglose fiscal V2 (estilo SUNAT) */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Resumen Tributario</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Op. Gravada</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency((selectedVenta.detalles ?? []).reduce((s, d) => s + (d.valor_unitario * d.cantidad), 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">IGV (18%)</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency((selectedVenta.detalles ?? []).reduce((s, d) => s + (d.igv_total ?? 0), 0))}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="font-bold">TOTAL A PAGAR</span>
                          <span className="font-bold text-lg tabular-nums">{formatCurrency(selectedVenta.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Botonera fija abajo */}
                <div className="border-t bg-background px-4 py-3 flex items-center justify-end gap-2">
                  <Button size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="size-4" /> Imprimir
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-2" disabled>
                    <Ban className="size-4" /> Anular
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
