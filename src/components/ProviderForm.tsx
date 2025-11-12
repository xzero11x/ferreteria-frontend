import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";

type ProviderFormProps<TValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TValues, any, TValues>;
  onSubmit: (values: TValues) => void;
  submitLabel?: string;
};

export default function ProviderForm<TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel = "Guardar",
}: ProviderFormProps<TValues>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          {/* Nombre (requerido) */}
          <FormField
            control={form.control}
            name={"nombre" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre o razón social</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Ferretería Suministros S.A." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RUC / Documento (opcional) */}
          <FormField
            control={form.control}
            name={"ruc_identidad" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUC / Documento</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" value={(field.value as any) ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref as any} />
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
                  <Input type="email" placeholder="Opcional" value={(field.value as any) ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref as any} />
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
                  <Input placeholder="Opcional" value={(field.value as any) ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref as any} />
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
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Opcional"
                    rows={3}
                    value={(field.value as any) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref as any}
                    className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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