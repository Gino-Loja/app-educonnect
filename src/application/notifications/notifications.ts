import type { Notification, NotificationsRepository } from "@/domain/notifications"

export async function getUnreadNotificationCount(
  userId: string,
  deps: { notificationsRepo: NotificationsRepository },
): Promise<number> {
  try {
    return await deps.notificationsRepo.getUnreadCount(userId)
  } catch (error) {
    console.error("getUnreadNotificationCount use-case error", error)
    return 0
  }
}

export async function getNotifications(
  userId: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean },
  deps: { notificationsRepo: NotificationsRepository },
): Promise<{ notifications: Notification[]; total: number }> {
  try {
    return await deps.notificationsRepo.listNotifications(userId, options)
  } catch (error) {
    console.error("getNotifications use-case error", error)
    return { notifications: [], total: 0 }
  }
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
  deps: { notificationsRepo: NotificationsRepository },
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    await deps.notificationsRepo.markAsRead(userId, notificationId)
    return { status: "success", message: "Notificacion marcada como leida" }
  } catch (error) {
    console.error("markNotificationAsRead use-case error", error)
    return { status: "error", message: "Error al marcar como leida" }
  }
}

export async function markAllNotificationsAsRead(
  userId: string,
  deps: { notificationsRepo: NotificationsRepository },
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    await deps.notificationsRepo.markAllAsRead(userId)
    return { status: "success", message: "Notificaciones marcadas como leidas" }
  } catch (error) {
    console.error("markAllNotificationsAsRead use-case error", error)
    return { status: "error", message: "Error al marcar todas como leidas" }
  }
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
  deps: { notificationsRepo: NotificationsRepository },
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    await deps.notificationsRepo.deleteNotification(userId, notificationId)
    return { status: "success", message: "Notificacion eliminada" }
  } catch (error) {
    console.error("deleteNotification use-case error", error)
    return { status: "error", message: "Error al eliminar notificacion" }
  }
}

export async function createNotification(
  input: {
    userId: string
    type: string
    title: string
    message: string
    link?: string | null
    metadata?: Record<string, unknown> | null
  },
  deps: { notificationsRepo: NotificationsRepository },
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    await deps.notificationsRepo.createNotification(input)
    return { status: "success", message: "Notificacion creada" }
  } catch (error) {
    console.error("createNotification use-case error", error)
    return { status: "error", message: "Error al crear notificacion" }
  }
}
