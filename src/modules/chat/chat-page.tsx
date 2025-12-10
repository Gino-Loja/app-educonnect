import { redirect } from "next/navigation"
import { ChatShell } from "./chat-shell"
import { getChatBootstrap } from "@/lib/data/chat-actions"

export default async function ChatPage() {
  const bootstrap = await getChatBootstrap()

  if (bootstrap.status === "error" || !bootstrap.contacts || !bootstrap.user) {
    redirect("/workspace")
  }

  return <ChatShell contacts={bootstrap.contacts} currentUser={bootstrap.user} />
}
