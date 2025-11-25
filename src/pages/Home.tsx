/**
 * Landing Page - Estilo Vercel/shadcn minimalista
 */
import { Button } from "@/components/ui_official/button";
import { Badge } from "@/components/ui_official/badge";
import { ScrollArea } from "@/components/ui_official/scroll-area";
import { ArrowRight, BarChart3, Package, TrendingUp, Zap, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardDemo from "./DashboardDemo";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-semibold text-xl">Ferretería Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Iniciar sesión
            </Button>
            <Button onClick={() => navigate("/demo")}>
              Ver demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="shadow-none">
            Nuevo: Dashboard de ventas en tiempo real
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Gestiona tu ferretería
            <br />
            <span className="text-muted-foreground">con inteligencia</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Control total de inventario, ventas y reportes. Todo en una plataforma simple y poderosa.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => navigate("/demo")}>
              Explorar demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
              Comenzar ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="shadow-none">
              Vista previa
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Tu negocio en tiempo real
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Visualiza métricas clave, tendencias y reportes desde un solo lugar
            </p>
          </div>

          {/* Dashboard Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-background rounded-xl border shadow-2xl overflow-hidden">
              {/* Mini Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-xs text-muted-foreground bg-background px-3 py-1 rounded border">
                    ferreteria-pro.com/dashboard
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => navigate("/demo")}
                >
                  <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                  Expandir
                </Button>
              </div>

              {/* Dashboard Content - Scaled */}
              <ScrollArea className="h-[630px]">
                <div style={{ 
                  transform: "scale(0.75)", 
                  transformOrigin: "top left",
                  width: "133.33%",
                  marginBottom: "-25%"
                }}>
                  <DashboardDemo />
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Dashboard en tiempo real</h3>
              <p className="text-muted-foreground">
                Visualiza tus KPIs principales y tendencias de ventas al instante
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Control de inventario</h3>
              <p className="text-muted-foreground">
                Gestiona tu stock con alertas automáticas y seguimiento preciso
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Análisis avanzado</h3>
              <p className="text-muted-foreground">
                Reportes detallados de rentabilidad por producto y categoría
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold">99.9%</div>
              <div className="text-muted-foreground mt-2">Uptime garantizado</div>
            </div>
            <div>
              <div className="text-4xl font-bold">&lt;100ms</div>
              <div className="text-muted-foreground mt-2">Tiempo de respuesta</div>
            </div>
            <div>
              <div className="text-4xl font-bold">24/7</div>
              <div className="text-muted-foreground mt-2">Soporte técnico</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-4xl font-bold">
            Listo para transformar tu negocio
          </h2>
          <p className="text-xl text-muted-foreground">
            Únete a las ferreterías que ya están creciendo con nuestra plataforma
          </p>
          <div className="pt-4">
            <Button size="lg" onClick={() => navigate("/demo")}>
              Ver demostración
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>© 2024 Ferretería Pro</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Documentación
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Soporte
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
