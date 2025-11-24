// Página de gestión de ajustes de inventario
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Package, Plus, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { EntityDataTable } from "@/components/entity-data-table";
import type { AjusteCreateInput, Ajuste } from "@/services/inventario";
import { createAjuste, listAjustes } from "@/services/inventario";
import type { Producto } from "@/services/productos";
import { ProductSearchSelector } from "@/components/ProductSearchSelector";

type AjusteFormState = {
	producto_id: string;
	tipo: "entrada" | "salida" | "";
	cantidad: string;
	motivo: string;
};

const initialFormState: AjusteFormState = {
	producto_id: "",
	tipo: "",
	cantidad: "",
	motivo: "",
};

const InventarioPage = () => {
  const [searchParams] = useSearchParams();
  const [productos] = useState<Producto[]>([]); // Solo para referencia de filtro, ProductSearchSelector hace su propia búsqueda
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [loadingAjustes, setLoadingAjustes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AjusteFormState>(initialFormState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProductoInfo, setSelectedProductoInfo] = useState<Producto | null>(null);
  const cantidadRef = useRef<HTMLInputElement | null>(null);
  
  // Estados de paginación server-side para ajustes
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  
  // Estados de filtros server-side
  const [tipoFilter, setTipoFilter] = useState<"entrada" | "salida" | "all">("all");
  const [productoIdFilter, setProductoIdFilter] = useState<number | null>(null);

	// Cargar ajustes con filtros server-side
	const fetchAjustes = useCallback(async (
		page: number, 
		limit: number, 
		search: string,
		tipo?: "entrada" | "salida",
		productoId?: number
	) => {
		setLoadingAjustes(true);
		try {
			const response = await listAjustes({ 
				page, 
				limit, 
				q: search || undefined,
				tipo: tipo || undefined,
				producto_id: productoId || undefined
			});
			
			setAjustes(response.data);
			setTotalPages(response.meta.totalPages);
			setTotalItems(response.meta.total);
			setCurrentPage(response.meta.page);
			
			console.log('📊 Total ajustes en esta página:', response.data.length);
			console.log('📊 Total de registros:', response.meta.total);
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudieron cargar los ajustes";
			toast.error(message);
			console.error('❌ Error cargando ajustes:', err);
		} finally {
			setLoadingAjustes(false);
		}
	}, []);

	// Ref para controlar si es el primer renderizado absoluto
    const isFirstRender = useRef(true);
	// 1. Efecto para CARGA INICIAL (Se ejecuta 1 sola vez, Inmediato)
    useEffect(() => {
        // Hacemos la carga inicial sin esperas
        void fetchAjustes(
            1, 
            pageSize, 
            "", 
            tipoFilter === "all" ? undefined : tipoFilter,
            productoIdFilter || undefined
        );
    }, []); // Array vacío: Solo al montar
	
	// 2. Efecto para CAMBIOS (Se ejecuta cuando cambian los filtros, con Debounce)
    useEffect(() => {
        // SI ES LA PRIMERA VEZ: NO HACER NADA.
        // Esto evita el parpadeo porque no dispara la segunda petición.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            void fetchAjustes(
                currentPage, 
                pageSize, 
                searchTerm,
                tipoFilter === "all" ? undefined : tipoFilter,
                productoIdFilter || undefined
            );
        }, 300);
        
        return () => clearTimeout(timer);
    }, [fetchAjustes, currentPage, pageSize, searchTerm, tipoFilter, productoIdFilter]);

	// Si viene productoId en el query, preseleccionarlo cuando los productos estén cargados
	useEffect(() => {
		const pid = searchParams.get("productoId");
		if (!pid) return;
		if (productos.length === 0) return;
		
		const productoId = pid;
		const exists = productos.find(p => String(p.id) === productoId);
		
		if (exists) {
			setForm(prev => ({ ...prev, producto_id: productoId }));
			setSelectedProductoInfo(exists);
			setDialogOpen(true); // Abrir el modal automáticamente
		}
	}, [searchParams, productos]);

	function resetForm() {
		setForm(initialFormState);
	}

	function buildPayload(): AjusteCreateInput {
		const productoId = Number.parseInt(form.producto_id, 10);
		if (Number.isNaN(productoId)) {
			throw new Error("Debe seleccionar un producto");
		}

		if (!form.tipo) {
			throw new Error("Debe seleccionar el tipo de ajuste");
		}

		const cantidad = Number.parseInt(form.cantidad, 10);
		if (Number.isNaN(cantidad) || cantidad <= 0) {
			throw new Error("La cantidad debe ser un número mayor a 0");
		}

		const motivo = form.motivo.trim();
		if (!motivo) {
			throw new Error("El motivo es obligatorio");
		}

		return {
			producto_id: productoId,
			tipo: form.tipo,
			cantidad,
			motivo,
		};
	}

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
	event.preventDefault();
	setSaving(true);
	try {
		const payload = buildPayload();
		console.log('📝 Registrando ajuste:', payload);
		const ajusteCreado = await createAjuste(payload);
		console.log('✅ Ajuste creado:', ajusteCreado);

		// Determinar si el submit fue "Registrar y continuar"
		const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
		const keepOpen = submitter?.dataset?.action === "continue";

		toast.success(`Ajuste de ${payload.tipo} registrado correctamente`);

		if (keepOpen) {
			// Actualizar stock optimísticamente en el display
			if (selectedProductoInfo) {
				const ajuste = payload.tipo === "entrada" ? payload.cantidad : -payload.cantidad;
				setSelectedProductoInfo(prev => prev ? {...prev, stock: prev.stock + ajuste} : null);
			}
			
			// Mantener producto, tipo y motivo; limpiar solo cantidad
			setForm(prev => ({ ...prev, cantidad: "" }));
			
			// Foco rápido en cantidad para el siguiente ajuste
			setTimeout(() => cantidadRef.current?.focus(), 0);
		} else {
			resetForm();
			setDialogOpen(false);
		}
		
		// Recargar el historial de ajustes con filtros actuales
		console.log('🔄 Recargando historial de ajustes...');
		await fetchAjustes(
			currentPage, 
			pageSize, 
			searchTerm,
			tipoFilter === "all" ? undefined : tipoFilter,
			productoIdFilter || undefined
		);
	} catch (err: any) {
		const message = err?.message || err?.body?.message || "Error al registrar el ajuste";
		toast.error(message);
		console.error('❌ Error al registrar ajuste:', err);
	} finally {
		setSaving(false);
	}
}

	const selectedProducto = productos.find(p => p.id === Number(form.producto_id));

	const columns = useMemo<ColumnDef<Ajuste>[]>(() => [
    {
      id: "fecha",
      header: "Fecha",
      accessorFn: (row) => row.created_at, // ✅ Campo real del backend
      cell: ({ getValue }) => {
        const fechaStr = getValue<string>();
        if (!fechaStr) return "—";
        return (
          <span className="text-sm tabular-nums">
            {new Date(fechaStr).toLocaleString("es-PE", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      id: "producto",
      header: "Producto",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.producto?.nombre || "Producto desconocido"}</div>
          {row.original.producto?.sku && (
            <div className="text-xs text-muted-foreground">SKU: {row.original.producto.sku}</div>
          )}
        </div>
      ),
      accessorFn: (row) => row.producto?.nombre ?? "Producto desconocido",
      enableSorting: true,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={row.original.tipo === "entrada" ? "default" : "destructive"}>
          {row.original.tipo === "entrada" ? "Entrada" : "Salida"}
        </Badge>
      ),
      enableSorting: false,
      filterFn: (row, _id, value?: "entrada" | "salida") => {
        if (!value) return true;
        return row.original.tipo === value;
      },
    },
    {
      accessorKey: "cantidad",
      header: () => <div className="w-full text-right">Cantidad</div>,
      cell: ({ row }) => (
        <div className="w-full text-right font-medium tabular-nums">{row.original.tipo === "entrada" ? "+" : "-"}{row.original.cantidad}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => <span className="text-sm text-muted-foreground max-w-xs truncate block">{row.original.motivo || "—"}</span>,
      enableSorting: false,
    },
    {
      id: "usuario",
      header: "Usuario",
      accessorFn: (row) => row.usuario?.nombre ?? row.usuario?.email ?? "Usuario desconocido",
      cell: ({ row }) => <span className="text-sm">{row.original.usuario?.nombre || row.original.usuario?.email || "Usuario desconocido"}</span>,
      enableSorting: true,
    },
    {
      id: "producto_id",
      header: "",
      accessorFn: (row) => row.producto_id,
      cell: () => null,
      enableHiding: false,
    },
  ], []);

	return (
        <div className="space-y-6 p-4 lg:p-6">
            {/* Header + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="size-5" />
                    <h2 className="text-lg font-semibold">Ajustes de Inventario</h2>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" /> Registrar Ajuste
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Registrar Ajuste</DialogTitle>
                            <DialogDescription>
                                Actualiza el stock de un producto. Los cambios se reflejan inmediatamente.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid gap-4">
                                {/* Selector de Producto */}
                                <div className="grid gap-2">
                                    <Label htmlFor="producto_id">Producto</Label>
                                    <ProductSearchSelector
                                        selected={selectedProducto ?? selectedProductoInfo}
                                        items={productos}
                                        onSelect={(p) => {
                                            setForm(prev => ({ ...prev, producto_id: String(p.id) }));
                                            setSelectedProductoInfo(p);
                                            setTimeout(() => cantidadRef.current?.focus(), 0);
                                        }}
                                        placeholder="Buscar por nombre, SKU o escanear código..."
                                        disabled={saving}
                                    />
                                    {(selectedProducto ?? selectedProductoInfo) && (
                                        <p className="text-sm text-muted-foreground">
                                            Stock actual: <span className="font-semibold">{(selectedProducto ?? selectedProductoInfo)!.stock}</span> unidades
                                        </p>
                                    )}
                                </div>

                                {/* Selector de Tipo */}
                                <div className="grid gap-2">
                                    <Label htmlFor="tipo">Tipo de Ajuste</Label>
                                    <Select
                                        value={form.tipo}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, tipo: value as "entrada" | "salida" }))}
                                    >
                                        <SelectTrigger id="tipo" className="w-full">
                                            <SelectValue placeholder="Seleccione el tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entrada">Entrada (Sumar)</SelectItem>
                                            <SelectItem value="salida">Salida (Restar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Campo de Cantidad */}
                                <div className="grid gap-2">
                                    <Label htmlFor="cantidad">Cantidad</Label>
                                    <Input
                                        id="cantidad"
                                        type="number"
                                        min="1"
                                        value={form.cantidad}
                                        onChange={(event) => setForm(prev => ({ ...prev, cantidad: event.target.value }))}
                                        ref={cantidadRef}
                                        placeholder="Ej: 10"
                                    />
                                </div>

                                {/* Campo de Motivo */}
                                <div className="grid gap-2">
                                    <Label htmlFor="motivo">Motivo del Ajuste</Label>
                                    <Input
                                        id="motivo"
                                        value={form.motivo}
                                        onChange={(event) => setForm(prev => ({ ...prev, motivo: event.target.value }))}
                                        placeholder="Ej: Producto dañado, Corrección de inventario físico"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-2 flex-wrap">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" disabled={saving}>
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Registrando...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 size-4" />
                                            Registrar Ajuste
                                        </>
                                    )}
                                </Button>
                                <Button type="submit" data-action="continue" variant="secondary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 size-4" />
                                            Registrar y continuar
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Buscar por producto, motivo o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="text-sm text-muted-foreground">
                    {totalItems} ajustes encontrados
                </div>
            </div>

            {/* Lógica de Renderizado Estable (Sin Parpadeos) */}
            
            {/* CASO 1: Carga Inicial Absoluta (Solo si no hay datos previos) */}
            {loadingAjustes && ajustes.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : ajustes.length === 0 ? (
                /* CASO 2: Estado Vacío Real (Cargó y no había nada) */
                <div className="text-center py-8 text-sm text-muted-foreground">
                    No hay ajustes registrados aún.
                </div>
            ) : (
                /* CASO 3: Visualización de Datos (Siempre visible si existen datos) */
                <div className="relative">
                    {/* Indicador sutil de carga en segundo plano */}
                    {loadingAjustes && (
                        <div className="absolute top-2 right-2 z-10">
                            <Loader2 className="size-4 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {/* Contenedor de Tabla + Paginación */}
                    {/* Usamos pointer-events-none para bloquear clics mientras carga, pero sin borrar nada */}
                    <div className={loadingAjustes ? "pointer-events-none opacity-80 transition-opacity" : "transition-opacity"}>
                        
                        {/* TABLA */}
                        <EntityDataTable<Ajuste>
                            columns={columns}
                            data={ajustes}
                            manualPagination={true}
                            toolbarRender={() => (
                                <div className="flex items-center gap-2">
                                    {/* Filtro por tipo */}
                                    <Select
                                        value={tipoFilter}
                                        onValueChange={(value: "entrada" | "salida" | "all") => {
                                            setTipoFilter(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 w-40">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="entrada">Entrada</SelectItem>
                                            <SelectItem value="salida">Salida</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Filtro por producto */}
                                    <div className="flex items-center gap-2">
                                        <ProductSearchSelector
                                            selected={productos.find(p => p.id === productoIdFilter) || null}
                                            placeholder="Filtrar por producto..."
                                            onSelect={(p) => {
                                                setProductoIdFilter(p.id);
                                                setCurrentPage(1);
                                            }}
                                            items={productos}
                                        />
                                        {productoIdFilter && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setProductoIdFilter(null);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                Limpiar
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void fetchAjustes(
                                            currentPage, 
                                            pageSize, 
                                            searchTerm,
                                            tipoFilter === "all" ? undefined : tipoFilter,
                                            productoIdFilter || undefined
                                        )}
                                        disabled={loadingAjustes}
                                    >
                                        <RefreshCcw className={`mr-2 size-4 ${loadingAjustes ? "animate-spin" : ""}`} />
                                        Actualizar
                                    </Button>
                                </div>
                            )}
                        />

                        {/* --- AQUÍ ESTÁ LA PAGINACIÓN RESTAURADA --- */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || loadingAjustes}
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
                                    disabled={currentPage === totalPages || loadingAjustes}
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
                        {/* --- FIN PAGINACIÓN --- */}

                    </div>
                </div>
            )}
        </div>
    );
};

export default InventarioPage;