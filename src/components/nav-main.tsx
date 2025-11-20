"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: Icon
    badge?: boolean
    group?: string
    description?: string
    tabs?: { label: string; url: string }[]
    separatorBefore?: boolean
  }[]
  userRole?: "student" | "teacher" | "admin"
}

export function NavMain({ items, userRole = "student" }: NavMainProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get("status")
  const showCreateTaskButton = userRole === "student"

  const isTabActive = (tabUrl: string) => {
    const parsed = new URL(tabUrl, "https://app.local")
    const targetStatus = parsed.searchParams.get("status")
    if (pathname !== parsed.pathname) {
      return false
    }
    if (!targetStatus) {
      return true
    }
    return targetStatus === currentStatus
  }

  const isItemActive = (itemUrl: string) => {
    const parsedItemUrl = new URL(itemUrl, "https://app.local")
    if (pathname !== parsedItemUrl.pathname) {
      return false
    }
    const itemStatus = parsedItemUrl.searchParams.get("status")
    if (!itemStatus) {
      return true
    }
    return itemStatus === currentStatus
  }

  return (
    <SidebarGroup className="space-y-3">
      {showCreateTaskButton ? (
        <div className="rounded-3xl bg-[#edf3ff] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-2xl bg-white text-[#3f82ff] shadow">
              <IconCirclePlusFilled className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1d2f58]">¿Necesitas ayuda?</p>
              <p className="text-xs text-[#5f6f94]">Crea una nueva tarea en segundos.</p>
            </div>
          </div>
          <Button
            asChild
            className="mt-4 w-full rounded-2xl bg-[#3f82ff] text-sm font-semibold text-white shadow-[0_12px_25px_rgba(63,130,255,0.35)] hover:bg-[#336fe0]"
          >
            <Link href="/workspace/mis-tareas/nueva">Crear tarea</Link>
          </Button>
        </div>
      ) : null}
      <SidebarGroupLabel className="text-[0.62rem] uppercase tracking-[0.45em] text-slate-400">
        NAVEGACION
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isActive = isItemActive(item.url)

            return (
              <Fragment key={item.title}>
                {item.separatorBefore ? <div className="mx-3 my-3 border-t border-slate-200/70" /> : null}
                <SidebarMenuItem className="pb-1">
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive}
                    className="group flex w-full items-center gap-3 rounded-3xl px-3 py-2 text-[0.95rem] font-semibold text-slate-500 shadow-none hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-0 data-[active=true]:!bg-[#dfe9ff] data-[active=true]:!text-[#21407b] data-[active=true]:shadow-none"
                  >
                    <Link href={item.url} className="flex flex-1 items-center gap-3 no-underline">
                      {item.icon ? (
                        <span
                          className={`flex size-7 items-center justify-center rounded-xl text-base transition-all ${
                            isActive
                              ? "bg-[#3f82ff] text-white shadow-[0_8px_20px_rgba(63,130,255,0.35)] ring-0"
                              : "bg-white text-[#7b89a8] ring-1 ring-slate-200 group-hover:ring-blue-200 group-hover:text-[#3f82ff]"
                          }`}
                        >
                          <item.icon className="size-4" />
                        </span>
                      ) : null}
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge ? (
                        <SidebarMenuBadge className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Nuevo
                        </SidebarMenuBadge>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                  {item.tabs?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 pl-14">
                      {item.tabs.map((tab) => {
                        const tabActive = isTabActive(tab.url)
                        return (
                          <Link
                            key={tab.label}
                            href={tab.url}
                            className={`rounded-full px-3 py-1 text-[0.7rem] font-medium transition-colors ${
                              tabActive
                                ? "bg-[#3f82ff] text-white shadow-sm"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {tab.label}
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </SidebarMenuItem>
              </Fragment>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
