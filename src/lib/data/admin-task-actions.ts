"use server"

import { createClient } from "@/utils/supabase/server"
import { Database } from "@/model/schema"

export interface AdminTask {
  id: string
  title: string
  description: string
  status: Database["public"]["Enums"]["task_status"]
  priority: Database["public"]["Enums"]["task_priority"]
  budget_min: number | null
  budget_max: number | null
  due_date: string | null
  created_at: string
  student: {
    id: string
    name: string | null
    email: string
  } | null
  teacher: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface AdminTasksResponse {
  tasks: AdminTask[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getAdminTasks(options?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}): Promise<AdminTasksResponse> {
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      student:profiles!tasks_student_id_fkey(id, name, email),
      teacher:profiles!tasks_teacher_id_fkey(id, name, email)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  // Filter by status
  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  // Search by title
  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching tasks:", error)
    return {
      tasks: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 0,
    }
  }

  const totalPages = count ? Math.ceil(count / limit) : 0

  return {
    tasks: data as AdminTask[],
    total: count || 0,
    page,
    pageSize: limit,
    totalPages,
  }
}
