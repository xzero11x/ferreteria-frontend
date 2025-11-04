import { Outlet } from "react-router-dom";

// Ruta protegida (stub): actualmente permite el acceso y renderiza las rutas hijas.
// Cuando se implemente autenticación, reemplazar por validación de token y redirección.
const ProtectedRoute = () => {
  return <Outlet />;
};

export default ProtectedRoute;