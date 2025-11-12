// Página de gestión de categorías con CRUD en modales
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, MoreHorizontal, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
// Filtros adicionales eliminados para una UI minimalista
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { EntityDataTable } from "@/components/entity-data-table";
import type { Categoria } from "@/services/categorias";
import { deactivateCategoria, listCategorias } from "@/services/categorias";
import CreateCategoryDialog from "@/components/CreateCategoryDialog";
import EditCategoryDialog from "@/components/EditCategoryDialog";

// Eliminamos formulario inline; se gestionará con modales

function sortByNombre(items: Categoria[]) {
	// Keep alphabetical order after mutations
	return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const CategoriasPage = () => {
		const [categorias, setCategorias] = useState<Categoria[]>([]);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState<string | null>(null);

        const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
        // Control externo de modales para evitar cierre inmediato al abrir desde el menú
        const [editOpen, setEditOpen] = useState(false);
        const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
        const [deactivateOpen, setDeactivateOpen] = useState(false);
        const [confirmCategoria, setConfirmCategoria] = useState<Categoria | null>(null);

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

    // La creación y edición ahora se gestionan mediante modales

	async function handleDeactivate(categoria: Categoria) {
		setDeactivatingId(categoria.id);
		try {
            await deactivateCategoria(categoria.id);
            setCategorias((prev) => prev.filter((item) => item.id !== categoria.id));
            toast.success("Categoría desactivada");
        } catch (err: any) {
            const message = err?.body?.message || err?.message || "No se pudo desactivar";
            toast.error(message);
        } finally {
            setDeactivatingId(null);
        }
    }

  const columns = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
      },
      {
        id: "descripcion",
        header: "Descripción",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.descripcion?.trim() || "—"}</span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditingCategoria(row.original);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deactivatingId === row.original.id}
                  onSelect={() => {
                    if (deactivatingId === row.original.id) return;
                    setConfirmCategoria(row.original);
                    setDeactivateOpen(true);
                  }}
                >
                  {deactivatingId === row.original.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Desactivando
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="size-4" /> Desactivar
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deactivatingId]
  );

			function handleReload() {
				void fetchCategorias();
			}

  return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
            <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorías</h1>
                <div className="flex items-center gap-2">
                    <CreateCategoryDialog
                        onCreated={(created) => setCategorias((prev) => sortByNombre([...prev, created]))}
                    />
                </div>
            </div>

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
        <EntityDataTable
          columns={columns}
          data={categorias}
          searchKey="nombre"
        />
      )}
            {/* Modales controlados de forma externa para evitar cierre al abrir desde el menú */}
            {editingCategoria && (
              <EditCategoryDialog
                categoria={editingCategoria}
                open={editOpen}
                onOpenChange={(open) => {
                  setEditOpen(open);
                  if (!open) setEditingCategoria(null);
                }}
                onUpdated={(updated) =>
                  setCategorias((prev) =>
                    sortByNombre(prev.map((c) => (c.id === updated.id ? updated : c)))
                  )
                }
              />
            )}
            <AlertDialog
              open={deactivateOpen}
              onOpenChange={(open) => {
                setDeactivateOpen(open);
                if (!open) setConfirmCategoria(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desactivar categoría</AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirmCategoria
                      ? `¿Desactivar la categoría "${confirmCategoria.nombre}"? Podrás crearla de nuevo si es necesario.`
                      : "¿Desactivar la categoría seleccionada?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (confirmCategoria) {
                        handleDeactivate(confirmCategoria);
                        setDeactivateOpen(false);
                      }
                    }}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          );
};

export default CategoriasPage;