// Página de creación de nueva orden de compra con información fiscal
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, AlertCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProveedorFiscalSelector } from "@/components/ProveedorFiscalSelector";
import { ProductSearchSelector } from "@/components/ProductSearchSelector";
import { usePostApiCompras } from "@/api/generated/órdenes-de-compra/órdenes-de-compra";
import { usePurchaseOrderCalculator, formatCurrency } from "@/hooks/usePurchaseOrderCalculator";
import type { Proveedor, Producto } from "@/api/generated/model";
import type { OrdenCompraDetalleItem } from "@/hooks/usePurchaseOrderCalculator";

const NuevaOrdenCompraPage = () => {
  const navigate = useNavigate();
  
  // Estados del formulario - Información fiscal
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<string>("FACTURA");
  const [serie, setSerie] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [fechaEmision, setFechaEmision] = useState<string>(new Date().toISOString().split("T")[0]);
  
  // Estados para agregar productos
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<string>("");
  const [costoUnitario, setCostoUnitario] = useState<string>("");
  
  // Carrito de compra
  const [items, setItems] = useState<OrdenCompraDetalleItem[]>([]);
  
  // Calcular totales con IGV usando el hook
  const { subtotal_base, impuesto_igv, total, detalles } = usePurchaseOrderCalculator(items);
  
  // Referencias para navegación con teclado
  const cantidadRef = useRef<HTMLInputElement>(null);
  const costoRef = useRef<HTMLInputElement>(null);
  const productoRef = useRef<HTMLInputElement>(null);
  
  // Mutation para crear orden
  const { mutate: createOrden, isPending } = usePostApiCompras({
    mutation: {
      onSuccess: (data) => {
        toast.success(`Orden de compra #${data.id} creada correctamente`);
        navigate("/dashboard/compras");
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || error?.message || "Error al crear orden de compra";
        toast.error(message);
      },
    },
  });

  // Auto-fill del costo cuando se selecciona un producto
  useEffect(() => {
    if (selectedProducto && selectedProducto.costo_compra) {
      setCostoUnitario(String(selectedProducto.costo_compra));
      setTimeout(() => cantidadRef.current?.focus(), 50);
    } else if (selectedProducto) {
      setCostoUnitario("");
      setTimeout(() => cantidadRef.current?.focus(), 50);
    }
  }, [selectedProducto]);

  // Función para agregar producto al carrito
  const handleAgregarProducto = () => {
    if (!selectedProducto) {
      toast.error("Selecciona un producto");
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    const costoNum = parseFloat(costoUnitario);

    // Validaciones
    if (!cantidad || cantidadNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      cantidadRef.current?.focus();
      return;
    }

    if (!costoUnitario || costoNum <= 0) {
      toast.error("El costo unitario debe ser mayor a 0");
      costoRef.current?.focus();
      return;
    }

    // Verificar si el producto ya está en el carrito
    const existingIndex = items.findIndex(item => item.producto_id === selectedProducto.id);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad del producto existente
      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cantidad: updatedItems[existingIndex].cantidad + cantidadNum,
      };
      setItems(updatedItems);
      toast.success("Cantidad actualizada en el carrito");
    } else {
      // Agregar nuevo item
      const nuevoItem: OrdenCompraDetalleItem = {
        producto_id: selectedProducto.id,
        producto_nombre: selectedProducto.nombre,
        cantidad: cantidadNum,
        costo_unitario: costoNum,
      };
      setItems([...items, nuevoItem]);
      toast.success("Producto agregado al carrito");
    }

    // Limpiar campos y enfocar de nuevo en búsqueda de producto
    setSelectedProducto(null);
    setCantidad("");
    setCostoUnitario("");
    setTimeout(() => productoRef.current?.focus(), 50);
  };

  // Función para eliminar item del carrito
  const handleEliminarItem = (productoId: number) => {
    const updatedItems = items.filter(item => item.producto_id !== productoId);
    setItems(updatedItems);
    toast.success("Producto eliminado del carrito");
  };

  // Función para guardar la orden
  const handleGuardarOrden = () => {
    // Validaciones
    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto a la orden");
      return;
    }

    if (!selectedProveedor) {
      toast.error("Debes seleccionar un proveedor");
      return;
    }

    if (tipoComprobante === 'FACTURA' && selectedProveedor.tipo_documento !== 'RUC') {
      toast.error("Para emitir FACTURA, el proveedor debe tener RUC");
      return;
    }

    // Convertir fecha a ISO datetime si existe
    let fechaISO: string | undefined = undefined;
    if (fechaEmision) {
      const fecha = new Date(fechaEmision + 'T00:00:00');
      fechaISO = fecha.toISOString();
    }

    const payload = {
      proveedor_id: selectedProveedor.id,
      tipo_comprobante: tipoComprobante as any,
      serie: serie || undefined,
      numero: numero || undefined,
      fecha_emision: fechaISO,
      detalles: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
      })),
    };

    createOrden({ data: payload });
  };

  // Handle Enter en inputs
  const handleKeyDown = (e: React.KeyboardEvent, nextAction: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextAction();
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pt-1 md:pt-2 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nueva Orden de Compra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea una orden de compra de mercadería con información fiscal
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/compras")}>
          Cancelar
        </Button>
      </div>

      {/* Sección A: Información del Proveedor y Datos Fiscales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Información del Proveedor y Comprobante
          </CardTitle>
          <CardDescription>Datos del proveedor y del comprobante de compra (opcional al crear, obligatorio al recibir)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proveedor */}
          <div className="space-y-2">
            <Label>Proveedor *</Label>
            <ProveedorFiscalSelector
              value={selectedProveedor?.id}
              onValueChange={setSelectedProveedor}
              tipoComprobanteRequerido={tipoComprobante as any}
              disabled={isPending}
              required={true}
            />
            {selectedProveedor && (
              <div className="text-xs text-muted-foreground space-y-1 mt-2 p-3 bg-muted rounded-md">
                <p><strong>Tipo:</strong> {selectedProveedor.tipo_documento}</p>
                {selectedProveedor.ruc_identidad && (
                  <p><strong>{selectedProveedor.tipo_documento}:</strong> {selectedProveedor.ruc_identidad}</p>
                )}
                {selectedProveedor.direccion && (
                  <p><strong>Dirección:</strong> {selectedProveedor.direccion}</p>
                )}
                {selectedProveedor.telefono && (
                  <p><strong>Teléfono:</strong> {selectedProveedor.telefono}</p>
                )}
              </div>
            )}
          </div>

          {/* Datos del Comprobante */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante</Label>
              <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                <SelectTrigger id="tipo_comprobante">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                  <SelectItem value="BOLETA">Boleta</SelectItem>
                  <SelectItem value="GUIA">Guía de Remisión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serie">Serie (Opcional)</Label>
              <Input
                id="serie"
                placeholder="F001"
                value={serie}
                onChange={(e) => setSerie(e.target.value.toUpperCase())}
                maxLength={10}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Puedes ingresar después al recibir
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número (Opcional)</Label>
              <Input
                id="numero"
                placeholder="000001"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                maxLength={20}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Emisión</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección B: Agregar Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Productos a la Orden</CardTitle>
          <CardDescription>Los precios deben incluir IGV (18%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Buscador de Producto */}
              <div className="md:col-span-5 space-y-2">
                <Label>Producto</Label>
                <ProductSearchSelector
                  selected={selectedProducto}
                  onSelect={setSelectedProducto}
                  placeholder="Buscar por nombre o SKU..."
                  disabled={isPending}
                />
                <input ref={productoRef} className="sr-only" />
              </div>

              {/* Cantidad */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  ref={cantidadRef}
                  id="cantidad"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="10"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => costoRef.current?.focus())}
                  disabled={!selectedProducto || isPending}
                />
              </div>

              {/* Costo Unitario (con IGV) */}
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="costo">Costo con IGV (S/)</Label>
                <Input
                  ref={costoRef}
                  id="costo"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.50"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleAgregarProducto)}
                  disabled={!selectedProducto || isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Precio con IGV incluido
                </p>
              </div>

              {/* Botón Agregar */}
              <div className="md:col-span-2 space-y-2">
                <Label className="invisible">Acción</Label>
                <Button
                  onClick={handleAgregarProducto}
                  disabled={!selectedProducto || isPending}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>

            {selectedProducto && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedProducto.nombre}</strong>
                  {selectedProducto.sku && <span className="ml-2 text-muted-foreground">SKU: {selectedProducto.sku}</span>}
                  <br />
                  <span className="text-xs">
                    Stock actual: <strong>{Number(selectedProducto.stock).toFixed(3)}</strong>
                    {/* @ts-ignore */}
                    {selectedProducto.unidad_medida && ` ${selectedProducto.unidad_medida.codigo}`}
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sección C: Carrito de Compra con Desglose de IGV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Productos en la Orden ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay productos en la orden</p>
              <p className="text-sm mt-1">Usa el buscador de arriba para agregar productos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabla de productos */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Producto</th>
                      <th className="text-left p-3 font-medium text-sm">Cantidad</th>
                      <th className="text-left p-3 font-medium text-sm">Costo Unit.</th>
                      <th className="text-left p-3 font-medium text-sm">Base</th>
                      <th className="text-left p-3 font-medium text-sm">IGV</th>
                      <th className="text-left p-3 font-medium text-sm">Subtotal</th>
                      <th className="text-center p-3 font-medium text-sm w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((detalle) => (
                      <tr key={detalle.producto_id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{detalle.producto_nombre}</div>
                        </td>
                        <td className="p-3 text-left tabular-nums">
                          {detalle.cantidad.toFixed(3).replace(/\.\?0+$/, '')}
                        </td>
                        <td className="p-3 text-left tabular-nums">
                          {formatCurrency(detalle.costo_unitario_total)}
                        </td>
                        <td className="p-3 text-left tabular-nums text-muted-foreground text-sm">
                          {formatCurrency(detalle.costo_unitario_base * detalle.cantidad)}
                        </td>
                        <td className="p-3 text-left tabular-nums text-muted-foreground text-sm">
                          {formatCurrency(detalle.igv_linea)}
                        </td>
                        <td className="p-3 text-left font-medium tabular-nums">
                          {formatCurrency(detalle.subtotal_linea)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminarItem(detalle.producto_id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen con desglose fiscal */}
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between pt-4 border-t gap-6">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Esta orden quedará en estado <strong>PENDIENTE</strong></p>
                  <p className="text-xs">El stock se actualizará cuando recibas la mercadería</p>
                  {!serie || !numero ? (
                    <p className="text-xs text-amber-600">
                      ⚠️ Deberás ingresar serie y número al recibir la mercadería
                    </p>
                  ) : null}
                </div>
                
                <div className="w-full md:w-auto min-w-[300px] space-y-3">
                  {/* Desglose de IGV */}
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (Base Imponible):</span>
                      <span className="font-medium tabular-nums">{formatCurrency(subtotal_base)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGV (18%):</span>
                      <span className="font-medium tabular-nums">{formatCurrency(impuesto_igv)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>TOTAL:</span>
                      <span className="tabular-nums">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleGuardarOrden}
                    disabled={items.length === 0 || isPending || !selectedProveedor}
                    className="w-full"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isPending ? "Generando orden..." : "Generar Orden de Compra"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NuevaOrdenCompraPage;
