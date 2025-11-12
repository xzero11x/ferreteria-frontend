// Página de gestión de proveedores refactorizada para usar modales
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
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
// Filtros adicionales eliminados para una búsqueda rápida
import type { Proveedor } from "@/services/proveedores";
import { deactivateProveedor, listProveedores } from "@/services/proveedores";
import CreateProviderDialog from "@/components/CreateProviderDialog";
import EditProviderDialog from "@/components/EditProviderDialog";

function sortByNombre(items: Proveedor[]) {
  return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  // Control externo de modales para evitar cierre inmediato al abrir desde el menú
  const [editOpen, setEditOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [confirmProveedor, setConfirmProveedor] = useState<Proveedor | null>(null);

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

  const columns = useMemo<ColumnDef<Proveedor>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
        // Búsqueda combinada por Nombre/RUC
        filterFn: (row, _id, val?: string) => {
          const q = (val ?? "").toString().toLowerCase();
          if (!q) return true;
          const nombre = (row.original.nombre ?? "").toLowerCase();
          const ruc = (row.original.ruc_identidad ?? "").toLowerCase();
          return nombre.includes(q) || ruc.includes(q);
        },
      },
      {
        accessorKey: "ruc_identidad",
        header: "Documento",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.ruc_identidad || "—"}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "—",
      },
      {
        accessorKey: "telefono",
        header: "Teléfono",
        cell: ({ row }) => row.original.telefono || "—",
      },
      {
        id: "direccion",
        header: "Dirección",
        cell: ({ row }) => row.original.direccion?.trim() || "—",
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
                    setEditingProveedor(row.original);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deactivatingId === row.original.id}
                  onSelect={() => {
                    if (deactivatingId === row.original.id) return;
                    setConfirmProveedor(row.original);
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

  async function handleDeactivate(proveedor: Proveedor) {
    setDeactivatingId(proveedor.id);
    try {
      await deactivateProveedor(proveedor.id);
      setProveedores((prev) => prev.filter((item) => item.id !== proveedor.id));
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
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <div className="flex items-center gap-2">
          <CreateProviderDialog onCreated={(created) => setProveedores((prev) => sortByNombre([...prev, created]))}>
            <Button>
<Plus className="mr-2 size-4" /> Crear Proveedor
            </Button>
          </CreateProviderDialog>
        </div>
      </div>

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
        <EntityDataTable
          columns={columns}
          data={proveedores}
          searchKey="nombre"
        />
      )}
      {/* Modales controlados de forma externa para evitar cierre al abrir desde el menú */}
      {editingProveedor && (
        <EditProviderDialog
          proveedor={editingProveedor}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingProveedor(null);
          }}
          onUpdated={(updated) =>
            setProveedores((prev) =>
              sortByNombre(prev.map((item) => (item.id === updated.id ? updated : item)))
            )
          }
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open);
          if (!open) setConfirmProveedor(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmProveedor
                ? `¿Desactivar al proveedor "${confirmProveedor.nombre}"? Ya no aparecerá en los listados.`
                : "¿Desactivar el proveedor seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmProveedor) {
                  handleDeactivate(confirmProveedor);
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

export default ProveedoresPage;