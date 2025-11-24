/**
 * AdminCajasPage - Gestión de Cajas Físicas
 * 
 * Las cajas son entidades FIJAS que representan puntos de venta físicos.
 * Creadas una sola vez por el administrador al configurar el negocio.
 * 
 * Ejemplo: "Caja Principal", "Caja Secundaria", "Caja Patio"
 * 
 * Los cajeros NO crean cajas, solo las USAN al abrir su turno.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useGetApiCajas,
  usePostApiCajas,
  usePutApiCajasId,
  useDeleteApiCajasId,
} from '@/api/generated/cajas/cajas';
import { toast } from 'sonner';
import { Loader2, Plus, Store, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import type { Caja } from '@/api/generated/model';

const cajaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
});

type CajaFormValues = z.infer<typeof cajaSchema>;

export default function AdminCajasPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [deletingCaja, setDeletingCaja] = useState<Caja | null>(null);

  const { data: cajasResponse, isLoading, error: loadError, refetch } = useGetApiCajas(
    { includeInactive: 'true' },
    {}
  );
  const cajas = cajasResponse?.data ?? [];

  // Mostrar error de carga
  if (loadError) {
    console.error('Error al cargar cajas:', loadError);
  }

  const { mutateAsync: createCaja } = usePostApiCajas();
  const { mutateAsync: updateCaja } = usePutApiCajasId();
  const { mutateAsync: deleteCaja } = useDeleteApiCajasId();

  const createForm = useForm<CajaFormValues>({
    resolver: zodResolver(cajaSchema),
    defaultValues: {
      nombre: '',
    },
  });

  const editForm = useForm<CajaFormValues>({
    resolver: zodResolver(cajaSchema),
  });

  const handleCreate = async (data: CajaFormValues) => {
    try {
      const response = await createCaja({
        data: {
          nombre: data.nombre,
        },
      });

      console.log('Caja creada:', response);

      toast.success('Caja creada exitosamente', {
        description: `La caja "${data.nombre}" está lista para usarse`,
      });

      setShowCreateDialog(false);
      createForm.reset();
      await refetch();
    } catch (error: unknown) {
      console.error('Error al crear caja:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al crear caja', {
        description: errorMessage,
      });
    }
  };

  const handleOpenEdit = (caja: Caja) => {
    setEditingCaja(caja);
    editForm.reset({
      nombre: caja.nombre,
    });
  };

  const handleEdit = async (data: CajaFormValues) => {
    if (!editingCaja) return;

    try {
      await updateCaja({
        id: editingCaja.id,
        data: {
          nombre: data.nombre,
        },
      });

      toast.success('Caja actualizada', {
        description: `La caja se renombró a "${data.nombre}"`,
      });

      setEditingCaja(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al actualizar caja', {
        description: errorMessage,
      });
    }
  };

  const handleToggleActive = async (caja: Caja) => {
    try {
      await updateCaja({
        id: caja.id,
        data: {
          nombre: caja.nombre,
          isActive: !caja.isActive,
        },
      });

      const newStatus = !caja.isActive ? 'activada' : 'desactivada';
      toast.success(`Caja ${newStatus}`, {
        description: caja.isActive
          ? 'Los cajeros ya no podrán seleccionar esta caja'
          : 'Los cajeros pueden volver a usar esta caja',
      });

      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al cambiar estado', {
        description: errorMessage,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCaja) return;

    try {
      await deleteCaja({
        id: deletingCaja.id,
      });

      toast.success('Caja eliminada', {
        description: `La caja "${deletingCaja.nombre}" fue eliminada permanentemente`,
      });

      setDeletingCaja(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al eliminar caja', {
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="size-6 text-primary" />
                Gestión de Cajas
              </CardTitle>
              <CardDescription className="mt-2">
                Las cajas son puntos de venta físicos creados una sola vez al configurar el negocio.
                Los cajeros seleccionan una caja existente al abrir su turno.
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Nueva Caja
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Caja</DialogTitle>
                  <DialogDescription>
                    Define el nombre del punto de venta físico (ej: "Caja Principal", "Caja Patio").
                  </DialogDescription>
                </DialogHeader>

                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Caja</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej: Caja Principal"
                              autoFocus
                            />
                          </FormControl>
                          <FormDescription>
                            Nombre descriptivo del punto de venta
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Plus className="mr-2 size-4" />
                        Crear Caja
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {cajas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="size-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">No hay cajas configuradas</p>
              <p className="text-sm mb-4">
                Crea al menos una caja para que los cajeros puedan abrir turnos
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 size-4" />
                Crear Primera Caja
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-left">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cajas.map((caja: Caja) => (
                  <TableRow key={caja.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      #{caja.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="size-4 text-primary" />
                        <span className="font-medium">{caja.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {caja.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          <Power className="mr-1 size-3" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <PowerOff className="mr-1 size-3" />
                          Inactiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-start gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(caja)}
                        >
                          <Pencil className="mr-2 size-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant={caja.isActive ? 'outline' : 'default'}
                          onClick={() => handleToggleActive(caja)}
                        >
                          {caja.isActive ? (
                            <>
                              <PowerOff className="mr-2 size-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 size-4" />
                              Activar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingCaja(caja)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      <Dialog open={!!editingCaja} onOpenChange={() => setEditingCaja(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Caja</DialogTitle>
            <DialogDescription>
              Modifica el nombre del punto de venta
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Caja</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Caja Principal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCaja(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Pencil className="mr-2 size-4" />
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Eliminación */}
      <AlertDialog open={!!deletingCaja} onOpenChange={() => setDeletingCaja(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar caja permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la caja <strong>"{deletingCaja?.nombre}"</strong>.
              <br />
              <br />
              ⚠️ Esta acción NO se puede deshacer. Si esta caja tiene sesiones históricas,
              podrían quedar referencias huérfanas.
              <br />
              <br />
              Recomendación: En lugar de eliminar, considera <strong>desactivarla</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-2 size-4" />
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
