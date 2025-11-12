// Página de gestión de clientes refactorizada para usar modales
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, MoreHorizontal, Plus } from "lucide-react";

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
// Filtros adicionales eliminados para una búsqueda rápida y simple; modernizamos acciones
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Cliente } from "@/services/clientes";
import { deactivateCliente, listClientes } from "@/services/clientes";
import CreateClientDialog from "@/components/CreateClientDialog";
import EditClientDialog from "@/components/EditClientDialog";

function sortByNombre(items: Cliente[]) {
  return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  // Control externo de modales para evitar cierre inmediato al abrir desde el menú
  const [editOpen, setEditOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [confirmCliente, setConfirmCliente] = useState<Cliente | null>(null);

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

  const columns = useMemo<ColumnDef<Cliente>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
        // Búsqueda combinada por Nombre/Email/Documento
        filterFn: (row, _id, val?: string) => {
          const q = (val ?? "").toString().toLowerCase();
          if (!q) return true;
          const nombre = (row.original.nombre ?? "").toLowerCase();
          const email = (row.original.email ?? "").toLowerCase();
          const doc = (row.original.documento_identidad ?? "").toLowerCase();
          return nombre.includes(q) || email.includes(q) || doc.includes(q);
        },
      },
      {
        accessorKey: "documento_identidad",
        header: "Documento",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.documento_identidad || "—"}</span>
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
                    setEditingCliente(row.original);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deactivatingId === row.original.id}
                  onSelect={() => {
                    if (deactivatingId === row.original.id) return;
                    setConfirmCliente(row.original);
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

  async function handleDeactivate(cliente: Cliente) {
    setDeactivatingId(cliente.id);
    try {
      await deactivateCliente(cliente.id);
      setClientes((prev) => prev.filter((item) => item.id !== cliente.id));
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
		<div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-2">
          <CreateClientDialog onCreated={(created) => setClientes((prev) => sortByNombre([...prev, created]))}>
            <Button>
<Plus className="mr-2 size-4" /> Crear Cliente
            </Button>
          </CreateClientDialog>
        </div>
      </div>

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
        <EntityDataTable
          columns={columns}
          data={clientes}
          searchKey="nombre"
        />
      )}
      {/* Modales controlados de forma externa para evitar cierre al abrir desde el menú */}
      {editingCliente && (
        <EditClientDialog
          cliente={editingCliente}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingCliente(null);
          }}
          onUpdated={(updated) =>
            setClientes((prev) => sortByNombre(prev.map((item) => (item.id === updated.id ? updated : item))))
          }
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open);
          if (!open) setConfirmCliente(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCliente
                ? `¿Desactivar al cliente "${confirmCliente.nombre}"? Podrás registrarlo nuevamente si lo necesitas.`
                : "¿Desactivar el cliente seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCliente) {
                  handleDeactivate(confirmCliente);
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

export default ClientesPage;