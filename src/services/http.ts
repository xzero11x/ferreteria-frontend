import { buildTenantApiBase } from "@/config/env";
import { getToken } from "@/auth/token";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = buildTenantApiBase();
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = isJson ? await res.json() : await res.text();
    } catch {}

    const err = new Error((errorBody && errorBody.message) || res.statusText);
    (err as any).status = res.status;
    (err as any).body = errorBody;
    throw err;
  }

  return (isJson ? await res.json() : (await res.text())) as T;
}

export const http = {
  get<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: "GET" });
  },
  post<T>(path: string, data?: unknown, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },
  put<T>(path: string, data?: unknown, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },
  patch<T>(path: string, data?: unknown, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },
  delete<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: "DELETE" });
  },
};