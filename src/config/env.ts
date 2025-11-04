// 1. Define la URL base de la API (sin subdominio)
const API_BASE_ORIGIN =
  import.meta.env.VITE_API_BASE_ORIGIN || "http://localhost:3001";

// 2. Función para OBTENER el subdominio actual del navegador
function getSubdomain() {
  const parts = window.location.hostname.split(".");
  // Si estamos en "central.localhost" (3 partes), devuelve "central"
  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }
  return null;
}

// 3. Construye la URL de la API dinámicamente
export function getApiBaseUrl(): string {
  const subdomain = getSubdomain();

  // Si NO hay subdominio (estamos en la landing 'localhost'),
  // devuelve la URL base (para el registro)
  if (!subdomain) {
    return API_BASE_ORIGIN;
  }

  // Si SÍ hay subdominio, lo añade a la URL
  try {
    const url = new URL(API_BASE_ORIGIN);
    url.host = `${subdomain}.${url.host}`; // Ej: "central.localhost:3001"
    return url.toString().slice(0, -1); // Quita el "/" final
  } catch (error) {
    console.error("Error constructing API URL", error);
    return API_BASE_ORIGIN;
  }
}