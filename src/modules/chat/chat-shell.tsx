"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { IconMessage, IconPaperclip, IconSend } from "@tabler/icons-react"
import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/model/schema"
import { ensureConversationForTask, getConversationMessages, sendChatMessage } from "@/lib/data/chat-actions"
import type { ChatContact, ChatMessage } from "@/lib/data/chat-types"

type ChatShellProps = {
  contacts: ChatContact[]
  currentUser: {
    id: string
    name: string
    avatar: string | null
    role: "student" | "teacher"
  }
}

const contactPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\d\s\-().]{7,}\d)\b/,
  /\b(?:whatsapp|wsp|telegram|tel[eé]fono|celular|phone)\s*:?\s*\+?\d[\d\s\-().]{5,}\d\b/i,
]

const containsContactInfo = (text: string) => contactPatterns.some((regex) => regex.test(text))
const isProduction = process.env.NODE_ENV === "production"

const debugLog = (...args: unknown[]) => {
  if (!isProduction) {
    console.debug("[ChatShell]", ...args)
  }
}

const reportError = (message: string, error?: unknown) => {
  toast.error(message)
  if (!isProduction && error) {
    console.error("[ChatShell]", message, error)
  }
}

export function ChatShell({ contacts, currentUser }: ChatShellProps) {
  const [contactList, setContactList] = useState<ChatContact[]>(contacts)
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [, setRealtimeConnected] = useState(false)
  const [realtimeAuthReady, setRealtimeAuthReady] = useState(false)

  const isSharingContactInfo = useMemo(() => containsContactInfo(messageText), [messageText])

  // Establece una línea base de "visto" para no marcar como no leído todo el historial inicial
  useEffect(() => {
    setLastSeen((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const baseline = contacts.reduce<Record<string, string>>((acc, contact) => {
        if (contact.lastMessageAt) {
          acc[contact.taskId] = contact.lastMessageAt
        }
        return acc
      }, {})
      if (Object.keys(baseline).length === 0) return prev
      return { ...prev, ...baseline }
    })
  }, [contacts])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    })
  }, [])

  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMessages = useCallback(
    async (conversationId: string, offset = 0, append = false) => {
      if (offset === 0) {
        setLoadingMessages(true)
      } else {
        setLoadingMore(true)
      }
      try {
        const response = await getConversationMessages(conversationId, { offset, limit: 10 })

        if (response.status === "error") {
          const errorMessage =
            "message" in response && response.message
              ? response.message
              : "No se pudieron cargar los mensajes"
          reportError(errorMessage)
          if (!append) setMessages([])
          return
        }

        const fetched = (response.messages as ChatMessage[]) || []
        setHasMore(fetched.length === 10)

        if (append) {
          setMessages((prev) => [...fetched, ...prev] as ChatMessage[])
        } else {
          setMessages(fetched)
          scrollToBottom()
        }
      } catch (error) {
        reportError("No se pudieron cargar los mensajes", error)
        if (!append) setMessages([])
      } finally {
        setLoadingMessages(false)
        setLoadingMore(false)
      }
    },
    [scrollToBottom],
  )

  const clearFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current)
      fallbackIntervalRef.current = null
    }
  }, [])

  const startFallbackPolling = useCallback(
    (conversationId: string) => {
      clearFallbackPolling()
      fallbackIntervalRef.current = setInterval(() => {
        loadMessages(conversationId, 0, false)
      }, 3000)
    },
    [clearFallbackPolling, loadMessages],
  )

  const ensureConversation = useCallback(
    async (contact: ChatContact) => {
      if (contact.conversationId) return contact.conversationId
      setCreatingConversation(true)
      try {
        const response = await ensureConversationForTask(contact.taskId)

        if (response.status === "error" || !response.conversation) {
          const errorMessage =
            "message" in response && response.message ? response.message : "No se pudo abrir el chat"
          reportError(errorMessage)
          return null
        }

        setContactList((prev) =>
          prev.map((item) =>
            item.taskId === contact.taskId
              ? { ...item, conversationId: response.conversation?.id ?? null }
              : item,
          ),
        )

        setSelectedContact((prev) =>
          prev && prev.taskId === contact.taskId ? { ...prev, conversationId: response.conversation!.id } : prev,
        )
        return response.conversation.id
      } catch (error) {
        reportError("No se pudo crear la conversación", error)
        return null
      } finally {
        setCreatingConversation(false)
      }
    },
    [],
  )

  const handleSelectContact = useCallback(
    async (contact: ChatContact) => {
      setSelectedContact(contact)
      setMessages([]) // Limpia mensajes inmediatamente
      setHasMore(false)
      try {
        const conversationId = await ensureConversation(contact)
        if (conversationId) {
          await loadMessages(conversationId, 0, false)
          setLastSeen((prev) => ({ ...prev, [contact.taskId]: new Date().toISOString() }))
        }
      } catch (error) {
        reportError("No se pudo cargar el chat", error)
      }
    },
    [ensureConversation, loadMessages],
  )

  // Bootstrap inicial
  useEffect(() => {
    if (!selectedContact || selectedContact.conversationId) return

    let cancelled = false
    const bootstrap = async () => {
      const conversationId = await ensureConversation(selectedContact)
      if (!conversationId || cancelled) return
      await loadMessages(conversationId, 0, false)
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [ensureConversation, loadMessages, selectedContact])

  // REALTIME: Suscripción a mensajes nuevos
  useEffect(() => {
    const conversationId = selectedContact?.conversationId
    if (!conversationId || !realtimeAuthReady) return

    let isMounted = true
    const supabase = supabaseRef.current

    const setupRealtime = async () => {
      try {
        clearFallbackPolling()

        if (channelRef.current) {
          debugLog("Limpiando canal anterior antes de crear uno nuevo")
          await channelRef.current.unsubscribe()
          channelRef.current = null
          setRealtimeConnected(false)
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (!isMounted) return null
        
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token)
        } else {
          reportError("No se pudo autenticar el chat en tiempo real", sessionError)
          startFallbackPolling(conversationId)
          return null
        }

        debugLog("Configurando Realtime para conversación:", conversationId)

        const channelName = `chat-messages-${conversationId}-${Date.now()}`
        
        const channel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: false },
            }
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              if (!isMounted) return
              
              const newMessage = payload.new as ChatMessage
              debugLog("Nuevo mensaje recibido:", newMessage)

              setMessages((prev) => {
                if (prev.some((msg) => msg.id === newMessage.id)) {
                  debugLog("Mensaje duplicado, ignorando")
                  return prev
                }
                return [...prev, newMessage]
              })

              setContactList((prev) =>
                prev.map((contact) =>
                  contact.conversationId === conversationId
                    ? {
                        ...contact,
                        lastMessage: newMessage.content,
                        lastMessageAt: newMessage.created_at,
                        lastMessageSenderId: newMessage.sender_id,
                      }
                    : contact,
                ),
              )
              
              scrollToBottom()
            },
          )
          .subscribe(async (status, err) => {
            if (!isMounted) return

            debugLog(`Estado Realtime [${channelName}]:`, status)
            
            if (err) {
              reportError("Problema con la conexión en tiempo real", err)
            }

            if (status === "SUBSCRIBED") {
              setRealtimeConnected(true)
              clearFallbackPolling()
            }

            if (status === "CHANNEL_ERROR") {
              setRealtimeConnected(false)
              startFallbackPolling(conversationId)
            }

            if (status === "TIMED_OUT" || status === "CLOSED") {
              setRealtimeConnected(false)
              startFallbackPolling(conversationId)
      await loadMessages(conversationId, 0, false)
            }
          })

        channelRef.current = channel
        return channel
      } catch (error) {
        reportError("No se pudo inicializar el chat en tiempo real", error)
        startFallbackPolling(conversationId)
        return null
      }
    }

    setupRealtime()

    return () => {
      debugLog("Limpiando efecto de Realtime")
      setRealtimeConnected(false)
      clearFallbackPolling()
      isMounted = false
      if (channelRef.current) {
        channelRef.current.unsubscribe().then(() => {
          debugLog("Canal desuscrito")
          channelRef.current = null
        })
      }
    }
  }, [
    selectedContact?.conversationId,
    loadMessages,
    scrollToBottom,
    realtimeAuthReady,
    clearFallbackPolling,
    startFallbackPolling,
  ])

  // Mantiene el token actualizado para Realtime (evita CHANNEL_ERROR por token inválido)
  useEffect(() => {
    const supabase = supabaseRef.current
    let active = true

    const syncSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!active) return

        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token)
          setRealtimeAuthReady(true)
        } else {
          reportError("No hay sesión disponible para Realtime", error)
          setRealtimeAuthReady(false)
        }
      } catch (error) {
        if (active) {
          reportError("No se pudo obtener la sesión de Realtime", error)
        }
      }
    }

    syncSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token)
        setRealtimeAuthReady(true)
      } else {
        setRealtimeAuthReady(false)
      }
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Listener global de conversaciones
  useEffect(() => {
    if (!realtimeAuthReady) return

    let isMounted = true
    const supabase = supabaseRef.current

    const channel = supabase
      .channel("chat_conversations_global")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
        },
        (payload) => {
          debugLog("Evento de conversación:", payload)
          if (!isMounted) return

          const newConv = payload.new as Database["public"]["Tables"]["chat_conversations"]["Row"]
          if (!newConv || !newConv.task_id) return

          setContactList((prev) => {
            const contactIndex = prev.findIndex((c) => c.taskId === newConv.task_id)
            if (contactIndex === -1) return prev

            const updatedContacts = [...prev]
            const contact = updatedContacts[contactIndex]

            if (contact.conversationId === newConv.id && contact.lastMessage === newConv.last_message) {
              return prev
            }

            updatedContacts[contactIndex] = {
              ...contact,
              conversationId: newConv.id,
              lastMessage: newConv.last_message,
              lastMessageAt: newConv.last_message_at,
              lastMessageSenderId: newConv.last_message_sender_id ?? contact.lastMessageSenderId ?? null,
            }

            if (selectedContact?.taskId === contact.taskId) {
              setSelectedContact((curr) => {
                if (!curr) return null
                return {
                  ...curr,
                  conversationId: newConv.id,
                  lastMessage: newConv.last_message,
                  lastMessageAt: newConv.last_message_at,
                  lastMessageSenderId: newConv.last_message_sender_id ?? curr.lastMessageSenderId ?? null,
                }
              })
            }

            return updatedContacts
          })
        }
      )
      .subscribe((status) => {
        debugLog("Estado global de conversaciones:", status)
      })

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [realtimeAuthReady, selectedContact?.taskId])

  const handleSend = useCallback(async () => {
    if (!selectedContact) return
    if (isSending || loadingMessages) return

    const trimmed = messageText.trim()
    if (trimmed.length === 0) {
      toast.error("Escribe un mensaje")
      return
    }
    if (isSharingContactInfo) {
      toast.error("No compartas correos, teléfonos u otros datos de contacto.")
      return
    }

    const conversationId = await ensureConversation(selectedContact)
    if (!conversationId) return

    setIsSending(true)
    try {
      const response = await sendChatMessage(conversationId, trimmed)

      if (response.status === "error" || !response.newMessage) {
        const errorMessage =
          "message" in response && response.message ? response.message : "No se pudo enviar el mensaje"
        reportError(errorMessage)
        return
      }

      // El mensaje se agregará automáticamente vía Realtime
      // Pero lo agregamos localmente también por si acaso
      setMessages((prev) =>
        prev.some((msg) => msg.id === response.newMessage!.id)
          ? prev
          : [...prev, response.newMessage as ChatMessage],
      )
      
      setContactList((prev) =>
        prev.map((contact) =>
          contact.taskId === selectedContact.taskId
            ? {
                ...contact,
                conversationId,
                lastMessage: trimmed,
                lastMessageAt: response.newMessage?.created_at ?? new Date().toISOString(),
                lastMessageSenderId: currentUser.id,
              }
            : contact,
        ),
      )
      
      setMessageText("")
      scrollToBottom()
    } catch (error) {
      reportError("No se pudo enviar el mensaje", error)
    } finally {
      setIsSending(false)
    }
  }, [
    ensureConversation,
    isSending,
    isSharingContactInfo,
    loadingMessages,
    messageText,
    scrollToBottom,
    selectedContact,
    currentUser.id,
  ])

  const formatTime = (date: string | null) => {
    if (!date) return ""
    try {
      return format(new Date(date), "HH:mm", { locale: es })
    } catch {
      return ""
    }
  }

  const lastMessagePreview = (text: string | null) => {
    if (!text) return "Aún no hay mensajes"
    if (text.length > 50) return `${text.slice(0, 50)}...`
    return text
  }

  const initials = (name: string) => {
    const parts = name.split(" ").filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-2 px-2 py-2 lg:px-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <IconMessage className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">Mensajes</h1>
          </div>
        </div>
        <Separator className="mt-1" />
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none lg:grid-cols-[280px_1fr]">
        <div className="flex h-full flex-col border-b border-slate-200/80 dark:border-slate-800 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between p-3">
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">Contactos</h2>
            <Badge variant="outline" className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-900">
              {contactList.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {contactList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-2 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No tienes contactos disponibles.
              </div>
            ) : (
              contactList.map((contact) => {
                const isActive = contact.taskId === selectedContact?.taskId
                const lastSeenAt = lastSeen[contact.taskId]
                const hasUnread =
                  !isActive &&
                  !!contact.lastMessageAt &&
                  !!contact.lastMessageSenderId &&
                  contact.lastMessageSenderId !== currentUser.id &&
                  (!lastSeenAt || new Date(contact.lastMessageAt).getTime() > new Date(lastSeenAt).getTime())
                return (
                  <button
                    key={contact.taskId}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full rounded-lg border px-2 py-2 text-left transition ${
                      isActive
                        ? "border-blue-500/30 bg-blue-50/70 shadow-sm dark:border-blue-500/40 dark:bg-blue-900/20"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="relative flex items-center gap-2">
                      {hasUnread && <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-blue-500 shadow-sm dark:bg-blue-400" />}
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.partnerAvatar || undefined} />
                        <AvatarFallback className="text-xs">{initials(contact.partnerName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{contact.partnerName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {lastMessagePreview(contact.lastMessage)}
                            </p>
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                            {formatTime(contact.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex h-full flex-col min-h-0">
          {selectedContact ? (
            <>
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800 shrink-0">
                <Avatar className="h-8 w-8 ring-1 ring-slate-200 dark:ring-slate-800">
                  <AvatarImage src={selectedContact.partnerAvatar || undefined} />
                  <AvatarFallback className="text-xs">{initials(selectedContact.partnerName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedContact.partnerName}</p>
                </div>
                {creatingConversation && (
                  <Badge variant="outline" className="animate-pulse border-blue-200 bg-blue-50 text-[10px] text-blue-600 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
                    Conectando...
                  </Badge>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50 px-4 py-4 dark:bg-slate-950/50">
                {loadingMessages ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                    <Spinner className="h-4 w-4" />
                    <span className="text-xs">Cargando mensajes...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                      <IconMessage className="h-5 w-5 opacity-50" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Aún no hay mensajes</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {hasMore && selectedContact?.conversationId && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingMore}
                          onClick={() => loadMessages(selectedContact.conversationId!, messages.length, true)}
                        >
                          {loadingMore ? "Cargando..." : "Cargar mensajes anteriores"}
                        </Button>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUser.id
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm transition-all ${
                              isMine
                                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm"
                                : "bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-800"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <span className={`mt-0.5 block text-[9px] ${isMine ? "text-blue-100/80" : "text-slate-400"}`}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950 shrink-0">
                <div className="relative flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-blue-500/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:bg-slate-950">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-500" disabled>
                    <IconPaperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    rows={1}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="min-h-[2rem] max-h-24 w-full resize-none border-0 bg-transparent py-1.5 text-sm focus-visible:ring-0 placeholder:text-slate-400"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className={`h-8 w-8 shrink-0 rounded-lg transition-all ${
                      messageText.trim().length > 0
                        ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                        : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                    }`}
                    onClick={handleSend}
                    disabled={isSending || creatingConversation || isSharingContactInfo || messageText.trim().length === 0}
                  >
                    {isSending ? <Spinner className="h-3 w-3" /> : <IconSend className="h-3 w-3" />}
                  </Button>
                </div>
                {isSharingContactInfo && (
                  <p className="mt-1 text-center text-[10px] text-amber-600 dark:text-amber-400">
                    Por seguridad, no compartas datos de contacto personal.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-slate-500 dark:text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                <IconMessage className="h-6 w-6 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Tus Mensajes</p>
                <p className="text-xs">Selecciona un chat</p>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
