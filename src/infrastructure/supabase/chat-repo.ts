import type { SupabaseClient } from "@supabase/supabase-js"

import type { ChatConversation, ChatMessage, ChatRepository, ChatRole, ChatUser } from "@/domain/chat"

type ProfileRef = {
  id?: string | null
  name?: string | null
  profile_picture_url?: string | null
  role?: ChatRole | null
} | null | undefined

type ChatMessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: { id?: string | null; name?: string | null; profile_picture_url?: string | null } | null
}

const mapMessage = (row: ChatMessageRow): ChatMessage => ({
  id: row.id as string,
  conversationId: row.conversation_id as string,
  senderId: row.sender_id as string,
  content: row.content as string,
  createdAt: row.created_at as string,
  sender: row.sender
    ? {
        id: (row.sender.id as string) ?? "",
        name: (row.sender.name as string | null) ?? null,
        avatar: (row.sender.profile_picture_url as string | null) ?? null,
      }
    : undefined,
})

const mapProfileRef = (
  profile: ProfileRef | ProfileRef[],
): { id: string; name: string | null; avatar: string | null } | null => {
  if (!profile) return null
  const user = Array.isArray(profile) ? profile[0] : profile
  if (!user) return null

  return {
    id: (user.id as string) ?? "",
    name: (user.name as string | null) ?? null,
    avatar: (user.profile_picture_url as string | null) ?? null,
  }
}

export function makeChatRepository(supabase: SupabaseClient): ChatRepository {
  return {
    async getUserProfile(userId: string): Promise<ChatUser | null> {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, profile_picture_url, role")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("getUserProfile chat repo error", error)
        return null
      }

      if (!data) return null

      return {
        id: data.id as string,
        name: (data.name as string) || "Sin nombre",
        avatar: (data.profile_picture_url as string | null) ?? null,
        role: (data.role as ChatRole) ?? "student",
      }
    },

    async listTasksForChat(userId: string, role: ChatRole) {
      const isStudent = role === "student"
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          status,
          created_at,
          updated_at,
          selected_proposal_id,
          student_id,
          teacher_id,
          student:profiles!tasks_student_id_fkey(id, name, profile_picture_url),
          teacher:profiles!tasks_teacher_id_fkey(id, name, profile_picture_url)
        `,
        )
        .eq(isStudent ? "student_id" : "teacher_id", userId)
        .not("selected_proposal_id", "is", null)
        .not("teacher_id", "is", null)
        .neq("status", "cancelled")
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("listTasksForChat chat repo error", error)
        return []
      }

      return (data || []).map((row) => ({
        id: row.id as string,
        title: row.title as string,
        studentId: row.student_id as string,
        teacherId: row.teacher_id as string,
        status: row.status as string,
        updatedAt: (row.updated_at as string | null) ?? null,
        createdAt: (row.created_at as string | null) ?? null,
        selectedProposalId: (row.selected_proposal_id as string | null) ?? null,
        student: mapProfileRef(row.student),
        teacher: mapProfileRef(row.teacher),
      }))
    },

    async getConversationsByTaskIds(taskIds: string[]) {
      if (!taskIds.length) return {}

      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .in("task_id", taskIds)

      if (error) {
        console.error("getConversationsByTaskIds chat repo error", error)
        return {}
      }

      return (data || []).reduce<Record<string, ChatConversation>>((acc, row) => {
        acc[row.task_id as string] = {
          id: row.id as string,
          taskId: row.task_id as string,
          studentId: row.student_id as string,
          teacherId: row.teacher_id as string,
          lastMessage: (row.last_message as string | null) ?? null,
          lastMessageAt: (row.last_message_at as string | null) ?? null,
          lastMessageSenderId: (row.last_message_sender_id as string | null) ?? null,
        }
        return acc
      }, {})
    },

    async findConversationByTask(taskId: string): Promise<ChatConversation | null> {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("task_id", taskId)
        .maybeSingle()

      if (error) {
        console.error("findConversationByTask chat repo error", error)
        return null
      }

      if (!data) return null

      return {
        id: data.id as string,
        taskId: data.task_id as string,
        studentId: data.student_id as string,
        teacherId: data.teacher_id as string,
        lastMessage: (data.last_message as string | null) ?? null,
        lastMessageAt: (data.last_message_at as string | null) ?? null,
        lastMessageSenderId: (data.last_message_sender_id as string | null) ?? null,
      }
    },

    async createConversation(taskId: string, studentId: string, teacherId: string) {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          task_id: taskId,
          student_id: studentId,
          teacher_id: teacherId,
        })
        .select()
        .single()

      if (error || !data) {
        throw error || new Error("No se pudo crear la conversacion")
      }

      return {
        id: data.id as string,
        taskId: data.task_id as string,
        studentId: data.student_id as string,
        teacherId: data.teacher_id as string,
        lastMessage: (data.last_message as string | null) ?? null,
        lastMessageAt: (data.last_message_at as string | null) ?? null,
        lastMessageSenderId: (data.last_message_sender_id as string | null) ?? null,
      }
    },

    async getConversationParticipants(conversationId: string) {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("student_id, teacher_id")
        .eq("id", conversationId)
        .maybeSingle()

      if (error) {
        console.error("getConversationParticipants chat repo error", error)
        return null
      }

      if (!data) return null

      return { studentId: data.student_id as string, teacherId: data.teacher_id as string }
    },

    async getMessages(
      conversationId: string,
      options?: { offset?: number; limit?: number },
    ): Promise<ChatMessage[]> {
      const offset = options?.offset ?? 0
      const limit = options?.limit ?? 10

      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          content,
          conversation_id,
          sender_id,
          created_at,
          sender:profiles!chat_messages_sender_id_fkey(id, name, profile_picture_url)
        `,
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("getMessages chat repo error", error)
        return []
      }

      const mapped = (data || []).map((row) =>
        mapMessage({
          id: row.id as string,
          conversation_id: row.conversation_id as string,
          sender_id: row.sender_id as string,
          content: row.content as string,
          created_at: row.created_at as string,
          sender: Array.isArray(row.sender)
            ? {
                id: row.sender[0]?.id as string | null | undefined,
                name: row.sender[0]?.name as string | null | undefined,
                profile_picture_url: row.sender[0]?.profile_picture_url as string | null | undefined,
              }
            : (row.sender as ChatMessageRow["sender"]),
        }),
      )
      return mapped.reverse()
    },

    async insertMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select(
          `
          id,
          content,
          conversation_id,
          sender_id,
          created_at,
          sender:profiles!chat_messages_sender_id_fkey(id, name, profile_picture_url)
        `,
        )
        .single()

      if (error || !data) {
        throw error || new Error("No se pudo guardar el mensaje")
      }

      const sender =
        Array.isArray(data.sender) && data.sender[0]
          ? {
              id: data.sender[0]?.id as string | null | undefined,
              name: data.sender[0]?.name as string | null | undefined,
              profile_picture_url: data.sender[0]?.profile_picture_url as string | null | undefined,
            }
          : (data.sender as ChatMessageRow["sender"])

      return mapMessage({
        id: data.id as string,
        conversation_id: data.conversation_id as string,
        sender_id: data.sender_id as string,
        content: data.content as string,
        created_at: data.created_at as string,
        sender,
      })
    },

    async updateConversationLastMessage(conversationId: string, payload: { lastMessage: string; lastMessageAt: string; lastMessageSenderId: string }): Promise<void> {
      const { error } = await supabase
        .from("chat_conversations")
        .update({
          last_message: payload.lastMessage,
          last_message_at: payload.lastMessageAt,
          last_message_sender_id: payload.lastMessageSenderId,
        })
        .eq("id", conversationId)

      if (error) throw error
    },
  }
}
