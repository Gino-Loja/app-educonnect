import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/server"
import { getUnreadNotificationCount } from "@/lib/data/notification-actions"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userData = {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "",
  }

  if (user) {
    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, profile_picture_url")
      .eq("id", user.id)
      .single()

    if (profile) {
      userData = {
        name: profile.name || user.email?.split("@")[0] || "Usuario",
        email: profile.email || user.email || "usuario@ejemplo.com",
        avatar: profile.profile_picture_url || "",
      }
    } else {
      userData = {
        name: user.email?.split("@")[0] || "Usuario",
        email: user.email || "usuario@ejemplo.com",
        avatar: "",
      }
    }
  }

  // Get unread notifications count
  const unreadCount = await getUnreadNotificationCount()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" userRole="teacher" user={userData} unreadNotifications={unreadCount} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
