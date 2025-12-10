"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconDotsVertical, IconLogout } from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/client"

export function NavUser({
  user,
}: {
  user?: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [userInfo, setUserInfo] = useState(() => ({
    name: user?.name || "Usuario",
    email: user?.email || "usuario@ejemplo.com",
    avatar: user?.avatar || "",
  }))
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Prefer server-provided user, but hydrate with Supabase client session when available.
  useEffect(() => {
    let isMounted = true
    const loadUser = async () => {
      // If user info already provided, keep it.
      if (user?.email) return

      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user

      if (!currentUser || !isMounted) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, profile_picture_url")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (!isMounted) return

      setUserInfo({
        name: profile?.name || currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Usuario",
        email: profile?.email || currentUser.email || "usuario@ejemplo.com",
        avatar: profile?.profile_picture_url || "",
      })
    }

    void loadUser()
    return () => {
      isMounted = false
    }
  }, [user])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Generate initials from name
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const initials = useMemo(() => getInitials(userInfo.name), [userInfo.name])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userInfo.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {userInfo.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                  <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userInfo.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userInfo.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                void handleLogout()
              }}
              disabled={isLoggingOut}
            >
              <IconLogout />
              {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
