// Página de gestión de productos con CRUD completo
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Producto, ProductoCreateInput } from "@/services/productos";
import {
	createProducto,
	deactivateProducto,
	listProductos,
	updateProducto,
} from "@/services/productos";
import type { Categoria } from "@/services/categorias";
import { listCategorias } from "@/services/categorias";

type ProductoFormState = {
	nombre: string;
	sku: string;
	descripcion: string;
	precio_venta: string;
	costo_compra: string;
	stock_minimo: string;
	categoria_id: string;
};

const initialFormState: ProductoFormState = {
	nombre: "",
	sku: "",
	descripcion: "",
	precio_venta: "",
	costo_compra: "",
	stock_minimo: "",
	categoria_id: "",
};

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

function sortByNombre(items: Producto[]) {
	return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const ProductosPage = () => {
	const [productos, setProductos] = useState<Producto[]>([]);
	const [categorias, setCategorias] = useState<Categoria[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

	const [form, setForm] = useState<ProductoFormState>(initialFormState);
	const [mode, setMode] = useState<"create" | "edit">("create");
	const [selected, setSelected] = useState<Producto | null>(null);

	const isEditing = mode === "edit" && !!selected;

	const fetchProductos = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await listProductos();
			setProductos(sortByNombre(data));
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudieron cargar los productos";
			setError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchCategorias = useCallback(async () => {
		try {
			const data = await listCategorias();
			setCategorias(data);
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudieron cargar las categorías";
			toast.error(message);
		}
	}, []);

	useEffect(() => {
		void fetchProductos();
		void fetchCategorias();
	}, [fetchProductos, fetchCategorias]);

	function resetForm() {
		setForm(initialFormState);
		setMode("create");
		setSelected(null);
	}

	function handleEdit(producto: Producto) {
		setSelected(producto);
		setForm({
			nombre: producto.nombre ?? "",
			sku: producto.sku ?? "",
			descripcion: producto.descripcion ?? "",
			precio_venta: producto.precio_venta ?? "",
			costo_compra: producto.costo_compra ?? "",
			stock_minimo: producto.stock_minimo !== null ? String(producto.stock_minimo) : "",
			categoria_id: producto.categoria_id !== null ? String(producto.categoria_id) : "",
		});
		setMode("edit");
	}

	function buildPayload(): ProductoCreateInput {
		const nombre = form.nombre.trim();
		if (!nombre) {
			throw new Error("El nombre es obligatorio");
		}

		const precio = Number(form.precio_venta);
		if (Number.isNaN(precio) || precio <= 0) {
			throw new Error("El precio de venta debe ser un número mayor a 0");
		}

		const payload: ProductoCreateInput = {
			nombre,
			precio_venta: precio,
			stock: 0, // Stock inicial en 0, se maneja desde Ajustes de Inventario
		};

		const sku = form.sku.trim();
		if (sku) payload.sku = sku;

		const descripcion = form.descripcion.trim();
		if (descripcion) payload.descripcion = descripcion;

		if (form.costo_compra.trim()) {
			const costo = Number(form.costo_compra);
			if (Number.isNaN(costo) || costo <= 0) {
				throw new Error("El costo de compra debe ser un número mayor a 0");
			}
			payload.costo_compra = costo;
		}

		if (form.stock_minimo.trim()) {
			const minimo = Number.parseInt(form.stock_minimo, 10);
			if (Number.isNaN(minimo) || minimo < 0) {
				throw new Error("El stock mínimo debe ser un entero mayor o igual a 0");
			}
			payload.stock_minimo = minimo;
		}

		if (form.categoria_id.trim()) {
			const categoriaId = Number.parseInt(form.categoria_id, 10);
			if (!Number.isNaN(categoriaId)) {
				payload.categoria_id = categoriaId;
			}
		}

		return payload;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		try {
			const payload = buildPayload();

			if (isEditing && selected) {
				const updated = await updateProducto(selected.id, payload);
						setProductos((prev) =>
							sortByNombre(prev.map((item) => (item.id === updated.id ? updated : item)))
						);
				toast.success("Producto actualizado");
			} else {
			const created = await createProducto(payload);
			setProductos((prev) => sortByNombre([...prev, created]));
				toast.success("Producto creado");
			}
			resetForm();
		} catch (err: any) {
			const message = err?.message || err?.body?.message || "Error al guardar";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(producto: Producto) {
		const confirmed = window.confirm(
			`¿Desactivar el producto "${producto.nombre}"? Ya no aparecerá en los listados.`
		);
		if (!confirmed) return;
		setDeactivatingId(producto.id);
		try {
			await deactivateProducto(producto.id);
			setProductos((prev) => prev.filter((item) => item.id !== producto.id));
			if (selected?.id === producto.id) {
				resetForm();
			}
			toast.success("Producto desactivado");
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo desactivar";
			toast.error(message);
		} finally {
			setDeactivatingId(null);
		}
	}

	function handleReload() {
		void fetchProductos();
	}

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold">
						{isEditing ? "Editar producto" : "Crear producto"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="nombre">Nombre</Label>
							<Input
								id="nombre"
								value={form.nombre}
								onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
								placeholder="Ej. Taladro percutor"
								required
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="sku">SKU</Label>
							<Input
								id="sku"
								value={form.sku}
								onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
								placeholder="Opcional"
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2 lg:col-span-2">
							<Label htmlFor="descripcion">Descripción</Label>
							<textarea
								id="descripcion"
								value={form.descripcion}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, descripcion: event.target.value }))
								}
								placeholder="Detalle del producto"
								rows={3}
								disabled={saving}
								className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="precio_venta">Precio de venta</Label>
							<Input
								id="precio_venta"
								type="number"
								min="0"
								step="0.01"
								value={form.precio_venta}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, precio_venta: event.target.value }))
								}
								placeholder="0.00"
								required
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="costo_compra">Costo de compra</Label>
							<Input
								id="costo_compra"
								type="number"
								min="0"
								step="0.01"
								value={form.costo_compra}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, costo_compra: event.target.value }))
								}
								placeholder="Opcional"
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="stock_minimo">Stock mínimo</Label>
							<Input
								id="stock_minimo"
								type="number"
								min="0"
								step="1"
								value={form.stock_minimo}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, stock_minimo: event.target.value }))
								}
								placeholder="Opcional"
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="categoria_id">Categoría</Label>
							<select
								id="categoria_id"
								value={form.categoria_id}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, categoria_id: event.target.value }))
								}
								disabled={saving || categorias.length === 0}
								className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Sin categoría</option>
								{categorias.map((categoria) => (
									<option key={categoria.id} value={categoria.id}>
										{categoria.nombre}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2 lg:col-span-2">
							<Button type="submit" disabled={saving}>
								{saving ? (
									<span className="flex items-center gap-2">
										<Loader2 className="size-4 animate-spin" />
										Guardando...
									</span>
								) : isEditing ? (
									<span className="flex items-center gap-2">
										<Pencil className="size-4" />
										Actualizar producto
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Plus className="size-4" />
										Crear producto
									</span>
								)}
							</Button>
							{isEditing ? (
								<Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
									Cancelar
								</Button>
							) : null}
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg font-semibold">Productos activos</CardTitle>
					<Button variant="outline" size="sm" onClick={handleReload} disabled={loading}>
						{loading ? (
							<span className="flex items-center gap-2">
								<Loader2 className="size-4 animate-spin" />
								Cargando
							</span>
						) : (
							<span className="flex items-center gap-2">
								<RefreshCcw className="size-4" />
								Recargar
							</span>
						)}
					</Button>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							Cargando productos...
						</div>
					) : error ? (
						<div className="text-sm text-red-600" aria-live="assertive">
							{error}
						</div>
					) : productos.length === 0 ? (
						<div className="text-sm text-muted-foreground">No hay productos activos.</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-16">ID</TableHead>
										<TableHead>Nombre</TableHead>
										<TableHead>SKU</TableHead>
										<TableHead>Precio</TableHead>
										<TableHead>Stock</TableHead>
										<TableHead>Categoría</TableHead>
										<TableHead className="w-40 text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{productos.map((producto) => (
										<TableRow key={producto.id}>
											<TableCell>{producto.id}</TableCell>
											<TableCell className="font-medium">{producto.nombre}</TableCell>
											<TableCell className="text-muted-foreground">
												{producto.sku || "—"}
											</TableCell>
											<TableCell>{formatCurrency(producto.precio_venta)}</TableCell>
											<TableCell>{producto.stock}</TableCell>
											<TableCell>{producto.categoria?.nombre || "—"}</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEdit(producto)}
													>
														<Pencil className="mr-1 size-4" /> Editar
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeactivate(producto)}
														disabled={deactivatingId === producto.id}
													>
														{deactivatingId === producto.id ? (
															<span className="flex items-center gap-2">
																<Loader2 className="size-4 animate-spin" />
																Desactivando
															</span>
														) : (
															<span className="flex items-center gap-2">
																<Trash2 className="size-4" />
																Desactivar
															</span>
														)}
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ProductosPage;