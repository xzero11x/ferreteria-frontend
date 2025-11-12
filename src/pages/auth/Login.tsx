// Página de inicio de sesión
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import { setToken } from "@/auth/token";
import { useAuth } from "@/auth/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
// Iconos eliminados para un estilo más minimalista

type LoginResponse = {
  message?: string;
  token?: string;
  usuario?: {
    id?: string | number;
    email?: string;
    rol?: string;
    nombre?: string;
    avatar?: string;
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await http.post<LoginResponse>(endpoints.auth.login(), {
        email,
        password,
      });
      if (res?.token) {
        setToken(res.token);
        if (res?.usuario) {
          const u = {
            id: res.usuario.id,
            email: res.usuario.email,
            rol: res.usuario.rol,
            name: res.usuario.nombre,
            avatar: res.usuario.avatar,
          };
          setUser(u);
        } else {
          setUser({ email });
        }
        navigate("/dashboard", { replace: true });
      } else {
        setError("Respuesta inválida del servidor");
      }
    } catch (err: any) {
      const apiMsg = err?.body?.message || err?.message || "Credenciales inválidas";
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Usa tu email de empresa para ingresar"
      variant="centered"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="#" className="text-sm underline-offset-2 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm text-muted-foreground">Recordarme</Label>
        </div>
        {error && (
          <div className="text-red-600 text-sm" aria-live="assertive">{error}</div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar"}
        </Button>
        <div className="text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="underline underline-offset-4">
            Regístrate
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
