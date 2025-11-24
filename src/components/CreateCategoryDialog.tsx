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
import CategoryForm from "@/components/CategoryForm";
import { toast } from "sonner";
import { createCategoria, type Categoria } from "@/services/categorias";

const createCategorySchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

type CreateCategoryDialogProps = {
  onCreated?: (categoria: Categoria) => void;
};

export default function CreateCategoryDialog({ onCreated }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ nombre: "", descripcion: "" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateCategoryFormValues) {
    try {
      const payload = {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || undefined,
      };
      const created = await createCategoria(payload);
      toast.success("Categoría creada");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "No se pudo crear la categoría";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
<Plus className="mr-2 size-4" /> Crear Categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear categoría</DialogTitle>
          <DialogDescription>Completa los datos para registrar una nueva categoría.</DialogDescription>
        </DialogHeader>
        <CategoryForm form={form} onSubmit={onSubmit} submitLabel="Crear" />
      </DialogContent>
    </Dialog>
  );
}