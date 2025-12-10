"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBriefcase,
  IconBook,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconFileText,
  IconInnerShadowTop,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconStar,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { NotificationBell } from "@/components/NotificationBell"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar"

const studentNavMain = [
  {
    title: "Dashboard",
    url: "/workspace/dashboard",
    icon: IconDashboard,
    description: "Resumen general de tu progreso",
    group: "overview",
  },
  {
    title: "Mis Tareas",
    url: "/workspace/mis-tareas",
    icon: IconListDetails,
    description: "Planifica, entrega y haz seguimiento",
    group: "tasks",
    // tabs: [
    //   { label: "Activas", url: "/workspace/mis-tareas?status=in_progress" },
    //   { label: "Pendientes", url: "/workspace/mis-tareas?status=open" },
    //   { label: "Completadas", url: "/workspace/mis-tareas?status=completed" },
    // ],
  },
  {
    title: "Mis Cursos",
    url: "/workspace/mis-cursos",
    icon: IconBook,
    description: "Cursos comprados y progreso",
    group: "courses",
  },
  {
    title: "Propuestas",
    url: "/workspace/propuestas",
    icon: IconChartBar,
    description: "Filtra y acepta a los mejores profesores",
    badge: true,
    group: "tasks",
  },
  {
    title: "Reseñas",
    url: "/workspace/resenas",
    icon: IconStar,
    description: "Historial de feedback de profesores",
    group: "community",
  },
  {
    title: "Pagos",
    url: "/workspace/pagos",
    icon: IconUsers,
    description: "Pagos, hitos y facturas",
    group: "finance",
  },
]

const teacherNavMain = [
  {
    title: "Dashboard",
    url: "/workspace",
    icon: IconDashboard,
    description: "Métricas y alertas docentes",
    group: "overview",
  },
  {
    title: "Marketplace",
    url: "/workspace/marketplace",
    icon: IconSearch,
    description: "Explora nuevas oportunidades",
    group: "tasks",
  },
  {
    title: "Mis Propuestas",
    url: "/workspace/mis-propuestas",
    icon: IconFileText,
    description: "Gestiona tus envíos",
    group: "tasks",
    // tabs: [
    //   { label: "Pendientes", url: "/workspace/mis-propuestas?status=pending" },
    //   { label: "Aceptadas", url: "/workspace/mis-propuestas?status=accepted" },
    //   { label: "Rechazadas", url: "/workspace/mis-propuestas?status=rejected" },
    // ],
  },
  {
    title: "Mis Trabajos",
    url: "/workspace/mis-trabajos",
    icon: IconBriefcase,
    description: "Seguimiento de tareas asignadas",
    group: "tasks",
  },
  {
    title: "Mis Cursos",
    url: "/workspace/mis-cursos",
    icon: IconBook,
    description: "Crea y gestiona tus cursos",
    group: "courses",
  },
  {
    title: "Pagos",
    url: "/workspace/pagos",
    icon: IconCreditCard,
    description: "Control de cobros y retiros",
    group: "finance",
  },

  {
    title: "Reseñas",
    url: "/workspace/resenas",
    icon: IconStar,
    description: "Valoraciones recibidas",
    group: "community",
  },
]

const navSecondary = [
  {
    title: "Configuración",
    url: "/workspace/configuracion",
    icon: IconSettings,
    description: "Cuenta y perfil",
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: "student" | "teacher" | "admin"
  user?: {
    name: string
    email: string
    avatar: string
  }
  unreadNotifications?: number
}

export function AppSidebar({ userRole = "student", user, unreadNotifications = 0, ...props }: AppSidebarProps) {
  const navMain = userRole === "student" ? studentNavMain : teacherNavMain
  const navigationItems = React.useMemo(() => {
    const primary = navMain.map((item) => ({ ...item, separatorBefore: false }))
    const secondary = navSecondary.map((item, index) => ({
      ...item,
      separatorBefore: index === 0,
    }))
    return [...primary, ...secondary]
  }, [navMain])

  // Default user data if not provided
  const userData = user || {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "",
  }
  const firstName = userData.name?.split(" ")[0] || "Usuario"
  const roleLabel = userRole === "teacher" ? "Profesor" : userRole === "admin" ? "Administrador" : "Estudiante"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-3 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/workspace" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <IconInnerShadowTop className="size-4" />
            </span>
            <div className="leading-tight">
              <p>Proedutec</p>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.4em] text-slate-400">Panel</p>
            </div>
          </Link>
          <NotificationBell initialCount={unreadNotifications} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="text-sm font-semibold text-slate-900">Hola, {firstName}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {roleLabel}
          </span>
          <span className="text-slate-300">|</span>
          <span>Gestiona tareas y propuestas</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-5">
        <React.Suspense
          fallback={
            <div className="px-3 py-2 text-sm text-slate-500">
              Cargando navegación...
            </div>
          }
        >
          <NavMain items={navigationItems} userRole={userRole} />
        </React.Suspense>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-4">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
