import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/ProductForm";
import { toast } from "sonner";
import { updateProducto, type Producto, type ProductoUpdateInput } from "@/services/productos";
import { listCategorias, type Categoria } from "@/services/categorias";
import { Pencil } from "lucide-react";

const editProductSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  sku: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
  precio_venta: z.number().positive("Debe ser mayor a 0"),
  costo_compra: z.number().positive().optional(),
  stock_minimo: z.number().int().min(0).optional(),
  categoria_id: z.number().int().min(1).nullable().optional(),
});

type EditProductFormValues = z.infer<typeof editProductSchema>;

type EditProductDialogProps = {
  producto: Producto;
  onUpdated?: (producto: Producto) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export default function EditProductDialog({ producto, onUpdated, children, open: controlledOpen, onOpenChange }: EditProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasLoading, setCategoriasLoading] = useState(false);

  const form = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      nombre: producto.nombre,
      sku: producto.sku ?? "",
      descripcion: producto.descripcion ?? "",
      precio_venta: Number(producto.precio_venta),
      costo_compra: producto.costo_compra != null ? Number(producto.costo_compra) : undefined,
      stock_minimo: producto.stock_minimo != null ? Number(producto.stock_minimo) : undefined,
      categoria_id: producto.categoria_id,
    },
    mode: "onChange",
  });

  useEffect(() => {
    async function fetchCategorias() {
      setCategoriasLoading(true);
      try {
        const data = await listCategorias();
        setCategorias(data);
      } catch (err: any) {
        const message = err?.body?.message || err?.message || "No se pudieron cargar las categorías";
        toast.error(message);
      } finally {
        setCategoriasLoading(false);
      }
    }
    if (open) void fetchCategorias();
  }, [open]);

  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: producto.nombre,
        sku: producto.sku ?? "",
        descripcion: producto.descripcion ?? "",
        precio_venta: Number(producto.precio_venta),
        costo_compra: producto.costo_compra != null ? Number(producto.costo_compra) : undefined,
        stock_minimo: producto.stock_minimo != null ? Number(producto.stock_minimo) : undefined,
        categoria_id: producto.categoria_id,
      });
    }
  }, [open, form, producto.nombre, producto.sku, producto.descripcion, producto.precio_venta, producto.costo_compra, producto.stock_minimo, producto.categoria_id]);

  async function onSubmit(values: EditProductFormValues) {
    try {
      const payload: ProductoUpdateInput = {
        nombre: values.nombre.trim(),
        precio_venta: values.precio_venta,
      };

      // Limpiar/actualizar cadenas opcionales
      const skuTrim = (values.sku ?? "").trim();
      if (values.sku === "") payload.sku = ""; // limpiar explícito
      else if (skuTrim) payload.sku = skuTrim;

      const descTrim = (values.descripcion ?? "").trim();
      if (values.descripcion === "") payload.descripcion = ""; // limpiar explícito
      else if (descTrim) payload.descripcion = descTrim;

      if (values.costo_compra !== undefined) payload.costo_compra = values.costo_compra;
      if (values.stock_minimo !== undefined) payload.stock_minimo = values.stock_minimo;
      // Enviar null para remover categoría
      if (values.categoria_id !== undefined) payload.categoria_id = values.categoria_id;

      const updated = await updateProducto(producto.id, payload);
      // Completar nombre de categoría inmediatamente si el backend no lo devuelve poblado
      const catId = updated.categoria_id ?? null;
      const cat = catId != null ? categorias.find((c) => c.id === catId) : null;
      const updatedWithCategoria: Producto = {
        ...updated,
        categoria: updated.categoria ?? (cat ? { nombre: cat.nombre } : null),
      };
      toast.success("Producto actualizado correctamente");
      onUpdated?.(updatedWithCategoria);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "Error al actualizar el producto";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>Actualiza los datos del producto seleccionado.</DialogDescription>
        </DialogHeader>
        <ProductForm form={form} onSubmit={onSubmit} submitLabel="Actualizar" categorias={categorias} categoriasLoading={categoriasLoading} />
      </DialogContent>
    </Dialog>
  );
}