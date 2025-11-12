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
import CategoryForm from "@/components/CategoryForm";
import { toast } from "sonner";
import { updateCategoria, type Categoria, type CategoriaUpdateInput } from "@/services/categorias";
import { Pencil } from "lucide-react";

const updateCategorySchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;

type EditCategoryDialogProps = {
  categoria: Categoria;
  onUpdated?: (categoria: Categoria) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function EditCategoryDialog({ categoria, onUpdated, children, open: controlledOpen, onOpenChange }: EditCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const form = useForm<UpdateCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({ nombre: categoria.nombre, descripcion: categoria.descripcion ?? "" });
    }
  }, [open, categoria, form]);

  async function onSubmit(values: UpdateCategoryFormValues) {
    try {
      const payload: CategoriaUpdateInput = {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || undefined,
      };
      const updated = await updateCategoria(categoria.id, payload);
      toast.success("Categoría actualizada");
      onUpdated?.(updated);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "No se pudo actualizar";
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
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>Actualiza los datos de la categoría seleccionada.</DialogDescription>
        </DialogHeader>
        <CategoryForm form={form} onSubmit={onSubmit} submitLabel="Actualizar" />
      </DialogContent>
    </Dialog>
  );
}