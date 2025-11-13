Asunto: Actualización a Arquitectura V2 (Server-Side Pagination) y Cierre de Módulo de Ventas. Prioridad: Alta. Referencia: Ver archivo actualizado API_Contract.md.

1. 🛑 Revisión Obligatoria: API_Contract.md
Instrucción: Antes de escribir código, revisa la última versión del API Contract. El Backend ha evolucionado. Los endpoints de Productos, Clientes y Ventas ya no devuelven un array simple [].

Nuevo Formato de Respuesta (V2):

JSON

{
  "data": [ ... ], // Array de objetos
  "meta": {        // Metadatos de paginación
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
Esto aplica para las cargas masivas (list) y búsquedas (search).

2. 🗺️ Hoja de Ruta de Implementación (Paso a Paso)
Debes ejecutar estos cambios en el siguiente orden para evitar errores de compilación y asegurar la estabilidad.

FASE 1: Actualización del Núcleo (Servicios) 🛠️
Actualizar la capa de comunicación para soportar la paginación en el servidor.

Definir Interface Global: En src/types/api.ts (o similar), agrega:

TypeScript

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
Refactorizar Servicios: Modificar listProductos, listClientes y listVentas en sus respectivos archivos en src/services/.

Entrada: Deben aceptar un objeto de parámetros opcional: { page?: number, limit?: number, q?: string }.

Salida: Deben devolver Promise<PaginatedResponse<T>> en lugar de Promise<T[]>.

Lógica: Construir la query string (?page=1&limit=10...) antes de llamar a http.get.

FASE 2: Componentes de Selección (Selectores) 🧩
Los componentes que buscan datos deben adaptarse a la búsqueda remota (Server-Side Search) para ser escalables.

ProductSearchSelector.tsx:

Actualizar para leer response.data en lugar de response.

Asegurar que el debounce llame a la API con el término de búsqueda (q) y no filtre localmente.

NUEVO: ClientSelector.tsx (Para el POS):

Crear componente: Un Popover + Command similar al de productos.

Comportamiento:

Default: Muestra "Público General".

Búsqueda: Llama a la API de clientes (?q=...).

Acción: Incluye un botón "➕ Crear Cliente" (reutilizando CreateClientDialog) para altas rápidas sin salir del flujo.

FASE 3: Refactorización de Páginas Maestras 📦
Las tablas de gestión deben dejar de cargar "todo" al inicio.

Productos y Clientes (index.tsx):

Estado: Eliminar useEffect de carga única. Agregar estados para page, totalPages y search.

Tabla: Usar response.data para poblar la tabla.

Interacción: Conectar los botones "Siguiente/Anterior" y la barra de búsqueda para que disparen nuevas peticiones a la API (fetchData(newPage, newSearch)).

FASE 4: Cierre del Módulo de Ventas 🛒
Finalizar la operatividad del negocio.

Actualizar POS (src/pages/ventas/POS.tsx):

Integrar el nuevo componente ClientSelector en la columna derecha (encima del carrito).

Asegurar que el cliente_id seleccionado se envíe en el payload de la venta (o null si es público).

NUEVA PÁGINA: Historial de Ventas (src/pages/ventas/historial.tsx):

Layout: Vista Dividida (Split View). Lista compacta a la izquierda, Ticket detallado a la derecha.

Data: Consumir el endpoint paginado de Ventas (listVentas).

Métricas: Mostrar "Total Vendido" y "Cant. Ventas" (calculados sobre la vista actual).

Acciones: Botones para Re-imprimir y Anular en el panel de detalle.

FASE 5: Navegación 🧭
Sidebar (app-sidebar.tsx):

Agrupar el menú para limpiar la interfaz.

Crear grupo "Ventas" que contenga: Punto de Venta, Historial y Pedidos.

Crear grupo "Inventario y Catálogo" para Productos, Categorías y Ajustes.

Nota Final para el Dev: La prioridad es la estabilidad. Los módulos de Usuarios, Categorías y Proveedores se mantienen en V1 (Client-Side) por ahora; no los toques a menos que sea necesario. Céntrate en que Productos, Clientes y Ventas funcionen con la nueva arquitectura paginada.