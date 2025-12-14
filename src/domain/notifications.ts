export type Notification = {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  metadata?: Record<string, unknown> | null
  createdAt: string
  readAt?: string | null
}

export interface NotificationsRepository {
  getUnreadCount(userId: string): Promise<number>
  listNotifications(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean },
  ): Promise<{ notifications: Notification[]; total: number }>
  markAsRead(userId: string, notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(userId: string, notificationId: string): Promise<void>
  createNotification(input: {
    userId: string
    type: string
    title: string
    message: string
    link?: string | null
    metadata?: Record<string, unknown> | null
  }): Promise<void>
}
