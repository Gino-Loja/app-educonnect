"use client"

import { useState, useEffect, useMemo, type ReactNode } from "react"
import {
  IconAlertCircle,
  IconBell,
  IconCheck,
  IconCreditCard,
  IconFilter,
  IconListDetails,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "@/lib/data/notification-actions"
import { differenceInDays, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const MAX_NOTIFICATIONS = 20

interface NotificationBellProps {
  initialCount: number
}

export function NotificationBell({ initialCount }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "recent">("all")

  // Fetch notifications when sheet opens
  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications(true) // Silent refresh
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true)

    const result = await getNotifications({ limit: MAX_NOTIFICATIONS })
    setNotifications(result.notifications)
    setUnreadCount(result.notifications.filter((n) => !n.is_read).length)

    if (!silent) setLoading(false)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.status === "success") {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.status === "success") {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
      toast.success(result.message)
    }
  }

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotification(notificationId)
    if (result.status === "success") {
      const wasUnread = notifications.find((n) => n.id === notificationId)?.is_read === false
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      toast.success(result.message)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.link) {
      setOpen(false)
      router.push(notification.link)
      router.refresh()
    }
  }

  const filterOptions: { label: string; value: typeof activeFilter }[] = [
    { label: "Todas", value: "all" },
    { label: "No leídas", value: "unread" },
    { label: "Recientes", value: "recent" },
  ]

  const filteredNotifications = useMemo(() => {
    const latest = notifications.slice(0, MAX_NOTIFICATIONS)
    return latest.filter((notification) => {
      if (activeFilter === "unread") {
        return !notification.is_read
      }
      if (activeFilter === "recent") {
        return differenceInDays(new Date(), new Date(notification.created_at)) <= 7
      }
      return true
    })
  }, [notifications, activeFilter])

  type TypeMeta = {
    label: string
    badgeClass: string
    icon: ReactNode
    accentBg: string
    highlight: string
  }

  const getNotificationTypeMeta = (type: string): TypeMeta => {
    const map: Record<string, TypeMeta> = {
      payment: {
        label: "Pagos",
        badgeClass: "bg-emerald-50 text-emerald-700",
        icon: <IconCreditCard className="h-4 w-4" />,
        accentBg: "bg-emerald-100/70 dark:bg-emerald-900/30",
        highlight: "border-emerald-100 dark:border-emerald-900/40",
      },
      task: {
        label: "Tareas",
        badgeClass: "bg-sky-50 text-sky-600",
        icon: <IconListDetails className="h-4 w-4" />,
        accentBg: "bg-sky-100/80 dark:bg-sky-900/30",
        highlight: "border-sky-100 dark:border-sky-900/40",
      },
      alert: {
        label: "Alertas",
        badgeClass: "bg-amber-50 text-amber-600",
        icon: <IconAlertCircle className="h-4 w-4" />,
        accentBg: "bg-amber-100/80 dark:bg-amber-900/30",
        highlight: "border-amber-100 dark:border-amber-900/30",
      },
    }

    return (
      map[type] ?? {
        label: "General",
        badgeClass: "bg-slate-100 text-slate-600",
        icon: <IconBell className="h-4 w-4" />,
        accentBg: "bg-slate-100 dark:bg-slate-800/60",
        highlight: "border-slate-200 dark:border-slate-800",
      }
    )
  }

  const description =
    unreadCount > 0
      ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} sin leer`
      : "Estás al día con tus notificaciones"
  const latestCount = Math.min(notifications.length, MAX_NOTIFICATIONS)

  const renderEmptyMessage = () => {
    if (notifications.length === 0) {
      return "No tienes notificaciones todavía"
    }
    if (activeFilter === "unread") {
      return "Todas tus notificaciones están leídas"
    }
    if (activeFilter === "recent") {
      return "No hay notificaciones en los últimos 7 días"
    }
    return "No encontramos notificaciones con este filtro"
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px]">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>Notificaciones</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button variant="ghost" size="icon" title="Actualizar" onClick={() => loadNotifications()}>
                <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              {unreadCount > 0 && (
                <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
                  Marcar todas
                </Button>
              )}
            </div>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <IconFilter className="h-3.5 w-3.5" />
              Filtros rápidos:
            </span>
            {filterOptions.map((option) => {
              const isActive = activeFilter === option.value
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs ${isActive ? "shadow-sm" : "text-muted-foreground"}`}
                  onClick={() => setActiveFilter(option.value)}
                >
                  {option.label}
                  {option.value === "unread" && unreadCount > 0 ? (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                      {unreadCount}
                    </span>
                  ) : null}
                </Button>
              )
            })}
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            Mostrando las últimas {latestCount || 0} notificaciones (máx. {MAX_NOTIFICATIONS})
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconBell className="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">{renderEmptyMessage()}</p>
              {activeFilter !== "all" && notifications.length > 0 ? (
                <Button variant="link" size="sm" className="mt-3" onClick={() => setActiveFilter("all")}>
                  Ver todas las notificaciones
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2.5 m-2">
              {filteredNotifications.map((notification) => {
                const typeMeta = getNotificationTypeMeta(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`group relative rounded-lg border p-3 transition-colors ${
                      notification.is_read
                        ? `bg-background hover:bg-accent/50 ${typeMeta.highlight}`
                        : `bg-blue-50 dark:bg-blue-950/20 ${typeMeta.highlight} hover:bg-blue-100 dark:hover:bg-blue-950/30`
                    } ${notification.link ? "cursor-pointer" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-2.5">
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                          notification.is_read ? "bg-muted" : typeMeta.accentBg
                        }`}
                      >
                        {typeMeta.icon}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-1 flex-col gap-1">
                            <p className="text-[0.9rem] font-semibold leading-tight">{notification.title}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`text-[0.65rem] ${typeMeta.badgeClass}`}>{typeMeta.label}</Badge>
                              {!notification.is_read && (
                                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-blue-600">
                                  Nuevo
                                </span>
                              )}
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <p className="text-[0.85rem] text-muted-foreground line-clamp-2">{notification.message}</p>

                        <div className="flex items-center justify-between pt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>

                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                              >
                                <IconCheck className="h-3 w-3" />
                              </Button>
                            )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(notification.id)
                                }}
                              >
                                <IconTrash className="h-3 w-3" />
                              </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
