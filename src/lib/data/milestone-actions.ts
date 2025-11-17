"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type PaymentStatus =
  | "pending_payment"
  | "pending_verification"
  | "in_custody"
  | "paid"
  | "rejected"

export interface PaymentMilestone {
  id: string
  task_id: string
  milestone_number: number
  title: string
  description: string | null
  amount: number
  due_date: string | null
  status: PaymentStatus
  submission_id: string | null
  payment_proof_url: string | null
  payment_reference: string | null
  submitted_at: string | null
  verified_at: string | null
  verified_by: string | null
  paid_at: string | null
  paid_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * Creates payment milestones for a task based on number of installments
 */
export async function createMilestonesForTask(
  taskId: string,
  totalAmount: number,
  installments: number
) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    // Verify task belongs to user
    const { data: task } = await supabase
      .from("tasks")
      .select("id, student_id")
      .eq("id", taskId)
      .single()

    if (!task || task.student_id !== user.id) {
      return { status: "error", message: "Tarea no encontrada" }
    }

    // Calculate amount per milestone
    const amountPerMilestone = totalAmount / installments

    // Create milestones
    const milestones = Array.from({ length: installments }, (_, index) => ({
      task_id: taskId,
      milestone_number: index + 1,
      title: `Avance ${index + 1} de ${installments}`,
      description: `Pago de cuota ${index + 1} por avance del trabajo`,
      amount: amountPerMilestone,
      status: "pending_payment" as const,
    }))

    const { error } = await supabase.from("payment_milestones").insert(milestones)

    if (error) {
      console.error("Error creating milestones:", error)
      return { status: "error", message: "Error al crear hitos de pago" }
    }

    revalidatePath("/workspace")
    return { status: "success", message: "Hitos de pago creados exitosamente" }
  } catch (error) {
    console.error("Error in createMilestonesForTask:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

/**
 * Gets milestones for a specific task
 */
export async function getMilestonesByTaskId(taskId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("payment_milestones")
      .select("*")
      .eq("task_id", taskId)
      .order("milestone_number", { ascending: true })

    if (error) {
      console.error("Error fetching milestones:", error)
      return { milestones: null, error: "Error al obtener hitos de pago" }
    }

    return { milestones: data as any as PaymentMilestone[], error: null }
  } catch (error) {
    console.error("Error in getMilestonesByTaskId:", error)
    return { milestones: null, error: "Error inesperado" }
  }
}

/**
 * Submit payment proof (student uploads proof of payment)
 */
export async function submitPaymentProof(
  milestoneId: string,
  fileData: FormData
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    // Verify milestone exists and belongs to user's task
    const { data: milestone, error: fetchError } = await supabase
      .from("payment_milestones")
      .select("id, task_id, tasks!inner(student_id)")
      .eq("id", milestoneId)
      .single()

    if (fetchError || !milestone) {
      return { status: "error", message: "Hito de pago no encontrado" }
    }

    const task = milestone.tasks as any
    if (task.student_id !== user.id) {
      return { status: "error", message: "No tienes permiso para actualizar este hito" }
    }

    // Get file and payment reference from FormData
    const file = fileData.get("file") as File
    const paymentReference = fileData.get("paymentReference") as string

    if (!file || !paymentReference) {
      return { status: "error", message: "Faltan datos requeridos" }
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${milestoneId}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { status: "error", message: "Error al subir el archivo" }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("comprobantes").getPublicUrl(fileName)

    // Update milestone with payment proof
    const { error } = await supabase
      .from("payment_milestones")
      .update({
        status: "pending_verification",
        payment_proof_url: publicUrl,
        payment_reference: paymentReference,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", milestoneId)

    if (error) {
      console.error("Error submitting payment proof:", error)
      return { status: "error", message: "Error al enviar comprobante de pago" }
    }

    revalidatePath("/workspace/pagos")
    return { status: "success", message: "Comprobante enviado. En espera de verificación." }
  } catch (error) {
    console.error("Error in submitPaymentProof:", error)
    return { status: "error", message: "Error inesperado" }
  }
}

/**
 * Gets student's payment milestones (for student view)
 */
export async function getStudentPaymentMilestones() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("getStudentPaymentMilestones: No user authenticated")
      return { milestones: [], error: null }
    }

    console.log("getStudentPaymentMilestones: User ID:", user.id)

    const { data, error } = await supabase
      .from("payment_milestones")
      .select(`
        *,
        tasks!inner (
          id,
          title,
          student_id
        )
      `)
      .eq("tasks.student_id", user.id)
      .order("created_at", { ascending: false })

    console.log("getStudentPaymentMilestones: Query result:", {
      dataLength: data?.length || 0,
      error: error?.message || error,
      errorCode: error?.code
    })

    if (error) {
      console.error("Error fetching student milestones:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { milestones: [], error: null }
    }

    console.log("getStudentPaymentMilestones: Found milestones:", data?.length || 0)

    return { milestones: data as any as PaymentMilestone[], error: null }
  } catch (error) {
    console.error("Error in getStudentPaymentMilestones:", error)
    return { milestones: [], error: null }
  }
}

/**
 * Gets teacher's payment milestones (for teacher view)
 */
export async function getTeacherPaymentMilestones() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("getTeacherPaymentMilestones: No user authenticated")
      return { milestones: [], error: null }
    }

    console.log("getTeacherPaymentMilestones: User ID:", user.id)

    const { data, error } = await supabase
      .from("payment_milestones")
      .select(`
        *,
        tasks!inner (
          id,
          title,
          teacher_id,
          student_id,
          student:profiles!tasks_student_id_fkey (
            id,
            name,
            email
          )
        )
      `)
      .eq("tasks.teacher_id", user.id)
      .order("created_at", { ascending: false })

    console.log("getTeacherPaymentMilestones: Query result:", {
      dataLength: data?.length || 0,
      error: error?.message || error,
      errorCode: error?.code
    })

    if (error) {
      console.error("Error fetching teacher milestones:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { milestones: [], error: null }
    }

    console.log("getTeacherPaymentMilestones: Found milestones:", data?.length || 0)

    return { milestones: data as any as PaymentMilestone[], error: null }
  } catch (error) {
    console.error("Error in getTeacherPaymentMilestones:", error)
    return { milestones: [], error: null }
  }
}

/**
 * Gets the next pending milestone for a task
 */
export async function getNextPendingMilestone(taskId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("payment_milestones")
      .select("*")
      .eq("task_id", taskId)
      .eq("status", "pending_payment")
      .order("milestone_number", { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching next milestone:", error)
      return { milestone: null, error: "Error al obtener siguiente hito" }
    }

    return { milestone: data as PaymentMilestone | null, error: null }
  } catch (error) {
    console.error("Error in getNextPendingMilestone:", error)
    return { milestone: null, error: "Error inesperado" }
  }
}
