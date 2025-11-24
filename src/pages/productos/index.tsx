// Página de gestión de productos con CRUD completo (Optimizada V3)
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, PlusCircle, MoreHorizontal, Pencil, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnDef } from "@tanstack/react-table";
import { EntityDataTable } from "@/components/entity-data-table";
import type { Producto } from "@/services/productos";
import {
  deactivateProducto,
  listProductos,
} from "@/services/productos";
import CreateProductDialog from "@/components/CreateProductDialog";
import EditProductDialog from "@/components/EditProductDialog";

// Utilidad local para mostrar moneda
function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

const ProductosPage = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  
  // Estados de paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState("");
  // Estado intermedio para el valor "confirmado" después de los 300ms
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Control de modales
  const [editOpen, setEditOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [confirmProducto, setConfirmProducto] = useState<Producto | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProductos = useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await listProductos({ page, limit, q: search || undefined });
      setProductos(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
      setCurrentPage(response.meta.page);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "No se pudieron cargar los productos";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 1. EFECTO DE DEBOUNCE (Solo afecta al escribir) ---
  useEffect(() => {
    // Si el texto cambia, esperamos 300ms antes de actualizar la variable "real"
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 2. EFECTO DE CARGA (Reacciona INMEDIATAMENTE a cambios reales) ---
  useEffect(() => {
    // Si cambias de página -> Carga YA.
    // Si cambias el límite -> Carga YA.
    // Si el debounce terminó -> Carga YA.
    // Si entras por primera vez -> Carga YA.
    void fetchProductos(currentPage, pageSize, debouncedSearch);
  }, [fetchProductos, currentPage, pageSize, debouncedSearch]);


  async function handleDeactivate(producto: Producto) {
    setDeactivatingId(producto.id);
    try {
      await deactivateProducto(producto.id);
      setProductos((prev) => prev.filter((item) => item.id !== producto.id));
      setTotalItems((prev) => prev - 1);
      toast.success("Producto desactivado");
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "No se pudo desactivar";
      toast.error(message);
    } finally {
      setDeactivatingId(null);
    }
  }

  const columns = useMemo<ColumnDef<Producto>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "imagen_url",
        header: "Imagen",
        cell: ({ row }) => {
          const url = row.original.imagen_url || "/assets/imgProductos/image.png";
          return url ? (<img src={url} alt={row.original.nombre} className="h-20 w-20 rounded-md object-cover" />) : ( <div className="h-8 w-8 rounded-md bg-muted" /> );
        }
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.sku || "—"}</span>
        ),
      },
      {
        id: "categoria",
        header: "Categoría",
        cell: ({ row }) => row.original.categoria?.nombre || "—",
        enableSorting: false,
        filterFn: (row, _id, val?: number | "none" | "all") => {
          if (!val || val === "all") return true;
          if (val === "none") return row.original.categoria_id == null;
          return Number(row.original.categoria_id) === Number(val);
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <div className="flex items-center">
            <span className="tabular-nums inline-block w-[6ch] text-left">{row.original.stock}</span>
          </div>
        ),
        filterFn: (row, _id, value?: "in_stock" | "out_of_stock" | "low_stock" | "all") => {
          if (!value || value === "all") return true;
          const stock = Number(row.original.stock) || 0;
          const min = Number(row.original.stock_minimo ?? 0);
          if (value === "in_stock") return stock > 0;
          if (value === "out_of_stock") return stock === 0;
          if (value === "low_stock") return min > 0 && stock <= min;
          return true;
        },
      },
      {
        accessorKey: "costo_compra",
        header: "P. Compra",
        cell: ({ row }) => formatCurrency(row.original.costo_compra),
      },
      {
        accessorKey: "precio_venta",
        header: "P. Venta",
        cell: ({ row }) => formatCurrency(row.original.precio_venta),
        filterFn: (row, _id, range?: { min?: number; max?: number }) => {
          if (!range || (range.min == null && range.max == null)) return true;
          const n = Number(row.original.precio_venta);
          if (Number.isNaN(n)) return false;
          if (range.min != null && n < range.min) return false;
          if (range.max != null && n > range.max) return false;
          return true;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditingProducto(row.original);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                {user?.rol === "admin" && (
                  <DropdownMenuItem
                    onSelect={() => {
                      navigate(`/dashboard/inventario?productoId=${row.original.id}`);
                    }}
                  >
                    <Settings className="mr-2 size-4" /> Ajustar stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={deactivatingId === row.original.id}
                  onSelect={() => {
                    if (deactivatingId === row.original.id) return;
                    setConfirmProducto(row.original);
                    setDeactivateOpen(true);
                  }}
                >
                  {deactivatingId === row.original.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Desactivando
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="size-4" /> Desactivar
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deactivatingId, user?.rol, navigate]
  );

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Productos</h1>
        <div className="flex items-center gap-2">
          <CreateProductDialog
            onCreated={(created) => {
              setProductos((prev) => [created, ...prev]);
              void fetchProductos(currentPage, pageSize, debouncedSearch);
            }}
          />
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o descripción..."
          value={searchTerm}
          onChange={(e) => {
              setSearchTerm(e.target.value);
              // Opcional: Si borra todo, reseteamos a pág 1
              if (e.target.value === "") setCurrentPage(1);
          }}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="text-sm text-muted-foreground">
          {totalItems} productos encontrados
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error}
        </div>
      )}

      {/* Lógica de Renderizado Estable (Igual que Inventario) */}
      {loading && productos.length === 0 ? (
        // CASO 1: Carga inicial absoluta
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : productos.length === 0 && !error ? (
        // CASO 2: Vacío real
        <div className="text-sm text-muted-foreground">No hay productos activos.</div>
      ) : (
        // CASO 3: Tabla siempre visible + Indicador de carga sutil
        <div className="relative">
            {loading && (
                <div className="absolute top-2 right-2 z-10">
                    <Loader2 className="size-4 animate-spin text-primary" />
                </div>
            )}
            
            {/* Mantenemos la tabla visible, solo bloqueamos clics si carga */}
            <div className={loading ? "pointer-events-none opacity-80 transition-opacity" : "transition-opacity"}>
                <EntityDataTable
                    columns={columns}
                    data={productos}
                    manualPagination={true}
                    toolbarRender={(table) => {
                        // ... (Tu código de toolbar se mantiene igual) ...
                        const categoryMap = new Map<number, string>();
                        for (const p of productos) {
                            if (p.categoria_id != null) {
                            categoryMap.set(Number(p.categoria_id), String(p.categoria?.nombre ?? `#${p.categoria_id}`));
                            }
                        }
                        const categoryOptions = Array.from(categoryMap.entries());
                        const priceRanges = [
                            { label: "Cualquiera", value: undefined },
                            { label: "< 50", value: { max: 50 } },
                            { label: "50–100", value: { min: 50, max: 100 } },
                            { label: "100–200", value: { min: 100, max: 200 } },
                            { label: "> 200", value: { min: 200 } },
                        ];
                        const currentPrice = table.getColumn("precio_venta")?.getFilterValue() as any;
                        const priceLabel = priceRanges.find((r) => JSON.stringify(r.value) === JSON.stringify(currentPrice))?.label ?? "Cualquiera";

                        return (
                            <div className="flex items-center gap-2">
                            {/* Estado */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                {(() => {
                                    const val = (table.getColumn("stock")?.getFilterValue() as string) || "all";
                                    const label =
                                    val === "in_stock"
                                        ? "Con stock"
                                        : val === "out_of_stock"
                                        ? "Sin stock"
                                        : val === "low_stock"
                                        ? "Bajo stock"
                                        : "Todos";
                                    return (
                                    <Button variant="outline" className="h-9">
                                        <PlusCircle className="mr-2 size-4" /> Estado: {label}
                                    </Button>
                                    );
                                })()}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("all")}>Todos</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("in_stock")}>Con stock</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("out_of_stock")}>Sin stock</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("low_stock")}>Bajo stock</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Select
                                value={(table.getColumn("categoria")?.getFilterValue() as any) ?? undefined}
                                onValueChange={(v) => table.getColumn("categoria")?.setFilterValue(v === "all" ? "all" : v)}
                            >
                                <SelectTrigger size="default" className="h-9 w-44">
                                <PlusCircle className="mr-2 size-4" />
                                <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="none">Sin categoría</SelectItem>
                                {categoryOptions.map(([id, name]) => (
                                    <SelectItem key={id} value={String(id)}>
                                    {name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>

                            {/* Precio */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-9">
                                    <span className="text-muted-foreground">Precio:</span>
                                    <span className="ml-1">{priceLabel}</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                {priceRanges.map((r) => (
                                    <DropdownMenuItem key={r.label} onClick={() => table.getColumn("precio_venta")?.setFilterValue(r.value)}>
                                    {r.label}
                                    </DropdownMenuItem>
                                ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                        );
                    }}
                />

                {/* Controles de paginación SIEMPRE VISIBLES */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                        >
                        Anterior
                        </Button>
                        <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                        </div>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                        >
                        Siguiente
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filas por página:</span>
                        <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                            setPageSize(Number(v));
                            setCurrentPage(1);
                        }}
                        >
                        <SelectTrigger className="h-8 w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* Modales ... (El resto del código se mantiene igual) */}
      {editingProducto && (
        <EditProductDialog
          producto={editingProducto}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingProducto(null);
          }}
          onUpdated={(updated) =>
            setProductos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open);
          if (!open) setConfirmProducto(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar producto</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmProducto
                ? `¿Desactivar el producto "${confirmProducto.nombre}"? Ya no aparecerá en los listados.`
                : "¿Desactivar el producto seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmProducto) {
                  handleDeactivate(confirmProducto);
                  setDeactivateOpen(false);
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductosPage;