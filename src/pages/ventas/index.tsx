// Página de registro de ventas con carrito funcional
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Trash2, ShoppingCart, DollarSign, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import type { Cliente } from "@/services/clientes";
import { listClientes } from "@/services/clientes";
import type { VentaCreateInput } from "@/services/ventas";
import { createVenta } from "@/services/ventas";

interface CarritoItem {
	productoId: number;
	nombre: string;
	sku: string | null;
	cantidad: number;
	precioVenta: number;
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

const VentasPage = () => {
	const [productos, setProductos] = useState<Producto[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [carrito, setCarrito] = useState<CarritoItem[]>([]);
	const [selectedClienteId, setSelectedClienteId] = useState<string>("");
	const [selectedProductoId, setSelectedProductoId] = useState<string>("");
	
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const fetchProductos = useCallback(async () => {
		try {
			const data = await listProductos();
			setProductos(data.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
		} catch (err: any) {
			toast.error(err?.body?.message || "Error al cargar productos");
		}
	}, []);

	const fetchClientes = useCallback(async () => {
		try {
			const data = await listClientes();
			setClientes(data.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
		} catch (err: any) {
			toast.error(err?.body?.message || "Error al cargar clientes");
		}
	}, []);

	useEffect(() => {
		async function init() {
			setLoading(true);
			await Promise.all([fetchProductos(), fetchClientes()]);
			setLoading(false);
		}
		void init();
	}, [fetchProductos, fetchClientes]);

	// Añadir producto al carrito
	function handleAddProducto(productoId: string) {
		if (!productoId) return;

		const producto = productos.find(p => p.id === Number(productoId));
		if (!producto) return;

		if (producto.stock <= 0) {
			toast.error("Producto sin stock disponible");
			return;
		}

		// Verificar si ya está en el carrito
		const existente = carrito.find(item => item.productoId === producto.id);
		if (existente) {
			// Incrementar cantidad si hay stock
			if (existente.cantidad < existente.stockDisponible) {
				setCarrito(prev => prev.map(item =>
					item.productoId === producto.id
						? { ...item, cantidad: item.cantidad + 1 }
						: item
				));
				toast.success(`Cantidad de ${producto.nombre} incrementada`);
			} else {
				toast.warning(`Stock máximo alcanzado para ${producto.nombre}`);
			}
		} else {
			// Añadir nuevo item
			const nuevoItem: CarritoItem = {
				productoId: producto.id,
				nombre: producto.nombre,
				sku: producto.sku,
				cantidad: 1,
				precioVenta: Number(producto.precio_venta),
				stockDisponible: producto.stock,
			};
			setCarrito(prev => [...prev, nuevoItem]);
			toast.success(`${producto.nombre} añadido al carrito`);
		}

		// Resetear selector
		setSelectedProductoId("");
	}

	// Cambiar cantidad manualmente
	function handleChangeCantidad(productoId: number, nuevaCantidad: number) {
		if (nuevaCantidad <= 0) {
			handleRemoveItem(productoId);
			return;
		}

		setCarrito(prev => prev.map(item => {
			if (item.productoId === productoId) {
				const cantidad = Math.min(nuevaCantidad, item.stockDisponible);
				if (cantidad < nuevaCantidad) {
					toast.warning(`Stock máximo: ${item.stockDisponible}`);
				}
				return { ...item, cantidad };
			}
			return item;
		}));
	}

	// Incrementar cantidad
	function handleIncrementCantidad(productoId: number) {
		const item = carrito.find(i => i.productoId === productoId);
		if (!item) return;

		if (item.cantidad < item.stockDisponible) {
			setCarrito(prev => prev.map(i =>
				i.productoId === productoId
					? { ...i, cantidad: i.cantidad + 1 }
					: i
			));
		} else {
			toast.warning(`Stock máximo: ${item.stockDisponible}`);
		}
	}

	// Decrementar cantidad
	function handleDecrementCantidad(productoId: number) {
		const item = carrito.find(i => i.productoId === productoId);
		if (!item) return;

		if (item.cantidad > 1) {
			setCarrito(prev => prev.map(i =>
				i.productoId === productoId
					? { ...i, cantidad: i.cantidad - 1 }
					: i
			));
		} else {
			handleRemoveItem(productoId);
		}
	}

	// Eliminar item del carrito
	function handleRemoveItem(productoId: number) {
		setCarrito(prev => prev.filter(item => item.productoId !== productoId));
	}

	// Limpiar carrito
	function handleClearCarrito() {
		if (carrito.length === 0) return;
		if (window.confirm("¿Limpiar todo el carrito?")) {
			setCarrito([]);
			setSelectedClienteId("");
		}
	}

	// Calcular totales
	const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.precioVenta), 0);

	// Registrar venta
	async function handleRegistrarVenta() {
		if (carrito.length === 0) {
			toast.error("El carrito está vacío");
			return;
		}

		setSaving(true);
		try {
			const payload: VentaCreateInput = {
				cliente_id: selectedClienteId ? Number(selectedClienteId) : null,
				detalles: carrito.map(item => ({
					producto_id: item.productoId,
					cantidad: item.cantidad,
					precio_unitario: item.precioVenta,
				})),
			};

			await createVenta(payload);
			toast.success("¡Venta registrada exitosamente!");

			// Limpiar estado
			setCarrito([]);
			setSelectedClienteId("");
			setSelectedProductoId("");

			// Recargar productos para actualizar stock
			await fetchProductos();
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "Error al registrar la venta";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="p-4 lg:p-6">
			<div className="grid gap-6 lg:grid-cols-[1fr,400px]">
				{/* COLUMNA IZQUIERDA: Carrito */}
				<div className="space-y-4">
					{/* Buscador de productos */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold flex items-center gap-2">
								<ShoppingCart className="size-5" />
								Añadir Producto al Carrito
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<div className="flex-1">
									<Select
										value={selectedProductoId}
										onValueChange={(value) => {
											setSelectedProductoId(value);
											handleAddProducto(value);
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Buscar producto por nombre o SKU..." />
										</SelectTrigger>
										<SelectContent>
											{productos
												.filter(p => p.stock > 0)
												.map((producto) => (
													<SelectItem key={producto.id} value={String(producto.id)}>
														{producto.nombre} {producto.sku ? `(${producto.sku})` : ""} - Stock: {producto.stock}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Tabla del Carrito */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								Carrito de Venta ({carrito.length} {carrito.length === 1 ? "producto" : "productos"})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{carrito.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<ShoppingCart className="size-12 mx-auto mb-2 opacity-50" />
									<p>El carrito está vacío</p>
									<p className="text-sm">Añade productos para comenzar la venta</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Producto</TableHead>
											<TableHead className="text-right">P. Unitario</TableHead>
											<TableHead className="text-center">Cantidad</TableHead>
											<TableHead className="text-right">Subtotal</TableHead>
											<TableHead></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{carrito.map((item) => (
											<TableRow key={item.productoId}>
												<TableCell>
													<div>
														<div className="font-medium">{item.nombre}</div>
														{item.sku && (
															<div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
														)}
														<div className="text-xs text-muted-foreground">
															Stock disponible: {item.stockDisponible}
														</div>
													</div>
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(item.precioVenta)}
												</TableCell>
												<TableCell>
													<div className="flex items-center justify-center gap-2">
														<Button
															type="button"
															size="sm"
															variant="outline"
															onClick={() => handleDecrementCantidad(item.productoId)}
														>
															<Minus className="size-3" />
														</Button>
														<Input
															type="number"
															min="1"
															max={item.stockDisponible}
															value={item.cantidad}
															onChange={(e) => handleChangeCantidad(item.productoId, Number(e.target.value))}
															className="w-16 text-center"
														/>
														<Button
															type="button"
															size="sm"
															variant="outline"
															onClick={() => handleIncrementCantidad(item.productoId)}
														>
															<Plus className="size-3" />
														</Button>
													</div>
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(item.cantidad * item.precioVenta)}
												</TableCell>
												<TableCell>
													<Button
														type="button"
														size="sm"
														variant="ghost"
														onClick={() => handleRemoveItem(item.productoId)}
													>
														<Trash2 className="size-4 text-destructive" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</div>

				{/* COLUMNA DERECHA: Cliente, Resumen y Acciones */}
				<div className="space-y-4">
					{/* Selector de Cliente */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">Cliente</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<Select
									value={selectedClienteId}
									onValueChange={setSelectedClienteId}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Cliente genérico (sin seleccionar)" />
									</SelectTrigger>
									<SelectContent>
										{clientes.map((cliente) => (
											<SelectItem key={cliente.id} value={String(cliente.id)}>
												{cliente.nombre}
												{cliente.documento_identidad && ` - ${cliente.documento_identidad}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedClienteId && (
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => setSelectedClienteId("")}
										className="w-full"
									>
										<X className="size-3 mr-1" />
										Quitar cliente
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Resumen de Totales */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">Resumen</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="font-semibold">Total a Pagar:</span>
									<span className="text-2xl font-bold text-primary">
										{formatCurrency(total)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Botones de Acción */}
					<Card>
						<CardContent className="pt-6 space-y-2">
							<Button
								type="button"
								className="w-full"
								size="lg"
								onClick={handleRegistrarVenta}
								disabled={carrito.length === 0 || saving}
							>
								{saving ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Registrando...
									</>
								) : (
									<>
										<DollarSign className="mr-2 size-4" />
										Registrar Venta
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="destructive"
								className="w-full"
								onClick={handleClearCarrito}
								disabled={carrito.length === 0 || saving}
							>
								<Trash2 className="mr-2 size-4" />
								Limpiar Carrito
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default VentasPage;