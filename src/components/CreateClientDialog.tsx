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
import ClientForm from "@/components/ClientForm";
import { toast } from "sonner";
import { createCliente, type Cliente, type ClienteCreateInput } from "@/services/clientes";

const createClientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  documento_identidad: z
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

type CreateClientFormValues = z.infer<typeof createClientSchema>;

type CreateClientDialogProps = {
  onCreated?: (cliente: Cliente) => void;
  children?: React.ReactNode;
};

export default function CreateClientDialog({ onCreated, children }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { nombre: "", documento_identidad: "", email: "", telefono: "", direccion: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ nombre: "", documento_identidad: "", email: "", telefono: "", direccion: "" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateClientFormValues) {
    try {
      const payload: ClienteCreateInput = {
        nombre: values.nombre.trim(),
        documento_identidad: values.documento_identidad?.trim() ? values.documento_identidad.trim() : undefined,
        email: values.email?.trim() ? values.email.trim() : undefined,
        telefono: values.telefono?.trim() ? values.telefono.trim() : undefined,
        direccion: values.direccion?.trim() ? values.direccion.trim() : undefined,
      };

      const created = await createCliente(payload);
      toast.success("Cliente creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "Error al crear el cliente";
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
<Plus className="mr-2 size-4" /> Crear Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear cliente</DialogTitle>
          <DialogDescription>Completa los datos para registrar un nuevo cliente.</DialogDescription>
        </DialogHeader>
        <ClientForm form={form} onSubmit={onSubmit} submitLabel="Crear" />
      </DialogContent>
    </Dialog>
  );
}