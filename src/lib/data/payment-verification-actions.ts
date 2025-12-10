"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import { revalidatePath } from "next/cache"

export type PaymentStatus =
  | "pending_payment"
  | "pending_verification"
  | "in_custody"
  | "paid"
  | "rejected"

export interface PaymentMilestoneWithDetails {
  id: string
  task_id: string
  milestone_number: number
  amount: number
  description: string | null
  status: PaymentStatus
  due_date: string | null
  payment_proof_url: string | null
  payment_reference: string | null
  submitted_at: string | null
  verified_at: string | null
  verified_by: string | null
  paid_at: string | null
  paid_by: string | null
  rejection_reason: string | null
  created_at: string
  tasks: {
    title: string
    student_id: string
    teacher_id: string | null
  }
  student: {
    id: string
    name: string | null
    email: string
  }
  teacher: {
    id: string
    name: string | null
    email: string
  } | null
}

/**
 * Get all pending payment verifications
 */
export async function getPendingVerifications() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_milestones")
    .select(`
      *,
      tasks!inner (
        title,
        student_id,
        teacher_id,
        student:profiles!tasks_student_id_fkey (
          id,
          name,
          email
        ),
        teacher:profiles!tasks_teacher_id_fkey (
          id,
          name,
          email
        )
      )
    `)
    .eq("status", "pending_verification")
    .order("submitted_at", { ascending: true })

  if (error) {
    console.error("Error fetching pending verifications:", error)
    return []
  }

  // Flatten the data structure
  // Flatten the data structure and generate signed URLs
  const flattenedData: PaymentMilestoneWithDetails[] = (data || []).map((milestone) => ({
    ...milestone,
    student: milestone.tasks.student,
    teacher: milestone.tasks.teacher,
    tasks: {
      title: milestone.tasks.title,
      student_id: milestone.tasks.student_id,
      teacher_id: milestone.tasks.teacher_id,
    },
  })) as PaymentMilestoneWithDetails[]

  const milestonesWithSignedUrls = await Promise.all(
    flattenedData.map(async (milestone) => {
      if (milestone.payment_proof_url) {
        let path = milestone.payment_proof_url
        // Backward compatibility: if it's a full URL, extract the path
        if (path.startsWith("http")) {
          const parts = path.split("/comprobantes/")
          if (parts.length > 1) {
            path = parts[1]
          }
        }

        const { data: signedData } = await supabase.storage
          .from("comprobantes")
          .createSignedUrl(path, 3600) // 1 hour expiry

        if (signedData?.signedUrl) {
          return { ...milestone, payment_proof_url: signedData.signedUrl }
        }
      }
      return milestone
    })
  )

  return milestonesWithSignedUrls as PaymentMilestoneWithDetails[]
}

/**
 * Get all payments in custody (waiting to be paid to teacher)
 */
export async function getPaymentsInCustody() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_milestones")
    .select(`
      *,
      tasks!inner (
        title,
        student_id,
        teacher_id,
        student:profiles!tasks_student_id_fkey (
          id,
          name,
          email
        ),
        teacher:profiles!tasks_teacher_id_fkey (
          id,
          name,
          email
        )
      )
    `)
    .eq("status", "in_custody")
    .order("verified_at", { ascending: true })

  if (error) {
    console.error("Error fetching payments in custody:", error)
    return []
  }

  // Flatten the data structure
  // Flatten the data structure and generate signed URLs
  const flattenedData: PaymentMilestoneWithDetails[] = (data || []).map((milestone) => ({
    ...milestone,
    student: milestone.tasks.student,
    teacher: milestone.tasks.teacher,
    tasks: {
      title: milestone.tasks.title,
      student_id: milestone.tasks.student_id,
      teacher_id: milestone.tasks.teacher_id,
    },
  })) as PaymentMilestoneWithDetails[]

  const milestonesWithSignedUrls = await Promise.all(
    flattenedData.map(async (milestone) => {
      if (milestone.payment_proof_url) {
        let path = milestone.payment_proof_url
        // Backward compatibility: if it's a full URL, extract the path
        if (path.startsWith("http")) {
          const parts = path.split("/comprobantes/")
          if (parts.length > 1) {
            path = parts[1]
          }
        }

        const { data: signedData } = await supabase.storage
          .from("comprobantes")
          .createSignedUrl(path, 3600) // 1 hour expiry

        if (signedData?.signedUrl) {
          return { ...milestone, payment_proof_url: signedData.signedUrl }
        }
      }
      return milestone
    })
  )

  return milestonesWithSignedUrls as PaymentMilestoneWithDetails[]
}

/**
 * Approve payment proof - move to custody
 */
export async function approvePaymentProof(
  milestoneId: string
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    const { user } = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from("payment_milestones")
      .update({
        status: "in_custody",
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", milestoneId)
      .eq("status", "pending_verification")

    if (error) {
      console.error("Error approving payment proof:", error)
      return {
        status: "error",
        message: "Error al aprobar el comprobante de pago",
      }
    }

    // TODO: Send notification to student that payment was verified
    // TODO: Send notification to teacher that funds are in custody

    revalidatePath("/admin/transactions")

    return {
      status: "success",
      message: "Comprobante aprobado. Fondos en custodia.",
    }
  } catch (error) {
    console.error("Error in approvePaymentProof:", error)
    return {
      status: "error",
      message: "Error al aprobar el comprobante de pago",
    }
  }
}

/**
 * Reject payment proof
 */
export async function rejectPaymentProof(
  milestoneId: string,
  reason: string
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from("payment_milestones")
      .update({
        status: "rejected",
        rejection_reason: reason,
        payment_proof_url: null,
        payment_reference: null,
        submitted_at: null,
      })
      .eq("id", milestoneId)
      .eq("status", "pending_verification")

    if (error) {
      console.error("Error rejecting payment proof:", error)
      return {
        status: "error",
        message: "Error al rechazar el comprobante de pago",
      }
    }

    // TODO: Send notification to student with rejection reason

    revalidatePath("/admin/transactions")

    return {
      status: "success",
      message: "Comprobante rechazado. El estudiante debe subir uno nuevo.",
    }
  } catch (error) {
    console.error("Error in rejectPaymentProof:", error)
    return {
      status: "error",
      message: "Error al rechazar el comprobante de pago",
    }
  }
}

/**
 * Mark payment as paid to teacher
 */
export async function markAsPaidToTeacher(
  milestoneId: string
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    const { user } = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from("payment_milestones")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: user.id,
      })
      .eq("id", milestoneId)
      .eq("status", "in_custody")

    if (error) {
      console.error("Error marking as paid:", error)
      return {
        status: "error",
        message: "Error al marcar como pagado al docente",
      }
    }

    // TODO: Send notification to teacher that payment was sent
    // TODO: Send notification to student that payment was completed

    revalidatePath("/admin/transactions")

    return {
      status: "success",
      message: "Pago marcado como transferido al docente.",
    }
  } catch (error) {
    console.error("Error in markAsPaidToTeacher:", error)
    return {
      status: "error",
      message: "Error al marcar como pagado al docente",
    }
  }
}
