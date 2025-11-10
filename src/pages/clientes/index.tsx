// Página de gestión de clientes con CRUD completo
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
import type { Cliente, ClienteCreateInput } from "@/services/clientes";
import {
	createCliente,
	deactivateCliente,
	listClientes,
	updateCliente,
} from "@/services/clientes";

type ClienteFormState = {
	nombre: string;
	documento_identidad: string;
	email: string;
	telefono: string;
	direccion: string;
};

const initialForm: ClienteFormState = {
	nombre: "",
	documento_identidad: "",
	email: "",
	telefono: "",
	direccion: "",
};

function sortByNombre(items: Cliente[]) {
	return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const ClientesPage = () => {
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

	const [form, setForm] = useState<ClienteFormState>(initialForm);
	const [mode, setMode] = useState<"create" | "edit">("create");
	const [selected, setSelected] = useState<Cliente | null>(null);

	const isEditing = useMemo(() => mode === "edit" && !!selected, [mode, selected]);

	const fetchClientes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await listClientes();
			setClientes(sortByNombre(data));
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo cargar la lista";
			setError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchClientes();
	}, [fetchClientes]);

	function resetForm() {
		setForm(initialForm);
		setMode("create");
		setSelected(null);
	}

	function handleEdit(cliente: Cliente) {
		setSelected(cliente);
		setForm({
			nombre: cliente.nombre ?? "",
			documento_identidad: cliente.documento_identidad ?? "",
			email: cliente.email ?? "",
			telefono: cliente.telefono ?? "",
			direccion: cliente.direccion ?? "",
		});
		setMode("edit");
	}

	function buildPayload(): ClienteCreateInput {
		const nombre = form.nombre.trim();
		if (!nombre) {
			throw new Error("El nombre es obligatorio");
		}

		const payload: ClienteCreateInput = { nombre };
		const documento = form.documento_identidad.trim();
		if (documento) payload.documento_identidad = documento;

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
				const updated = await updateCliente(selected.id, payload);
				setClientes((prev) =>
					sortByNombre(prev.map((item) => (item.id === updated.id ? updated : item)))
				);
				toast.success("Cliente actualizado");
			} else {
				const created = await createCliente(payload);
				setClientes((prev) => sortByNombre([...prev, created]));
				toast.success("Cliente creado");
			}
			resetForm();
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "Error al guardar";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(cliente: Cliente) {
		const confirmed = window.confirm(
			`¿Desactivar al cliente "${cliente.nombre}"? Podrás registrarlo nuevamente si lo necesitas.`
		);
		if (!confirmed) return;
		setDeactivatingId(cliente.id);
		try {
			await deactivateCliente(cliente.id);
			setClientes((prev) => prev.filter((item) => item.id !== cliente.id));
			if (selected?.id === cliente.id) {
				resetForm();
			}
			toast.success("Cliente desactivado");
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo desactivar";
			toast.error(message);
		} finally {
			setDeactivatingId(null);
		}
	}

	function handleReload() {
		void fetchClientes();
	}

	return (
		<div className="space-y-6 p-4 lg:p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold">
						{isEditing ? "Editar cliente" : "Crear cliente"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
						<div className="grid gap-2 lg:col-span-2">
							<Label htmlFor="nombre">Nombre completo</Label>
							<Input
								id="nombre"
								value={form.nombre}
								onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
								placeholder="Ej. Juan Pérez"
								required
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="documento_identidad">Documento de identidad</Label>
							<Input
								id="documento_identidad"
								value={form.documento_identidad}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, documento_identidad: event.target.value }))
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
										Actualizar cliente
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Plus className="size-4" />
										Crear cliente
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
					<CardTitle className="text-lg font-semibold">Clientes activos</CardTitle>
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
							Cargando clientes...
						</div>
					) : error ? (
						<div className="text-sm text-red-600" aria-live="assertive">
							{error}
						</div>
					) : clientes.length === 0 ? (
						<div className="text-sm text-muted-foreground">No hay clientes activos.</div>
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
									{clientes.map((cliente) => (
										<TableRow key={cliente.id}>
											<TableCell>{cliente.id}</TableCell>
											<TableCell className="font-medium">{cliente.nombre}</TableCell>
											<TableCell className="text-muted-foreground">
												{cliente.documento_identidad || "—"}
											</TableCell>
											<TableCell>{cliente.email || "—"}</TableCell>
											<TableCell>{cliente.telefono || "—"}</TableCell>
											<TableCell>{cliente.direccion?.trim() || "—"}</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEdit(cliente)}
													>
														<Pencil className="mr-1 size-4" /> Editar
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeactivate(cliente)}
														disabled={deactivatingId === cliente.id}
													>
														{deactivatingId === cliente.id ? (
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

export default ClientesPage;