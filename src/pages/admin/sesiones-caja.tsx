/**
 * AdminSesionesView - Página de administración de sesiones de caja
 * 
 * Según doc_funcional_caja.md Sección 4 (Cierre Forzoso):
 * "Supervisor/Administrador ingresa con permisos elevados"
 * "Accede a menú 'Cajas' → 'Sesiones Activas'"
 * "Identifica la sesión zombie de Pedro"
 * "Ejecuta 'Cierre Forzoso': Cuenta el dinero físico, ingresa monto real"
 * "Sistema calcula diferencia y cierra la sesión"
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetApiSesionesCajaHistorial, usePostApiSesionesCajaIdCierreAdministrativo } from '@/api/generated/sesiones-de-caja/sesiones-de-caja';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ShieldAlert, Calendar, User, Wallet } from 'lucide-react';
import type { SesionCaja } from '@/api/generated/model';

const cierreAdministrativoSchema = z.object({
  monto_final: z
    .string()
    .min(1, 'El monto final es requerido')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
});

type CierreAdministrativoFormValues = z.infer<typeof cierreAdministrativoSchema>;

export default function AdminSesionesPage() {
  const [selectedSesion, setSelectedSesion] = useState<SesionCaja | null>(null);
  const [showCierreModal, setShowCierreModal] = useState(false);

  const { data: sesionesResponse, isLoading, refetch } = useGetApiSesionesCajaHistorial();
  const sesiones = (sesionesResponse?.data ?? []).filter((s: { estado: string }) => s.estado === 'ABIERTA');

  const { mutateAsync: cerrarAdministrativamente } = usePostApiSesionesCajaIdCierreAdministrativo();

  const form = useForm<CierreAdministrativoFormValues>({
    resolver: zodResolver(cierreAdministrativoSchema),
    defaultValues: {
      monto_final: '',
      motivo: '',
    },
  });

  const handleOpenCierreModal = (sesion: SesionCaja) => {
    setSelectedSesion(sesion);
    form.reset({
      monto_final: '',
      motivo: `Cierre administrativo: Usuario ${sesion.usuario?.nombre ?? 'desconocido'} no cerró su turno`,
    });
    setShowCierreModal(true);
  };

  const handleCierreAdministrativo = async (data: CierreAdministrativoFormValues) => {
    if (!selectedSesion) return;

    try {
      await cerrarAdministrativamente({
        id: selectedSesion.id,
        data: {
          monto_final: Number(data.monto_final),
          motivo: data.motivo,
        },
      });

      toast.success('Sesión cerrada administrativamente', {
        description: `Sesión de ${selectedSesion.usuario?.nombre ?? 'usuario'} cerrada con éxito`,
      });

      setShowCierreModal(false);
      setSelectedSesion(null);
      form.reset();
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al cerrar sesión', {
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
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-6 text-amber-600" />
            Administración de Sesiones de Caja
          </CardTitle>
          <CardDescription>
            Vista de supervisores para gestionar sesiones abiertas y ejecutar cierres administrativos cuando un usuario no cierra su turno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sesiones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="size-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No hay sesiones activas</p>
              <p className="text-sm">Todas las cajas están cerradas correctamente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Monto Inicial</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-left">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sesiones.map((sesion: SesionCaja) => (
                  <TableRow key={sesion.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">{sesion.usuario?.nombre ?? 'Usuario'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sesion.caja?.nombre ?? 'Caja'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="size-4 text-muted-foreground" />
                        {new Date(sesion.fecha_apertura).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      S/ {Number(sesion.monto_inicial ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono">
                      S/ {Number(sesion.total_ventas ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">
                        {sesion.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenCierreModal(sesion)}
                      >
                        <AlertTriangle className="mr-2 size-4" />
                        Cierre Forzoso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cierre Administrativo */}
      <Dialog open={showCierreModal} onOpenChange={setShowCierreModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              Cierre Administrativo
            </DialogTitle>
            <DialogDescription>
              Estás por cerrar forzosamente la sesión de{' '}
              <span className="font-semibold">{selectedSesion?.usuario?.nombre}</span>. Cuenta el
              dinero físico que hay en el cajón e ingresa el monto exacto.
            </DialogDescription>
          </DialogHeader>

          {selectedSesion && (
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Inicial:</span>
                <span className="font-medium">S/ {Number(selectedSesion.monto_inicial ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Ventas:</span>
                <span className="font-medium text-green-600">
                  + S/ {Number(selectedSesion.total_ventas ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Egresos:</span>
                <span className="font-medium text-red-600">
                  - S/ {Number(selectedSesion.total_egresos ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Esperado:</span>
                <span className="font-bold">
                  S/{' '}
                  {(
                    Number(selectedSesion.monto_inicial ?? 0) +
                    Number(selectedSesion.total_ventas ?? 0) -
                    Number(selectedSesion.total_egresos ?? 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCierreAdministrativo)} className="space-y-4">
              <FormField
                control={form.control}
                name="monto_final"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Real (Contado Físicamente)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          S/
                        </span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-10 text-lg font-semibold"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Cuenta los billetes y monedas del cajón</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del Cierre Administrativo</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Ej: Usuario no cerró su turno al finalizar su jornada"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>Mínimo 10 caracteres (auditoría)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCierreModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive">
                  <ShieldAlert className="mr-2 size-4" />
                  CONFIRMAR CIERRE FORZOSO
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
