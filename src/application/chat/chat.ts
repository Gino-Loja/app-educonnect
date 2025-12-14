import type { ChatContact, ChatConversation, ChatMessage, ChatRepository, ChatRole, ChatUser } from "@/domain/chat"

const contactPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\d\s\-().]{7,}\d)\b/,
  /\b(?:whatsapp|wsp|telegram|telefono|celular|phone)\s*:?\s*\+?\d[\d\s\-().]{5,}\d\b/i,
]

const containsContactInfo = (text: string) => contactPatterns.some((regex) => regex.test(text))

type ChatBootstrapResult =
  | { status: "error"; message: string }
  | {
      status: "success"
      user: ChatUser
      contacts: ChatContact[]
    }

export async function getChatBootstrap(
  userId: string,
  deps: { chatRepo: ChatRepository },
): Promise<ChatBootstrapResult> {
  const profile = await deps.chatRepo.getUserProfile(userId)
  if (!profile) {
    return { status: "error", message: "No autenticado" }
  }

  const role: ChatRole = profile.role === "teacher" ? "teacher" : "student"
  const isStudent = role === "student"

  const tasks = await deps.chatRepo.listTasksForChat(userId, role)
  const taskIds = tasks.map((t) => t.id)
  const conversations = await deps.chatRepo.getConversationsByTaskIds(taskIds)

  const contacts: ChatContact[] = tasks
    .filter((task) => task.teacherId && task.selectedProposalId)
    .map((task) => {
      const conversation = conversations[task.id]
      const partner = isStudent ? task.teacher : task.student
      const sortDate = conversation?.lastMessageAt || task.updatedAt || task.createdAt || null
      return {
        conversationId: conversation?.id ?? null,
        taskId: task.id,
        taskTitle: task.title,
        partnerId: partner?.id || (isStudent ? task.teacherId : task.studentId),
        partnerName: partner?.name || "Sin nombre",
        partnerAvatar: partner?.avatar || null,
        lastMessage: conversation?.lastMessage ?? null,
        lastMessageAt: conversation?.lastMessageAt ?? sortDate,
        lastMessageSenderId: conversation?.lastMessageSenderId ?? null,
      }
    })
    .sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })

  return {
    status: "success",
    user: profile,
    contacts,
  }
}

export async function ensureConversationForTask(
  taskId: string,
  userId: string,
  deps: { chatRepo: ChatRepository },
): Promise<{ status: "success"; conversation: ChatConversation } | { status: "error"; message: string }> {
  const profile = await deps.chatRepo.getUserProfile(userId)
  if (!profile) {
    return { status: "error", message: "No autenticado" }
  }

  const role: ChatRole = profile.role === "teacher" ? "teacher" : "student"
  const tasks = await deps.chatRepo.listTasksForChat(userId, role)
  const task = tasks.find((t) => t.id === taskId)

  if (!task) {
    return { status: "error", message: "No se encontro la tarea" }
  }

  if (!task.teacherId || !task.selectedProposalId) {
    return { status: "error", message: "La tarea no tiene una propuesta aceptada" }
  }

  if (![task.studentId, task.teacherId].includes(userId)) {
    return { status: "error", message: "No tienes acceso a esta conversacion" }
  }

  const existing = await deps.chatRepo.findConversationByTask(taskId)
  if (existing) {
    return { status: "success", conversation: existing }
  }

  const conversation = await deps.chatRepo.createConversation(taskId, task.studentId, task.teacherId)
  return { status: "success", conversation }
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  options: { offset?: number; limit?: number },
  deps: { chatRepo: ChatRepository },
): Promise<{ status: "success"; messages: ChatMessage[] } | { status: "error"; message: string; messages: ChatMessage[] }> {
  const profile = await deps.chatRepo.getUserProfile(userId)
  if (!profile) {
    return { status: "error", message: "No autenticado", messages: [] }
  }

  const participants = await deps.chatRepo.getConversationParticipants(conversationId)
  if (!participants || ![participants.studentId, participants.teacherId].includes(userId)) {
    return { status: "error", message: "No tienes acceso a este chat", messages: [] }
  }

  const messages = await deps.chatRepo.getMessages(conversationId, options)
  return { status: "success", messages }
}

export async function sendChatMessage(
  conversationId: string,
  userId: string,
  content: string,
  deps: { chatRepo: ChatRepository },
): Promise<{ status: "success"; newMessage: ChatMessage } | { status: "error"; message: string }> {
  const trimmed = content.trim()

  if (trimmed.length < 1) {
    return { status: "error", message: "Escribe un mensaje" }
  }

  if (containsContactInfo(trimmed)) {
    return { status: "error", message: "No compartas correos, telefonos u otros datos de contacto." }
  }

  const profile = await deps.chatRepo.getUserProfile(userId)
  if (!profile) {
    return { status: "error", message: "No autenticado" }
  }

  const participants = await deps.chatRepo.getConversationParticipants(conversationId)
  if (!participants || ![participants.studentId, participants.teacherId].includes(userId)) {
    return { status: "error", message: "No tienes acceso a este chat" }
  }

  const message = await deps.chatRepo.insertMessage(conversationId, userId, trimmed)

  await deps.chatRepo.updateConversationLastMessage(conversationId, {
    lastMessage: trimmed,
    lastMessageAt: message.createdAt,
    lastMessageSenderId: userId,
  })

  return { status: "success", newMessage: message }
}
