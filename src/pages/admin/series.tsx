import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Plus, FileText, Receipt, FileSignature, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetApiSeries,
  usePostApiSeries,
  usePutApiSeriesId,
  useDeleteApiSeriesId,
} from '@/api/generated/series-sunat/series-sunat';
import { useGetApiCajas } from '@/api/generated/cajas/cajas';
import type { Serie, CreateSerie, UpdateSerie } from '@/api/generated/model';
import { useQueryClient } from '@tanstack/react-query';

// Schema de validación para el formulario
const serieSchema = z.object({
  codigo: z
    .string()
    .length(4, 'El código debe tener exactamente 4 caracteres')
    .regex(/^[A-Z0-9]{4}$/, 'Solo letras mayúsculas y números'),
  tipo_comprobante: z.enum(['FACTURA', 'BOLETA', 'NOTA_VENTA']),
  caja_id: z.number().nullable().optional(),
});

type SerieFormValues = z.infer<typeof serieSchema>;

const TIPO_COMPROBANTE_ICONS = {
  FACTURA: FileText,
  BOLETA: Receipt,
  NOTA_VENTA: FileSignature,
};

const TIPO_COMPROBANTE_COLORS = {
  FACTURA: 'bg-blue-100 text-blue-800',
  BOLETA: 'bg-green-100 text-green-800',
  NOTA_VENTA: 'bg-purple-100 text-purple-800',
};

export default function AdminSeriesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSerie, setEditingSerie] = useState<Serie | null>(null);
  const [deletingSerie, setDeletingSerie] = useState<Serie | null>(null);
  const queryClient = useQueryClient();

  // Fetch series y cajas
  const { data: seriesResponse, isLoading, error: loadError } = useGetApiSeries({}, {});
  const series = seriesResponse?.data ?? [];

  const { data: cajasResponse } = useGetApiCajas({ includeInactive: 'false' }, {});
  const cajas = cajasResponse?.data ?? [];

  const { mutateAsync: createSerie } = usePostApiSeries();
  const { mutateAsync: updateSerie } = usePutApiSeriesId();
  const { mutateAsync: deleteSerie } = useDeleteApiSeriesId();

  const createForm = useForm<SerieFormValues>({
    resolver: zodResolver(serieSchema),
    defaultValues: {
      codigo: '',
      tipo_comprobante: 'FACTURA',
      caja_id: null,
    },
  });

  const editForm = useForm<SerieFormValues>({
    resolver: zodResolver(serieSchema),
  });

  // Handlers
  const handleCreate = async (data: SerieFormValues) => {
    try {
      const payload: CreateSerie = {
        codigo: data.codigo.toUpperCase(),
        tipo_comprobante: data.tipo_comprobante,
        caja_id: data.caja_id ?? undefined,
        isActive: true,
      };

      await createSerie({ data: payload });
      
      toast.success('Serie creada exitosamente', {
        description: `Serie ${payload.codigo} registrada`,
      });

      setShowCreateDialog(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/series'] });
    } catch (error: any) {
      console.error('Error al crear serie:', error);
      toast.error('Error al crear serie', {
        description: error?.response?.data?.message || 'No se pudo crear la serie',
      });
    }
  };

  const handleEdit = async (data: SerieFormValues) => {
    if (!editingSerie) return;

    try {
      const payload: UpdateSerie = {
        codigo: data.codigo.toUpperCase(),
        tipo_comprobante: data.tipo_comprobante,
        caja_id: data.caja_id ?? undefined,
      };

      await updateSerie({ id: editingSerie.id, data: payload });
      
      toast.success('Serie actualizada', {
        description: `Serie ${payload.codigo} actualizada exitosamente`,
      });

      setEditingSerie(null);
      queryClient.invalidateQueries({ queryKey: ['/api/series'] });
    } catch (error: any) {
      console.error('Error al actualizar serie:', error);
      toast.error('Error al actualizar serie', {
        description: error?.response?.data?.message || 'No se pudo actualizar la serie',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingSerie) return;

    try {
      await deleteSerie({ id: deletingSerie.id });
      
      toast.success('Serie eliminada', {
        description: `Serie ${deletingSerie.codigo} eliminada exitosamente`,
      });

      setDeletingSerie(null);
      queryClient.invalidateQueries({ queryKey: ['/api/series'] });
    } catch (error: any) {
      console.error('Error al eliminar serie:', error);
      toast.error('Error al eliminar serie', {
        description: error?.response?.data?.message || 'No se pudo eliminar la serie',
      });
    }
  };

  const openEditDialog = (serie: Serie) => {
    setEditingSerie(serie);
    editForm.reset({
      codigo: serie.codigo,
      tipo_comprobante: serie.tipo_comprobante,
      caja_id: serie.caja_id ?? null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando series...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error al cargar las series</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Series de Comprobantes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las series SUNAT para facturación electrónica
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Serie
        </Button>
      </div>

      {/* Tabla de Series */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo Comprobante</TableHead>
              <TableHead>Correlativo Actual</TableHead>
              <TableHead>Caja Asignada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-left">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay series registradas. Crea tu primera serie para comenzar a facturar.
                </TableCell>
              </TableRow>
            ) : (
              series.map((serie) => {
                const Icon = TIPO_COMPROBANTE_ICONS[serie.tipo_comprobante];
                const colorClass = TIPO_COMPROBANTE_COLORS[serie.tipo_comprobante];
                const cajaAsignada = cajas.find((c) => c.id === serie.caja_id);

                return (
                  <TableRow key={serie.id}>
                    <TableCell className="font-mono font-semibold">{serie.codigo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={colorClass}>
                        <Icon className="mr-1 h-3 w-3" />
                        {serie.tipo_comprobante.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{serie.correlativo_actual.toString().padStart(8, '0')}</TableCell>
                    <TableCell>
                      {cajaAsignada ? (
                        <span className="text-sm">{cajaAsignada.nombre}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {serie.isActive ? (
                        <Badge variant="default" className="bg-green-500">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(serie)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingSerie(serie)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Crear Serie */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Serie</DialogTitle>
            <DialogDescription>
              Registra una serie de comprobantes SUNAT. Ejemplo: F001 para facturas, B001 para boletas.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="tipo_comprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comprobante</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FACTURA">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Factura (RUC 11 dígitos)
                          </div>
                        </SelectItem>
                        <SelectItem value="BOLETA">
                          <div className="flex items-center">
                            <Receipt className="mr-2 h-4 w-4" />
                            Boleta (DNI/RUC)
                          </div>
                        </SelectItem>
                        <SelectItem value="NOTA_VENTA">
                          <div className="flex items-center">
                            <FileSignature className="mr-2 h-4 w-4" />
                            Nota de Venta (Interno)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      SUNAT valida el tipo según el RUC del cliente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Serie</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="F001"
                        maxLength={4}
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      4 caracteres. Ej: F001, F002, B001, NV01
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="caja_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caja Asignada (Opcional)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === 'null' ? null : Number(val))}
                      value={field.value?.toString() ?? 'null'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Sin asignar</SelectItem>
                        {cajas.map((caja) => (
                          <SelectItem key={caja.id} value={caja.id.toString()}>
                            {caja.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Recomendado para organización fiscal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? 'Creando...' : 'Crear Serie'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Serie */}
      <Dialog open={!!editingSerie} onOpenChange={(open) => !open && setEditingSerie(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Serie</DialogTitle>
            <DialogDescription>
              Modifica los datos de la serie. El correlativo se mantiene automáticamente.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="tipo_comprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comprobante</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FACTURA">Factura</SelectItem>
                        <SelectItem value="BOLETA">Boleta</SelectItem>
                        <SelectItem value="NOTA_VENTA">Nota de Venta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Serie</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="F001"
                        maxLength={4}
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="caja_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caja Asignada</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === 'null' ? null : Number(val))}
                      value={field.value?.toString() ?? 'null'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Sin asignar</SelectItem>
                        {cajas.map((caja) => (
                          <SelectItem key={caja.id} value={caja.id.toString()}>
                            {caja.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSerie(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Eliminar */}
      <AlertDialog open={!!deletingSerie} onOpenChange={(open) => !open && setDeletingSerie(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar serie {deletingSerie?.codigo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la serie pero los comprobantes
              emitidos con ella se mantendrán registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
