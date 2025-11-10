// Página de gestión de ajustes de inventario
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Package, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AjusteCreateInput } from "@/services/inventario";
import { createAjuste } from "@/services/inventario";
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
	const [productos, setProductos] = useState<Producto[]>([]);
	const [loading, setLoading] = useState(true);
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

	useEffect(() => {
		void fetchProductos();
	}, [fetchProductos]);

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

			{/* Card informativo */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base font-semibold">💡 ¿Cómo usar los ajustes?</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground space-y-2">
					<p>
						<strong>Entrada (Sumar):</strong> Utiliza este tipo cuando encuentres productos que no estaban contabilizados o necesites corregir un conteo inicial hacia arriba.
					</p>
					<p>
						<strong>Salida (Restar):</strong> Utiliza este tipo cuando encuentres productos dañados, perdidos o necesites corregir un conteo hacia abajo.
					</p>
					<p className="pt-2 border-t">
						<strong>Nota:</strong> Todos los ajustes quedan registrados en el sistema y pueden ser auditados desde el reporte de Kardex.
					</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default InventarioPage;