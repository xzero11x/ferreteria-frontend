/**
 * AperturaCajaModal - Modal de apertura de caja (SIN botón de cerrar - Bloqueo Total)
 * 
 * Según doc_funcional_caja.md Paso A:
 * "Opción A: Se presenta un Modal sin botón de cerrar"
 * "Usuario no puede proceder hasta abrir turno"
 * 
 * Interfaz:
 * - Selector (Dropdown): Lista de cajas disponibles
 * - Campo numérico: "Monto de Inicio (Sencillo)"
 * - Botón: "ABRIR TURNO"
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGetApiCajas } from '@/api/generated/cajas/cajas';
import { usePostApiSesionesCajaApertura } from '@/api/generated/sesiones-de-caja/sesiones-de-caja';
import { useCaja } from '@/context/CajaContext';
import { toast } from 'sonner';
import type { SesionCaja } from '@/api/generated/model';

const aperturaSchema = z.object({
  caja_id: z.number({
    message: 'Debes seleccionar una caja',
  }),
  monto_inicial: z
    .string()
    .min(1, 'El monto inicial es requerido')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
});

type AperturaFormValues = z.infer<typeof aperturaSchema>;

interface AperturaCajaModalProps {
  open: boolean;
}

export function AperturaCajaModal({ open }: AperturaCajaModalProps) {
  const { setCurrentSession } = useCaja();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consultar cajas disponibles (solo activas)
  const { data: cajasResponse, isLoading: loadingCajas } = useGetApiCajas();
  const cajas = (cajasResponse?.data ?? []).filter((c: { isActive: boolean }) => c.isActive);

  // Mutation para apertura
  const { mutateAsync: abrirCaja } = usePostApiSesionesCajaApertura();

  const form = useForm<AperturaFormValues>({
    resolver: zodResolver(aperturaSchema),
    defaultValues: {
      monto_inicial: '100.00',
    },
  });

  const onSubmit = async (data: AperturaFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await abrirCaja({
        data: {
          caja_id: data.caja_id,
          monto_inicial: Number(data.monto_inicial),
        },
      });

      // Actualizar contexto con la sesión recién creada
      setCurrentSession(response as SesionCaja);

      toast.success('Caja abierta exitosamente', {
        description: `Turno iniciado con S/ ${data.monto_inicial}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Validación específica: Caja Ocupada (doc_funcional_caja.md Sección 4)
      if (errorMessage.includes('ya está siendo usada')) {
        toast.error('🛑 Caja Ocupada', {
          description: errorMessage,
          duration: 8000,
        });
      } else {
        toast.error('Error al abrir caja', {
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      {/* onOpenChange vacío previene cierre por ESC o click fuera */}
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Apertura de Caja</DialogTitle>
          <DialogDescription>
            Debes abrir un turno antes de realizar ventas. Cuenta el dinero inicial (sencillo) que
            tienes en el cajón.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="caja_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caja</FormLabel>
                  <Select
                    disabled={loadingCajas || isSubmitting}
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una caja" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cajas.map((caja: { id: number; nombre: string }) => (
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

            <FormField
              control={form.control}
              name="monto_inicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de Inicio (Sencillo)</FormLabel>
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
                        placeholder="100.00"
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Abriendo...' : 'ABRIR TURNO'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
