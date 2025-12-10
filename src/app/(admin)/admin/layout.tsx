import type { CSSProperties } from "react"

import { requireAdmin } from "@/lib/auth/admin"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify admin access
  await requireAdmin()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AdminSidebar />
      <SidebarInset className="min-h-svh">
        <header className="flex h-(--header-height) items-center gap-3 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <div>
            <p className="text-sm font-semibold leading-tight">Panel de Administrador</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Administra usuarios, tareas y transacciones desde un solo lugar.
            </p>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="container flex-1 py-6 px-4 lg:px-8">{children}</div>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
