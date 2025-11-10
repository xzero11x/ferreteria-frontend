// Página de registro de nuevo tenant
import { useState } from "react";
import { Link } from "react-router-dom";
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-[95vw] md:w-[52.5vw] max-w-[980px] flex flex-col gap-6">
        <Card className="overflow-hidden py-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={onSubmit} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Crear nueva cuenta (Tenant)</h1>
                  <p className="text-balance text-muted-foreground">
                    Configura tu empresa y subdominio para empezar
                  </p>
                </div>
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
                  <Input
                    id="password"
                    type="password"
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
              </div>
            </form>
            <div className="relative hidden bg-muted md:block">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop"
                alt="Imagen de fondo"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a>{" "}
          y <a href="#">Política de Privacidad</a>.
        </div>
      </div>
    </div>
  );
}
