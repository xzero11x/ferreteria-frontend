import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart, DollarSign, Plus, Minus, Search, X, Circle, Wallet, Power } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useGetApiProductos } from "@/api/generated/productos/productos";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { usePostApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import { useGetApiClientesId } from "@/api/generated/clientes/clientes";
import type { Producto, Categoria } from "@/api/generated/model";
import CreateProductDialog from "@/components/CreateProductDialog";
import ClientSelector from "@/components/ClientSelector";
import { useQueryClient } from "@tanstack/react-query";
import { useCaja } from "@/context/CajaContext";
import { AperturaCajaModal } from "@/components/AperturaCajaModal";
import { MovimientosCajaModal } from "@/components/MovimientosCajaModal";
import { CierreCajaModal } from "@/components/CierreCajaModal";

interface CarritoItem {
  productoId: number;
  nombre: string;
  sku: string | null;
  cantidad: number;
  precioVenta: number;
  stockDisponible: number;
  unidadMedida: string | null;
  permiteDecimales: boolean;
}

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatCantidad(cantidad: number, permiteDecimales: boolean) {
  return permiteDecimales 
    ? cantidad.toFixed(3).replace(/\.?0+$/, '') 
    : cantidad.toString();
}

export default function POSPage() {
  const queryClient = useQueryClient();
  const { currentSessionId, currentSession, isLoading: loadingSession } = useCaja();
  
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");

  // Cliente seleccionado (null = Público General)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  
  // Tipo de comprobante (BOLETA/FACTURA)
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA');

  // Obtener datos del cliente seleccionado para validar RUC
  const { data: clienteData } = useGetApiClientesId(
    selectedClienteId?.toString() || '',
    { query: { enabled: !!selectedClienteId } }
  );

  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "yape">("efectivo");
  const [montoRecibido, setMontoRecibido] = useState<string>("");
  
  // Modales de caja
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [showCierre, setShowCierre] = useState(false);

  // Hooks para datos
  const { data: productosResponse, isLoading: loadingProductos, refetch: refetchProductos } = useGetApiProductos({ limit: 100 });
  const { data: categoriasResponse, isLoading: loadingCategorias } = useGetApiCategorias();
  const { mutateAsync: createVenta } = usePostApiVentas();

  const productos = productosResponse?.data ?? [];
  const categorias = categoriasResponse?.data ?? [];
  const loading = loadingProductos || loadingCategorias;

  const filteredProductos = useMemo(() => {
    const s = search.trim().toLowerCase();
    return productos
      .filter((p) => {
        const nombre = p.nombre ?? "";
        const sku = p.sku ?? "";
        const bySearch = s
          ? nombre.toLowerCase().includes(s) || sku.toLowerCase().includes(s)
          : true;
        const byCat = selectedCategoriaId === "all" ? true : p.categoria_id === Number(selectedCategoriaId);
        return bySearch && byCat;
      })
      .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  }, [productos, search, selectedCategoriaId]);

  function handleAddToCart(producto: Producto) {
    const stockActual = producto.stock ?? 0;
    if (stockActual <= 0) {
      toast.error("Producto sin stock disponible");
      return;
    }

    setCarrito((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id);
      if (existing) {
        if (existing.cantidad < existing.stockDisponible) {
          return prev.map((i) =>
            i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
          );
        }
        toast.warning(`Stock máximo: ${existing.stockDisponible}`);
        return prev;
      }
      // V2: usar precio_venta calculado dinámicamente por backend (incluye IGV según config tenant)
      const precioVenta = producto.precio_venta ?? 0;
      const unidadCodigo = producto.unidad_medida?.codigo ?? null;
      const permiteDecimales = producto.unidad_medida?.permite_decimales ?? false;
      const nuevo: CarritoItem = {
        productoId: producto.id!,
        nombre: producto.nombre ?? "Producto",
        sku: producto.sku ?? null,
        cantidad: 1,
        precioVenta: precioVenta,
        stockDisponible: stockActual,
        unidadMedida: unidadCodigo,
        permiteDecimales: permiteDecimales,
      };
      toast.success(`${producto.nombre} añadido al carrito`);
      return [...prev, nuevo];
    });
  }

  function handleRemoveItem(productoId: number) {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function handleIncrementCantidad(productoId: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const incremento = i.permiteDecimales ? 0.1 : 1;
          const next = Number((i.cantidad + incremento).toFixed(3));
          if (next > i.stockDisponible) {
            toast.warning(`Stock máximo: ${i.stockDisponible} ${i.unidadMedida ?? ''}`);
            return i;
          }
          return { ...i, cantidad: next };
        }
        return i;
      })
    );
  }

  function handleDecrementCantidad(productoId: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const decremento = i.permiteDecimales ? 0.1 : 1;
          const minimo = i.permiteDecimales ? 0.001 : 1;
          const next = Number((i.cantidad - decremento).toFixed(3));
          if (next < minimo) return i;
          return { ...i, cantidad: next };
        }
        return i;
      })
    );
  }

  function handleChangeCantidad(productoId: number, nuevaCantidad: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const minimo = i.permiteDecimales ? 0.001 : 1;
          const cantidad = Math.max(minimo, Math.min(nuevaCantidad, i.stockDisponible));
          if (cantidad < nuevaCantidad) toast.warning(`Stock máximo: ${i.stockDisponible} ${i.unidadMedida ?? ''}`);
          return { ...i, cantidad: Number(cantidad.toFixed(3)) };
        }
        return i;
      })
    );
  }

  function handleClearCarrito() {
    if (carrito.length === 0) return;
    setCarrito([]);
    setMontoRecibido("");
  }

  const total = carrito.reduce((sum, i) => sum + i.cantidad * i.precioVenta, 0);
  const recibido = parseFloat(montoRecibido.replace(",", ".")) || 0;
  const vuelto = recibido - total;
  const faltaDinero = paymentMethod === "efectivo" && vuelto < 0;

  async function handleRegistrarVenta() {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente_id: selectedClienteId,
        tipo_comprobante: tipoComprobante,
        metodo_pago: paymentMethod,
        detalles: carrito.map((i) => ({
          producto_id: i.productoId,
          cantidad: i.cantidad,
          precio_unitario: i.precioVenta, // Ya incluye IGV
        })),
      };
      await createVenta({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'ventas'] });
      await queryClient.invalidateQueries({ queryKey: ['api', 'productos'] });
      toast.success("¡Venta registrada exitosamente!");
      setCarrito([]);
      setMontoRecibido("");
      setSelectedClienteId(null);
      setTipoComprobante('BOLETA');
      await refetchProductos();
    } catch (err: any) {
      // Manejar error de sesión de caja no abierta
      if (err?.response?.data?.requiere_accion === "APERTURA_SESION") {
        toast.error("Debes abrir una sesión de caja antes de registrar ventas");
      } else {
        const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Error al registrar la venta";
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingSession) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Modal de apertura (bloqueo total si no hay sesión) */}
      <AperturaCajaModal open={!currentSessionId} />
      
      {/* Modales de operación (solo si hay sesión) */}
      {currentSessionId && (
        <>
          <MovimientosCajaModal open={showMovimientos} onOpenChange={setShowMovimientos} />
          <CierreCajaModal open={showCierre} onOpenChange={setShowCierre} />
        </>
      )}
    
      <div className="pos-page px-4 lg:px-6 -my-3 md:-my-3 h-[calc(100svh-var(--header-height))] md:h-[calc(100svh-var(--header-height)-1rem)] overflow-hidden">
        <div className="grid h-full min-h-0 overflow-hidden gap-0" style={{ gridTemplateColumns: "minmax(0,1fr) 420px" }}>
          {/* IZQUIERDA: controles fijos y productos con scroll interno */}
          <div className="min-w-0 min-h-0 pr-4 h-full flex flex-col">
            {/* Header de Sesión */}
            {currentSession && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg px-4 py-2 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Circle className="size-3 fill-green-600 text-green-600 animate-pulse" />
                  <div>
                    <div className="text-sm font-semibold text-green-900 dark:text-green-100">
                      Caja Abierta
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Inicio: {new Date(currentSession.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowMovimientos(true)}>
                    <Wallet className="mr-2 size-4" />
                    Movimientos
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowCierre(true)}>
                    <Power className="mr-2 size-4" />
                    Cerrar Turno
                  </Button>
                </div>
              </div>
            )}
          
            {/* Controles superiores (fila 1: título-búsqueda-botón, fila 2: categorías) */}
            <div className="bg-background border-b py-3">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-3">
                <h2 className="text-lg font-semibold">Punto de Venta</h2>
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos por nombre o SKU"
                  className="pl-8"
                />
              </div>
              <CreateProductDialog onCreated={() => void refetchProductos()}>
                <Button>
                  <Plus className="mr-2 size-4" /> Añadir producto
                </Button>
              </CreateProductDialog>
            </div>
            <div className="mt-3 overflow-x-auto">
              <ToggleGroup type="single" value={selectedCategoriaId} onValueChange={(v) => setSelectedCategoriaId(v || "all")} spacing={4}>
                <ToggleGroupItem value="all" aria-label="Todas">Todas</ToggleGroupItem>
                {categorias.map((cat) => (
                  <ToggleGroupItem key={cat.id} value={String(cat.id)} aria-label={cat.nombre || "Categoría"}>
                    {cat.nombre}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {/* Productos ocupan el espacio restante y scrollean dentro */}
          <ScrollArea className="flex-1">
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {filteredProductos.map((p) => (
                <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-tight line-clamp-2 min-w-0 break-words">
                      {p.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-[1fr,auto] items-start gap-3">
                      <div className="space-y-1 text-sm text-muted-foreground min-w-0">
                        <div>{p.sku ? `SKU: ${p.sku}` : "Sin SKU"}</div>
                        <div>Stock: <span className="tabular-nums">{p.stock ?? 0} {p.unidad_medida?.codigo ?? ''}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Precio</div>
                        <div className="text-lg font-semibold tabular-nums">
                          {formatCurrency(p.precio_venta ?? 0)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={() => handleAddToCart(p)}
                        disabled={(p.stock ?? 0) <= 0}
                      >
                        <Plus className="mr-2 size-4" /> Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProductos.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Search className="size-10 mx-auto mb-2 opacity-50" />
                  <p>No hay productos que coincidan</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* DERECHA: Panel fijo del carrito y acciones con separadores */}
        <div className="pl-4 border-l h-full min-w-0 min-h-0">
          <div className="flex flex-col h-full min-h-0 divide-y divide-border">
            {/* Encabezado carrito */}
            <div className="flex items-center justify-between py-3">
              <div className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="size-5" /> Carrito
              </div>
              <span className="text-sm text-muted-foreground">({carrito.length})</span>
            </div>

            {/* Selector de Cliente */}
            <div className="py-3">
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <ClientSelector
                value={selectedClienteId}
                onChange={(clienteId) => {
                  setSelectedClienteId(clienteId);
                  // Siempre resetear a BOLETA cuando cambia cliente
                  setTipoComprobante('BOLETA');
                }}
                disabled={saving}
              />
              
              {/* Botón discreto para cambiar a FACTURA (solo si cliente tiene RUC) */}
              {(clienteData?.ruc || clienteData?.documento_identidad?.match(/^[0-9]{11}$/)) && (
                <div className="mt-2">
                  {tipoComprobante === 'BOLETA' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTipoComprobante('FACTURA')}
                      disabled={saving}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cambiar a FACTURA
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600">📄 FACTURA</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTipoComprobante('BOLETA')}
                        disabled={saving}
                        className="h-6 text-xs"
                      >
                        Cambiar a BOLETA
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista del carrito scroleable */}
            <ScrollArea className="flex-1">
              {carrito.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="size-12 mx-auto mb-2 opacity-50" />
                  <p>El carrito está vacío</p>
                  <p className="text-sm">Añade productos desde el grid</p>
                </div>
              ) : (
                <Table className="table-fixed">
                  <TableHeader className="sr-only">
                    <TableRow>
                      <TableHead>Carrito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carrito.map((item) => (
                      <TableRow key={item.productoId} className="relative">
                        <TableCell colSpan={5} className="px-2 py-2 align-top">
                          <div className="relative grid grid-cols-[1fr,auto] grid-rows-[auto,auto,auto] gap-x-2 gap-y-2 min-w-0">
                            {/* Nombre arriba, wrap completo */}
                            <div className="col-span-2 font-semibold text-sm !whitespace-normal break-words min-w-0 pr-7 md:pr-8">
                              {item.nombre}
                              {item.sku && <span className="text-xs text-muted-foreground ml-2">({item.sku})</span>}
                            </div>

                            {/* Botón eliminar en esquina superior derecha */}
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Eliminar"
                              onClick={() => handleRemoveItem(item.productoId)}
                              className="absolute right-1 top-1"
                            >
                              <X className="size-4 text-destructive" />
                            </Button>

                            {/* Fila 2: P. Unitario arriba; se elimina SKU/Stock */}
                            <div className="text-xs">
                              <span className="text-muted-foreground">P. Unitario:</span>{" "}
                              <span className="font-medium tabular-nums">{formatCurrency(item.precioVenta)}</span>
                              {item.unidadMedida && <span className="text-muted-foreground ml-1">/{item.unidadMedida}</span>}
                            </div>
                            <div />

                            {/* Fila 3: Cantidad (solo control), subtotal queda a la derecha */}
                            <div className="flex items-center justify-start gap-2 text-xs min-w-0">
                              <div className="relative shrink-0 w-[88px]">
                                <Input
                                  type="number"
                                  min={item.permiteDecimales ? 0.001 : 1}
                                  max={item.stockDisponible}
                                  step={item.permiteDecimales ? 0.001 : 1}
                                  value={item.cantidad}
                                  onChange={(e) => handleChangeCantidad(item.productoId, Number(e.target.value))}
                                  aria-label="Cantidad"
                                  className="appearance-none w-full h-8 text-center pl-7 pr-7"
                                />
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Disminuir"
                                  onClick={() => handleDecrementCantidad(item.productoId)}
                                  className="absolute left-0.5 top-1/2 -translate-y-1/2"
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Incrementar"
                                  onClick={() => handleIncrementCantidad(item.productoId)}
                                  className="absolute right-0.5 top-1/2 -translate-y-1/2"
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                              {item.unidadMedida && (
                                <span className="text-muted-foreground font-medium">{item.unidadMedida}</span>
                              )}
                            </div>

                            {/* Total en esquina inferior derecha, más grande y en negrita */}
                            <div className="text-right font-semibold text-lg tabular-nums">
                              {formatCurrency(item.cantidad * item.precioVenta)}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>

            {/* Footer de pago moderno con cálculo de vuelto */}
            <div className="border-t bg-background px-3 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] items-start gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Total a Pagar</div>
                  <div className="text-3xl font-bold tracking-tight tabular-nums text-primary">
                    {formatCurrency(total)}
                  </div>

                  {/* Método de pago */}
                  <div className="mt-2">
                    <ToggleGroup type="single" value={paymentMethod} onValueChange={(v) => setPaymentMethod((v as any) || "efectivo")} spacing={4}>
                      <ToggleGroupItem value="efectivo" aria-label="Efectivo">Efectivo</ToggleGroupItem>
                      <ToggleGroupItem value="tarjeta" aria-label="Tarjeta">Tarjeta</ToggleGroupItem>
                      <ToggleGroupItem value="yape" aria-label="Yape">Yape</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {/* Paga con y vuelto/falta para efectivo */}
                  {paymentMethod === "efectivo" ? (
                    <div className="mt-2 grid grid-cols-[1fr,auto] items-end gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Paga con</div>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="Ej: 200.00"
                          value={montoRecibido}
                          onChange={(e) => setMontoRecibido(e.target.value)}
                          className="h-9 appearance-none"
                        />
                      </div>
                      <div className={faltaDinero ? "text-destructive" : "text-emerald-600"} aria-live="polite">
                        <div className="text-xs text-muted-foreground">{faltaDinero ? "Falta" : "Vuelto"}</div>
                        <div className="text-lg font-semibold tabular-nums">{formatCurrency(Math.abs(vuelto))}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">Cobro exacto</div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    className="w-full h-11 font-semibold"
                    size="lg"
                    onClick={handleRegistrarVenta}
                    disabled={
                      carrito.length === 0 ||
                      saving ||
                      (paymentMethod === "efectivo" && recibido < total)
                    }
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Registrando
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 size-4" /> Cobrar
                      </>
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" className="w-full h-11" disabled={carrito.length === 0 || saving}>
                        <X className="mr-2 size-4" /> Limpiar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpiar carrito</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminarán todos los productos del carrito. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCarrito}>Confirmar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
