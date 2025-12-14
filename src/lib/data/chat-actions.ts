"use server"

import {
  ensureConversationForTask as ensureConversationForTaskUseCase,
  getChatBootstrap as getChatBootstrapUseCase,
  getConversationMessages as getConversationMessagesUseCase,
  sendChatMessage as sendChatMessageUseCase,
} from "@/application/chat/chat"
import type { ChatMessage as DomainChatMessage } from "@/domain/chat"
import type { ChatContact } from "@/lib/data/chat-types"
import { requireUser } from "@/infrastructure/auth/server-auth"
import { makeChatRepository } from "@/infrastructure/supabase/chat-repo"

type ChatBootstrap =
  | { status: "error"; message: string }
  | {
      status: "success"
      user: {
        id: string
        name: string
        avatar: string | null
        role: "student" | "teacher"
      }
      contacts: ChatContact[]
    }

type ChatMessage = {
  id: string
  content: string
  conversation_id: string
  sender_id: string
  created_at: string
  sender?: {
    id: string
    name: string | null
    profile_picture_url: string | null
  }
}

const mapMessageToClient = (message: DomainChatMessage): ChatMessage => ({
  id: message.id,
  content: message.content,
  conversation_id: message.conversationId,
  sender_id: message.senderId,
  created_at: message.createdAt,
  sender: message.sender
    ? {
        id: message.sender.id,
        name: message.sender.name,
        profile_picture_url: message.sender.avatar,
      }
    : undefined,
})

export async function getChatBootstrap(): Promise<ChatBootstrap> {
  const auth = await requireUser()
  if ("error" in auth) {
    return { status: "error", message: "No autenticado" }
  }

  const chatRepo = makeChatRepository(auth.supabase)
  const result = await getChatBootstrapUseCase(auth.user.id, { chatRepo })

  if (result.status === "error") {
    return result
  }

  const role = result.user.role === "teacher" ? "teacher" : "student"

  return {
    status: "success",
    user: {
      id: result.user.id,
      name: result.user.name,
      avatar: result.user.avatar,
      role,
    },
    contacts: result.contacts,
  }
}

export async function ensureConversationForTask(taskId: string) {
  const auth = await requireUser()
  if ("error" in auth) {
    return { status: "error" as const, message: "No autenticado" }
  }

  const chatRepo = makeChatRepository(auth.supabase)
  return ensureConversationForTaskUseCase(taskId, auth.user.id, { chatRepo })
}

export async function getConversationMessages(conversationId: string, options?: { offset?: number; limit?: number }) {
  const auth = await requireUser()
  if ("error" in auth) {
    return { status: "error" as const, message: "No autenticado", messages: [] }
  }

  const chatRepo = makeChatRepository(auth.supabase)
  const result = await getConversationMessagesUseCase(conversationId, auth.user.id, options || {}, { chatRepo })

  if (result.status === "error") {
    return result
  }

  return { status: "success", messages: result.messages.map(mapMessageToClient) }
}

export async function sendChatMessage(conversationId: string, content: string) {
  const auth = await requireUser()
  if ("error" in auth) {
    return { status: "error" as const, message: "No autenticado" }
  }

  const chatRepo = makeChatRepository(auth.supabase)
  const result = await sendChatMessageUseCase(conversationId, auth.user.id, content, { chatRepo })
  if (result.status === "error") return result
  return { status: "success" as const, newMessage: mapMessageToClient(result.newMessage) }
}
