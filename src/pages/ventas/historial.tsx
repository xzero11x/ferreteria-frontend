import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Printer, Ban, Search } from "lucide-react";

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
import type { Venta } from "@/services/ventas";
import { listVentas } from "@/services/ventas";
import type { PaginationParams } from "@/types/api";

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
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const listRef = useRef<HTMLDivElement | null>(null);

  async function fetchVentas() {
    setLoading(true);
    try {
      const params: PaginationParams = { page, limit };
      const q = search.trim();
      if (q) params.q = q;
      if (fecha) {
        params.fecha_inicio = fecha;
        params.fecha_fin = fecha;
      }
      const res = await listVentas(params);
      const getDate = (v: Venta) => v.created_at ?? v.fecha ?? "1970-01-01T00:00:00Z";
      const sorted = [...res.data].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
      setVentas(sorted);
      setTotalPages(res.meta.totalPages);
      setTotalRecords(res.meta.total);
      setSelectedIndex(sorted.length > 0 ? 0 : -1);
    } catch (err) {
      console.error("Error al cargar ventas", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchVentas();
    }, 300);
    return () => clearTimeout(t);
  }, [page, limit, search, fecha]);

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
                    <TableHead>Fecha:Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVentas.map((v, idx) => {
                    const isSelected = idx === selectedIndex;
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
                        <TableCell className="whitespace-nowrap">{formatFechaHora((v.created_at ?? v.fecha) as string)}</TableCell>
                        <TableCell className="truncate max-w-[20ch]">{v.cliente?.nombre ?? "—"}</TableCell>
                        <TableCell className="truncate max-w-[18ch]">{v.usuario?.nombre ?? v.usuario?.email ?? "—"}</TableCell>
                        <TableCell className="truncate max-w-[12ch]">{prettyPago(v.metodo_pago)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatCurrency(v.total)}</TableCell>
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
                {/* Cabecera del ticket */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded bg-muted" aria-hidden />
                      <div className="min-w-0">
                        <div className="font-semibold">Ferretería Pro</div>
                        <div className="text-xs text-muted-foreground">RUC 12345678901</div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">ID Venta</div>
                      <div className="font-semibold">#{String(selectedVenta.id).padStart(5, "0")}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Vendedor</div>
                    <div className="font-medium truncate">{selectedVenta.usuario?.nombre ?? selectedVenta.usuario?.email ?? "—"}</div>
                    <div className="text-muted-foreground">Pago</div>
                    <div className="font-medium">{prettyPago(selectedVenta.metodo_pago)}</div>
                  </div>
                </div>

                {/* Detalles y productos */}
                <ScrollArea className="px-4 py-3">
                  <div className="space-y-3">
                    {/* Cliente y fecha */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Cliente</div>
                      <div className="font-medium truncate">{selectedVenta.cliente?.nombre ?? "—"}</div>
                      <div className="text-muted-foreground">Fecha</div>
                      <div className="font-medium">{formatFechaHora((selectedVenta.created_at ?? selectedVenta.fecha) as string)}</div>
                    </div>

                    {/* Lista de productos */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Productos</div>
                      <div className="space-y-2">
                        {(selectedVenta.detalles ?? []).map((d) => {
                          const subtotal = Number(d.subtotal);
                          return (
                            <div key={d.id} className="grid grid-cols-[1fr,auto,auto] gap-3 items-center">
                              <div className="truncate">
                                <div className="font-medium truncate">{d.producto?.nombre ?? `Producto #${d.producto_id}`}</div>
                                {d.producto?.sku && (
                                  <div className="text-xs text-muted-foreground">SKU {d.producto.sku}</div>
                                )}
                              </div>
                              <div className="text-right text-sm tabular-nums text-muted-foreground">x{d.cantidad}</div>
                              <div className="text-right font-medium tabular-nums">{formatCurrency(subtotal)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Totales */}
                    <div className="border-t pt-2">
                      <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
                        <div className="text-sm text-muted-foreground">Subtotal</div>
                        <div className="text-right tabular-nums">
                          {formatCurrency((selectedVenta.detalles ?? []).reduce((s, d) => s + Number(d.subtotal), 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-right font-semibold tabular-nums">{formatCurrency(selectedVenta.total)}</div>
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