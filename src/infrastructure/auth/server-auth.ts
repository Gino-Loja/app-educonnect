import type { SupabaseClient, User } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"

type AuthSuccess = { supabase: SupabaseClient; user: User }
type AuthError = { supabase: SupabaseClient; error: string }

export async function getAuthContext(): Promise<{ supabase: SupabaseClient; user: User | null; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("getAuthContext error", error)
    return { supabase, user: null, error: "No autenticado" }
  }

  return { supabase, user, error: user ? undefined : "No autenticado" }
}

export async function requireUser(): Promise<AuthSuccess | AuthError> {
  const context = await getAuthContext()
  if (!context.user) {
    return { supabase: context.supabase, error: "No autenticado" }
  }

  return { supabase: context.supabase, user: context.user }
}

export function revalidatePaths(paths: string[]) {
  paths.forEach((path) => revalidatePath(path))
}

export function redirectTo(path: string): never {
  redirect(path)
}
