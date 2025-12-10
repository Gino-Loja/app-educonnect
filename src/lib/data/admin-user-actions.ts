"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/model/schema"

export interface User {
  id: string
  email: string
  name: string | null
  role: string
  is_active: boolean | null
  created_at: string | null
  last_active_at: string | null
  profile_picture_url: string | null
  phone: string | null
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getUsers(options?: {
  page?: number
  limit?: number
  role?: string
  search?: string
  status?: "active" | "inactive" | "all"
}): Promise<UsersResponse> {
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  // Filter by role
  if (options?.role && options.role !== "all") {
    query = query.eq("role", options.role)
  }

  // Filter by status
  if (options?.status === "active") {
    query = query.eq("is_active", true)
  } else if (options?.status === "inactive") {
    query = query.eq("is_active", false)
  }

  // Search by name or email
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching users:", error)
    return {
      users: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 0,
    }
  }

  const totalPages = count ? Math.ceil(count / limit) : 0

  return {
    users: data || [],
    total: count || 0,
    page,
    pageSize: limit,
    totalPages,
  }
}

export async function toggleUserStatus(userId: string): Promise<{
  status: "success" | "error"
  message: string
}> {
  try {
    const supabase = await createClient()

    // Get current status
    const { data: user, error: fetchError } = await supabase
      .from("profiles")
      .select("is_active, deleted_at")
      .eq("id", userId)
      .single()

    if (fetchError || !user) {
      return { status: "error", message: "Usuario no encontrado" }
    }

    if (user.deleted_at) {
      return { status: "error", message: "El usuario ya fue eliminado" }
    }

    // Toggle status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", userId)

    if (updateError) {
      console.error("Error toggling user status:", updateError)
      return { status: "error", message: "Error al actualizar el estado del usuario" }
    }

    revalidatePath("/admin/users")
    return {
      status: "success",
      message: user.is_active ? "Usuario desactivado" : "Usuario activado",
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

type StudentProfile = Database["public"]["Tables"]["students"]["Row"]
type TeacherProfile = Database["public"]["Tables"]["teachers"]["Row"]

export type UserDetail = User & {
  student: StudentProfile | null
  teacher: TeacherProfile | null
}

export async function getUserById(userId: string): Promise<{
  status: "success" | "error"
  message?: string
  user?: UserDetail
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        student:students!students_id_fkey(*),
        teacher:teachers!teachers_id_fkey(*)
      `
      )
      .eq("id", userId)
      .is("deleted_at", null)
      .single()

    if (error || !data) {
      console.error("Error fetching user by id:", error)
      return { status: "error", message: "Usuario no encontrado" }
    }

    return { status: "success", user: data as UserDetail }
  } catch (error) {
    console.error("Unexpected error fetching user:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

export async function deleteUser(userId: string): Promise<{
  status: "success" | "error"
  message: string
}> {
  try {
    const supabase = await createClient()

    // Avoid deleting an already removed user
    const { data: user, error: fetchError } = await supabase
      .from("profiles")
      .select("deleted_at")
      .eq("id", userId)
      .single()

    if (fetchError || !user) {
      return { status: "error", message: "Usuario no encontrado" }
    }

    if (user.deleted_at) {
      return { status: "error", message: "El usuario ya fue eliminado" }
    }

    // Soft delete by setting deleted_at
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId)

    if (updateError) {
      console.error("Error deleting user:", updateError)
      return { status: "error", message: "Error al eliminar el usuario" }
    }

    revalidatePath("/admin/users")
    return { status: "success", message: "Usuario eliminado exitosamente" }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { status: "error", message: "Error inesperado" }
  }
}
