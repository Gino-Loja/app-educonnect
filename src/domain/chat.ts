export type ChatRole = "student" | "teacher" | string

export type ChatUser = {
  id: string
  name: string
  avatar: string | null
  role: ChatRole
}

export type ChatContact = {
  conversationId: string | null
  taskId: string
  taskTitle: string
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  lastMessageSenderId?: string | null
}

export type ChatConversation = {
  id: string
  taskId: string
  studentId: string
  teacherId: string
  lastMessage?: string | null
  lastMessageAt?: string | null
  lastMessageSenderId?: string | null
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  sender?: {
    id: string
    name: string | null
    avatar: string | null
  }
}

export interface ChatRepository {
  getUserProfile(userId: string): Promise<ChatUser | null>
  listTasksForChat(userId: string, role: ChatRole): Promise<
    Array<{
      id: string
      title: string
      studentId: string
      teacherId: string
      status: string
      updatedAt: string | null
      createdAt: string | null
      selectedProposalId?: string | null
      student?: { id: string; name: string | null; avatar: string | null } | null
      teacher?: { id: string; name: string | null; avatar: string | null } | null
    }>
  >
  getConversationsByTaskIds(taskIds: string[]): Promise<Record<string, ChatConversation>>
  findConversationByTask(taskId: string): Promise<ChatConversation | null>
  createConversation(taskId: string, studentId: string, teacherId: string): Promise<ChatConversation>
  getConversationParticipants(conversationId: string): Promise<{ studentId: string; teacherId: string } | null>
  getMessages(
    conversationId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<ChatMessage[]>
  insertMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage>
  updateConversationLastMessage(conversationId: string, payload: { lastMessage: string; lastMessageAt: string; lastMessageSenderId: string }): Promise<void>
}
