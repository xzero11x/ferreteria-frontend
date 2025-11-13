// Sidebar de navegación principal con menú de módulos
import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  BoxIcon,
  BoxesIcon,
  TagsIcon,
  TruckIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  UserCog as UserCogIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
// Eliminamos íconos de Tabler para mantener estética coherente con Lucide
import { useAuth } from "@/auth/AuthContext"

const data = {
  user: {
    name: "Ferreteria Admin",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    // Dashboard
    { label: "Dashboard-Inicio" },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },

    // Ventas (POS)
    { label: "Ventas (POS)" },
    { title: "Ventas", url: "/dashboard/ventas", icon: ShoppingCartIcon },
    { title: "Clientes", url: "/dashboard/clientes", icon: UsersIcon },
    { title: "Pedidos", url: "/dashboard/pedidos", icon: ClipboardCheckIcon },

    // Catálogo
    { label: "Catálogo" },
    { title: "Productos", url: "/dashboard/productos", icon: BoxIcon },
    { title: "Categorías", url: "/dashboard/categorias", icon: TagsIcon },

    // Inventario
    { label: "Inventario" },
    { title: "Inventario", url: "/dashboard/inventario", icon: BoxesIcon },

    // Compras
    { label: "Compras" },
    { title: "Compras", url: "/dashboard/compras", icon: ShoppingBagIcon },
    { title: "Proveedores", url: "/dashboard/proveedores", icon: TruckIcon },

    // Reportes
    { label: "Reportes" },
    { title: "Reportes", url: "/dashboard/reportes", icon: BarChartIcon },

    // Configuración
    { label: "Configuración" },
    { title: "Configuración", url: "/dashboard/configuracion", icon: SettingsIcon },
    { title: "Usuarios", url: "/dashboard/usuarios", icon: UserCogIcon },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/configuracion",
      icon: SettingsIcon,
    },
    {
      title: "Search",
      url: "/dashboard",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const displayUser = {
    name:
      user?.name || (user?.email ? user.email.split("@")[0] : undefined) || data.user.name,
    email: user?.email || data.user.email,
    avatar: user?.avatar || data.user.avatar,
  };
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="/assets/logo/logoDefecto.svg"
                  alt="Logo"
                  className="h-6 w-6"
                />
                <span className="text-base font-semibold">FerrePro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
