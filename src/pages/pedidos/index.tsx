import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// Datos estáticos simulados
const pedidosMock = [
  {
    id: 1,
    cliente: { nombre: "Juan Pérez" },
    estado: "pendiente",
    alerta_por_vencer: false,
    tipo_recojo: "tienda",
    detalles: [
      { id: 101, producto_nombre: "Taladro Bosch", cantidad: 2, stock_actual: 10 },
      { id: 102, producto_nombre: "Martillo Stanley", cantidad: 1, stock_actual: 25 },
    ],
  },
  {
    id: 2,
    cliente: { nombre: "María López" },
    estado: "confirmado",
    alerta_por_vencer: true,
    tipo_recojo: "envio",
    detalles: [
      { id: 103, producto_nombre: "Sierra Circular Truper", cantidad: 1, stock_actual: 5 },
    ],
  },
  {
    id: 3,
    cliente: null,
    estado: "cancelado",
    alerta_por_vencer: false,
    tipo_recojo: "tienda",
    detalles: [
      { id: 104, producto_nombre: "Lijadora 3M", cantidad: 3, stock_actual: 8 },
    ],
  },
];

const PedidosPage = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("pendiente");

  // Filtrar pedidos según estado seleccionado
  const pedidosFiltrados = pedidosMock.filter(p => p.estado === estadoFiltro);

  // Obtener detalle del pedido seleccionado (de los datos estáticos)
  const detallePedido = pedidosMock.find(p => p.id === selectedId) ?? null;

  // Simular acciones con toast y actualización local (no backend)
  const confirmarPedido = () => {
    toast.success("Pedido confirmado (simulado)");
    // Aquí podrías actualizar el estado local si quieres simular cambio real
  };

  const cancelarPedido = () => {
    toast.success("Pedido cancelado (simulado)");
  };

  const generarVentaPedido = () => {
    toast.success("Venta generada (simulado)");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Pedidos (Datos estáticos)</h1>

      {/* FILTROS */}
      <div className="flex gap-4">
        {["pendiente", "confirmado", "cancelado"].map((estado) => (
          <Button
            key={estado}
            variant={estadoFiltro === estado ? "default" : "outline"}
            onClick={() => setEstadoFiltro(estado)}
          >
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </Button>
        ))}
      </div>

      {/* LISTA DE PEDIDOS */}
      <Card>
        <CardContent className="p-4">
          {pedidosFiltrados.length === 0 && <p>No hay pedidos en estado "{estadoFiltro}"</p>}

          <div className="space-y-3">
            {pedidosFiltrados.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center border rounded p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedId(p.id)}
              >
                <div>
                  <p className="font-semibold">Pedido #{p.id}</p>
                  <p className="text-sm text-gray-600">
                    Cliente: {p.cliente?.nombre ?? "—"}
                  </p>
                </div>

                {p.alerta_por_vencer && (
                  <span className="text-red-600 font-bold">⚠ Por vencer</span>
                )}

                <span className="capitalize">{p.estado}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MODAL DETALLE */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Pedido</DialogTitle>
          </DialogHeader>

          {!detallePedido && <p>No se encontró el pedido.</p>}

          {detallePedido && (
            <div className="space-y-4">
              <p>
                <strong>Estado:</strong> {detallePedido.estado}
              </p>

              <p>
                <strong>Cliente:</strong> {detallePedido.cliente?.nombre ?? "—"}
              </p>

              <h3 className="font-bold mt-4">Productos</h3>
              <div className="space-y-2">
                {detallePedido.detalles.map((d) => (
                  <div
                    key={d.id}
                    className="border p-2 rounded flex justify-between"
                  >
                    <span>
                      {d.producto_nombre} (x{d.cantidad})
                    </span>
                    <span>Stock: {d.stock_actual}</span>
                  </div>
                ))}
              </div>

              {/* BOTONES */}
              {detallePedido.estado === "pendiente" && (
                <div className="flex gap-2">
                  <Button onClick={confirmarPedido}>Confirmar</Button>
                  <Button variant="destructive" onClick={cancelarPedido}>
                    Cancelar
                  </Button>
                </div>
              )}

              {detallePedido.estado === "confirmado" && (
                <Button className="w-full" onClick={generarVentaPedido}>
                  Generar Venta
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedidosPage;
