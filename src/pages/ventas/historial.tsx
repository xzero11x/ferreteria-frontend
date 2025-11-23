"use client"

import * as React from "react"
import { Loader2, Printer, Ban, Search, FileText, Receipt, ChevronLeft, ChevronRight } from "lucide-react"

import { useGetApiVentas } from "@/api/generated/ventas-pos/ventas-pos"
import { useGetApiTenantConfiguracion } from "@/api/generated/tenant/tenant"
import type { Venta } from "@/api/generated/model"

import { ScrollArea } from "@/components/ui_official/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui_official/table"
import { Button } from "@/components/ui_official/button"
import { Input } from "@/components/ui_official/input"
import { Badge } from "@/components/ui_official/badge"
import { Separator } from "@/components/ui_official/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_official/select"

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num)
}

function formatFechaHora(iso: string) {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
  return `${fecha} ${hora}`
}

function prettyPago(value?: string) {
  if (!value) return "—"
  const v = value.toLowerCase()
  if (v === "efectivo") return "Efectivo"
  if (v === "tarjeta") return "Tarjeta"
  if (v === "yape") return "Yape"
  return value
}

const metodoPagoVariant: Record<string, "default" | "secondary" | "outline"> = {
  efectivo: "default",
  tarjeta: "secondary",
  yape: "outline",
}

export default function HistorialVentasPageV2() {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)
  const [search, setSearch] = React.useState<string>("")
  const [fecha, setFecha] = React.useState<string>("")
  const [page, setPage] = React.useState<number>(1)
  const [limit, setLimit] = React.useState<number>(50)

  // Obtener configuración del tenant
  const { data: configTenant } = useGetApiTenantConfiguracion()

  // Debounce del search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // Hook para ventas
  const { data: ventasResponse, isLoading: loading } = useGetApiVentas({
    page,
    limit,
    q: debouncedSearch || undefined,
    fecha_inicio: fecha || undefined,
    fecha_fin: fecha || undefined,
  })

  const ventasData = ventasResponse?.data ?? []
  const getDate = (v: Venta) => v.created_at ?? "1970-01-01T00:00:00Z"
  const ventas = [...ventasData].sort(
    (a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime()
  )
  const totalPages = ventasResponse?.meta?.totalPages ?? 1
  const totalRecords = ventasResponse?.meta?.total ?? 0

  const filteredVentas = React.useMemo(() => ventas, [ventas])

  // Resetear selección SOLO cuando cambian las ventas (paginación, búsqueda)
  React.useEffect(() => {
    if (filteredVentas.length === 0) {
      setSelectedIndex(-1)
    } else if (selectedIndex >= filteredVentas.length) {
      // Solo resetear si el índice actual es inválido
      setSelectedIndex(0)
    }
    // NO incluir selectedIndex en las dependencias para evitar loops
  }, [filteredVentas.length])

  function handleRowClick(idx: number) {
    console.log('handleRowClick called with idx:', idx)
    console.log('Current selectedIndex:', selectedIndex)
    setSelectedIndex(idx)
    console.log('New selectedIndex set to:', idx)
  }

  const selectedVenta = selectedIndex >= 0 ? filteredVentas[selectedIndex] : undefined
  
  React.useEffect(() => {
    console.log('selectedIndex changed to:', selectedIndex)
    console.log('selectedVenta:', selectedVenta)
  }, [selectedIndex, selectedVenta])

  if (loading && ventas.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header con título y filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Historial de Ventas</h1>
        </div>

        {/* Filtros organizados horizontalmente */}
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value)
              setPage(1)
            }}
            className="w-[180px]"
          />
          <div className="relative flex-1 min-w-[250px] max-w-[450px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, vendedor o ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Layout con vista split */}
      <div className="grid grid-cols-[1fr_450px] gap-6 h-[calc(100vh-220px)]">
        {/* Panel Izquierdo: Lista de ventas */}
        <div className="flex flex-col min-h-0 border rounded-lg bg-card">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Ventas Registradas</h2>
              <Badge variant="outline" className="font-mono">
                {filteredVentas.length} ventas
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1 min-h-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Comprobante</TableHead>
                  <TableHead className="w-[160px]">Fecha y Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[110px]">Método Pago</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No se encontraron ventas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVentas.map((v, idx) => {
                    const isSelected = idx === selectedIndex
                    const comprobante =
                      v.serie && v.numero_comprobante
                        ? `${v.serie.codigo}-${String(v.numero_comprobante).padStart(6, "0")}`
                        : `#${v.id}`
                    return (
                      <TableRow
                        key={v.id}
                        onClick={() => {
                          console.log('Clicking row:', idx, v.id)
                          handleRowClick(idx)
                        }}
                        data-state={isSelected ? "selected" : undefined}
                        className={
                          isSelected
                            ? "cursor-pointer bg-primary/15 hover:bg-primary/20 border-l-4 border-l-primary data-[state=selected]:bg-primary/15"
                            : "cursor-pointer hover:bg-muted/50 border-l-4 border-l-transparent"
                        }
                      >
                        <TableCell className={isSelected ? "font-mono font-bold" : "font-mono font-semibold"}>
                          {comprobante}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatFechaHora(v.created_at)}
                        </TableCell>
                        <TableCell className="truncate max-w-[180px]">
                          {v.cliente?.nombre ?? "Público General"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              metodoPagoVariant[v.metodo_pago?.toLowerCase() || ""] || "outline"
                            }
                            className="text-xs"
                          >
                            {prettyPago(v.metodo_pago || undefined)}
                          </Badge>
                        </TableCell>
                        <TableCell className={isSelected ? "text-right font-bold tabular-nums" : "text-right font-semibold tabular-nums"}>
                          {formatCurrency(v.total)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Paginación en el footer del panel */}
          <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setPage(1)
                  setLimit(Number(v))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">por página</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium">{totalRecords}</span> ventas
            </div>
          </div>
        </div>

        {/* Panel Derecho: Detalle del comprobante */}
        <div className="flex flex-col min-h-0 border rounded-lg bg-card">
          {!selectedVenta ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <Receipt className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Selecciona una venta de la lista</p>
              <p className="text-xs mt-1">para ver el detalle del comprobante</p>
            </div>
          ) : (
            <>
              {/* Header del comprobante */}
              <div className="p-4 border-b bg-muted/30">
                <div className="text-center space-y-2">
                  <div className="font-bold text-lg">
                    {configTenant?.nombre_empresa ?? "Ferretería"}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {(configTenant?.configuracion as any)?.empresa?.ruc && (
                      <div>RUC: {(configTenant?.configuracion as any).empresa.ruc}</div>
                    )}
                    {(configTenant?.configuracion as any)?.empresa?.direccion && (
                      <div className="line-clamp-2">
                        {(configTenant?.configuracion as any).empresa.direccion}
                      </div>
                    )}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-center gap-2">
                    {selectedVenta.serie?.tipo_comprobante === "FACTURA" && (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    {selectedVenta.serie?.tipo_comprobante === "BOLETA" && (
                      <Receipt className="h-5 w-5 text-primary" />
                    )}
                    <span className="text-sm font-semibold uppercase">
                      {selectedVenta.serie?.tipo_comprobante?.replace("_", " ") ??
                        "COMPROBANTE DE VENTA"}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xl">
                    {selectedVenta.serie && selectedVenta.numero_comprobante
                      ? `${selectedVenta.serie.codigo}-${String(
                          selectedVenta.numero_comprobante
                        ).padStart(8, "0")}`
                      : `#${String(selectedVenta.id).padStart(6, "0")}`}
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-left">
                      <div className="text-muted-foreground mb-1">Fecha</div>
                      <div className="font-medium">
                        {new Date(selectedVenta.created_at).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-1">Hora</div>
                      <div className="font-medium">
                        {new Date(selectedVenta.created_at).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-muted-foreground mb-1">Vendedor</div>
                      <div className="font-medium truncate">
                        {selectedVenta.usuario?.nombre ?? selectedVenta.usuario?.email ?? "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-1">Método Pago</div>
                      <Badge
                        variant={
                          metodoPagoVariant[selectedVenta.metodo_pago?.toLowerCase() || ""] ||
                          "outline"
                        }
                        className="text-xs"
                      >
                        {prettyPago(selectedVenta.metodo_pago || undefined)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body del comprobante */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Cliente */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Datos del Cliente
                    </div>
                    <div className="p-3 rounded-md bg-muted/30 space-y-1">
                      <div className="font-semibold">
                        {selectedVenta.cliente?.nombre ?? "CLIENTE VARIOS"}
                      </div>
                      {selectedVenta.cliente?.documento_identidad && (
                        <div className="text-xs text-muted-foreground">
                          DNI: {selectedVenta.cliente.documento_identidad}
                        </div>
                      )}
                      {(selectedVenta.cliente as any)?.ruc && (
                        <div className="text-xs text-muted-foreground">
                          RUC: {(selectedVenta.cliente as any).ruc}
                        </div>
                      )}
                      {selectedVenta.cliente?.direccion && (
                        <div className="text-xs text-muted-foreground">
                          {selectedVenta.cliente.direccion}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Productos */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Detalle de la Venta
                    </div>
                    <div className="space-y-3">
                      {(selectedVenta.detalles ?? []).map((d) => {
                        const subtotal = d.precio_unitario * d.cantidad
                        const valorSinIgv = d.valor_unitario * d.cantidad
                        const igvLinea = d.igv_total ?? 0
                        const formatCant = (cant: number) =>
                          cant % 1 === 0 ? cant.toString() : cant.toFixed(3).replace(/\.?0+$/, "")

                        return (
                          <div
                            key={d.id}
                            className="p-3 rounded-md border bg-card space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">
                                  {d.producto?.nombre ?? `Producto #${d.producto_id}`}
                                </div>
                                {d.producto?.sku && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    SKU: {d.producto.sku}
                                  </div>
                                )}
                              </div>
                              <div className="text-right font-semibold tabular-nums shrink-0">
                                {formatCurrency(subtotal)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-2 border-t">
                              <div className="text-muted-foreground">
                                {formatCant(d.cantidad)} {d.producto?.unidad_medida?.codigo ?? "UND"} ×{" "}
                                {formatCurrency(d.precio_unitario)}
                              </div>
                              <div className="text-muted-foreground tabular-nums">
                                Base: {formatCurrency(valorSinIgv)} | IGV: {formatCurrency(igvLinea)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Resumen tributario */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Resumen Tributario
                    </div>
                    <div className="p-3 rounded-md bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Op. Gravada</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(
                            (selectedVenta.detalles ?? []).reduce(
                              (s, d) => s + d.valor_unitario * d.cantidad,
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">IGV (18%)</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(
                            (selectedVenta.detalles ?? []).reduce(
                              (s, d) => s + (d.igv_total ?? 0),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-base">TOTAL A PAGAR</span>
                        <span className="font-bold text-xl tabular-nums text-primary">
                          {formatCurrency(selectedVenta.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer con acciones */}
              <div className="p-3 border-t bg-muted/20 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button size="sm" variant="destructive" className="gap-2" disabled>
                  <Ban className="h-4 w-4" /> Anular
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
