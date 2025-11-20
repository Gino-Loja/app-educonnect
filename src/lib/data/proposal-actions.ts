"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { createProposalSchema, updateProposalSchema } from "@/lib/validation/proposal-schema"
import { Database } from "@/model/schema"

type Proposal = Database["public"]["Tables"]["proposals"]["Row"] & {
  task?: {
    id: string
    title: string
    description: string
    subject: string
    academic_level: string
    due_date: string | null
    budget_min: number | null
    budget_max: number | null
    status: Database["public"]["Enums"]["task_status"]
    student?: {
      name: string | null
      profile_picture_url: string | null
    }
  }
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  }
}

export type ActionState = {
  status: "error" | "success"
  message: string
}

export async function createProposal(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "teacher") {
      return { status: "error", message: "Solo los profesores pueden crear propuestas" }
    }

    // Parse and validate form data
    const rawData = {
      task_id: formData.get("task_id") as string,
      proposed_amount: parseFloat(formData.get("proposed_amount") as string),
      estimated_hours: parseFloat(formData.get("estimated_hours") as string),
      cover_letter: formData.get("cover_letter") as string,
    }

    const validation = createProposalSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        status: "error",
        message: validation.error.issues[0].message,
      }
    }

    // Check if task exists and is open
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, student_id, payment_type, budget_min, budget_max")
      .eq("id", validation.data.task_id)
      .single()

    if (taskError || !task) {
      return { status: "error", message: "Tarea no encontrada" }
    }

    if (task.status !== "open") {
      return { status: "error", message: "Esta tarea ya no está disponible" }
    }

    // Validate fixed price
    if (task.payment_type === "fixed") {
      const fixedPrice = task.budget_max !== null ? task.budget_max : task.budget_min
      if (fixedPrice !== null && validation.data.proposed_amount !== fixedPrice) {
        return {
          status: "error",
          message: `Esta tarea tiene un precio fijo de $${fixedPrice}. No puedes proponer un monto diferente.`,
        }
      }
    }

    // Check if teacher already has a proposal for this task
    const { data: existingProposal } = await supabase
      .from("proposals")
      .select("id")
      .eq("task_id", validation.data.task_id)
      .eq("teacher_id", user.id)
      .single()

    if (existingProposal) {
      return { status: "error", message: "Ya has enviado una propuesta para esta tarea" }
    }

    // Create proposal
    const { error: insertError } = await supabase
      .from("proposals")
      .insert({
        task_id: validation.data.task_id,
        teacher_id: user.id,
        proposed_amount: validation.data.proposed_amount,
        estimated_hours: validation.data.estimated_hours,
        cover_letter: validation.data.cover_letter,
        status: "pending",
      })

    if (insertError) {
      console.error("Error creating proposal:", insertError)
      return { status: "error", message: "Error al crear la propuesta" }
    }

    revalidatePath("/workspace/marketplace")
    revalidatePath("/workspace/mis-propuestas")

    return { status: "success", message: "Propuesta enviada exitosamente" }
  } catch (error) {
    console.error("Unexpected error creating proposal:", error)
    return { status: "error", message: "Error inesperado al crear la propuesta" }
  }
}

export async function updateProposal(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    const rawData = {
      id: formData.get("id") as string,
      proposed_amount: formData.get("proposed_amount") ? parseFloat(formData.get("proposed_amount") as string) : undefined,
      estimated_hours: formData.get("estimated_hours") ? parseFloat(formData.get("estimated_hours") as string) : undefined,
      cover_letter: formData.get("cover_letter") as string || undefined,
    }

    const validation = updateProposalSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        status: "error",
        message: validation.error.issues[0].message,
      }
    }

    // Verify ownership and status
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("teacher_id, status")
      .eq("id", validation.data.id)
      .single()

    if (proposalError || !proposal) {
      return { status: "error", message: "Propuesta no encontrada" }
    }

    if (proposal.teacher_id !== user.id) {
      return { status: "error", message: "No tienes permiso para editar esta propuesta" }
    }

    if (proposal.status !== "pending") {
      return { status: "error", message: "Solo puedes editar propuestas pendientes" }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (validation.data.proposed_amount !== undefined) {
      updateData.proposed_amount = validation.data.proposed_amount
    }
    if (validation.data.estimated_hours !== undefined) {
      updateData.estimated_hours = validation.data.estimated_hours
    }
    if (validation.data.cover_letter !== undefined) {
      updateData.cover_letter = validation.data.cover_letter
    }

    const { error: updateError } = await supabase
      .from("proposals")
      .update(updateData)
      .eq("id", validation.data.id)

    if (updateError) {
      console.error("Error updating proposal:", updateError)
      return { status: "error", message: "Error al actualizar la propuesta" }
    }

    revalidatePath("/workspace/mis-propuestas")

    return { status: "success", message: "Propuesta actualizada exitosamente" }
  } catch (error) {
    console.error("Unexpected error updating proposal:", error)
    return { status: "error", message: "Error inesperado al actualizar la propuesta" }
  }
}

export async function deleteProposal(proposalId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    // Verify ownership and status
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("teacher_id, status")
      .eq("id", proposalId)
      .single()

    if (proposalError || !proposal) {
      return { status: "error", message: "Propuesta no encontrada" }
    }

    if (proposal.teacher_id !== user.id) {
      return { status: "error", message: "No tienes permiso para eliminar esta propuesta" }
    }

    if (proposal.status === "accepted") {
      return { status: "error", message: "No puedes eliminar una propuesta aceptada" }
    }

    const { error: deleteError } = await supabase
      .from("proposals")
      .delete()
      .eq("id", proposalId)

    if (deleteError) {
      console.error("Error deleting proposal:", deleteError)
      return { status: "error", message: "Error al eliminar la propuesta" }
    }

    revalidatePath("/workspace/mis-propuestas")
    revalidatePath("/workspace/marketplace")

    return { status: "success", message: "Propuesta eliminada exitosamente" }
  } catch (error) {
    console.error("Unexpected error deleting proposal:", error)
    return { status: "error", message: "Error inesperado al eliminar la propuesta" }
  }
}

type ProposalStatusFilter =
  | Database["public"]["Enums"]["proposal_status"]
  | "all"
  | "task_cancelled"

export async function getMyProposals(options?: {
  page?: number
  limit?: number
  status?: ProposalStatusFilter
}): Promise<{ proposals: Proposal[]; total: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { proposals: [], total: 0 }
    }

    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
      .from("proposals")
      .select(`
        *,
        task:tasks!proposals_task_id_fkey (
          id,
          title,
          description,
          subject,
          academic_level,
          due_date,
          budget_min,
          budget_max,
          status,
          student:profiles!tasks_student_id_fkey (
            name,
            profile_picture_url
          )
        )
      `, { count: "exact" })
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    const filteringCancelledTasks = options?.status === "task_cancelled"

    if (options?.status && options.status !== "all" && options.status !== "task_cancelled") {
      query = query.eq("status", options.status)
    } else if (!filteringCancelledTasks) {
      // By default, exclude withdrawn proposals
      query = query.neq("status", "withdrawn")
    }

    if (filteringCancelledTasks) {
      query = query.eq("task.status", "cancelled")
    } else {
      query = query.neq("task.status", "cancelled")
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching proposals:", error)
      return { proposals: [], total: 0 }
    }

    return { proposals: data || [], total: count || 0 }
  } catch (error) {
    console.error("Unexpected error fetching proposals:", error)
    return { proposals: [], total: 0 }
  }
}

export async function getProposalById(proposalId: string): Promise<Proposal | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        task:tasks!proposals_task_id_fkey (
          id,
          title,
          description,
          subject,
          academic_level,
          due_date,
          budget_min,
          budget_max,
          status,
          student:profiles!tasks_student_id_fkey (
            name,
            profile_picture_url
          )
        ),
        teacher:profiles!proposals_teacher_id_fkey (
          name,
          profile_picture_url
        )
      `)
      .eq("id", proposalId)
      .single()

    if (error) {
      console.error("Error fetching proposal:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching proposal:", error)
    return null
  }
}

// Get proposals received by the student for their tasks
export async function getReceivedProposals(options?: {
  page?: number
  limit?: number
  status?: Database["public"]["Enums"]["proposal_status"] | "all" | "task_cancelled"
  taskId?: string
}): Promise<{ proposals: Proposal[]; total: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()


    if (!user) {
      return { proposals: [], total: 0 }
    }

    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    // First get all task IDs belonging to the student
    const { data: userTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("student_id", user.id)

    if (tasksError) {
      console.error("Error fetching user tasks:", tasksError)
      return { proposals: [], total: 0 }
    }

    const taskGroups = (userTasks || []).reduce(
      (groups, task) => {
        if (task.status === "cancelled") {
          groups.cancelled.push(task.id)
        } else {
          groups.active.push(task.id)
        }
        return groups
      },
      { active: [] as string[], cancelled: [] as string[] },
    )

    let query = supabase
      .from("proposals")
      .select(`
        *,
        task:tasks!proposals_task_id_fkey (
          id,
          title,
          description,
          subject,
          academic_level,
          due_date,
          budget_min,
          budget_max,
          status,
          installments
        ),
        teacher:profiles!proposals_teacher_id_fkey (
          name,
          profile_picture_url
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false })

    const useCancelledTasks = options?.status === "task_cancelled"
    const targetTaskIds = useCancelledTasks ? taskGroups.cancelled : taskGroups.active

    if (options?.taskId) {
      query = query.eq("task_id", options.taskId)
    } else {
      if (targetTaskIds.length === 0) {
        return { proposals: [], total: 0 }
      }
      query = query.in("task_id", targetTaskIds)
    }

    if (options?.status && options.status !== "all" && options.status !== "task_cancelled") {
      query = query.eq("status", options.status)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)


    if (error) {
      console.error("Error fetching received proposals:", error)
      return { proposals: [], total: 0 }
    }

    return { proposals: data || [], total: count || 0 }
  } catch (error) {
    console.error("Unexpected error fetching received proposals:", error)
    return { proposals: [], total: 0 }
  }
}

// Accept a proposal (student action)
export async function acceptProposal(proposalId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    // First, get the proposal to verify ownership and get task_id, proposed_amount, teacher_id, and installments
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select(`
        id,
        task_id,
        teacher_id,
        proposed_amount,
        task:tasks!proposals_task_id_fkey(
          student_id,
          installments
        )
      `)
      .eq("id", proposalId)
      .single()

    if (fetchError || !proposal) {
      return { status: "error", message: "Propuesta no encontrada" }
    }

    // Verify the user is the task owner
    if (proposal.task?.student_id !== user.id) {
      return { status: "error", message: "No tienes permiso para aceptar esta propuesta" }
    }

    // Update proposal status to accepted
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ status: "accepted" })
      .eq("id", proposalId)

    if (updateError) {
      console.error("Error accepting proposal:", updateError)
      return { status: "error", message: "Error al aceptar la propuesta" }
    }

    // Update task with selected_proposal_id, teacher_id, and change status to in_progress
    const { error: taskError } = await supabase
      .from("tasks")
      .update({
        selected_proposal_id: proposalId,
        teacher_id: proposal.teacher_id,
        status: "in_progress",
      })
      .eq("id", proposal.task_id)

    if (taskError) {
      console.error("Error updating task:", taskError)
      return { status: "error", message: "Error al actualizar la tarea" }
    }

    // Reject all other proposals for this task
    const { error: rejectError } = await supabase
      .from("proposals")
      .update({ status: "rejected" })
      .eq("task_id", proposal.task_id)
      .neq("id", proposalId)
      .eq("status", "pending")

    if (rejectError) {
      console.error("Error rejecting other proposals:", rejectError)
    }

    // Create payment milestones based on installments
    const task = proposal.task as any
    const installments = task?.installments || 1
    const totalAmount = proposal.proposed_amount
    const amountPerMilestone = totalAmount / installments

    const milestones = Array.from({ length: installments }, (_, index) => ({
      task_id: proposal.task_id,
      milestone_number: index + 1,
      title: `Hito ${index + 1} de ${installments}`,
      description: `Pago de cuota ${index + 1} por avance del trabajo`,
      amount: amountPerMilestone,
      status: "pending_payment" as const,
    }))

    const { error: milestonesError } = await supabase
      .from("payment_milestones")
      .insert(milestones)

    if (milestonesError) {
      console.error("Error creating payment milestones:", milestonesError)
      // Don't fail the whole operation if milestones fail
      // The task is still accepted, just log the error
    }

    revalidatePath("/workspace/propuestas")
    revalidatePath("/workspace/mis-tareas")
    revalidatePath("/workspace/pagos")

    return { status: "success", message: "Propuesta aceptada exitosamente. Se han creado los hitos de pago." }
  } catch (error) {
    console.error("Unexpected error accepting proposal:", error)
    return { status: "error", message: "Error inesperado al aceptar la propuesta" }
  }
}

// Reject a proposal (student action)
export async function rejectProposal(proposalId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { status: "error", message: "No autenticado" }
    }

    // Verify the user is the task owner
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("id, task:tasks!proposals_task_id_fkey(student_id)")
      .eq("id", proposalId)
      .single()

    if (fetchError || !proposal) {
      return { status: "error", message: "Propuesta no encontrada" }
    }

    if (proposal.task?.student_id !== user.id) {
      return { status: "error", message: "No tienes permiso para rechazar esta propuesta" }
    }

    // Update proposal status to rejected
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ status: "rejected" })
      .eq("id", proposalId)

    if (updateError) {
      console.error("Error rejecting proposal:", updateError)
      return { status: "error", message: "Error al rechazar la propuesta" }
    }

    revalidatePath("/workspace/propuestas")

    return { status: "success", message: "Propuesta rechazada" }
  } catch (error) {
    console.error("Unexpected error rejecting proposal:", error)
    return { status: "error", message: "Error inesperado al rechazar la propuesta" }
  }
}
