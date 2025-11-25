// Configuración de rutas de la aplicación con protección de autenticación
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import DashboardShell from "@/app/dashboard/DashboardShell";
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

// Auth

import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";

// Páginas principales

import ProductosPage from "@/pages/productos/index";
import CategoriasPage from "@/pages/categorias/index";
import MarcasPage from "@/pages/marcas/index";
import UnidadesMedidaPage from "@/pages/unidades-medida/index";
import InventarioPage from "@/pages/inventario/index";
import InventarioPageV2 from "@/pages/inventario/v2";
import ComprasPage from "@/pages/compras/index";
import NuevaOrdenCompraFiscalPage from "@/pages/compras/nueva-fiscal";
import KardexPage from "@/pages/kardex/index";
import POSPage from "@/pages/ventas/POS";
import HistorialVentasPage from "@/pages/ventas/historial";
import ReportesPage from "@/pages/reportes/index";
import ReportesFiscalesPage from "@/pages/reportes/fiscales";
import ConfiguracionPage from "@/pages/configuracion/index";
import ClientesPage from "@/pages/clientes/index";
import ProveedoresPage from "@/pages/proveedores/index";
import PedidosPage from "@/pages/pedidos/index";
import UsuariosPage from "@/pages/usuarios/index";
import AdminCajasPage from "@/pages/admin/cajas";
import AdminSesionesPage from "@/pages/admin/sesiones-caja";
import AdminSeriesPage from "@/pages/admin/series";
// Tienda pública
import Catalogo from "@/pages/tienda/Catalogo"
import Checkout from "@/pages/tienda/Checkout"
import PedidoConfirmado from "@/pages/tienda/PedidoConfirmado"


const AppRouter: React.FC = () => {

    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Home />} />

                {/* Rutas Tienda Pública */}
                <Route path="/tienda/catalogo" element={<Catalogo />} />
                <Route path="/tienda/checkout" element={<Checkout />} />
                <Route path="/tienda/pedido-confirmado/:id" element={<PedidoConfirmado />} />

                
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Rutas protegidas del dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute />}>

                    <Route path="" element={<DashboardShell />}>
                        {/* Dashboard principal */}
                        <Route index element={<Dashboard />} />
                        {/* Páginas principales de cada módulo */}
                        <Route path="productos" element={<ProductosPage />} />

                        <Route path="categorias" element={<CategoriasPage />} />

                        <Route path="marcas" element={<MarcasPage />} />

                        <Route path="unidades-medida" element={<UnidadesMedidaPage />} />

                        <Route path="inventario" element={<InventarioPage />} />
                        <Route path="inventario/v2" element={<InventarioPageV2 />} />

                        <Route path="usuarios" element={<UsuariosPage />} />

                        <Route path="clientes" element={<ClientesPage />} />

                        <Route path="proveedores" element={<ProveedoresPage />} />

                        <Route path="pedidos" element={<PedidosPage />} />

                        <Route path="compras" element={<ComprasPage />} />
                        <Route path="compras/nueva-fiscal" element={<NuevaOrdenCompraFiscalPage />} />

                        <Route path="kardex" element={<KardexPage />} />

                        <Route path="ventas" element={<POSPage />} />
                        <Route path="ventas/historial" element={<HistorialVentasPage />} />

                        <Route path="reportes" element={<ReportesPage />} />
                        <Route path="reportes/fiscales" element={<ReportesFiscalesPage />} />

                        <Route path="configuracion" element={<ConfiguracionPage />} />

                        {/* Administración de Caja */}
                        <Route path="admin/cajas" element={<AdminCajasPage />} />
                        <Route path="admin/sesiones" element={<AdminSesionesPage />} />
                        <Route path="admin/series" element={<AdminSeriesPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
