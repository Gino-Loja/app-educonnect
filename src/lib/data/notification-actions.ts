"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: Record<string, any> | null
  created_at: string
  read_at: string | null
}

/**
 * Get unread notification count for current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return 0
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Error fetching unread count:", error)
      return 0
    }

    return count || 0
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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { notifications: [], total: 0 }
    }

    const limit = options?.limit || 10
    const offset = options?.offset || 0

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching notifications:", error)
      return { notifications: [], total: 0 }
    }

    return { notifications: data || [], total: count || 0 }
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error)
    return { notifications: [], total: 0 }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id) // Security: only update own notifications

    if (error) {
      console.error("Error marking notification as read:", error)
      return { status: "error", message: "Error al marcar como leída" }
    }

    revalidatePath("/workspace")
    return { status: "success", message: "Notificación marcada como leída" }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return { status: "error", message: "Error al marcar todas como leídas" }
    }

    revalidatePath("/workspace")
    return { status: "success", message: "Todas las notificaciones marcadas como leídas" }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id) // Security: only delete own notifications

    if (error) {
      console.error("Error deleting notification:", error)
      return { status: "error", message: "Error al eliminar notificación" }
    }

    revalidatePath("/workspace")
    return { status: "success", message: "Notificación eliminada" }
  } catch (error) {
    console.error("Unexpected error deleting notification:", error)
    return { status: "error", message: "Error inesperado" }
  }
}
