"use client"

import * as React from "react"
import {
  IconBriefcase,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconFileText,
  IconHistory,
  IconInnerShadowTop,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconStar,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { NotificationBell } from "@/components/NotificationBell"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const studentNavMain = [
  {
    title: "Dashboard",
    url: "/workspace/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Mis Tareas",
    url: "/workspace/mis-tareas",
    icon: IconListDetails,
  },
  {
    title: "Propuestas",
    url: "/workspace/propuestas",
    icon: IconChartBar,
    badge: true,
  },
  {
    title: "Reseñas",
    url: "/workspace/resenas",
    icon: IconStar,
  },
  {
    title: "Pagos",
    url: "/workspace/pagos",
    icon: IconUsers,
  },
]

const teacherNavMain = [
  {
    title: "Dashboard",
    url: "/workspace",
    icon: IconDashboard,
  },
  {
    title: "Marketplace",
    url: "/workspace/marketplace",
    icon: IconSearch,
  },
  {
    title: "Mis Propuestas",
    url: "/workspace/mis-propuestas",
    icon: IconFileText,
  },
  {
    title: "Mis Trabajos",
    url: "/workspace/mis-trabajos",
    icon: IconBriefcase,
  },
  {
    title: "Pagos",
    url: "/workspace/pagos",
    icon: IconCreditCard,
  },
  {
    title: "Historial",
    url: "/workspace/historial",
    icon: IconHistory,
  },
  {
    title: "Reseñas",
    url: "/workspace/resenas",
    icon: IconStar,
  },
]

const navSecondary = [
  {
    title: "Mi perfil",
    url: "/workspace/account",
    icon: IconUser,
  },
  {
    title: "Configuración",
    url: "/workspace/configuracion",
    icon: IconSettings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: "student" | "teacher"
  user?: {
    name: string
    email: string
    avatar: string
  }
  unreadNotifications?: number
}

export function AppSidebar({ userRole = "student", user, unreadNotifications = 0, ...props }: AppSidebarProps) {
  const navMain = userRole === "teacher" ? teacherNavMain : studentNavMain

  // Default user data if not provided
  const userData = user || {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 flex-1"
              >
                <a href="/workspace">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">Proedutec </span>
                </a>
              </SidebarMenuButton>
              <div className="pr-2">
                <NotificationBell initialCount={unreadNotifications} />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
