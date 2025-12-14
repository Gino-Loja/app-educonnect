import type { ChatContact as DomainChatContact } from "@/domain/chat"

export type ChatContact = DomainChatContact

export type ChatMessage = {
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
