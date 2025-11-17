"use server"

import { createClient } from "@/utils/supabase/server"

export interface DashboardStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  newUsersThisMonth: number
  totalTasks: number
  openTasks: number
  inProgressTasks: number
  completedTasks: number
  totalProposals: number
  totalTransactions: number
  totalRevenue: number
  pendingDisputes: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get current month dates
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalTeachers },
    { count: newUsersThisMonth },
    { count: totalTasks },
    { count: openTasks },
    { count: inProgressTasks },
    { count: completedTasks },
    { count: totalProposals },
    { count: totalTransactions },
    { data: revenueData },
    { count: pendingDisputes },
  ] = await Promise.all([
    // Total users
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    // Total students
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),

    // Total teachers
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),

    // New users this month
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),

    // Total tasks
    supabase.from("tasks").select("*", { count: "exact", head: true }),

    // Open tasks
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "open"),

    // In progress tasks
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "in_progress"),

    // Completed tasks
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),

    // Total proposals
    supabase.from("proposals").select("*", { count: "exact", head: true }),

    // Total transactions (completed tasks with payments)
    supabase
      .from("payment_milestones")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),

    // Total revenue (sum of paid milestones)
    supabase
      .from("payment_milestones")
      .select("amount")
      .eq("status", "paid"),

    // Pending disputes
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "disputed"),
  ])

  // Calculate total revenue
  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0

  return {
    totalUsers: totalUsers || 0,
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    newUsersThisMonth: newUsersThisMonth || 0,
    totalTasks: totalTasks || 0,
    openTasks: openTasks || 0,
    inProgressTasks: inProgressTasks || 0,
    completedTasks: completedTasks || 0,
    totalProposals: totalProposals || 0,
    totalTransactions: totalTransactions || 0,
    totalRevenue,
    pendingDisputes: pendingDisputes || 0,
  }
}

export async function getRecentActivity() {
  const supabase = await createClient()

  // Get recent tasks (last 10)
  const { data: recentTasks } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      created_at,
      student:profiles!tasks_student_id_fkey(name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get recent users (last 10)
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  return {
    recentTasks: recentTasks || [],
    recentUsers: recentUsers || [],
  }
}
