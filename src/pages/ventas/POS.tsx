import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart, DollarSign, Plus, Minus, Search, X, Package } from "lucide-react";

import { Card, CardContent } from "@/components/ui_official/card";
import { Button } from "@/components/ui_official/button";
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
} from "@/components/ui_official/alert-dialog";
import { Input } from "@/components/ui_official/input";
import { Badge } from "@/components/ui_official/badge";
import { ScrollArea } from "@/components/ui_official/scroll-area";
import { Separator } from "@/components/ui_official/separator";

import { useGetApiProductos } from "@/api/generated/productos/productos";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { usePostApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import { useGetApiClientesId } from "@/api/generated/clientes/clientes";
import type { Producto } from "@/api/generated/model";
import CreateProductDialog from "@/components/CreateProductDialog";
import ClientSelector from "@/components/ClientSelector";
import { useQueryClient } from "@tanstack/react-query";
import { useCaja } from "@/context/CajaContext";
import { AperturaCajaModal } from "@/components/AperturaCajaModal";
import { MovimientosCajaModal } from "@/components/MovimientosCajaModal";
import { CierreCajaModal } from "@/components/CierreCajaModal";

// Tipo extendido con relaciones expandidas (como lo envía el backend)
interface ProductoConRelaciones extends Producto {
  unidad_medida?: {
    codigo: string;
    permite_decimales: boolean;
  };
}

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

export default function POSPageV2() {
  const queryClient = useQueryClient();
  const { currentSessionId, isLoading: loadingSession } = useCaja();
  
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");

  // Cliente seleccionado (null = Público General)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  
  // Tipo de comprobante (BOLETA/FACTURA)
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA');

  // Obtener datos del cliente seleccionado para validar RUC
  const { data: clienteData } = useGetApiClientesId(
    selectedClienteId ?? 0,
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
    return (productos as ProductoConRelaciones[])
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

  function handleAddToCart(producto: ProductoConRelaciones) {
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
          precio_unitario: i.precioVenta,
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
      <AperturaCajaModal open={!currentSessionId} />
      
      {currentSessionId && (
        <>
          <MovimientosCajaModal open={showMovimientos} onOpenChange={setShowMovimientos} />
          <CierreCajaModal open={showCierre} onOpenChange={setShowCierre} />
        </>
      )}
    
      <div className="h-[calc(100vh-var(--header-height)-3rem)] px-4 lg:px-6 py-4">
        {/* Layout principal con 2 columnas */}
        <div className="flex gap-6 h-full">
          {/* Columna Izquierda: Título + Búsqueda + Productos */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Título */}
            <h1 className="text-2xl font-semibold flex-shrink-0">Punto de Venta</h1>

<<<<<<< Updated upstream
            {/* Barra de Búsqueda y Filtros */}
            <div className="space-y-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU"
                    className="pl-9"
                  />
=======
          {/* Productos ocupan el espacio restante y scrollean dentro */}
          <ScrollArea className="flex-1">
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {filteredProductos.map((p) => (
                <Card key={p.id} className="overflow-hidden  hover:shadow-md gap-2 transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-tight line-clamp-2 min-w-0 break-words">
                      {p.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                       <div>
                        <img src="/assets/imgProductos/image.png"  className="h-20 w-20 rounded-md object-cover" />
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground min-w-0">
                        <div>{p.sku ? `SKU: ${p.sku}` : "Sin SKU"}</div>
                        <div>Stock: <span className="tabular-nums">{p.stock}</span></div>
                        {p.categoria?.nombre && (
                          <Badge variant="secondary" className="mt-1">{p.categoria?.nombre}</Badge>
                        )}
                      </div>
                     
                     
                    </div>
                    <div className="mt-5 flex justify-between items-center ">
                       <div className="text-right">
                        <div className="text-xs text-muted-foreground">Precio</div>
                        <div className="text-lg font-semibold tabular-nums">{formatCurrency(p.precio_venta)}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
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
>>>>>>> Stashed changes
                </div>
                <CreateProductDialog onCreated={() => void refetchProductos()}>
                  <Button>
                    <Plus className="mr-2 size-4" /> Nuevo
                  </Button>
                </CreateProductDialog>
              </div>

              {/* Categorías como Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategoriaId === "all" ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setSelectedCategoriaId("all")}
                >
                  Todas
                </Badge>
                {categorias.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategoriaId === String(cat.id) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => setSelectedCategoriaId(String(cat.id))}
                  >
                    {cat.nombre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Grid de Productos */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4 pb-4">
                {filteredProductos.map((p) => (
                  <Card 
                    key={p.id} 
                    className="group overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer border-border/40 rounded-md"
                    onClick={() => handleAddToCart(p)}
                  >
                    {/* Imagen del Producto - Sin padding */}
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                      {p.imagen_url ? (
                        <img 
                          src={p.imagen_url} 
                          alt={p.nombre || ''} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="size-10 text-muted-foreground/50" />
                      )}
                    </div>

                    <CardContent className="p-3 space-y-2">
                      {/* Nombre del Producto */}
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.25rem]">
                        {p.nombre}
                      </h3>
                      
                      {/* Precio */}
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-primary tabular-nums">
                          {formatCurrency(p.precio_venta ?? 0)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                          disabled={(p.stock ?? 0) <= 0}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredProductos.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    <Package className="size-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No se encontraron productos</p>
                    <p className="text-sm">Intenta con otros filtros</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Columna Derecha: Carrito - ocupa toda la altura */}
        <div className="w-[420px] flex-shrink-0">
          {/* PANEL DERECHO: Carrito y Pago */}
          <Card className="h-full flex flex-col border-border/40 rounded-lg">
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Header inline */}
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  <span className="font-semibold">Carrito</span>
                  <Badge variant="secondary">
                    {carrito.length}
                  </Badge>
                </div>
                {/* Botones de sesión compactos */}
                {currentSessionId && (
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowMovimientos(true)}
                      className="h-7 text-xs"
                    >
                      Movimientos
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowCierre(true)}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      Cerrar Turno
                    </Button>
                  </div>
                )}
              </div>
              {/* Cliente Selector */}
              <div className="p-4 space-y-3 border-b">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente</label>
                  <ClientSelector
                    value={selectedClienteId}
                    onChange={(clienteId) => {
                      setSelectedClienteId(clienteId);
                      setTipoComprobante('BOLETA');
                    }}
                    disabled={saving}
                  />
                </div>
                
                {/* Tipo de Comprobante */}
                {(clienteData?.ruc || clienteData?.documento_identidad?.match(/^[0-9]{11}$/)) && (
                  <div className="flex items-center gap-2">
                    <Badge variant={tipoComprobante === 'BOLETA' ? 'default' : 'outline'}>
                      BOLETA
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTipoComprobante(tipoComprobante === 'BOLETA' ? 'FACTURA' : 'BOLETA')}
                      disabled={saving}
                    >
                      Cambiar a {tipoComprobante === 'BOLETA' ? 'FACTURA' : 'BOLETA'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Lista del Carrito */}
              <ScrollArea className="flex-1 min-h-0">
                {carrito.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground px-4">
                    <ShoppingCart className="size-16 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Carrito vacío</p>
                    <p className="text-sm">Añade productos para comenzar</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {carrito.map((item) => (
                      <Card key={item.productoId} className="relative border-border/40 rounded-md">
                        <CardContent className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-2 top-2 size-6 p-0"
                            onClick={() => handleRemoveItem(item.productoId)}
                          >
                            <X className="size-4 text-destructive" />
                          </Button>

                          <div className="pr-8 space-y-2">
                            {/* Nombre */}
                            <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                              {item.nombre}
                            </h4>

                            {/* Precio Unitario */}
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(item.precioVenta)} / {item.unidadMedida || 'und'}
                            </div>

                            {/* Controles de Cantidad */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="size-7 p-0"
                                  onClick={() => handleDecrementCantidad(item.productoId)}
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min={item.permiteDecimales ? 0.001 : 1}
                                  max={item.stockDisponible}
                                  step={item.permiteDecimales ? 0.001 : 1}
                                  value={item.cantidad}
                                  onChange={(e) => handleChangeCantidad(item.productoId, Number(e.target.value))}
                                  className="w-16 h-7 text-center text-xs p-1"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="size-7 p-0"
                                  onClick={() => handleIncrementCantidad(item.productoId)}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>

                              {/* Subtotal */}
                              <div className="text-base font-bold tabular-nums">
                                {formatCurrency(item.cantidad * item.precioVenta)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Footer: Total y Pago */}
              <div className="p-4 space-y-4 bg-muted/30">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-3xl font-bold text-primary tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Método de Pago */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pago</label>
                  <div className="flex gap-2">
                    <Badge
                      variant={paymentMethod === "efectivo" ? "default" : "outline"}
                      className="cursor-pointer flex-1 justify-center py-2"
                      onClick={() => setPaymentMethod("efectivo")}
                    >
                      Efectivo
                    </Badge>
                    <Badge
                      variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                      className="cursor-pointer flex-1 justify-center py-2"
                      onClick={() => setPaymentMethod("tarjeta")}
                    >
                      Tarjeta
                    </Badge>
                    <Badge
                      variant={paymentMethod === "yape" ? "default" : "outline"}
                      className="cursor-pointer flex-1 justify-center py-2"
                      onClick={() => setPaymentMethod("yape")}
                    >
                      Yape
                    </Badge>
                  </div>
                </div>

                {/* Paga con / Vuelto (solo efectivo) */}
                {paymentMethod === "efectivo" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Paga con</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={montoRecibido}
                          onChange={(e) => setMontoRecibido(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          {faltaDinero ? "Falta" : "Vuelto"}
                        </label>
                        <div className={`text-lg font-bold tabular-nums ${faltaDinero ? 'text-destructive' : 'text-emerald-600'}`}>
                          {formatCurrency(Math.abs(vuelto))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    size="lg"
                    className="font-semibold"
                    onClick={handleRegistrarVenta}
                    disabled={
                      carrito.length === 0 ||
                      saving ||
                      (paymentMethod === "efectivo" && recibido < total)
                    }
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Procesando
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 size-4" />
                        Cobrar
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="lg"
                        disabled={carrito.length === 0 || saving}
                      >
                        <X className="mr-2 size-4" />
                        Limpiar
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
                        <AlertDialogAction onClick={handleClearCarrito}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
