// Página de gestión de ajustes de inventario
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Package, Plus, RefreshCcw, History } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AjusteCreateInput, Ajuste } from "@/services/inventario";
import { createAjuste, listAjustes } from "@/services/inventario";
import type { Producto } from "@/services/productos";
import { listProductos } from "@/services/productos";

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

			toast.success(`Ajuste de ${payload.tipo} registrado correctamente`);
			resetForm();
			
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

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<Package className="size-5" />
						Registrar Ajuste de Inventario
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid gap-4 lg:grid-cols-2">
							{/* Selector de Producto */}
							<div className="grid gap-2">
								<Label htmlFor="producto_id">Producto</Label>
								{loading ? (
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Loader2 className="size-4 animate-spin" />
										Cargando productos...
									</div>
								) : (
									<Select
										value={form.producto_id}
										onValueChange={(value) => setForm(prev => ({ ...prev, producto_id: value }))}
									>
										<SelectTrigger id="producto_id" className="w-full">
											<SelectValue placeholder="Seleccione un producto" />
										</SelectTrigger>
										<SelectContent>
											{productos.map((producto) => (
												<SelectItem key={producto.id} value={String(producto.id)}>
													{producto.nombre} {producto.sku ? `(${producto.sku})` : ""}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
								{selectedProducto && (
									<p className="text-sm text-muted-foreground">
										Stock actual: <span className="font-semibold">{selectedProducto.stock}</span> unidades
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
									placeholder="Ej: 10"
								/>
							</div>

							{/* Campo de Motivo */}
							<div className="grid gap-2 lg:col-span-2">
								<Label htmlFor="motivo">Motivo del Ajuste</Label>
								<Input
									id="motivo"
									value={form.motivo}
									onChange={(event) => setForm(prev => ({ ...prev, motivo: event.target.value }))}
									placeholder="Ej: Producto dañado en almacén, Corrección de inventario físico"
								/>
							</div>
						</div>

						{/* Botones de Acción */}
						<div className="flex gap-2 pt-2">
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
							<Button
								type="button"
								variant="outline"
								onClick={resetForm}
								disabled={saving}
							>
								Limpiar
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Historial de Ajustes */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg font-semibold flex items-center gap-2">
							<History className="size-5" />
							Historial de Ajustes
						</CardTitle>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => void fetchAjustes()}
							disabled={loadingAjustes}
						>
							<RefreshCcw className={`size-4 mr-2 ${loadingAjustes ? "animate-spin" : ""}`} />
							Actualizar
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{loadingAjustes ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					) : ajustes.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<History className="size-12 mx-auto mb-2 opacity-50" />
							<p>No hay ajustes registrados</p>
							<p className="text-sm">Los ajustes que registres aparecerán aquí</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fecha</TableHead>
										<TableHead>Producto</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead className="text-right">Cantidad</TableHead>
										<TableHead>Motivo</TableHead>
										<TableHead>Usuario</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{ajustes.map((ajuste) => (
										<TableRow key={ajuste.id}>
											<TableCell className="text-sm">
												{new Date(ajuste.fecha).toLocaleString("es-PE", {
													year: "numeric",
													month: "2-digit",
													day: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</TableCell>
											<TableCell>
												<div>
													<div className="font-medium">
														{ajuste.producto?.nombre || "Producto desconocido"}
													</div>
													{ajuste.producto?.sku && (
														<div className="text-xs text-muted-foreground">
															SKU: {ajuste.producto.sku}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Badge 
													variant={ajuste.tipo === "entrada" ? "default" : "destructive"}
												>
													{ajuste.tipo === "entrada" ? "Entrada" : "Salida"}
												</Badge>
											</TableCell>
											<TableCell className="text-right font-medium">
												{ajuste.tipo === "entrada" ? "+" : "-"}{ajuste.cantidad}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground max-w-xs truncate">
												{ajuste.motivo || "—"}
											</TableCell>
											<TableCell className="text-sm">
												{ajuste.usuario?.nombre || ajuste.usuario?.email || "Usuario desconocido"}
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

export default InventarioPage;