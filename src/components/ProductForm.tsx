import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";
import type { Categoria } from "@/services/categorias";

type ProductFormProps<TValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TValues, any, TValues>;
  onSubmit: (values: TValues) => void;
  submitLabel?: string;
  categorias?: Categoria[];
  categoriasLoading?: boolean;
};

export default function ProductForm<TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel = "Guardar",
  categorias = [],
  categoriasLoading = false,
}: ProductFormProps<TValues>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Nombre */}
          <FormField
            control={form.control}
            name={"nombre" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Taladro percutor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

       <FormField
  control={form.control}
  name={"imagen" as FieldPath<TValues>}
  render={({ field }) => (
    <FormItem className="lg:row-span-2">
      <FormLabel>Imagen</FormLabel>

      <FormControl>
        <div className="flex flex-col items-center gap-2">
          {/* INPUT REAL OCULTO */}
          <input
            id="imagen-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => field.onChange(e.target.files?.[0])}
          />

          {/* BOTÓN PERSONALIZADO */}
          <button
            type="button"
            onClick={() => document.getElementById("imagen-input")?.click()}
            className="px-4 py-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Seleccionar imagen
          </button>

          {/* PREVIEW */}
          {field.value ? (
            <img
              src={URL.createObjectURL(field.value)}
              className="h-24 w-24 rounded-md object-cover  border"
            />
          ) : (
            <div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
      </FormControl>

      <FormMessage />
    </FormItem>
  )}
/>



          {/* SKU (opcional) */}
          <FormField
            control={form.control}
            name={"sku" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción (opcional) */}
          <FormField
            control={form.control}
            name={"descripcion" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Detalle del producto"
                    rows={3}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref as any}
                    className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Precio de venta */}
          <FormField
            control={form.control}
            name={"precio_venta" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de venta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value == null ? "" : (field.value as number)}
                    onChange={(e) =>
                      field.onChange(
                        e.currentTarget.value === "" ? undefined : e.currentTarget.valueAsNumber
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Costo de compra (opcional) */}
          <FormField
            control={form.control}
            name={"costo_compra" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de compra</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value == null ? "" : (field.value as number)}
                    onChange={(e) => field.onChange(e.currentTarget.value === "" ? undefined : e.currentTarget.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="Opcional"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock mínimo (opcional) */}
          <FormField
            control={form.control}
            name={"stock_minimo" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock mínimo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={field.value == null ? "" : (field.value as number)}
                    onChange={(e) => field.onChange(e.currentTarget.value === "" ? undefined : e.currentTarget.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="Opcional"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoría (opcional) */}
          <FormField
            control={form.control}
            name={"categoria_id" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Select
                    value={field.value == null ? "" : String(field.value)}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : Number(val))
                    }
                    disabled={categoriasLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriasLoading ? "Cargando…" : "Sin categoría"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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