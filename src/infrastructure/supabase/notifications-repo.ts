import type { SupabaseClient } from "@supabase/supabase-js"

import type { Notification, NotificationsRepository } from "@/domain/notifications"
import type { Json } from "@/model/schema"

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link?: string | null
  is_read?: boolean | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  read_at?: string | null
}

const mapNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  message: row.message,
  link: row.link ?? null,
  isRead: row.is_read ?? false,
  metadata: row.metadata ?? null,
  createdAt: row.created_at || new Date().toISOString(),
  readAt: row.read_at ?? null,
})

export function makeNotificationsRepository(supabase: SupabaseClient): NotificationsRepository {
  return {
    async getUnreadCount(userId: string): Promise<number> {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("getUnreadCount notifications repo error", error)
        return 0
      }

      return count || 0
    },

    async listNotifications(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
      const limit = options?.limit ?? 10
      const offset = options?.offset ?? 0

      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (options?.unreadOnly) {
        query = query.eq("is_read", false)
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1)

      if (error) {
        console.error("listNotifications notifications repo error", error)
        return { notifications: [], total: 0 }
      }

      return {
        notifications: (data || []).map(mapNotification),
        total: count || 0,
      }
    },

    async markAsRead(userId: string, notificationId: string): Promise<void> {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId)

      if (error) throw error
    },

    async markAllAsRead(userId: string): Promise<void> {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) throw error
    },

    async deleteNotification(userId: string, notificationId: string): Promise<void> {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId)

      if (error) throw error
    },

    async createNotification(input) {
      const { error } = await supabase.rpc("create_notification", {
        p_user_id: input.userId,
        p_type: input.type,
        p_title: input.title,
        p_message: input.message,
        p_link: input.link ?? undefined,
        p_metadata: (input.metadata as Json | undefined) ?? undefined,
      })

      if (error) throw error
    },
  }
}
