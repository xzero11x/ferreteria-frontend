// Página de gestión de categorías con CRUD completo
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
import type { Categoria, CategoriaCreateInput } from "@/services/categorias";
import {
	createCategoria,
	deactivateCategoria,
	listCategorias,
	updateCategoria,
} from "@/services/categorias";

type FormMode = "create" | "edit";

type FormState = {
	nombre: string;
	descripcion: string;
};

const emptyForm: FormState = {
	nombre: "",
	descripcion: "",
};

function sortByNombre(items: Categoria[]) {
	// Keep alphabetical order after mutations
	return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const CategoriasPage = () => {
		const [categorias, setCategorias] = useState<Categoria[]>([]);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState<string | null>(null);

	const [form, setForm] = useState<FormState>(emptyForm);
	const [mode, setMode] = useState<FormMode>("create");
	const [selected, setSelected] = useState<Categoria | null>(null);
		const [saving, setSaving] = useState(false);
		const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

		const isEditing = mode === "edit" && !!selected;

		const fetchCategorias = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await listCategorias();
			setCategorias(sortByNombre(data));
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo cargar la lista";
			setError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
		}, []);

		useEffect(() => {
			void fetchCategorias();
		}, [fetchCategorias]);

	function resetForm() {
		setForm(emptyForm);
		setMode("create");
		setSelected(null);
	}

	function handleEdit(categoria: Categoria) {
		setSelected(categoria);
		setForm({ nombre: categoria.nombre, descripcion: categoria.descripcion ?? "" });
		setMode("edit");
	}

		function buildPayload(): CategoriaCreateInput {
		const nombre = form.nombre.trim();
		const descripcion = form.descripcion.trim();
		return {
			nombre,
			descripcion: descripcion ? descripcion : undefined,
		};
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!form.nombre.trim()) {
			toast.error("El nombre es obligatorio");
			return;
		}
		setSaving(true);
		const payload = buildPayload();
		try {
			if (isEditing && selected) {
				const updated = await updateCategoria(selected.id, payload);
				setCategorias((prev) =>
					sortByNombre(prev.map((item) => (item.id === updated.id ? updated : item)))
				);
				toast.success("Categoría actualizada");
			} else {
						const created = await createCategoria(payload);
				setCategorias((prev) => sortByNombre([...prev, created]));
				toast.success("Categoría creada");
			}
			resetForm();
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "Error al guardar";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(categoria: Categoria) {
		const confirmed = window.confirm(
			`¿Desactivar la categoría "${categoria.nombre}"? Podrás crearla de nuevo si es necesario.`
		);
		if (!confirmed) return;
		setDeactivatingId(categoria.id);
		try {
			await deactivateCategoria(categoria.id);
			setCategorias((prev) => prev.filter((item) => item.id !== categoria.id));
			if (selected?.id === categoria.id) {
				resetForm();
			}
			toast.success("Categoría desactivada");
		} catch (err: any) {
			const message = err?.body?.message || err?.message || "No se pudo desactivar";
			toast.error(message);
		} finally {
			setDeactivatingId(null);
		}
	}

			function handleReload() {
				void fetchCategorias();
			}

	return (
		<div className="space-y-6 p-4 lg:p-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold">
								{isEditing ? "Editar categoría" : "Crear categoría"}
							</CardTitle>
						</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
						<div className="grid gap-2">
							<Label htmlFor="nombre">Nombre</Label>
							<Input
								id="nombre"
								value={form.nombre}
								onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
								placeholder="Ej. Herramientas"
								required
								disabled={saving}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="descripcion">Descripción</Label>
							<textarea
								id="descripcion"
								value={form.descripcion}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, descripcion: event.target.value }))
								}
								placeholder="Opcional"
								rows={3}
								disabled={saving}
								className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button type="submit" disabled={saving}>
								{saving ? (
									<span className="flex items-center gap-2">
										<Loader2 className="size-4 animate-spin" />
										Guardando...
									</span>
								) : isEditing ? (
									<span className="flex items-center gap-2">
										<Pencil className="size-4" />
										Actualizar categoría
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Plus className="size-4" />
										Crear categoría
									</span>
								)}
							</Button>
							{!isEditing ? null : (
								<Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
									Cancelar
								</Button>
							)}
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg font-semibold">Categorías activas</CardTitle>
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
							Cargando categorías...
						</div>
					) : error ? (
						<div className="text-sm text-red-600" aria-live="assertive">
							{error}
						</div>
					) : categorias.length === 0 ? (
						<div className="text-sm text-muted-foreground">No hay categorías activas.</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-16">ID</TableHead>
										<TableHead>Nombre</TableHead>
										<TableHead>Descripción</TableHead>
										<TableHead className="w-40 text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{categorias.map((categoria) => (
										<TableRow key={categoria.id}>
											<TableCell>{categoria.id}</TableCell>
											<TableCell className="font-medium">{categoria.nombre}</TableCell>
											<TableCell className="text-muted-foreground">
												{categoria.descripcion?.trim() || "—"}
											</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEdit(categoria)}
													>
														<Pencil className="mr-1 size-4" /> Editar
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeactivate(categoria)}
														disabled={deactivatingId === categoria.id}
													>
														{deactivatingId === categoria.id ? (
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

export default CategoriasPage;