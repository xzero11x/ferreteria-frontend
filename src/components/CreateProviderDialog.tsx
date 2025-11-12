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
import ProviderForm from "@/components/ProviderForm";
import { toast } from "sonner";
import { createProveedor, type Proveedor, type ProveedorCreateInput } from "@/services/proveedores";

const createProviderSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  ruc_identidad: z
    .string()
    .trim()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  telefono: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

type CreateProviderFormValues = z.infer<typeof createProviderSchema>;

type CreateProviderDialogProps = {
  onCreated?: (proveedor: Proveedor) => void;
  children?: React.ReactNode;
};

export default function CreateProviderDialog({ onCreated, children }: CreateProviderDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateProviderFormValues>({
    resolver: zodResolver(createProviderSchema),
    defaultValues: { nombre: "", ruc_identidad: "", email: "", telefono: "", direccion: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ nombre: "", ruc_identidad: "", email: "", telefono: "", direccion: "" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateProviderFormValues) {
    try {
      const payload: ProveedorCreateInput = {
        nombre: values.nombre.trim(),
        ruc_identidad: values.ruc_identidad?.trim() ? values.ruc_identidad.trim() : undefined,
        email: values.email?.trim() ? values.email.trim() : undefined,
        telefono: values.telefono?.trim() ? values.telefono.trim() : undefined,
        direccion: values.direccion?.trim() ? values.direccion.trim() : undefined,
      };

      const created = await createProveedor(payload);
      toast.success("Proveedor creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "Error al crear el proveedor";
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
<Plus className="mr-2 size-4" /> Crear Proveedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear proveedor</DialogTitle>
          <DialogDescription>Completa los datos para registrar un nuevo proveedor.</DialogDescription>
        </DialogHeader>
        <ProviderForm form={form} onSubmit={onSubmit} submitLabel="Crear" />
      </DialogContent>
    </Dialog>
  );
}