"use server"

import { createClient } from "@/utils/supabase/server"
import { type TeacherCoursePayment } from "@/lib/data/course-actions"

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
    type?: "task" | "course"
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

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

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

  const totalRevenueTasks = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0

  // Fetch course payments to merge into transactions
  const { data: coursePayments } = await supabase
    .from("payments")
    .select(
      `
        id,
        status,
        payout_id,
        created_at,
        verified_at,
        enrollment:enrollments!payments_enrollment_id_fkey (
          id,
          status,
          student:profiles!enrollments_student_id_fkey (name, email),
          course:courses!enrollments_course_id_fkey (
            id,
            title,
            price,
            teacher:profiles!courses_teacher_id_fkey (name, email)
          )
        )
      `,
    )

  const courseTransactions: Transaction[] =
    (coursePayments as TeacherCoursePayment[] | null | undefined)
      ?.map((p) => {
        const courseStatus = p.payout_id ? "paid" : p.status === "verified" ? "approved" : p.status
        return {
          id: p.id,
          amount: p.enrollment?.course?.price || 0,
          status: courseStatus,
          paid_at: p.payout_id ? p.verified_at || p.created_at : null,
          created_at: p.created_at,
          task: {
            id: p.enrollment?.course?.id || "",
            title: p.enrollment?.course?.title || "Curso",
            student: {
              name: p.enrollment?.student?.name || null,
              email: p.enrollment?.student?.email || "",
            },
            teacher: {
              name: p.enrollment?.course?.teacher?.name || null,
              email: p.enrollment?.course?.teacher?.email || "",
            },
            type: "course",
          },
        } as Transaction
      })
      ?.filter((t) => {
        if (!options?.status || options.status === "all") return true
        return t.status === options.status
      }) || []

  const courseRevenue = courseTransactions
    .filter((t) => t.status === "paid")
    .reduce((acc, t) => acc + t.amount, 0)

  const allTransactions = [...courseTransactions, ...(data as Transaction[])]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

  const total = (count || 0) + courseTransactions.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = allTransactions.slice(offset, offset + limit)

  return {
    transactions: paginated,
    total,
    page,
    pageSize: limit,
    totalPages,
    totalRevenue: totalRevenueTasks + courseRevenue,
  }
}
