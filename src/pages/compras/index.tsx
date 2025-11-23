<<<<<<< Updated upstream
// Página de gestión de órdenes de compra con información fiscal (Historial + Detalle con Sheet)
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Eye, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ProviderSelector } from "@/components/ProviderSelector";
import { ReceiveOrderModal } from "@/components/ReceiveOrderModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetApiCompras,
  useGetApiComprasId,
  usePostApiComprasIdCancelar,
} from "@/api/generated/órdenes-de-compra/órdenes-de-compra";
import type { Proveedor } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "@/hooks/usePurchaseOrderCalculator";

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const getEstadoBadge = (estado: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, label: string }> = {
    pendiente: { variant: "secondary", icon: Clock, label: "Pendiente" },
    recibida: { variant: "default", icon: CheckCircle2, label: "Recibida" },
    cancelada: { variant: "destructive", icon: XCircle, label: "Cancelada" },
  };
  const item = config[estado] || { variant: "outline" as const, icon: AlertCircle, label: estado };
  const Icon = item.icon;
  
  return (
    <Badge variant={item.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

const getTipoComprobanteBadge = (tipo: string | null | undefined) => {
  if (!tipo) return <Badge variant="outline">Sin Comprobante</Badge>;
  
  const config: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
    FACTURA: { variant: "default", label: "Factura" },
    BOLETA: { variant: "secondary", label: "Boleta" },
    GUIA: { variant: "outline", label: "Guía" },
  };
  
  const item = config[tipo] || { variant: "outline" as const, label: tipo };
  
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

const ComprasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados de filtros
  const [estadoFilter, setEstadoFilter] = useState<string>("todas");
  const [tipoComprobanteFilter, setTipoComprobanteFilter] = useState<string>("todos");
  const [proveedorFilter, setProveedorFilter] = useState<Proveedor | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Estados del sheet de detalle
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Estados de modales
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [confirmCancelarOpen, setConfirmCancelarOpen] = useState(false);

  // Query principal con filtros
  const { data: ordenesResponse, isLoading, error } = useGetApiCompras(
    {
      estado: estadoFilter !== "todas" ? (estadoFilter as any) : undefined,
      proveedor_id: proveedorFilter?.id,
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
    }
  );

  // Query de detalle (solo se ejecuta si hay ID seleccionado)
  const { data: ordenDetalle, isLoading: loadingDetalle } = useGetApiComprasId(
    selectedOrdenId!,
    { query: { enabled: !!selectedOrdenId } }
  );

  // Mutation de cancelar
  const { mutate: cancelarOrden, isPending: cancelandoOrden } = usePostApiComprasIdCancelar({
    mutation: {
      onSuccess: () => {
        toast.success("Orden cancelada correctamente");
        queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
        queryClient.invalidateQueries({ queryKey: [`/api/compras/${selectedOrdenId}`] });
        setConfirmCancelarOpen(false);
        setDetailSheetOpen(false);
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || "Error al cancelar orden";
        toast.error(message);
      },
    },
  });

  const ordenes = ordenesResponse?.data || [];

  // Filtrado client-side por tipo de comprobante
  const filteredOrdenes = useMemo(() => {
    if (tipoComprobanteFilter === "todos") return ordenes;
    return ordenes.filter(orden => orden.tipo_comprobante === tipoComprobanteFilter);
  }, [ordenes, tipoComprobanteFilter]);

  const handleVerDetalle = (ordenId: number) => {
    setSelectedOrdenId(ordenId);
    setDetailSheetOpen(true);
  };

  const handleCancelarOrden = () => {
    if (!selectedOrdenId) return;
    cancelarOrden({ id: selectedOrdenId });
  };

  const handleReceiveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
    queryClient.invalidateQueries({ queryKey: [`/api/compras/${selectedOrdenId}`] });
  };

  if (error) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar órdenes: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
=======
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Search, X, FileInput, Save } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
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

import type { Producto } from "@/services/productos";
import { listProductos } from "@/services/productos";
import type { Categoria } from "@/services/categorias";
import { listCategorias } from "@/services/categorias";
import CreateProductDialog from "@/components/CreateProductDialog";
import ProveedorSelector from "@/components/ProveedorSelector";
import { createOrdenCompra, type OrdenCompraCreateInput } from "@/services/compra";

interface CarritoItem {
  productoId: number;
  nombre: string;
  sku: string | null;
  cantidad: number;
  precioCompra: number;
  stockDisponible: number;
}

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

export default function ComprasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");

  // Cliente seleccionado (null = Público General)
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "yape">("efectivo");

  const fetchProductos = useCallback(async () => {
    try {
      const response = await listProductos({ limit: 100 });
      setProductos(response.data);
    } catch (err: any) {
      toast.error(err?.body?.message || "Error al cargar productos");
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await listCategorias();
      setCategorias(data);
    } catch (err: any) {
      toast.error(err?.body?.message || "Error al cargar categorías");
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchProductos(), fetchCategorias()]);
      setLoading(false);
    }
    void init();
  }, [fetchProductos, fetchCategorias]);

  const filteredProductos = useMemo(() => {
    const s = search.trim().toLowerCase();
    return productos
      .filter((p) => {
        const bySearch = s
          ? p.nombre.toLowerCase().includes(s) || (p.sku ?? "").toLowerCase().includes(s)
          : true;
        const byCat = selectedCategoriaId === "all" ? true : p.categoria_id === Number(selectedCategoriaId);
        return bySearch && byCat;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [productos, search, selectedCategoriaId]);

  function handleAddToCart(producto: Producto) {
    if (producto.stock <= 0) {
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
      const nuevo: CarritoItem = {
        productoId: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        cantidad: 1,
        precioCompra: Number(producto.costo_compra),
        stockDisponible: producto.stock,
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
          const next = i.cantidad + 1;
          if (next > i.stockDisponible) {
            toast.warning(`Stock máximo: ${i.stockDisponible}`);
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
          const next = i.cantidad - 1;
          if (next <= 0) return i;
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
          const cantidad = Math.max(1, Math.min(nuevaCantidad, i.stockDisponible));
          if (cantidad < nuevaCantidad) toast.warning(`Stock máximo: ${i.stockDisponible}`);
          return { ...i, cantidad };
        }
        return i;
      })
    );
  }

  function handleClearCarrito() {
    if (carrito.length === 0) return;
    setCarrito([]);
  }

  const total = carrito.reduce((sum, i) => sum + i.cantidad * i.precioCompra, 0);

 async function handleRegistrarOrdenCompra() {
  if (carrito.length === 0) {
    toast.error("El carrito está vacío");
    return;
  }

  if (!selectedProveedorId) {
    toast.error("Seleccione un proveedor");
    return;
  }

  setSaving(true);

  try {
    const payload: OrdenCompraCreateInput = {
      proveedor_id: selectedProveedorId,
      detalles: carrito.map((i) => ({
        producto_id: i.productoId,
        cantidad: i.cantidad,
        precio_unitario: i.precioCompra, // precio de compra
      })),
    };

    await createOrdenCompra(payload);

    toast.success("¡Orden de compra registrada exitosamente!");

    // Reset
    setCarrito([]);
    setSelectedProveedorId(null);
    await fetchProductos(); // refrescar stock si tu backend lo actualiza
  } catch (err: any) {
    const message =
      err?.body?.message || err?.message || "Error al registrar la orden de compra";

    toast.error(message);
  } finally {
    setSaving(false);
  }
}


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
>>>>>>> Stashed changes
      </div>
    );
  }

  return (
<<<<<<< Updated upstream
    <div className="space-y-6 px-4 lg:px-6 pt-1 md:pt-2 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las órdenes de compra a proveedores con información fiscal
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/compras/nueva-fiscal")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden de Compra
        </Button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Filtro de Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="recibida">Recibidas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Tipo Comprobante */}
          <div className="space-y-2">
            <Label>Tipo Comprobante</Label>
            <Select value={tipoComprobanteFilter} onValueChange={setTipoComprobanteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="FACTURA">Factura</SelectItem>
                <SelectItem value="BOLETA">Boleta</SelectItem>
                <SelectItem value="GUIA">Guía</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Proveedor */}
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <ProviderSelector
              value={proveedorFilter?.id}
              onValueChange={setProveedorFilter}
            />
          </div>

          {/* Filtro de Fecha Inicio */}
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha Desde</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          {/* Filtro de Fecha Fin */}
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha Hasta</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(estadoFilter !== "todas" || tipoComprobanteFilter !== "todos" || proveedorFilter || fechaInicio || fechaFin) && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEstadoFilter("todas");
                setTipoComprobanteFilter("todos");
                setProveedorFilter(null);
                setFechaInicio("");
                setFechaFin("");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Tabla de Órdenes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrdenes.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay órdenes de compra</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {estadoFilter !== "todas" || proveedorFilter || fechaInicio || fechaFin
              ? "No se encontraron órdenes con los filtros aplicados"
              : "Crea tu primera orden de compra para comenzar"}
          </p>
          <Button onClick={() => navigate("/dashboard/compras/nueva-fiscal")}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primera Orden
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-left p-3 font-medium text-sm">Orden #</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Proveedor</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Tipo</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Comprobante</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Fecha</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Estado</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Subtotal</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">IGV</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Total</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdenes.map((orden) => (
                <TableRow key={orden.id} className="border-t hover:bg-muted/50">
                  <TableCell className="p-3">
                    <div className="font-bold">OC-{String(orden.id).padStart(5, "0")}</div>
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="font-medium">
                      {orden.proveedor?.nombre || "Sin proveedor"}
                    </div>
                    {orden.proveedor?.ruc_identidad && (
                      <div className="text-xs text-muted-foreground">
                        RUC: {orden.proveedor.ruc_identidad}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-3">{getTipoComprobanteBadge(orden.tipo_comprobante)}</TableCell>
                  <TableCell className="p-3 text-sm">
                    {orden.serie && orden.numero ? (
                      <span className="font-mono">{orden.serie}-{orden.numero}</span>
                    ) : (
                      <span className="text-muted-foreground">Sin comprobante</span>
                    )}
                  </TableCell>
                  <TableCell className="p-3 text-sm">{formatDate(orden.fecha_creacion)}</TableCell>
                  <TableCell className="p-3">{getEstadoBadge(orden.estado)}</TableCell>
                  <TableCell className="p-3 text-left font-medium tabular-nums text-sm">
                    {formatCurrency(Number(orden.subtotal_base) || 0)}
                  </TableCell>
                  <TableCell className="p-3 text-left font-medium tabular-nums text-sm text-orange-600">
                    {formatCurrency(Number(orden.impuesto_igv) || 0)}
                  </TableCell>
                  <TableCell className="p-3 text-left font-semibold tabular-nums">
                    {formatCurrency(Number(orden.total) || 0)}
                  </TableCell>
                  <TableCell className="p-3 text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerDetalle(orden.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t bg-muted/50 p-3 text-sm text-muted-foreground">
            <strong>{filteredOrdenes.length}</strong> {filteredOrdenes.length === 1 ? "orden" : "órdenes"}
          </div>
        </div>
      )}

      {/* Sheet de Detalle */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {loadingDetalle || !ordenDetalle ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  Orden de Compra #{String(ordenDetalle.id).padStart(5, "0")}
                </SheetTitle>
                <SheetDescription>
                  Detalles completos de la orden de compra
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Sección A: Cabecera - Info del Proveedor y Estado */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Estado</h3>
                    <div className="scale-110">{getEstadoBadge(ordenDetalle.estado)}</div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Información del Proveedor</h3>
                    {ordenDetalle.proveedor ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium">{ordenDetalle.proveedor.nombre}</span>
                        </div>
                        {ordenDetalle.proveedor.ruc_identidad && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RUC:</span>
                            <span>{ordenDetalle.proveedor.ruc_identidad}</span>
                          </div>
                        )}
                        {/* @ts-ignore */}
                        {ordenDetalle.proveedor.telefono && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Teléfono:</span>
                            {/* @ts-ignore */}
                            <span>{ordenDetalle.proveedor.telefono}</span>
                          </div>
                        )}
                        {/* @ts-ignore */}
                        {ordenDetalle.proveedor.email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            {/* @ts-ignore */}
                            <span>{ordenDetalle.proveedor.email}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin proveedor asignado</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1">Fecha de Emisión</span>
                      <span className="font-medium">{formatDate(ordenDetalle.fecha_creacion)}</span>
                    </div>
                    {ordenDetalle.fecha_recepcion && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Fecha de Recepción</span>
                        <span className="font-medium text-green-600">
                          {formatDateTime(ordenDetalle.fecha_recepcion)}
                        </span>
                      </div>
                    )}
                  </div>

                  {ordenDetalle.usuario && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Creado por: </span>
                      <span className="font-medium">
                        {ordenDetalle.usuario.nombre || ordenDetalle.usuario.email}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Sección de Información Fiscal */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Fiscal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground block mb-1">Tipo de Comprobante</span>
                      {getTipoComprobanteBadge(ordenDetalle.tipo_comprobante)}
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Número de Comprobante</span>
                      <span className="font-mono font-medium">
                        {ordenDetalle.serie && ordenDetalle.numero ? (
                          `${ordenDetalle.serie}-${ordenDetalle.numero}`
                        ) : (
                          <span className="text-muted-foreground">Sin comprobante</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Subtotal Base</span>
                      <span className="font-medium">
                        {formatCurrency(Number(ordenDetalle.subtotal_base) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">IGV (18%)</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(Number(ordenDetalle.impuesto_igv) || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sección B: Lista de Productos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Productos Ordenados</h3>
                  {/* @ts-ignore */}
                  {ordenDetalle.detalles && ordenDetalle.detalles.length > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border overflow-hidden">
                        <Table className="text-sm">
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead className="text-left p-2 font-medium">Producto</TableHead>
                              <TableHead className="text-left p-2 font-medium">SKU</TableHead>
                              <TableHead className="text-left p-2 font-medium">Cantidad</TableHead>
                              <TableHead className="text-left p-2 font-medium">Costo Unit.</TableHead>
                              <TableHead className="text-left p-2 font-medium">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ordenDetalle.detalles.map((detalle: any) => (
                              <TableRow key={detalle.id} className="border-t">
                                <TableCell className="p-2">
                                  <div className="font-medium">{detalle.producto_nombre || "—"}</div>
                                  {ordenDetalle.estado === "pendiente" && (
                                    <div className="text-xs text-muted-foreground">
                                      Stock actual: {Number(detalle.stock_actual || 0).toFixed(3)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="p-2 text-muted-foreground">
                                  {detalle.producto_sku || "—"}
                                </TableCell>
                                <TableCell className="p-2 text-left tabular-nums">
                                  {Number(detalle.cantidad).toFixed(3).replace(/\.?0+$/, "")}
                                </TableCell>
                                <TableCell className="p-2 text-left tabular-nums">
                                  {formatCurrency(Number(detalle.costo_unitario) || 0)}
                                </TableCell>
                                <TableCell className="p-2 text-left font-medium tabular-nums">
                                  {formatCurrency(Number(detalle.subtotal) || 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Total General */}
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-semibold text-lg">TOTAL</span>
                        <span className="font-bold text-2xl">
                          {formatCurrency(Number(ordenDetalle.total) || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay productos en esta orden</p>
                  )}
                </div>

                <Separator />

                {/* Sección C: Acciones según Estado */}
                <div className="space-y-4">
                  {ordenDetalle.estado === "pendiente" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Esta orden está <strong>PENDIENTE</strong>. El stock se actualizará cuando
                        recibas la mercadería.
                      </AlertDescription>
                    </Alert>
                  )}

                  {ordenDetalle.estado === "recibida" && ordenDetalle.fecha_recepcion && (
                    <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Recibido el:</strong> {formatDateTime(ordenDetalle.fecha_recepcion)}
                        <br />
                        El stock de los productos ya fue actualizado.
                      </AlertDescription>
                    </Alert>
                  )}

                  {ordenDetalle.estado === "cancelada" && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Esta orden fue <strong>CANCELADA</strong>. No se realizó ningún movimiento de
                        stock.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex gap-3">
                    {ordenDetalle.estado === "pendiente" && (
                      <>
                        <Button
                          className="flex-1"
                          size="lg"
                          onClick={() => setReceiveModalOpen(true)}
                          disabled={cancelandoOrden}
                        >
                          <Receipt className="mr-2 h-5 w-5" />
                          Recibir Mercadería
                        </Button>
                        <Button
                          variant="destructive"
                          size="lg"
                          onClick={() => setConfirmCancelarOpen(true)}
                          disabled={cancelandoOrden}
                        >
                          <XCircle className="mr-2 h-5 w-5" />
                          Cancelar Orden
                        </Button>
                      </>
                    )}

                    {ordenDetalle.estado === "recibida" && (
                      <Button variant="outline" size="lg" className="w-full" disabled>
                        <FileText className="mr-2 h-5 w-5" />
                        Imprimir Comprobante (Próximamente)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ReceiveOrderModal - Recibir Mercadería */}
      <ReceiveOrderModal
        orden={ordenDetalle || null}
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onSuccess={handleReceiveSuccess}
      />

      {/* AlertDialog - Confirmar Cancelación */}
      <AlertDialog open={confirmCancelarOpen} onOpenChange={setConfirmCancelarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              La orden quedará marcada como <strong>CANCELADA</strong> y no se podrá recibir
              mercadería.
              <br />
              <br />
              No se realizará ningún movimiento de stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelandoOrden}>No, volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelarOrden}
              disabled={cancelandoOrden}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelandoOrden ? "Cancelando..." : "Sí, Cancelar Orden"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ComprasPage;
=======
    <div className="pos-page px-4 lg:px-6 -my-3 md:-my-3 h-[calc(100svh-var(--header-height))] md:h-[calc(100svh-var(--header-height)-1rem)] overflow-hidden">
      <div className="grid h-full min-h-0 overflow-hidden gap-0" style={{ gridTemplateColumns: "minmax(0,1fr) 420px" }}>
        {/* IZQUIERDA: controles fijos y productos con scroll interno */}
        <div className="min-w-0 min-h-0 pr-4 h-full flex flex-col">
          {/* Controles superiores (fila 1: título-búsqueda-botón, fila 2: categorías) */}
          <div className="bg-background border-b py-3">
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-3">
              <h2 className="text-lg font-semibold">Registro de compras</h2>
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos por nombre o SKU"
                  className="pl-8"
                />
              </div>
              <CreateProductDialog onCreated={() => void fetchProductos()}>
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
                        <div className="text-xs text-muted-foreground">P. Compra</div>
                        
                        <div className="text-lg font-semibold tabular-nums">{formatCurrency(p.costo_compra)}</div>
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
                <FileInput className="size-5" /> Orden de Compra
               
              </div>
              <span className="text-sm text-muted-foreground">({carrito.length})</span>
            </div>

            {/* Selector de Cliente */}
            <div className="py-3">
              <label className="text-sm font-medium mb-2 block">Proveedor</label>
              <ProveedorSelector
                value={selectedProveedorId}
                onChange={(clienteId) => {
                  setSelectedProveedorId(clienteId);
                }}
                disabled={saving}
              />
            </div>

            {/* Lista del carrito scroleable */}
            <ScrollArea className="flex-1">
              {carrito.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileInput className="size-12 mx-auto mb-2 opacity-50" />
                  <p>La orden está vacío</p>
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
                              <span className="font-medium tabular-nums">{formatCurrency(item.precioCompra)}</span>
                            </div>
                            <div />

                            {/* Fila 3: Cantidad (solo control), subtotal queda a la derecha */}
                            <div className="flex items-center justify-start gap-2 text-xs min-w-0">
                              <div className="relative shrink-0 w-[88px]">
                                <Input
                                  type="number"
                                  min={1}
                                  max={item.stockDisponible}
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
                            </div>

                            {/* Total en esquina inferior derecha, más grande y en negrita */}
                            <div className="text-right font-semibold text-lg tabular-nums">
                              {formatCurrency(item.cantidad * item.precioCompra)}
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
                  <div className="text-sm text-muted-foreground">Total de la compra</div>
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
                        <div className="text-xs text-muted-foreground">tipo de pago</div>
                        
                      </div>
                      
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">Pago exacto</div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    className="w-full h-11 font-semibold"
                    size="lg"
                    onClick={handleRegistrarOrdenCompra}
                    disabled={
                      carrito.length === 0 ||
                      saving 
                    }
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Registrando
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" /> Guardar
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
                        <AlertDialogTitle>Limpiar orden</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminarán todos los productos de la orden. Esta acción no se puede deshacer.
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
  );
}
>>>>>>> Stashed changes
