// Página de inicio de sesión
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import { setToken } from "@/auth/token";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            <Button type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}
