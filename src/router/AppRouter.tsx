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
import InventarioPage from "@/pages/inventario/index";
import ComprasPage from "@/pages/compras/index";
import POSPage from "@/pages/ventas/POS";
import HistorialVentasPage from "@/pages/ventas/historial";
import ReportesPage from "@/pages/reportes/index";
import ConfiguracionPage from "@/pages/configuracion/index";
import ClientesPage from "@/pages/clientes/index";
import ProveedoresPage from "@/pages/proveedores/index";
import PedidosPage from "@/pages/pedidos/index";
import UsuariosPage from "@/pages/usuarios/index";

const AppRouter: React.FC = () => {

    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Home />} />
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

                        <Route path="inventario" element={<InventarioPage />} />

                        <Route path="usuarios" element={<UsuariosPage />} />

                        <Route path="clientes" element={<ClientesPage />} />

                        <Route path="proveedores" element={<ProveedoresPage />} />

                        <Route path="pedidos" element={<PedidosPage />} />

                        <Route path="compras" element={<ComprasPage />} />

                        <Route path="ventas" element={<POSPage />} />
                        <Route path="ventas/historial" element={<HistorialVentasPage />} />

                        <Route path="reportes" element={<ReportesPage />} />

                        <Route path="configuracion" element={<ConfiguracionPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
