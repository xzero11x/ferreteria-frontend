// Página de inicio con landing y planes de pricing
import { Button } from "../components/button";
import { CheckCircle, BarChart, Users, Zap } from "lucide-react";
import { PricingPlans } from "../components/PricingPlans";

import "../home.css";

const FerreteriaProLanding: React.FC = () => {
  return (
    <div className="ferreteria-pro">
      {/* Header */}
      <header>
        <h1>Ferretería Pro</h1>
        <nav>
          <a href="#features">Características</a>
          <a href="#pricing">Precios</a>
          <a href="#docs">Docs</a>
        </nav>
        <div className="header-actions">
          <Button variant="ghost">Ingresar</Button>
          <Button>Comenzar gratis</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <span>Nuevo</span>
        <h2> Gestiona tu ferretería con inteligencia</h2>
        <p>
         Gestión de inventario en tiempo real. Controla inventario, ventas y clientes desde una plataforma única.
        </p>
        <div className="header-actions">
          <Button>Comenzar ahora</Button>
          <Button variant="outline">Ver demo</Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <h3>Todo lo que necesitas para crecer</h3>
        <div className="features-grid">
          <div>
            <BarChart size={48} color="#2563eb" />
            <h4>Inventario Inteligente</h4>
            <p>Controla stock en tiempo real y recibe alertas automáticas</p>
          </div>
          <div>
            <CheckCircle size={48} color="#2563eb" />
            <h4>Reportes Detallados</h4>
            <p>Analiza ventas, ganancias y tendencias con dashboards visuales</p>
          </div>
          <div>
            <Users size={48} color="#2563eb" />
            <h4>Gestión de Clientes</h4>
            <p>Mantén registro de clientes y personaliza ofertas</p>
          </div>
          <div>
            <Zap size={48} color="#2563eb" />
            <h4>Automatización</h4>
            <p>Automatiza procesos repetitivos y ahorra tiempo</p>
          </div>
        </div>
      </section>
 <PricingPlans />
      {/* CTA */}
      <section className="cta">
        <h3>Listo para transformar tu ferretería</h3>
        <p>Únete a cientos de ferreterías que ya están creciendo con Ferretería Pro</p>
        <Button>Comenzar prueba gratis</Button>
      </section>

     

      {/* Footer */}
      <footer>
        <div className="footer-bottom">
          © 2025 Ferretería Pro. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default FerreteriaProLanding;
