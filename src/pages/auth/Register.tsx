// Página de registro de nuevo tenant
import { useState } from "react";
import { Link } from "react-router-dom";
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Iconos eliminados para un estilo más minimalista

type RegisterResponse = {
  message?: string;
  tenantId?: number;
};

export default function RegisterPage() {
  const [nombre_empresa, setNombreEmpresa] = useState("");
  const [subdominio, setSubdominio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await http.post<RegisterResponse>(endpoints.auth.register(), {
        nombre_empresa,
        subdominio,
        email,
        password,
      });
      const msg = res?.message || "Registro exitoso. Revisa tu consola para la activación manual";
      setSuccess(msg);
      console.log("Registro de tenant", res);
    } catch (err: any) {
      const apiMsg = err?.body?.message || err?.message || "Error en el registro";
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crear nueva cuenta"
      subtitle="Configura tu empresa y subdominio para empezar"
      variant="centered"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="nombre_empresa">Nombre de la empresa</Label>
          <Input
            id="nombre_empresa"
            value={nombre_empresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            placeholder="Mi Ferretería S.A."
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subdominio">Subdominio</Label>
          <Input
            id="subdominio"
            value={subdominio}
            onChange={(e) => setSubdominio(e.target.value)}
            placeholder="central"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@empresa.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && (
          <div className="text-red-600 text-sm" aria-live="assertive">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm" aria-live="polite">{success}</div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </Button>
        <div className="text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Inicia sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
