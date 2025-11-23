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
} from "@/components/ui_official/dialog";
import { Button } from "@/components/ui_official/button";
import { ScrollArea } from "@/components/ui_official/scroll-area";
import { Plus } from "lucide-react";
import ClientForm from "@/components/ClientForm";
import { toast } from "sonner";
import { usePostApiClientes } from "@/api/generated/clientes/clientes";
import type { Cliente } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

const createClientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  documento_identidad: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[0-9]{8}$|^[0-9]{11}$/.test(val),
      "El documento debe ser DNI (8 dígitos) o RUC (11 dígitos)"
    )
    .optional()
    .or(z.literal("")),
  ruc: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[0-9]{11}$/.test(val),
      "El RUC debe tener 11 dígitos"
    )
    .optional()
    .or(z.literal("")),
  razon_social: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Email inválido"
    )
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
}).refine(
  (data) => {
    // Si tiene RUC, debe tener razón social
    if (data.ruc && !data.razon_social) return false;
    return true;
  },
  {
    message: "Si proporciona RUC, debe incluir la Razón Social",
    path: ["razon_social"],
  }
);

type CreateClientFormValues = z.infer<typeof createClientSchema>;

type CreateClientDialogProps = {
  onCreated?: (cliente: Cliente) => void;
  children?: React.ReactNode;
};

export default function CreateClientDialog({ onCreated, children }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: createCliente } = usePostApiClientes();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { 
      nombre: "", 
      documento_identidad: "", 
      ruc: "", 
      razon_social: "", 
      email: "", 
      telefono: "", 
      direccion: "" 
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ 
        nombre: "", 
        documento_identidad: "", 
        ruc: "", 
        razon_social: "", 
        email: "", 
        telefono: "", 
        direccion: "" 
      });
    }
  }, [open, form]);

  async function onSubmit(values: CreateClientFormValues) {
    try {
      const payload = {
        nombre: values.nombre.trim(),
        documento_identidad: values.documento_identidad?.trim() ? values.documento_identidad.trim() : undefined,
        ruc: values.ruc?.trim() ? values.ruc.trim() : undefined,
        razon_social: values.razon_social?.trim() ? values.razon_social.trim() : undefined,
        email: values.email?.trim() ? values.email.trim() : undefined,
        telefono: values.telefono?.trim() ? values.telefono.trim() : undefined,
        direccion: values.direccion?.trim() ? values.direccion.trim() : undefined,
      };

      const created = await createCliente({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'clientes'] });
      toast.success("Cliente creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Error al crear el cliente";
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear cliente</DialogTitle>
          <DialogDescription>Completa los datos para registrar un nuevo cliente</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <ClientForm form={form} onSubmit={onSubmit} submitLabel="Crear cliente" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
