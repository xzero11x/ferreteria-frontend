export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type PaginationParams = {
  page?: number;
  limit?: number;
  q?: string;
  // Filtros comunes adicionales (usados por ventas)
<<<<<<< HEAD
  proveedor_id?: number;
=======
>>>>>>> parent of bafa93d (Merge remote-tracking branch 'origin/up-upload' into dante)
  cliente_id?: number;
  fecha_inicio?: string; // formato 'YYYY-MM-DD' o ISO según backend
  fecha_fin?: string;    // formato 'YYYY-MM-DD' o ISO según backend
};