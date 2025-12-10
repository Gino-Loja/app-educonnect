"use server"

import type { PostgrestError } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/model/schema"

type ChatConversation = Database["public"]["Tables"]["chat_conversations"]["Row"]
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"] & {
  sender?: {
    id: string
    name: string | null
    profile_picture_url: string | null
  }
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

type ChatTaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  student?: { id: string; name: string | null; profile_picture_url: string | null } | null
  teacher?: { id: string; name: string | null; profile_picture_url: string | null } | null
}

export type ChatBootstrap = {
  status: "success" | "error"
  message?: string
  user?: {
    id: string
    name: string
    avatar: string | null
    role: "student" | "teacher"
  }
  contacts?: ChatContact[]
}

const contactPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\d\s\-().]{7,}\d)\b/,
  /\b(?:whatsapp|wsp|telegram|tel[eé]fono|celular|phone)\s*:?\s*\+?\d[\d\s\-().]{5,}\d\b/i,
]

const containsContactInfo = (text: string) => contactPatterns.some((regex) => regex.test(text))

export async function getChatBootstrap(): Promise<ChatBootstrap> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, profile_picture_url, role")
    .eq("id", user.id)
    .single()

  const role = profile?.role === "teacher" ? "teacher" : "student"
  const isStudent = role === "student"

  const { data: tasks, error: tasksError } = await supabase
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
    .eq(isStudent ? "student_id" : "teacher_id", user.id)
    .not("selected_proposal_id", "is", null)
    .not("teacher_id", "is", null)
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false })

  if (tasksError) {
    console.error("Error fetching chat tasks:", tasksError)
    return { status: "error", message: "No se pudieron cargar tus contactos" }
  }

  const taskIds = (tasks || []).map((task) => task.id)

  let conversationMap: Record<string, ChatConversation> = {}

  if (taskIds.length > 0) {
    const { data: conversations, error: conversationsError } = await supabase
      .from("chat_conversations")
      .select("*")
      .in("task_id", taskIds)

    if (conversationsError && (conversationsError as PostgrestError).message) {
      console.error("Error loading conversations:", conversationsError)
    } else if (conversations) {
      conversationMap = conversations.reduce<Record<string, ChatConversation>>((acc, conv) => {
        acc[conv.task_id] = conv
        return acc
      }, {})
    }
  }

  const groupedByPartner = new Map<
    string,
    {
      partnerName: string
      partnerAvatar: string | null
      entries: {
        taskId: string
        taskTitle: string
        conversationId: string | null
        lastMessage: string | null
        lastMessageAt: string | null
        sortDate: string | null
      }[]
    }
  >()

  ;((tasks || []) as ChatTaskRow[]).forEach((task) => {
    const partner = isStudent ? task.teacher : task.student
    if (!partner?.id) return
    const conversation = conversationMap[task.id]
    const sortDate = conversation?.last_message_at || conversation?.updated_at || task.updated_at || task.created_at || null

    const entry = {
      taskId: task.id,
      taskTitle: task.title,
      conversationId: conversation?.id ?? null,
      lastMessage: conversation?.last_message ?? null,
      lastMessageAt: conversation?.last_message_at ?? null,
      sortDate,
    }

    const existing = groupedByPartner.get(partner.id)
    if (existing) {
      existing.entries.push(entry)
    } else {
      groupedByPartner.set(partner.id, {
        partnerName: partner?.name || "Sin nombre",
        partnerAvatar: partner?.profile_picture_url || null,
        entries: [entry],
      })
    }
  })

  const contacts: ChatContact[] = Array.from(groupedByPartner.entries()).map(([partnerId, payload]) => {
    const best = payload.entries.sort((a, b) => {
      const aDate = a.sortDate ? new Date(a.sortDate).getTime() : 0
      const bDate = b.sortDate ? new Date(b.sortDate).getTime() : 0
      return bDate - aDate
    })[0]

    return {
      conversationId: best.conversationId,
      taskId: best.taskId,
      taskTitle: best.taskTitle,
      partnerId,
      partnerName: payload.partnerName,
      partnerAvatar: payload.partnerAvatar,
      lastMessage: best.lastMessage,
      lastMessageAt: best.lastMessageAt,
      lastMessageSenderId: conversationMap[best.taskId]?.last_message_sender_id ?? null,
    }
  })

  return {
    status: "success",
    user: {
      id: user.id,
      name: profile?.name || user.email || "Sin nombre",
      avatar: profile?.profile_picture_url || null,
      role,
    },
    contacts,
  }
}

export async function ensureConversationForTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error" as const, message: "No autenticado" }
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select("id, title, student_id, teacher_id, selected_proposal_id")
    .eq("id", taskId)
    .single()

  if (error || !task) {
    return { status: "error" as const, message: "No se encontró la tarea" }
  }

  if (!task.teacher_id || !task.selected_proposal_id) {
    return { status: "error" as const, message: "La tarea no tiene una propuesta aceptada" }
  }

  if (![task.student_id, task.teacher_id].includes(user.id)) {
    return { status: "error" as const, message: "No tienes acceso a esta conversación" }
  }

  const { data: existingConversation } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("task_id", taskId)
    .maybeSingle()

  if (existingConversation) {
    return { status: "success" as const, conversation: existingConversation }
  }

  const { data: conversation, error: createError } = await supabase
    .from("chat_conversations")
    .insert({
      task_id: task.id,
      student_id: task.student_id,
      teacher_id: task.teacher_id,
    })
    .select()
    .single()

  if (createError || !conversation) {
    console.error("Error creating conversation:", createError)
    return { status: "error" as const, message: "No se pudo crear la conversación" }
  }

  return { status: "success" as const, conversation }
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error" as const, message: "No autenticado", messages: [] }
  }

  const { data: conversation } = await supabase
    .from("chat_conversations")
    .select("id, student_id, teacher_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (!conversation || ![conversation.student_id, conversation.teacher_id].includes(user.id)) {
    return { status: "error" as const, message: "No tienes acceso a este chat", messages: [] }
  }

  const { data: messages, error } = await supabase
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
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return { status: "error" as const, message: "No se pudieron cargar los mensajes", messages: [] }
  }

  return { status: "success" as const, messages: (messages || []) as ChatMessage[] }
}

export async function sendChatMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const trimmed = content.trim()

  if (trimmed.length < 1) {
    return { status: "error" as const, message: "Escribe un mensaje" }
  }

  if (containsContactInfo(trimmed)) {
    return { status: "error" as const, message: "No compartas correos, teléfonos u otros datos de contacto." }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error" as const, message: "No autenticado" }
  }

  const { data: conversation } = await supabase
    .from("chat_conversations")
    .select("id, student_id, teacher_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (!conversation || ![conversation.student_id, conversation.teacher_id].includes(user.id)) {
    return { status: "error" as const, message: "No tienes acceso a este chat" }
  }

  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
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

  if (error || !message) {
    console.error("Error sending message:", error)
    return { status: "error" as const, message: "No se pudo enviar el mensaje" }
  }

  await supabase
    .from("chat_conversations")
    .update({
      last_message: trimmed,
      last_message_at: message.created_at,
      last_message_sender_id: user.id,
    })
    .eq("id", conversationId)

  return { status: "success" as const, newMessage: message as ChatMessage }
}
