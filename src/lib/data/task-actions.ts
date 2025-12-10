"use server"

import { createClient } from "@/utils/supabase/server"
import { createTaskSchema } from "@/lib/validation/task-schema"
import { revalidatePath } from "next/cache"
import { Database } from "@/model/schema"

export type ActionState = {
  status: "success" | "error"
  message: string
  errors?: Record<string, string[]>
}

export type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  student?: {
    name: string | null
    profile_picture_url: string | null
  }
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  }
  progress?: {
    total: number
    completed: number
    percentage: number
  }
}

export type TasksResponse = {
  tasks: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function createTask(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const referenceFiles = formData
      .getAll("reference_files")
      .filter((file): file is File => file instanceof File && file.size > 0)

    const isPdf = (file: File) =>
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

    const invalidReference = referenceFiles.find(
      (file) => !isPdf(file) || file.size > 10 * 1024 * 1024
    )

    if (invalidReference) {
      return {
        status: "error",
        message: "Solo puedes adjuntar archivos PDF de hasta 10MB",
      }
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        status: "error",
        message: "Debes iniciar sesión para crear una tarea",
      }
    }

    // Verify user is a student
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return {
        status: "error",
        message: "Error al verificar tu perfil",
      }
    }

    if (profile.role !== "student") {
      return {
        status: "error",
        message: "Solo los estudiantes pueden crear tareas",
      }
    }

    // Parse form data
    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      subject: formData.get("subject"),
      academic_level: formData.get("academic_level"),
      difficulty: formData.get("difficulty") || undefined,
      topic_tags: formData.get("topic_tags")
        ? JSON.parse(formData.get("topic_tags") as string)
        : [],
      budget_min: formData.get("budget_min")
        ? parseFloat(formData.get("budget_min") as string)
        : null,
      budget_max: formData.get("budget_max")
        ? parseFloat(formData.get("budget_max") as string)
        : null,
      payment_type: formData.get("payment_type") || "negotiable",
      due_date: formData.get("due_date") || null,
      estimated_hours: formData.get("estimated_hours")
        ? parseFloat(formData.get("estimated_hours") as string)
        : null,
      priority: formData.get("priority") || "normal",
      installments: formData.get("installments")
        ? parseInt(formData.get("installments") as string)
        : 1,
    }

    // Validate with Zod
    const validationResult = createTaskSchema.safeParse(rawData)

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        status: "error",
        message: "Por favor corrige los errores en el formulario",
        errors: errors as Record<string, string[]>,
      }
    }

    const validatedData = validationResult.data

    // Create task in database
    const { data: task, error: createError } = await supabase
      .from("tasks")
      .insert({
        student_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        subject: validatedData.subject,
        academic_level: validatedData.academic_level,
        difficulty: validatedData.difficulty || null,
        topic_tags: validatedData.topic_tags,
        budget_min: validatedData.budget_min,
        budget_max: validatedData.budget_max,
        payment_type: validatedData.payment_type,
        due_date: validatedData.due_date,
        estimated_hours: validatedData.estimated_hours,
        priority: validatedData.priority,
        installments: validatedData.installments,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating task:", createError)
      return {
        status: "error",
        message: "Error al crear la tarea. Por favor intenta de nuevo.",
      }
    }

    let referenceUploadMessage = ""
    if (task && referenceFiles.length > 0) {
      const uploadedPaths: string[] = []
      const sanitizeFileName = (name: string) =>
        (name || "archivo.pdf").replace(/[^a-zA-Z0-9.-]/g, "_")

      for (const [index, file] of referenceFiles.entries()) {
        const storagePath = `${task.id}/referencias/${Date.now()}_${index}_${sanitizeFileName(file.name)}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(storagePath, file, {
            contentType: "application/pdf",
            upsert: false,
          })

        if (uploadError || !uploadData) {
          console.error("Error uploading reference PDF:", uploadError)
          if (uploadedPaths.length > 0) {
            await supabase.storage.from("task-attachments").remove(uploadedPaths)
          }
          return {
            status: "error",
            message: "La tarea se creó, pero hubo un error al subir tus referencias. Inténtalo de nuevo.",
          }
        }

        uploadedPaths.push(uploadData.path)

        const {
          data: { publicUrl },
        } = supabase.storage.from("task-attachments").getPublicUrl(uploadData.path)

        const { error: attachmentError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: task.id,
            uploaded_by: user.id,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            file_type: "application/pdf",
            attachment_type: "task_reference",
            milestone_id: null,
            description: "Adjunto de referencia de la tarea",
          })

        if (attachmentError) {
          console.error("Error saving reference attachment:", attachmentError)
          await supabase.storage.from("task-attachments").remove(uploadedPaths)
          return {
            status: "error",
            message: "La tarea se creó, pero no pudimos guardar los PDFs. Inténtalo nuevamente.",
          }
        }
      }

      referenceUploadMessage =
        referenceFiles.length === 1
          ? " Se agregó 1 PDF de referencia."
          : ` Se agregaron ${referenceFiles.length} PDFs de referencia.`
    }

    // Revalidate paths
    revalidatePath("/workspace")
    revalidatePath("/workspace/mis-tareas")

    return {
      status: "success",
      message: `Tarea creada exitosamente!${referenceUploadMessage}`,
    }
  } catch (error) {
    console.error("Unexpected error in createTask:", error)
    return {
      status: "error",
      message: "Error inesperado. Por favor intenta de nuevo.",
    }
  }
}

export type GetTasksOptions = {
  page?: number
  pageSize?: number
  status?: Database["public"]["Enums"]["task_status"] | "all"
  subject?: string
  priority?: Database["public"]["Enums"]["task_priority"]
  search?: string
}

/**
 * Get tasks for the current user (student perspective)
 * Returns tasks created by the student with pagination
 */
export async function getMyTasks(
  options: GetTasksOptions = {}
): Promise<TasksResponse | { error: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "No autorizado" }
    }

    const {
      page = 1,
      pageSize = 10,
      status = "all",
      subject,
      priority,
      search,
    } = options

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query
    let query = supabase
      .from("tasks")
      .select(
        `
        *,
        student:profiles!tasks_student_id_fkey(name, profile_picture_url),
        teacher:profiles!tasks_teacher_id_fkey(name, profile_picture_url)
      `,
        { count: "exact" }
      )
      .eq("student_id", user.id)
      .eq("is_active", true)

    // Apply filters
    if (status !== "all") {
      query = query.eq("status", status)
    } else {
      // By default, exclude cancelled tasks
      query = query.neq("status", "cancelled")
    }

    if (subject) {
      query = query.eq("subject", subject)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching tasks:", error)
      return { error: "Error al obtener las tareas" }
    }

    // Fetch milestone progress for each task
    const tasksWithProgress = await Promise.all(
      (data || []).map(async (task) => {
        // Fetch payment milestones for this task
        const { data: milestones } = await supabase
          .from("payment_milestones")
          .select("id, status")
          .eq("task_id", task.id)

        const total = milestones?.length || 0
        const completed = milestones?.filter(
          (m) => m.status === "paid" || m.status === "in_custody"
        ).length || 0
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
          ...task,
          progress: {
            total,
            completed,
            percentage,
          },
        } as Task
      })
    )

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      tasks: tasksWithProgress,
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.error("Unexpected error in getMyTasks:", error)
    return { error: "Error inesperado al obtener las tareas" }
  }
}

/**
 * Get available tasks for teachers
 * Returns open tasks that teachers can submit proposals to
 */
export async function getAvailableTasks(
  options: GetTasksOptions = {}
): Promise<TasksResponse | { error: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "No autorizado" }
    }

    const {
      page = 1,
      pageSize = 10,
      subject,
      priority,
      search,
    } = options

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query for open tasks
    let query = supabase
      .from("tasks")
      .select(
        `
        *,
        student:profiles!tasks_student_id_fkey(name, profile_picture_url)
      `,
        { count: "exact" }
      )
      .eq("status", "open")
      .eq("is_active", true)

    // Apply filters
    if (subject) {
      query = query.eq("subject", subject)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching available tasks:", error)
      return { error: "Error al obtener las tareas" }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      tasks: (data as Task[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.error("Unexpected error in getAvailableTasks:", error)
    return { error: "Error inesperado al obtener las tareas" }
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  taskId: string
): Promise<Task | { error: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        student:profiles!tasks_student_id_fkey(name, profile_picture_url),
        teacher:profiles!tasks_teacher_id_fkey(name, profile_picture_url)
      `
      )
      .eq("id", taskId)
      .single()

    if (error) {
      console.error("Error fetching task:", error)
      return { error: "Tarea no encontrada" }
    }

    const { data: milestones } = await supabase
      .from("payment_milestones")
      .select("status")
      .eq("task_id", taskId)

    const totalMilestones = milestones?.length || 0
    const completedMilestones =
      milestones?.filter((m) => m.status === "paid" || m.status === "in_custody").length || 0
    const progressPercentage =
      totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

    return {
      ...(data as Task),
      progress: {
        total: totalMilestones,
        completed: completedMilestones,
        percentage: progressPercentage,
      },
    }
  } catch (error) {
    console.error("Unexpected error in getTaskById:", error)
    return { error: "Error inesperado al obtener la tarea" }
  }
}

/**
 * Update a task
 * Only allowed for tasks in 'open' status
 */
export async function updateTask(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        status: "error",
        message: "Debes iniciar sesión para actualizar una tarea",
      }
    }

    const taskId = formData.get("task_id") as string

    if (!taskId) {
      return {
        status: "error",
        message: "ID de tarea inválido",
      }
    }

    // Get current task to verify ownership and status
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("student_id, status")
      .eq("id", taskId)
      .single()

    if (fetchError || !existingTask) {
      return {
        status: "error",
        message: "Tarea no encontrada",
      }
    }

    // Verify ownership
    if (existingTask.student_id !== user.id) {
      return {
        status: "error",
        message: "No tienes permiso para editar esta tarea",
      }
    }

    // Verify status - only 'open' tasks can be fully edited
    if (existingTask.status !== "open") {
      return {
        status: "error",
        message: "Solo puedes editar tareas en estado 'Abierta'",
      }
    }

    // Parse form data
    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      subject: formData.get("subject"),
      academic_level: formData.get("academic_level"),
      difficulty: formData.get("difficulty") || undefined,
      topic_tags: formData.get("topic_tags")
        ? JSON.parse(formData.get("topic_tags") as string)
        : [],
      budget_min: formData.get("budget_min")
        ? parseFloat(formData.get("budget_min") as string)
        : null,
      budget_max: formData.get("budget_max")
        ? parseFloat(formData.get("budget_max") as string)
        : null,
      payment_type: formData.get("payment_type") || "negotiable",
      due_date: formData.get("due_date") || null,
      estimated_hours: formData.get("estimated_hours")
        ? parseFloat(formData.get("estimated_hours") as string)
        : null,
      priority: formData.get("priority") || "normal",
    }

    // Validate with Zod
    const validationResult = createTaskSchema.safeParse(rawData)

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        status: "error",
        message: "Por favor corrige los errores en el formulario",
        errors: errors as Record<string, string[]>,
      }
    }

    const validatedData = validationResult.data

    // Update task in database
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        title: validatedData.title,
        description: validatedData.description,
        subject: validatedData.subject,
        academic_level: validatedData.academic_level,
        difficulty: validatedData.difficulty || null,
        topic_tags: validatedData.topic_tags,
        budget_min: validatedData.budget_min,
        budget_max: validatedData.budget_max,
        payment_type: validatedData.payment_type,
        due_date: validatedData.due_date,
        estimated_hours: validatedData.estimated_hours,
        priority: validatedData.priority,
      })
      .eq("id", taskId)

    if (updateError) {
      console.error("Error updating task:", updateError)
      return {
        status: "error",
        message: "Error al actualizar la tarea. Por favor intenta de nuevo.",
      }
    }

    // Revalidate paths
    revalidatePath("/workspace/mis-tareas")

    return {
      status: "success",
      message: "Tarea actualizada exitosamente!",
    }
  } catch (error) {
    console.error("Unexpected error in updateTask:", error)
    return {
      status: "error",
      message: "Error inesperado. Por favor intenta de nuevo.",
    }
  }
}

/**
 * Delete a task (hard delete)
 * Only allowed for tasks in 'open' status with no proposals
 */
export async function deleteTask(taskId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        status: "error",
        message: "Debes iniciar sesión",
      }
    }

    // Get task to verify ownership, status, and proposals
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("student_id, status, proposals_count")
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      return {
        status: "error",
        message: "Tarea no encontrada",
      }
    }

    // Verify ownership
    if (task.student_id !== user.id) {
      return {
        status: "error",
        message: "No tienes permiso para eliminar esta tarea",
      }
    }

    // Only allow deletion if status is 'open'
    if (task.status !== "open") {
      return {
        status: "error",
        message: "Solo puedes eliminar tareas en estado 'Abierta'. Considera cancelarla en su lugar.",
      }
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)

    if (deleteError) {
      console.error("Error deleting task:", deleteError)
      return {
        status: "error",
        message: "Error al eliminar la tarea. Por favor intenta de nuevo.",
      }
    }

    // Revalidate paths
    revalidatePath("/workspace/mis-tareas")

    return {
      status: "success",
      message: "Tarea eliminada exitosamente",
    }
  } catch (error) {
    console.error("Unexpected error in deleteTask:", error)
    return {
      status: "error",
      message: "Error inesperado. Por favor intenta de nuevo.",
    }
  }
}

/**
 * Cancel a task (soft delete - changes status to 'cancelled')
 * Can be done at any time before 'completed'
 */
export async function cancelTask(
  taskId: string,
  _reason?: string
): Promise<ActionState> {
  try {
    const supabase = await createClient()
    void _reason

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        status: "error",
        message: "Debes iniciar sesión",
      }
    }

    // Get task to verify ownership and status
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("student_id, status, teacher_id")
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      return {
        status: "error",
        message: "Tarea no encontrada",
      }
    }

    // Verify ownership
    if (task.student_id !== user.id) {
      return {
        status: "error",
        message: "No tienes permiso para cancelar esta tarea",
      }
    }

    // Cannot cancel if already completed or cancelled
    if (task.status === "completed") {
      return {
        status: "error",
        message: "No puedes cancelar una tarea completada",
      }
    }

    if (task.status === "cancelled") {
      return {
        status: "error",
        message: "Esta tarea ya está cancelada",
      }
    }

    // Warning if task has teacher assigned
    if (task.status === "in_progress" && task.teacher_id) {
      // In a real app, you might want to:
      // 1. Notify the teacher
      // 2. Apply penalties
      // 3. Require a cancellation reason
      console.warn(`Task ${taskId} cancelled while in progress with teacher ${task.teacher_id}`)
    }

    // Update task status to cancelled
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "cancelled",
      })
      .eq("id", taskId)

    if (updateError) {
      console.error("Error cancelling task:", updateError)
      return {
        status: "error",
        message: "Error al cancelar la tarea. Por favor intenta de nuevo.",
      }
    }

    // Revalidate paths
    revalidatePath("/workspace/mis-tareas")

    return {
      status: "success",
      message: "Tarea cancelada exitosamente",
    }
  } catch (error) {
    console.error("Unexpected error in cancelTask:", error)
    return {
      status: "error",
      message: "Error inesperado. Por favor intenta de nuevo.",
    }
  }
}

// Get assigned tasks for teacher (Mis Trabajos)
export async function getAssignedTasks(options?: {
  page?: number
  limit?: number
  status?: Database["public"]["Enums"]["task_status"] | "all"
}): Promise<TasksResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        tasks: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }
    }

    const page = options?.page || 1
    const pageSize = options?.limit || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from("tasks")
      .select(`
        *,
        student:profiles!tasks_student_id_fkey (
          name,
          profile_picture_url
        )
      `, { count: "exact" })
      .eq("teacher_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    // Filter by status if provided
    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status)
    } else {
      // Default view hides cancelled work unless explicitly requested
      query = query.neq("status", "cancelled")
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) {
      console.error("Error fetching assigned tasks:", error)
      return {
        tasks: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      tasks: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.error("Unexpected error fetching assigned tasks:", error)
    return {
      tasks: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    }
  }
}

/**
 * Complete a task
 * Only allowed for tasks in 'in_progress' or 'submitted' status
 * Only the teacher can complete the task
 */
export async function completeTask(taskId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        status: "error",
        message: "Debes iniciar sesión",
      }
    }

    // Get task to verify ownership and status
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("teacher_id, status")
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      return {
        status: "error",
        message: "Tarea no encontrada",
      }
    }

    // Verify ownership (only teacher can complete)
    if (task.teacher_id !== user.id) {
      return {
        status: "error",
        message: "No tienes permiso para completar esta tarea",
      }
    }

    // Verify status
    if (task.status === "completed") {
      return {
        status: "error",
        message: "Esta tarea ya está completada",
      }
    }

    if (task.status === "cancelled") {
      return {
        status: "error",
        message: "No puedes completar una tarea cancelada",
      }
    }

    // Update task status to completed
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "completed",
      })
      .eq("id", taskId)

    if (updateError) {
      console.error("Error completing task:", updateError)
      return {
        status: "error",
        message: "Error al completar la tarea. Por favor intenta de nuevo.",
      }
    }

    // Revalidate paths
    revalidatePath("/workspace/mis-trabajos")
    revalidatePath(`/workspace/mis-trabajos/${taskId}`)

    return {
      status: "success",
      message: "Tarea completada exitosamente",
    }
  } catch (error) {
    console.error("Unexpected error in completeTask:", error)
    return {
      status: "error",
      message: "Error inesperado. Por favor intenta de nuevo.",
    }
  }
}
