"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  IconClipboardList,
  IconCreditCard,
  IconDashboard,
  IconLogout,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/client"

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Usuarios",
    href: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Tareas",
    href: "/admin/tasks",
    icon: IconClipboardList,
  },
  {
    title: "Transacciones",
    href: "/admin/transactions",
    icon: IconCreditCard,
  },
  {
    title: "Configuracion",
    href: "/admin/settings",
    icon: IconSettings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesion", error)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h2 className="text-lg font-semibold">Panel de Administrador</h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} disabled={signingOut}>
              <IconLogout className="h-4 w-4" />
              <span>{signingOut ? "Cerrando..." : "Cerrar sesion"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
