import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_official/form";
import { Input } from "@/components/ui_official/input";
import { Button } from "@/components/ui_official/button";
import { Textarea } from "@/components/ui_official/textarea";
import type { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";

type ClientFormProps<TValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TValues, any, TValues>;
  onSubmit: (values: TValues) => void;
  submitLabel?: string;
};

export default function ClientForm<TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel = "Guardar",
}: ClientFormProps<TValues>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre (requerido) */}
          <FormField
            control={form.control}
            name={"nombre" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Documento de identidad (opcional) */}
          <FormField
            control={form.control}
            name={"documento_identidad" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento de identidad</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RUC (opcional) */}
          <FormField
            control={form.control}
            name={"ruc" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUC</FormLabel>
                <FormControl>
                  <Input placeholder="11 dígitos (opcional)" maxLength={11} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Razón Social (opcional, requerido si tiene RUC) */}
          <FormField
            control={form.control}
            name={"razon_social" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl>
                  <Input placeholder="Requerido si tiene RUC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email (opcional) */}
          <FormField
            control={form.control}
            name={"email" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teléfono (opcional) */}
          <FormField
            control={form.control}
            name={"telefono" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dirección (opcional) */}
          <FormField
            control={form.control}
            name={"direccion" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Dirección completa..."
                    rows={3}
                    value={(field.value as any) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref as any}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
