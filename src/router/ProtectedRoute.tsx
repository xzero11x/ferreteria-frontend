import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/auth/token";

export default function ProtectedRoute() {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}