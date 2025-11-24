// Página de gestión de usuarios del tenant con CRUD completo
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
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
import { Badge } from "@/components/ui/badge";
// Filtros adicionales eliminados; mantenemos solo Select para Rol y modernizamos acciones
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import CreateUserDialog from "@/components/CreateUserDialog";
import EditUserDialog from "@/components/EditUserDialog";
import type {
  RolUsuario,
  Usuario,
} from "@/services/usuarios";
import {
  deactivateUsuario,
  listUsuarios,
} from "@/services/usuarios";

const rolLabels: Record<RolUsuario, string> = {
  admin: "Administrador",
  empleado: "Empleado",
};

// Eliminado: formulario interno, migrado a modales

function normalizeId(id: string | number | undefined | null) {
  if (id === null || id === undefined) return null;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function sortByEmail(items: Usuario[]) {
  return [...items].sort((a, b) => a.email.localeCompare(b.email, "es"));
}

const UsuariosPage = () => {
  const { user } = useAuth();
  const currentUserId = useMemo(() => normalizeId(user?.id), [user?.id]);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  // Control externo de modales para evitar cierre inmediato al abrir desde el menú
  const [editOpen, setEditOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [confirmUsuario, setConfirmUsuario] = useState<Usuario | null>(null);
  

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsuarios();
      setUsuarios(sortByEmail(data));
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "No se pudo cargar la lista";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsuarios();
  }, [fetchUsuarios]);

  // Edición ahora se maneja con EditUserDialog

  // Creación manejada por CreateUserDialog

  // Actualización migrada a EditUserDialog

  // Submit eliminado; creación/edición via modales

  async function handleDeactivate(usuario: Usuario) {
    if (currentUserId && currentUserId === usuario.id) {
      toast.error("No puedes desactivar tu propia cuenta");
      return;
    }
    setDeactivatingId(usuario.id);
    try {
      await deactivateUsuario(usuario.id);
      setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id));
      // Ya no se mantiene selección de edición
      toast.success("Usuario desactivado");
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "No se pudo desactivar";
      toast.error(message);
    } finally {
      setDeactivatingId(null);
    }
  }

  function handleReload() {
    void fetchUsuarios();
  }

  const columns = useMemo<ColumnDef<Usuario>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => row.original.nombre?.trim() || "—",
        // Búsqueda combinada por Nombre/Email
        filterFn: (row, _id, val?: string) => {
          const q = (val ?? "").toString().toLowerCase();
          if (!q) return true;
          const nombre = (row.original.nombre ?? "").toLowerCase();
          const email = (row.original.email ?? "").toLowerCase();
          return nombre.includes(q) || email.includes(q);
        },
      },
      {
        accessorKey: "rol",
        header: "Rol",
        cell: ({ row }) => (
          <Badge variant={row.original.rol === "admin" ? "default" : "secondary"}>
            {rolLabels[row.original.rol]}
          </Badge>
        ),
        filterFn: (row, _id, val?: RolUsuario | "all") => {
          if (!val || val === "all") return true;
          return row.original.rol === val;
        },
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
                    setEditingUsuario(row.original);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deactivatingId === row.original.id || currentUserId === row.original.id}
                  onSelect={() => {
                    if (deactivatingId === row.original.id || currentUserId === row.original.id) return;
                    setConfirmUsuario(row.original);
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
    [deactivatingId, currentUserId]
  );

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Formulario eliminado: la creación y edición se realizan con modales */}

      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Usuarios</div>
        <div className="flex items-center gap-2">
          <CreateUserDialog
            onCreated={(created) =>
              setUsuarios((prev) => sortByEmail([...prev, created]))
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando usuarios...
        </div>
      ) : error ? (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-sm text-muted-foreground">No hay usuarios activos.</div>
      ) : (
        <EntityDataTable
          columns={columns}
          data={usuarios}
          searchKey="nombre"
          toolbarRender={(table) => (
            <div className="flex items-center gap-2">
              {/* Filtro por Rol */}
              <Select
                value={(table.getColumn("rol")?.getFilterValue() as any) ?? undefined}
                onValueChange={(v) => table.getColumn("rol")?.setFilterValue(v === "all" ? "all" : v)}
              >
                <SelectTrigger size="default" className="h-9 w-44">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      )}
      {/* Modales controlados de forma externa para evitar cierre al abrir desde el menú */}
      {editingUsuario && (
        <EditUserDialog
          usuario={editingUsuario}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingUsuario(null);
          }}
          onUpdated={(updated) =>
            setUsuarios((prev) =>
              sortByEmail(prev.map((item) => (item.id === updated.id ? updated : item)))
            )
          }
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open);
          if (!open) setConfirmUsuario(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUsuario
                ? `¿Desactivar al usuario "${confirmUsuario.email}"? Podrás asignarlo nuevamente si lo necesitas.`
                : "¿Desactivar el usuario seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmUsuario) {
                  handleDeactivate(confirmUsuario);
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

export default UsuariosPage;
