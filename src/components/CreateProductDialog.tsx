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
import { Plus } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { toast } from "sonner";
import { createProducto, type Producto, type ProductoCreateInput } from "@/services/productos";
import { listCategorias, type Categoria } from "@/services/categorias";

const createProductSchema = z.object({
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

type CreateProductFormValues = z.infer<typeof createProductSchema>;

type CreateProductDialogProps = {
  onCreated?: (producto: Producto) => void;
  children?: React.ReactNode;
};

export default function CreateProductDialog({ onCreated, children }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasLoading, setCategoriasLoading] = useState(false);

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      nombre: "",
      sku: "",
      descripcion: "",
      precio_venta: 0,
      costo_compra: undefined,
      stock_minimo: undefined,
      categoria_id: undefined,
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
        nombre: "",
        sku: "",
        descripcion: "",
        precio_venta: 0,
        costo_compra: undefined,
        stock_minimo: undefined,
        categoria_id: undefined,
      });
    }
  }, [open, form]);

  async function onSubmit(values: CreateProductFormValues) {
    try {
      const payload: ProductoCreateInput = {
        nombre: values.nombre.trim(),
        precio_venta: values.precio_venta,
        stock: 0,
      };

      const skuTrim = (values.sku ?? "").trim();
      if (skuTrim) payload.sku = skuTrim;

      const descTrim = (values.descripcion ?? "").trim();
      if (descTrim) payload.descripcion = descTrim;

      if (values.costo_compra !== undefined) payload.costo_compra = values.costo_compra;
      if (values.stock_minimo !== undefined) payload.stock_minimo = values.stock_minimo;
      if (values.categoria_id !== undefined) payload.categoria_id = values.categoria_id;

      const created = await createProducto(payload);
      // Completar nombre de categoría inmediatamente si el backend no lo devuelve poblado
      const catId = created.categoria_id ?? null;
      const cat = catId != null ? categorias.find((c) => c.id === catId) : null;
      const createdWithCategoria: Producto = {
        ...created,
        categoria: created.categoria ?? (cat ? { nombre: cat.nombre } : null),
      };
      toast.success("Producto creado correctamente");
      onCreated?.(createdWithCategoria);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "Error al crear el producto";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button>
<Plus className="mr-2 size-4" /> Crear Producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear producto</DialogTitle>
          <DialogDescription>Completa los datos para registrar un nuevo producto.</DialogDescription>
        </DialogHeader>
        <ProductForm form={form} onSubmit={onSubmit} submitLabel="Crear" categorias={categorias} categoriasLoading={categoriasLoading} />
      </DialogContent>
    </Dialog>
  );
}