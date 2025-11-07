import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  RolUsuario,
  Usuario,
  UsuarioCreateInput,
  UsuarioUpdateInput,
} from "@/services/usuarios";
import {
  createUsuario,
  deactivateUsuario,
  listUsuarios,
  updateUsuario,
} from "@/services/usuarios";

const rolLabels: Record<RolUsuario, string> = {
  admin: "Administrador",
  empleado: "Empleado",
};

type UsuarioFormState = {
  email: string;
  nombre: string;
  password: string;
  rol: RolUsuario;
};

const initialForm: UsuarioFormState = {
  email: "",
  nombre: "",
  password: "",
  rol: "empleado",
};

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
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const [form, setForm] = useState<UsuarioFormState>(initialForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Usuario | null>(null);

  const isEditing = useMemo(() => mode === "edit" && !!selected, [mode, selected]);

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

  function resetForm() {
    setForm(initialForm);
    setMode("create");
    setSelected(null);
  }

  function handleEdit(usuario: Usuario) {
    setSelected(usuario);
    setForm({
      email: usuario.email,
      nombre: usuario.nombre ?? "",
      password: "",
      rol: usuario.rol,
    });
    setMode("edit");
  }

  function buildCreatePayload(): UsuarioCreateInput {
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    if (!email) {
      throw new Error("El email es obligatorio");
    }
    if (!password) {
      throw new Error("La contraseña es obligatoria");
    }
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
    const payload: UsuarioCreateInput = {
      email,
      password,
      rol: form.rol,
    };
    const nombre = form.nombre.trim();
    return nombre ? { ...payload, nombre } : payload;
  }

  function buildUpdatePayload(): UsuarioUpdateInput {
    const email = form.email.trim().toLowerCase();
    if (!email) {
      throw new Error("El email es obligatorio");
    }
    const nombre = form.nombre.trim();
    const password = form.password.trim();
    if (password && password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
    const payload: UsuarioUpdateInput = {
      email,
      rol: form.rol,
    };
    if (form.nombre === "") {
      payload.nombre = "";
    } else if (nombre) {
      payload.nombre = nombre;
    }
    if (password) {
      payload.password = password;
    }
    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (isEditing && selected) {
        const payload = buildUpdatePayload();
        const updated = await updateUsuario(selected.id, payload);
        setUsuarios((prev) =>
          sortByEmail(prev.map((item) => (item.id === updated.id ? updated : item)))
        );
        toast.success("Usuario actualizado");
      } else {
        const payload = buildCreatePayload();
        const created = await createUsuario(payload);
        setUsuarios((prev) => sortByEmail([...prev, created]));
        toast.success("Usuario creado");
      }
      resetForm();
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "Error al guardar";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(usuario: Usuario) {
    if (currentUserId && currentUserId === usuario.id) {
      toast.error("No puedes desactivar tu propia cuenta");
      return;
    }
    const confirmed = window.confirm(
      `¿Desactivar al usuario "${usuario.email}"? Podrás asignarlo nuevamente si lo necesitas.`
    );
    if (!confirmed) return;
    setDeactivatingId(usuario.id);
    try {
      await deactivateUsuario(usuario.id);
      setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id));
      if (selected?.id === usuario.id) {
        resetForm();
      }
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

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {isEditing ? "Editar usuario" : "Crear usuario"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="empleado@empresa.com"
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nombre: event.target.value }))
                }
                placeholder="Opcional"
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={form.rol}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, rol: value as RolUsuario }))
                }
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva contraseña" : "Contraseña"}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={isEditing ? "Dejar en blanco para mantener" : "Mínimo 6 caracteres"}
                disabled={saving}
                required={!isEditing}
                minLength={isEditing ? undefined : 6}
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
                    Actualizar usuario
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="size-4" />
                    Crear usuario
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
          <CardTitle className="text-lg font-semibold">Usuarios activos</CardTitle>
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
              Cargando usuarios...
            </div>
          ) : error ? (
            <div className="text-sm text-red-600" aria-live="assertive">
              {error}
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay usuarios activos.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="w-40 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.id}</TableCell>
                      <TableCell className="font-medium">{usuario.email}</TableCell>
                      <TableCell>{usuario.nombre?.trim() || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.rol === "admin" ? "default" : "secondary"}>
                          {rolLabels[usuario.rol]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                          >
                            <Pencil className="mr-1 size-4" /> Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivate(usuario)}
                            disabled={
                              deactivatingId === usuario.id || currentUserId === usuario.id
                            }
                          >
                            {deactivatingId === usuario.id ? (
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

export default UsuariosPage;
