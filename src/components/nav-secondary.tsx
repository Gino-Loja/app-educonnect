"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    description?: string
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent className="space-y-3">
        <SidebarGroupLabel className="text-[0.6rem] uppercase tracking-[0.45em] text-slate-400">
          Cuenta
        </SidebarGroupLabel>
        <SidebarMenu className="space-y-2 rounded-3xl border border-slate-100 bg-white/90 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {items.map((item) => {
            const isActive = pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="group w-full rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:text-slate-900 data-[active=true]:border-blue-200 data-[active=true]:bg-white data-[active=true]:text-slate-900"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-11 items-center justify-center rounded-xl border text-base transition-colors ${
                        isActive
                          ? "border-blue-100 bg-blue-600 text-white shadow-[0_6px_15px_rgba(59,130,246,0.25)]"
                          : "border-slate-200 bg-slate-100 text-slate-500 group-hover:border-blue-100 group-hover:text-blue-600"
                      }`}
                    >
                      <item.icon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.85rem] font-semibold">{item.title}</span>
                      {item.description && (
                        <span className="text-[0.7rem] text-slate-400">{item.description}</span>
                      )}
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
