"use server"

import { revalidatePath } from "next/cache"

import { listPendingPayments } from "@/application/payments/listPendingPayments"
import { verifyCoursePayment } from "@/application/payments/verifyCoursePayment"
import type { PendingPayment } from "@/domain/payments"
import { makePaymentsRepository } from "@/infrastructure/supabase/payments-repo"
import { requireAdmin } from "@/lib/auth/admin"
import { createClient } from "@/utils/supabase/server"

export type AdminActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export async function getPendingPayments(): Promise<PendingPayment[]> {
  await requireAdmin()
  const supabase = await createClient()
  const repo = makePaymentsRepository(supabase)

  return listPendingPayments(repo)
}

export async function verifyPayment(paymentId: string): Promise<AdminActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const repo = makePaymentsRepository(supabase)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminId = user?.id ?? ""

  const result = await verifyCoursePayment(paymentId, adminId, { paymentsRepo: repo })

  if (result.status === "error") {
    return { status: "error", message: result.message }
  }

  revalidatePath("/admin/courses/payments")
  revalidatePath("/workspace/mis-cursos")

  return { status: "success", message: result.message }
}
