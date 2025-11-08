// Página de gestión de proveedores con CRUD completo
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Proveedor, ProveedorCreateInput } from "@/services/proveedores";
import {
	createProveedor,
	deactivateProveedor,
	listProveedores,
	updateProveedor,
} from "@/services/proveedores";

type ProveedorFormState = {
	nombre: string;
	ruc_identidad: string;
	email: string;
	telefono: string;
	direccion: string;
};

const initialForm: ProveedorFormState = {
	nombre: "",
	ruc_identidad: "",
	email: "",
	telefono: "",
	direccion: "",
};

function sortByNombre(items: Proveedor[]) {
	return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const ProveedoresPage = () => {
	const [proveedores, setProveedores] = useState<Proveedor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

	const [form, setForm] = useState<ProveedorFormState>(initialForm);
	const [mode, setMode] = useState<"create" | "edit">("create");
	const [selected, setSelected] = useState<Proveedor | null>(null);

	const isEditing = useMemo(() => mode === "edit" && !!selected, [mode, selected]);

	const fetchProveedores = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await listProveedores();
			setProveedores(sortByNombre(data));
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo cargar la lista";
			setError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchProveedores();
	}, [fetchProveedores]);

	function resetForm() {
		setForm(initialForm);
		setMode("create");
		setSelected(null);
	}

	function handleEdit(proveedor: Proveedor) {
		setSelected(proveedor);
		setForm({
			nombre: proveedor.nombre ?? "",
			ruc_identidad: proveedor.ruc_identidad ?? "",
			email: proveedor.email ?? "",
			telefono: proveedor.telefono ?? "",
			direccion: proveedor.direccion ?? "",
		});
		setMode("edit");
	}

	function buildPayload(): ProveedorCreateInput {
		const nombre = form.nombre.trim();
		if (!nombre) {
			throw new Error("El nombre es obligatorio");
		}

		const payload: ProveedorCreateInput = { nombre };
		const ruc = form.ruc_identidad.trim();
		if (ruc) payload.ruc_identidad = ruc;

		const email = form.email.trim();
		if (email) payload.email = email;

		const telefono = form.telefono.trim();
		if (telefono) payload.telefono = telefono;

		const direccion = form.direccion.trim();
		if (direccion) payload.direccion = direccion;

		return payload;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		try {
			const payload = buildPayload();
			if (isEditing && selected) {
				const updated = await updateProveedor(selected.id, payload);
				setProveedores((prev) =>
					sortByNombre(prev.map((item) => (item.id === updated.id ? updated : item)))
				);
				toast.success("Proveedor actualizado");
			} else {
				const created = await createProveedor(payload);
				setProveedores((prev) => sortByNombre([...prev, created]));
				toast.success("Proveedor creado");
			}
			resetForm();
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "Error al guardar";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(proveedor: Proveedor) {
		const confirmed = window.confirm(
			`¿Desactivar al proveedor "${proveedor.nombre}"? Ya no aparecerá en los listados.`
		);
		if (!confirmed) return;
		setDeactivatingId(proveedor.id);
		try {
			await deactivateProveedor(proveedor.id);
			setProveedores((prev) => prev.filter((item) => item.id !== proveedor.id));
			if (selected?.id === proveedor.id) {
				resetForm();
			}
			toast.success("Proveedor desactivado");
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo desactivar";
			toast.error(message);
		} finally {
			setDeactivatingId(null);
		}
	}

	function handleReload() {
		void fetchProveedores();
	}

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold">
						{isEditing ? "Editar proveedor" : "Crear proveedor"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
						<div className="grid gap-2 lg:col-span-2">
							<Label htmlFor="nombre">Nombre o razón social</Label>
							<Input
								id="nombre"
								value={form.nombre}
								onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
								placeholder="Ej. Ferretería Suministros S.A."
								required
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="ruc_identidad">RUC / Documento</Label>
							<Input
								id="ruc_identidad"
								value={form.ruc_identidad}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, ruc_identidad: event.target.value }))
								}
								placeholder="Opcional"
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={form.email}
								onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
								placeholder="Opcional"
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="telefono">Teléfono</Label>
							<Input
								id="telefono"
								value={form.telefono}
								onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
								placeholder="Opcional"
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2 lg:col-span-2">
							<Label htmlFor="direccion">Dirección</Label>
							<textarea
								id="direccion"
								value={form.direccion}
								onChange={(event) => setForm((prev) => ({ ...prev, direccion: event.target.value }))}
								placeholder="Opcional"
								rows={3}
								disabled={saving}
								className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							/>
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
										Actualizar proveedor
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Plus className="size-4" />
										Crear proveedor
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
					<CardTitle className="text-lg font-semibold">Proveedores activos</CardTitle>
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
							Cargando proveedores...
						</div>
					) : error ? (
						<div className="text-sm text-red-600" aria-live="assertive">
							{error}
						</div>
					) : proveedores.length === 0 ? (
						<div className="text-sm text-muted-foreground">No hay proveedores activos.</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-16">ID</TableHead>
										<TableHead>Nombre</TableHead>
										<TableHead>Documento</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Teléfono</TableHead>
										<TableHead>Dirección</TableHead>
										<TableHead className="w-40 text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{proveedores.map((proveedor) => (
										<TableRow key={proveedor.id}>
											<TableCell>{proveedor.id}</TableCell>
											<TableCell className="font-medium">{proveedor.nombre}</TableCell>
											<TableCell className="text-muted-foreground">
												{proveedor.ruc_identidad || "—"}
											</TableCell>
											<TableCell>{proveedor.email || "—"}</TableCell>
											<TableCell>{proveedor.telefono || "—"}</TableCell>
											<TableCell>{proveedor.direccion?.trim() || "—"}</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEdit(proveedor)}
													>
														<Pencil className="mr-1 size-4" /> Editar
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeactivate(proveedor)}
														disabled={deactivatingId === proveedor.id}
													>
														{deactivatingId === proveedor.id ? (
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

export default ProveedoresPage;