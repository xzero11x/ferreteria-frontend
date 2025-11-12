// Header del sitio con trigger del sidebar
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

export function SiteHeader() {
  const [atTop, setAtTop] = useState(true)
  useEffect(() => {
    const onScroll = () => {
      setAtTop(window.scrollY === 0)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const location = useLocation()
  const pathTitleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/productos": "Productos",
    "/dashboard/categorias": "Categorías",
    "/dashboard/inventario": "Inventario",
    "/dashboard/usuarios": "Usuarios",
    "/dashboard/clientes": "Clientes",
    "/dashboard/proveedores": "Proveedores",
    "/dashboard/pedidos": "Pedidos",
    "/dashboard/ventas": "Ventas",
    "/dashboard/compras": "Compras",
    "/dashboard/reportes": "Reportes",
    "/dashboard/configuracion": "Configuración",
  }
  const title = pathTitleMap[location.pathname] ?? "Ferretería"
  return (
    <header
      className={[
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        "sticky top-0 z-50",
        "flex h-12 shrink-0 items-center gap-2",
        "bg-background",
        "transition-all duration-200",
        atTop ? "rounded-t-lg shadow-sm border-b" : "rounded-none shadow border-b",
      ].join(" ")}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
      </div>
    </header>
  )
}
