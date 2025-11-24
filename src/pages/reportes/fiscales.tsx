/**
 * Página: Reportes Fiscales SUNAT
 * Genera libros de compras y ventas para cumplimiento fiscal
 */

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText } from "lucide-react";
import { ReportesFilters } from "@/components/ReportesFilters";
import { PurchaseReportTable } from "@/components/PurchaseReportTable";
import { SalesReportTable } from "@/components/SalesReportTable";
import { useGetApiCompras } from "@/api/generated/órdenes-de-compra/órdenes-de-compra";
import { useGetApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import type { OrdenCompra, Venta } from "@/api/generated/model";
import { toast } from "sonner";

const ReportesFiscalesPage = () => {
  const [tipoReporte, setTipoReporte] = useState<string>("compras");
  const [mes, setMes] = useState<string>("");
  const [año, setAño] = useState<string>(new Date().getFullYear().toString());
  const [formatoExportacion, setFormatoExportacion] = useState<string>("excel");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // Fetch compras
  const {
    data: comprasData,
    isLoading: isLoadingCompras,
    isError: isErrorCompras,
    refetch: refetchCompras,
  } = useGetApiCompras(undefined, {
    query: {
      enabled: false,
    },
  });

  // Fetch ventas
  const {
    data: ventasData,
    isLoading: isLoadingVentas,
    isError: isErrorVentas,
    refetch: refetchVentas,
  } = useGetApiVentas(undefined, {
    query: {
      enabled: false,
    },
  });

  const handleConsultar = async () => {
    if (!mes || !año) {
      toast.error("Selecciona mes y año");
      return;
    }

    setMostrarResultados(false);

    try {
      if (tipoReporte === "compras") {
        await refetchCompras();
      } else if (tipoReporte === "ventas") {
        await refetchVentas();
      }
      setMostrarResultados(true);
      toast.success("Reporte cargado exitosamente");
    } catch (error) {
      console.error("Error cargando reporte:", error);
      toast.error("Error al cargar el reporte");
    }
  };

  const filtrarPorPeriodo = (fecha: string | null | undefined) => {
    if (!fecha || !mes || !año) return false;
    const date = new Date(fecha);
    const mesFecha = String(date.getMonth() + 1).padStart(2, "0");
    const añoFecha = date.getFullYear().toString();
    return mesFecha === mes && añoFecha === año;
  };

  const comprasFiltradas =
    comprasData?.data?.filter(
      (c: OrdenCompra) => c.estado === "recibida" && filtrarPorPeriodo(c.fecha_emision)
    ) || [];

  const ventasFiltradas = ventasData?.data?.filter((v: Venta) => filtrarPorPeriodo(v.created_at)) || [];

  const handleExportar = async () => {
    if (!mostrarResultados) {
      toast.error("Primero consulta el reporte");
      return;
    }

    try {
      if (tipoReporte === "compras") {
        await exportarComprasCSV();
      } else if (tipoReporte === "ventas") {
        await exportarVentasCSV();
      }
      toast.success(`Reporte exportado en formato ${formatoExportacion.toUpperCase()}`);
    } catch (error) {
      console.error("Error exportando:", error);
      toast.error("Error al exportar el reporte");
    }
  };

  const exportarComprasCSV = async () => {
    const headers = [
      "Fecha Emisión",
      "Tipo",
      "Serie",
      "Número",
      "Proveedor",
      "RUC",
      "Base Imponible",
      "IGV",
      "Total",
    ];

    const rows = comprasFiltradas.map((c: OrdenCompra) => [
      c.fecha_emision || "",
      c.tipo_comprobante || "",
      c.serie || "",
      c.numero || "",
      c.proveedor?.nombre || "",
      c.proveedor?.ruc_identidad || "",
      Number(c.subtotal_base) || 0,
      Number(c.impuesto_igv) || 0,
      Number(c.total) || 0,
    ]);

    const totales = comprasFiltradas.reduce(
      (acc: { base: number; igv: number; total: number }, c: OrdenCompra) => ({
        base: acc.base + (Number(c.subtotal_base) || 0),
        igv: acc.igv + (Number(c.impuesto_igv) || 0),
        total: acc.total + (Number(c.total) || 0),
      }),
      { base: 0, igv: 0, total: 0 }
    );

    const csvContent = [
      `LIBRO DE COMPRAS - ${mes}/${año}`,
      `Generado: ${new Date().toLocaleString("es-PE")}`,
      "",
      headers.join(","),
      ...rows.map((row: (string | number)[]) => row.join(",")),
      "",
      `TOTALES,,,,,,${totales.base.toFixed(2)},${totales.igv.toFixed(2)},${totales.total.toFixed(2)}`,
    ].join("\n");

    descargarArchivo(csvContent, `libro_compras_${mes}_${año}.csv`, "text/csv");
  };

  const exportarVentasCSV = async () => {
    const headers = [
      "Fecha",
      "Tipo",
      "Número",
      "Cliente",
      "Documento",
      "Base Imponible",
      "IGV",
      "Total",
    ];

    const rows = ventasFiltradas.map((v: Venta) => {
      const total = Number(v.total) || 0;
      const base = total / 1.18;
      const igv = base * 0.18;

      return [
        v.created_at || "",
        v.serie?.tipo_comprobante || "",
        v.numero_comprobante || "",
        v.cliente?.nombre || "Cliente General",
        v.cliente?.documento_identidad || "",
        base.toFixed(2),
        igv.toFixed(2),
        total.toFixed(2),
      ];
    });

    const totales = ventasFiltradas.reduce(
      (acc: { base: number; igv: number; total: number }, v: Venta) => {
        const total = Number(v.total) || 0;
        const base = total / 1.18;
        const igv = base * 0.18;
        return {
          base: acc.base + base,
          igv: acc.igv + igv,
          total: acc.total + total,
        };
      },
      { base: 0, igv: 0, total: 0 }
    );

    const csvContent = [
      `LIBRO DE VENTAS - ${mes}/${año}`,
      `Generado: ${new Date().toLocaleString("es-PE")}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      `TOTALES,,,,,${totales.base.toFixed(2)},${totales.igv.toFixed(2)},${totales.total.toFixed(2)}`,
    ].join("\n");

    descargarArchivo(csvContent, `libro_ventas_${mes}_${año}.csv`, "text/csv");
  };

  const descargarArchivo = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = isLoadingCompras || isLoadingVentas;
  const isError = isErrorCompras || isErrorVentas;
  const hasData =
    mostrarResultados &&
    ((tipoReporte === "compras" && comprasFiltradas.length > 0) ||
      (tipoReporte === "ventas" && ventasFiltradas.length > 0));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Reportes Fiscales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Genera libros de compras y ventas para cumplimiento con SUNAT
        </p>
      </div>

      {/* Filtros */}
      <ReportesFilters
        tipoReporte={tipoReporte}
        onTipoReporteChange={setTipoReporte}
        mes={mes}
        onMesChange={setMes}
        año={año}
        onAñoChange={setAño}
        formatoExportacion={formatoExportacion}
        onFormatoExportacionChange={setFormatoExportacion}
        onConsultar={handleConsultar}
        onExportar={handleExportar}
        isConsultando={isLoading}
        isExportando={false}
        hasData={hasData}
      />

      {/* Contenido Principal */}
      <div className="rounded-lg border bg-card">
        {!mostrarResultados ? (
          // Estado inicial
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona un reporte</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Usa los filtros superiores para seleccionar el tipo de reporte, mes y año que deseas
              consultar.
            </p>
          </div>
        ) : isLoading ? (
          // Estado: cargando
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          // Estado: error
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al cargar el reporte. Por favor, intenta nuevamente.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Estado: datos cargados
          <div className="p-6">
            {tipoReporte === "compras" && (
              <PurchaseReportTable compras={comprasFiltradas} mes={mes} año={año} />
            )}
            {tipoReporte === "ventas" && (
            <SalesReportTable ventas={ventasFiltradas} mes={mes} año={año} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesFiscalesPage;
