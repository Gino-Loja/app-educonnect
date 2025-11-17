"use server"

import { createClient } from "@/utils/supabase/server"

export interface Transaction {
  id: string
  amount: number
  status: string
  paid_at: string | null
  created_at: string | null
  task: {
    id: string
    title: string
    student: {
      name: string | null
      email: string
    } | null
    teacher: {
      name: string | null
      email: string
    } | null
  } | null
}

export interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  totalRevenue: number
}

export async function getTransactions(options?: {
  page?: number
  limit?: number
  status?: string
}): Promise<TransactionsResponse> {
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from("payment_milestones")
    .select(
      `
      *,
      task:tasks(
        id,
        title,
        student:profiles!tasks_student_id_fkey(name, email),
        teacher:profiles!tasks_teacher_id_fkey(name, email)
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  // Filter by status
  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching transactions:", error)
    return {
      transactions: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 0,
      totalRevenue: 0,
    }
  }

  // Calculate total revenue (only paid milestones)
  const { data: revenueData } = await supabase
    .from("payment_milestones")
    .select("amount")
    .eq("status", "paid")

  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0

  const totalPages = count ? Math.ceil(count / limit) : 0

  return {
    transactions: data as Transaction[],
    total: count || 0,
    page,
    pageSize: limit,
    totalPages,
    totalRevenue,
  }
}
