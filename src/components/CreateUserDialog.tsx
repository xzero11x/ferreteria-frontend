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
import UserForm from "@/components/UserForm";
import { toast } from "sonner";
import { createUsuario, type Usuario, type UsuarioCreateInput, type RolUsuario } from "@/services/usuarios";

const createUserSchema = z.object({
  email: z.string().min(1, "El email es obligatorio").email("Email inválido"),
  nombre: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "Debe tener al menos 6 caracteres"),
  rol: z.enum(["admin", "empleado"] as [RolUsuario, RolUsuario]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type CreateUserDialogProps = {
  onCreated?: (usuario: Usuario) => void;
};

export default function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", nombre: "", password: "", rol: "empleado" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ email: "", nombre: "", password: "", rol: "empleado" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateUserFormValues) {
    try {
      const payload: UsuarioCreateInput = {
        email: values.email,
        password: values.password,
        nombre: values.nombre ? values.nombre : undefined,
        rol: values.rol,
      };

      const created = await createUsuario(payload);
      toast.success("Usuario creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.body?.message || err?.message || "Error al crear el usuario";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
<Plus className="mr-2 size-4" /> Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>Completa los datos para registrar un nuevo usuario.</DialogDescription>
        </DialogHeader>
        <UserForm form={form} onSubmit={onSubmit} submitLabel="Crear" />
      </DialogContent>
    </Dialog>
  );
}