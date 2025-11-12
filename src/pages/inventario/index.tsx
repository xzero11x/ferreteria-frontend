// Página de gestión de ajustes de inventario
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Package, Plus, RefreshCcw, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
import { listProductos } from "@/services/productos";
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
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAjustes, setLoadingAjustes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AjusteFormState>(initialFormState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProductoInfo, setSelectedProductoInfo] = useState<Producto | null>(null);
  const [toolbarSelectedProduct, setToolbarSelectedProduct] = useState<Producto | null>(null);
  const cantidadRef = useRef<HTMLInputElement | null>(null);

	const fetchProductos = useCallback(async () => {
		setLoading(true);
		try {
			const data = await listProductos();
			setProductos(data.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudieron cargar los productos";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchAjustes = useCallback(async () => {
		setLoadingAjustes(true);
		try {
			const data = await listAjustes();
			// Ordenar por fecha descendente (más recientes primero)
			setAjustes(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudieron cargar los ajustes";
			toast.error(message);
		} finally {
			setLoadingAjustes(false);
		}
	}, []);

	useEffect(() => {
		void fetchProductos();
		void fetchAjustes();
	}, [fetchProductos, fetchAjustes]);

	// Si viene productoId en el query, preseleccionarlo cuando los productos estén cargados
	useEffect(() => {
		const pid = searchParams.get("productoId");
		if (!pid) return;
		if (productos.length === 0) return;
		setForm(prev => {
			if (prev.producto_id) return prev; // no sobrescribir si ya hay selección
			const exists = productos.some(p => String(p.id) === pid);
			return exists ? { ...prev, producto_id: pid } : prev;
		});
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
		await createAjuste(payload);
			
			// Actualizar el stock del producto en la lista local
			const producto = productos.find(p => p.id === payload.producto_id);
			if (producto) {
				const ajuste = payload.tipo === "entrada" ? payload.cantidad : -payload.cantidad;
				setProductos(prev => 
					prev.map(p => 
						p.id === payload.producto_id 
							? { ...p, stock: p.stock + ajuste }
							: p
					)
				);
			}

		// Determinar si el submit fue "Registrar y continuar"
		const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
		const keepOpen = submitter?.dataset?.action === "continue";

		toast.success(`Ajuste de ${payload.tipo} registrado correctamente`);

		if (keepOpen) {
			// Mantener producto, tipo y motivo; limpiar solo cantidad
			setForm(prev => ({ ...prev, cantidad: "" }));
		} else {
			resetForm();
			setDialogOpen(false);
		}
		
		// Recargar el historial de ajustes
		await fetchAjustes();
	} catch (err: any) {
		const message = err?.message || err?.body?.message || "Error al registrar el ajuste";
		toast.error(message);
	} finally {
		setSaving(false);
	}
}

	const selectedProducto = productos.find(p => p.id === Number(form.producto_id));

	const columns = useMemo<ColumnDef<Ajuste>[]>(() => [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {new Date(row.original.fecha).toLocaleString("es-PE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
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
                                                // Foco ágil para ingresar cantidad tras seleccionar
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

			{/* Historial de Ajustes: tabla de frente (sin envoltorio) */}
			{loadingAjustes ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</div>
			) : (
				<EntityDataTable<Ajuste>
					columns={columns}
					data={ajustes}
					searchKey={"producto"}
					toolbarRender={(table) => (
						<div className="flex items-center gap-2">
							{/* Filtro por tipo */}
							<Select
								value={(table.getColumn("tipo")?.getFilterValue() as string) ?? "all"}
								onValueChange={(value) => table.getColumn("tipo")?.setFilterValue(value === "all" ? undefined : value)}
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

                          {/* Filtro por producto: buscador inteligente */}
                          <div className="flex items-center gap-2">
                            <ProductSearchSelector
                              selected={toolbarSelectedProduct}
                              items={productos}
                              placeholder="Filtrar por producto..."
                              onSelect={(p) => {
                                setToolbarSelectedProduct(p);
                                table.getColumn("producto_id")?.setFilterValue(p.id);
                              }}
                            />
                            {toolbarSelectedProduct && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setToolbarSelectedProduct(null);
                                  table.getColumn("producto_id")?.setFilterValue(undefined);
                                }}
                              >
                                Todos
                              </Button>
                            )}
                          </div>

							<Button
								variant="outline"
								size="sm"
								onClick={() => void fetchAjustes()}
								disabled={loadingAjustes}
							>
								<RefreshCcw className={`mr-2 size-4 ${loadingAjustes ? "animate-spin" : ""}`} />
								Actualizar
							</Button>
						</div>
					)}
				/>
			)}
		</div>
	);
};

export default InventarioPage;