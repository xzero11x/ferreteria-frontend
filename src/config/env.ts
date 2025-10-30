// Centraliza lectura de variables de entorno para Vite
export const API_BASE_ORIGIN: string = (import.meta.env.VITE_API_BASE_ORIGIN as string) || "http://localhost:3001";
export const TENANT_SUBDOMAIN: string = (import.meta.env.VITE_TENANT_SUBDOMAIN as string) || "central";
export const TOKEN_KEY: string = (import.meta.env.VITE_TOKEN_STORAGE_KEY as string) || "ferreteria_token";

/**
 * Construye la base de la API con subdominio para multi-tenant
 * Ej: http://central.localhost:3001
 */
export function buildTenantApiBase(): string {
  try {
    const url = new URL(API_BASE_ORIGIN);
    const protocol = url.protocol; // ej: "http:"
    const host = url.host; // ej: "localhost:3001"
    const [hostname, port] = host.split(":");
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    const tenantHost = isLocal
      ? `${TENANT_SUBDOMAIN}.${hostname}${port ? `:${port}` : ""}`
      : `${TENANT_SUBDOMAIN}.${host}`;
    return `${protocol}//${tenantHost}`;
  } catch {
    // Fallback seguro para desarrollo
    return `http://${TENANT_SUBDOMAIN}.localhost:3001`;
  }
}