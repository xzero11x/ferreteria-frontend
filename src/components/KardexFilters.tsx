import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileDown, Search } from "lucide-react";
import { useGetApiProductos } from "@/api/generated/productos/productos";

interface KardexFiltersProps {
  selectedProductoId: number | null;
  onProductoChange: (productoId: number | null) => void;
  tipoMovimiento: string;
  onTipoMovimientoChange: (tipo: string) => void;
  fechaInicio: string;
  onFechaInicioChange: (fecha: string) => void;
  fechaFin: string;
  onFechaFinChange: (fecha: string) => void;
  onExport: () => void;
  isExporting: boolean;
}

export const KardexFilters: React.FC<KardexFiltersProps> = ({
  selectedProductoId,
  onProductoChange,
  tipoMovimiento,
  onTipoMovimientoChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  onExport,
  isExporting,
}) => {
  const [productoSearch, setProductoSearch] = useState("");

  // Fetch productos con búsqueda
  const { data: productosData } = useGetApiProductos({});

  const productos = productosData?.data || [];

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter((p) => {
    if (!productoSearch) return true;
    const search = productoSearch.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search) ||
      p.id.toString().includes(search)
    );
  });

  const productoSeleccionado = productos.find((p) => p.id === selectedProductoId);

  const handleLimpiarFiltros = () => {
    onProductoChange(null);
    onTipoMovimientoChange("todos");
    onFechaInicioChange("");
    onFechaFinChange("");
    setProductoSearch("");
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="space-y-4">
        {/* Fila 1: Producto */}
        <div className="space-y-2">
          <Label>Producto</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, SKU o ID..."
                value={productoSearch}
                onChange={(e) => setProductoSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={selectedProductoId?.toString() || ""}
              onValueChange={(value) => onProductoChange(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue
                  placeholder={
                    productoSeleccionado
                      ? `${productoSeleccionado.nombre} (${productoSeleccionado.sku})`
                      : "Seleccionar producto..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {productosFiltrados.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No se encontraron productos
                  </div>
                ) : (
                  productosFiltrados.slice(0, 50).map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{producto.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          SKU: {producto.sku || "N/A"} | Stock: {Number(producto.stock) || 0}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fila 2: Tipo de Movimiento, Fechas, Botones */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Tipo de Movimiento */}
          <div className="space-y-2">
            <Label>Tipo de Movimiento</Label>
            <Select value={tipoMovimiento} onValueChange={onTipoMovimientoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="venta">Ventas</SelectItem>
                <SelectItem value="compra">Compras</SelectItem>
                <SelectItem value="ajuste_entrada">Ajustes +</SelectItem>
                <SelectItem value="ajuste_salida">Ajustes -</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-2">
            <Label>Fecha Inicio</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => onFechaInicioChange(e.target.value)}
            />
          </div>

          {/* Fecha Fin */}
          <div className="space-y-2">
            <Label>Fecha Fin</Label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => onFechaFinChange(e.target.value)}
              min={fechaInicio || undefined}
            />
          </div>

          {/* Botón Consultar */}
          <div className="space-y-2">
            <Label className="invisible">Acciones</Label>
            <Button
              className="w-full"
              disabled={!selectedProductoId}
              onClick={() => {
                // Trigger re-fetch - handled by parent component
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              Consultar
            </Button>
          </div>

          {/* Botón Exportar */}
          <div className="space-y-2">
            <Label className="invisible">Exportar</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={onExport}
              disabled={!selectedProductoId || isExporting}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? "Exportando..." : "Exportar Excel"}
            </Button>
          </div>
        </div>

        {/* Botón Limpiar Filtros */}
        {(selectedProductoId || tipoMovimiento !== "todos" || fechaInicio || fechaFin) && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleLimpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
