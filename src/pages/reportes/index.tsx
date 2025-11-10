// Página de reportes y análisis (Kardex completo de productos)
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, FileText } from "lucide-react";

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
	getKardexCompleto,
	type KardexCompleto,
	type TipoMovimientoKardex,
} from "@/services/reportes";

const tipoLabels: Record<TipoMovimientoKardex, string> = {
	venta: "Venta",
	compra: "Compra",
	ajuste_entrada: "Ajuste (+)",
	ajuste_salida: "Ajuste (-)",
};

const tipoVariants: Record<
	TipoMovimientoKardex,
	"default" | "secondary" | "destructive" | "outline"
> = {
	venta: "destructive",
	compra: "default",
	ajuste_entrada: "secondary",
	ajuste_salida: "outline",
};

function formatCurrency(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	return new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: "PEN",
		minimumFractionDigits: 2,
	}).format(value);
}

function formatDate(dateString: string) {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("es-PE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

const ReportesPage = () => {
	const [productoId, setProductoId] = useState("");
	const [kardex, setKardex] = useState<KardexCompleto | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleBuscar(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const id = Number.parseInt(productoId, 10);
		if (Number.isNaN(id) || id <= 0) {
			toast.error("Ingresa un ID de producto válido");
			return;
		}

		setLoading(true);
		try {
			const data = await getKardexCompleto(id);
			setKardex(data);
			toast.success("Kardex generado correctamente");
		} catch (err: any) {
			const message =
				err?.body?.message || err?.message || "No se pudo obtener el kardex";
			toast.error(message);
			setKardex(null);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<FileText className="size-5" />
						Kardex de Producto
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleBuscar} className="flex gap-4">
						<div className="grid flex-1 gap-2">
							<Label htmlFor="productoId">ID del Producto</Label>
							<Input
								id="productoId"
								type="number"
								min="1"
								value={productoId}
								onChange={(event) => setProductoId(event.target.value)}
								placeholder="Ingresa el ID del producto"
								required
								disabled={loading}
							/>
						</div>
						<div className="flex items-end">
							<Button type="submit" disabled={loading}>
								{loading ? (
									<span className="flex items-center gap-2">
										<Loader2 className="size-4 animate-spin" />
										Buscando...
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Search className="size-4" />
										Buscar Kardex
									</span>
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{kardex && (
				<>
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								Información del Producto
							</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
								<div>
									<dt className="text-sm text-muted-foreground">ID</dt>
									<dd className="text-lg font-medium">{kardex.producto.id}</dd>
								</div>
								<div>
									<dt className="text-sm text-muted-foreground">Nombre</dt>
									<dd className="text-lg font-medium">{kardex.producto.nombre}</dd>
								</div>
								<div>
									<dt className="text-sm text-muted-foreground">SKU</dt>
									<dd className="text-lg font-medium">
										{kardex.producto.sku || "—"}
									</dd>
								</div>
								<div>
									<dt className="text-sm text-muted-foreground">Stock Actual</dt>
									<dd className="text-lg font-medium text-primary">
										{kardex.stockActual} unidades
									</dd>
								</div>
							</dl>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								Historial de Movimientos ({kardex.totalMovimientos})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{kardex.movimientos.length === 0 ? (
								<div className="text-sm text-muted-foreground">
									No hay movimientos registrados para este producto.
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-40">Fecha</TableHead>
												<TableHead className="w-32">Tipo</TableHead>
												<TableHead className="w-24 text-right">Cantidad</TableHead>
												<TableHead>Referencia</TableHead>
												<TableHead className="w-28 text-right">Precio Unit.</TableHead>
												<TableHead className="w-24 text-right">Saldo</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{kardex.movimientos.map((mov, idx) => (
												<TableRow key={idx}>
													<TableCell className="text-sm">
														{formatDate(mov.fecha)}
													</TableCell>
													<TableCell>
														<Badge variant={tipoVariants[mov.tipo]}>
															{tipoLabels[mov.tipo]}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-mono">
														{mov.cantidad}
													</TableCell>
													<TableCell>
														<div className="flex flex-col gap-1">
															<span className="text-sm">{mov.referencia}</span>
															{mov.motivo && (
																<span className="text-xs text-muted-foreground">
																	{mov.motivo}
																</span>
															)}
															{mov.responsable && (
																<span className="text-xs text-muted-foreground">
																	Por: {mov.responsable}
																</span>
															)}
														</div>
													</TableCell>
													<TableCell className="text-right font-mono text-sm">
														{formatCurrency(mov.precio_unitario)}
													</TableCell>
													<TableCell className="text-right font-mono font-medium">
														{mov.saldo}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
};

export default ReportesPage;
