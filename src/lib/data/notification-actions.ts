"use server"

import {
  createNotification as createNotificationUseCase,
  deleteNotification as deleteNotificationUseCase,
  getNotifications as getNotificationsUseCase,
  getUnreadNotificationCount as getUnreadNotificationCountUseCase,
  markAllNotificationsAsRead as markAllNotificationsAsReadUseCase,
  markNotificationAsRead as markNotificationAsReadUseCase,
} from "@/application/notifications/notifications"
import type { Notification as DomainNotification } from "@/domain/notifications"
import { requireUser, revalidatePaths } from "@/infrastructure/auth/server-auth"
import { makeNotificationsRepository } from "@/infrastructure/supabase/notifications-repo"

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  read_at: string | null
}

const mapNotificationToClient = (notification: DomainNotification): Notification => ({
  id: notification.id,
  user_id: notification.userId,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: notification.link ?? null,
  is_read: notification.isRead,
  metadata: notification.metadata ?? null,
  created_at: notification.createdAt,
  read_at: notification.readAt ?? null,
})

/**
 * Get unread notification count for current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const auth = await requireUser()

    if ("error" in auth) {
      return 0
    }

    const notificationsRepo = makeNotificationsRepository(auth.supabase)
    return await getUnreadNotificationCountUseCase(auth.user.id, { notificationsRepo })
  } catch (error) {
    console.error("Unexpected error fetching unread count:", error)
    return 0
  }
}

/**
 * Get notifications for current user
 */
export async function getNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}): Promise<{ notifications: Notification[]; total: number }> {
  const auth = await requireUser()

  if ("error" in auth) {
    return { notifications: [], total: 0 }
  }

  const notificationsRepo = makeNotificationsRepository(auth.supabase)
  const result = await getNotificationsUseCase(
    auth.user.id,
    {
      limit: options?.limit,
      offset: options?.offset,
      unreadOnly: options?.unreadOnly,
    },
    { notificationsRepo },
  )

  return {
    notifications: result.notifications.map(mapNotificationToClient),
    total: result.total,
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  status: "success" | "error"
  message: string
}> {
  try {
    const auth = await requireUser()

    if ("error" in auth) {
      return { status: "error", message: "No autenticado" }
    }

    const notificationsRepo = makeNotificationsRepository(auth.supabase)
    const result = await markNotificationAsReadUseCase(auth.user.id, notificationId, { notificationsRepo })

    if (result.status === "success") {
      revalidatePaths(["/workspace"])
    }

    return result
  } catch (error) {
    console.error("Unexpected error marking notification as read:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<{
  status: "success" | "error"
  message: string
}> {
  try {
    const auth = await requireUser()

    if ("error" in auth) {
      return { status: "error", message: "No autenticado" }
    }

    const notificationsRepo = makeNotificationsRepository(auth.supabase)
    const result = await markAllNotificationsAsReadUseCase(auth.user.id, { notificationsRepo })
    if (result.status === "success") {
      revalidatePaths(["/workspace"])
    }
    return result
  } catch (error) {
    console.error("Unexpected error marking all notifications as read:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  status: "success" | "error"
  message: string
}> {
  try {
    const auth = await requireUser()

    if ("error" in auth) {
      return { status: "error", message: "No autenticado" }
    }

    const notificationsRepo = makeNotificationsRepository(auth.supabase)
    const result = await deleteNotificationUseCase(auth.user.id, notificationId, { notificationsRepo })
    if (result.status === "success") {
      revalidatePaths(["/workspace"])
    }
    return result
  } catch (error) {
    console.error("Unexpected error deleting notification:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

/**
 * Create a new notification (System use only)
 */
export async function createNotification(params: {
  userId: string
  type: string
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
}): Promise<{ status: "success" | "error"; message: string }> {
  try {
    const auth = await requireUser()
    const notificationsRepo = makeNotificationsRepository(auth.supabase)
    const result = await createNotificationUseCase(
      {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
        metadata: params.metadata ?? null,
      },
      { notificationsRepo },
    )

    return result
  } catch (error) {
    console.error("Unexpected error creating notification:", error)
    return { status: "error", message: "Error inesperado" }
  }
}
