"use server"

import {
  createMilestonesForTask as createMilestonesUseCase,
  submitPaymentProof as submitPaymentProofUseCase,
} from "@/application/tasks/createTask"
import { makeMilestonesRepository, makeTasksRepository } from "@/infrastructure/supabase/tasks-repo"
import { deleteFromMinio, parseObjectName, signMinioUrl, uploadToMinio } from "@/infrastructure/minio/storage"
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

const PAYMENT_PROOF_BUCKET = process.env.MINIO_PAYMENT_PROOF_BUCKET || "comprobantes"

function resolvePaymentProofObject(path: string) {
  const parsed = parseObjectName(path)
  if (parsed) {
    if (parsed.bucket === PAYMENT_PROOF_BUCKET) {
      return parsed
    }
    return { bucket: PAYMENT_PROOF_BUCKET, objectName: `${parsed.bucket}/${parsed.objectName}` }
  }

  return { bucket: PAYMENT_PROOF_BUCKET, objectName: path.replace(/^\//, "") }
}

async function signPaymentProofUrl(path: string | null) {
  if (!path) return null
  const resolved = resolvePaymentProofObject(path)
  return await signMinioUrl(`${resolved.bucket}/${resolved.objectName}`)
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
  const tasksRepo = makeTasksRepository(supabase)
  const milestonesRepo = makeMilestonesRepository(supabase)

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    const result = await createMilestonesUseCase(
      { taskId, studentId: user.id, totalAmount, installments },
      { tasksRepo, milestonesRepo },
    )

    if (result.status === "error") {
      return { status: "error", message: result.message }
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
      .select(`
        *,
        tasks (
          id,
          title,
          status
        )
      `)
      .eq("task_id", taskId)
      .order("milestone_number", { ascending: true })

    if (error) {
      console.error("Error fetching milestones:", error)
      return { milestones: null, error: "Error al obtener hitos de pago" }
    }

    // Generate signed URLs for payment proofs
    const milestonesWithSignedUrls: PaymentMilestone[] = await Promise.all(
      (data || []).map(async (milestone) => {
        if (!milestone.payment_proof_url) return milestone

        const signedUrl = await signPaymentProofUrl(milestone.payment_proof_url)
        return signedUrl ? { ...milestone, payment_proof_url: signedUrl } : milestone
      })
    ) as PaymentMilestone[]

    return { milestones: milestonesWithSignedUrls, error: null }
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
  const milestonesRepo = makeMilestonesRepository(supabase)

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    const milestone = await milestonesRepo.findMilestoneOwner(milestoneId)
    if (!milestone) {
      return { status: "error", message: "Hito de pago no encontrado" }
    }

    if (milestone.studentId !== user.id) {
      return { status: "error", message: "No tienes permiso para actualizar este hito" }
    }

    // Get file and payment reference from FormData
    const file = fileData.get("file") as File
    const paymentReference = fileData.get("paymentReference") as string

    if (!file || !paymentReference) {
      return { status: "error", message: "Faltan datos requeridos" }
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${milestoneId}-${Date.now()}.${fileExt}`
    const uploadResult = await uploadToMinio({
      bucket: PAYMENT_PROOF_BUCKET,
      file,
      objectName: fileName,
    }).catch((error) => {
      console.error("Error uploading payment proof to MinIO:", error)
      return null
    })

    if (!uploadResult) {
      return { status: "error", message: "Error al subir el archivo" }
    }

    const paymentProofPath = `${PAYMENT_PROOF_BUCKET}/${uploadResult.objectName}`
    const result = await submitPaymentProofUseCase(
      {
        milestoneId,
        studentId: user.id,
        paymentProofUrl: paymentProofPath,
        paymentReference,
      },
      { milestonesRepo },
    )

    if (result.status === "error") {
      await deleteFromMinio(PAYMENT_PROOF_BUCKET, uploadResult.objectName)
      return { status: "error", message: result.message }
    }

    revalidatePath("/workspace/pagos")
    return { status: "success", message: "Comprobante enviado. En espera de verificacion." }
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
          status,
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

    // Generate signed URLs for payment proofs
    const milestonesWithSignedUrls: PaymentMilestone[] = await Promise.all(
      (data || []).map(async (milestone) => {
        if (!milestone.payment_proof_url) return milestone

        const signedUrl = await signPaymentProofUrl(milestone.payment_proof_url)
        return signedUrl ? { ...milestone, payment_proof_url: signedUrl } : milestone
      })
    ) as PaymentMilestone[]

    return { milestones: milestonesWithSignedUrls, error: null }
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

    // Generate signed URLs for payment proofs
    const milestonesWithSignedUrls: PaymentMilestone[] = await Promise.all(
      (data || []).map(async (milestone) => {
        if (!milestone.payment_proof_url) return milestone

        const signedUrl = await signPaymentProofUrl(milestone.payment_proof_url)
        return signedUrl ? { ...milestone, payment_proof_url: signedUrl } : milestone
      })
    ) as PaymentMilestone[]

    return { milestones: milestonesWithSignedUrls, error: null }
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
