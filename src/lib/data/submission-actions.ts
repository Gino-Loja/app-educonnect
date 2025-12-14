"use server"

import { saveSubmissionForMilestone } from "@/application/tasks/createTask"
import { makeMilestonesRepository, makeSubmissionsRepository, makeTasksRepository } from "@/infrastructure/supabase/tasks-repo"
import { deleteFromMinio, signMinioUrl, uploadToMinio } from "@/infrastructure/minio/storage"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { createSubmissionSchema, updateSubmissionSchema } from "@/lib/validation/submission-schema"
import { createNotification } from "@/lib/data/notification-actions"
import type { Database } from "@/model/schema"

type TaskSubmission = Database["public"]["Tables"]["task_submissions"]["Row"]
export type SubmissionComment = Database["public"]["Tables"]["submission_comments"]["Row"] & {
  author?: {
    name: string | null
    profile_picture_url: string | null
  }
}

type SubmissionWithTeacher = TaskSubmission & {
  teacher?: { name: string | null; profile_picture_url: string | null } | null
}

export type ActionState = {
  status: "error" | "success"
  message: string
}

const MAX_SUBMISSION_IMAGES = 5
const MAX_SUBMISSION_IMAGE_SIZE_MB = 5
const MAX_SUBMISSION_IMAGE_SIZE_BYTES = MAX_SUBMISSION_IMAGE_SIZE_MB * 1024 * 1024
const SUBMISSION_BUCKET = process.env.MINIO_SUBMISSION_BUCKET || "task-progress"
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"]

const isValidSubmissionImage = (file: File) => {
  if (file.type) {
    if (file.type.startsWith("image/") || ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return true
    }
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension)
}

const resolveImageExtension = (file: File) => {
  return (
    file.name.split(".").pop()?.toLowerCase() ||
    file.type.split("/").pop()?.toLowerCase() ||
    "jpg"
  )
}

async function signSubmissionAttachments(attachments: string[] | null | undefined) {
  if (!attachments || attachments.length === 0) {
    return attachments ?? null
  }

  const signed = await Promise.all(
    attachments.map(async (item) => {
      const signedUrl = await signMinioUrl(item)
      return signedUrl || item
    })
  )

  return signed
}

export async function createSubmission(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    // Parse and validate form data
    const filesUrls = formData.get("submission_files_urls")
    let parsedFilesUrls: string[] | null = null
    if (filesUrls && typeof filesUrls === "string" && filesUrls.trim() !== "") {
      try {
        parsedFilesUrls = JSON.parse(filesUrls)
      } catch {
        parsedFilesUrls = null
      }
    }

    const rawData = {
      task_id: formData.get("task_id") as string,
      submission_text: formData.get("submission_text") as string,
      submission_files_urls: parsedFilesUrls,
    }

    const validation = createSubmissionSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        status: "error",
        message: validation.error.issues[0].message,
      }
    }

    // Check if task exists and is in_progress
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, teacher_id")
      .eq("id", validation.data.task_id)
      .single()

    if (taskError || !task) {
      return { status: "error", message: "Tarea no encontrada" }
    }

    if (task.teacher_id !== user.id) {
      return { status: "error", message: "No tienes permiso para entregar esta tarea" }
    }

    if (task.status !== "in_progress") {
      return { status: "error", message: "Solo puedes entregar tareas en progreso" }
    }

    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from("task_submissions")
      .select("id")
      .eq("task_id", validation.data.task_id)
      .single()

    if (existingSubmission) {
      return { status: "error", message: "Ya existe una entrega para esta tarea" }
    }

    // Create submission
    const { error: insertError } = await supabase
      .from("task_submissions")
      .insert({
        task_id: validation.data.task_id,
        teacher_id: user.id,
        content: validation.data.submission_text,
        attachments: validation.data.submission_files_urls || null,
        is_final: false,
        review_status: "pending_review",
      })

    if (insertError) {
      console.error("Error creating submission:", insertError)
      return { status: "error", message: "Error al crear la entrega" }
    }

    // Update task status to 'submitted'
    const { error: updateTaskError } = await supabase
      .from("tasks")
      .update({ status: "submitted" })
      .eq("id", validation.data.task_id)

    if (updateTaskError) {
      console.error("Error updating task status:", updateTaskError)
      return { status: "error", message: "Entrega creada pero error al actualizar tarea" }
    }

    revalidatePath("/workspace/mis-trabajos")

    return { status: "success", message: "Trabajo entregado exitosamente" }
  } catch (error) {
    console.error("Unexpected error creating submission:", error)
    return { status: "error", message: "Error inesperado al crear la entrega" }
  }
}

export async function updateSubmission(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    const filesUrls = formData.get("submission_files_urls")
    let parsedFilesUrls: string[] | null | undefined = undefined
    if (filesUrls !== null) {
      if (typeof filesUrls === "string" && filesUrls.trim() !== "") {
        try {
          parsedFilesUrls = JSON.parse(filesUrls)
        } catch {
          parsedFilesUrls = null
        }
      } else {
        parsedFilesUrls = null
      }
    }

    const rawData = {
      id: formData.get("id") as string,
      submission_text: formData.get("submission_text") as string || undefined,
      submission_files_urls: parsedFilesUrls,
    }

    const validation = updateSubmissionSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        status: "error",
        message: validation.error.issues[0].message,
      }
    }

    // Verify ownership via task
    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        task:tasks (
          teacher_id,
          status
        )
      `)
      .eq("id", validation.data.id)
      .single()

    if (submissionError || !submission) {
      return { status: "error", message: "Entrega no encontrada" }
    }

    const task = Array.isArray(submission.task) ? submission.task[0] : submission.task

    if (task.teacher_id !== user.id) {
      return { status: "error", message: "No tienes permiso para editar esta entrega" }
    }

    if (task.status !== "submitted") {
      return { status: "error", message: "Solo puedes editar entregas pendientes de revisiÃƒÂ³n" }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (validation.data.submission_text !== undefined) {
      updateData.submission_text = validation.data.submission_text
    }
    if (validation.data.submission_files_urls !== undefined) {
      updateData.submission_files_urls = validation.data.submission_files_urls
    }
    // Reset review markers when teacher updates a submission
    updateData.review_status = "pending_review"
    updateData.is_approved = null
    updateData.reviewed_at = null

    const { error: updateError } = await supabase
      .from("task_submissions")
      .update(updateData)
      .eq("id", validation.data.id)

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return { status: "error", message: "Error al actualizar la entrega" }
    }

    revalidatePath("/workspace/mis-trabajos")

    return { status: "success", message: "Entrega actualizada exitosamente" }
  } catch (error) {
    console.error("Unexpected error updating submission:", error)
    return { status: "error", message: "Error inesperado al actualizar la entrega" }
  }
}

export async function getMySubmissions(options?: {
  page?: number
  limit?: number
}): Promise<{ submissions: TaskSubmission[]; total: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { submissions: [], total: 0 }
    }

    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from("task_submissions")
      .select(`
        *,
        task:tasks (
          id,
          title,
          description,
          status,
          agreed_price,
          deadline,
          student:profiles!tasks_student_id_fkey (
            name,
            profile_picture_url
          )
        )
      `, { count: "exact" })
      .eq("task.teacher_id", user.id)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching submissions:", error)
      return { submissions: [], total: 0 }
    }

    const submissions = await Promise.all(
      (data || []).map(async (submission) => {
        const signedAttachments = await signSubmissionAttachments(
          (submission.attachments as string[] | null | undefined) ?? null,
        )
        return signedAttachments ? { ...submission, attachments: signedAttachments } : submission
      })
    )

    return { submissions: submissions as TaskSubmission[], total: count || 0 }
  } catch (error) {
    console.error("Unexpected error fetching submissions:", error)
    return { submissions: [], total: 0 }
  }
}

export async function getSubmissionById(submissionId: string): Promise<TaskSubmission | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("task_submissions")
      .select(`
        *,
        task:tasks (
          id,
          title,
          description,
          status,
          agreed_price,
          deadline,
          student:profiles!tasks_student_id_fkey (
            name,
            profile_picture_url
          ),
          teacher:profiles!tasks_teacher_id_fkey (
            name,
            profile_picture_url
          )
        )
      `)
      .eq("id", submissionId)
      .single()

    if (error) {
      console.error("Error fetching submission:", error)
      return null
    }

    const submission = data as TaskSubmission
    const signedAttachments = await signSubmissionAttachments(
      (submission.attachments as string[] | null | undefined) ?? null,
    )
    return signedAttachments ? { ...submission, attachments: signedAttachments } : submission
  } catch (error) {
    console.error("Unexpected error fetching submission:", error)
    return null
  }
}

/**
 * Submit work with image uploads to Supabase Storage
 */
export async function submitWork(formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const tasksRepo = makeTasksRepository(supabase)
    const milestonesRepo = makeMilestonesRepository(supabase)
    const submissionsRepo = makeSubmissionsRepository(supabase)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    const taskIdValue = formData.get("task_id")
    const descriptionValue = formData.get("description")
    const imageCountValue = formData.get("image_count")
    const milestoneIdValue = formData.get("milestone_id")

    const taskId = typeof taskIdValue === "string" ? taskIdValue : ""
    const description = typeof descriptionValue === "string" ? descriptionValue.trim() : ""
    const imageCount = typeof imageCountValue === "string" ? parseInt(imageCountValue, 10) : 0
    const milestoneId = typeof milestoneIdValue === "string" ? milestoneIdValue : ""

    if (!taskId || !description || description.length < 20) {
      return { status: "error", message: "Datos invalidos" }
    }

    if (!milestoneId) {
      return { status: "error", message: "Debes seleccionar un hito de pago" }
    }

    if (!Number.isFinite(imageCount) || imageCount < 1 || imageCount > MAX_SUBMISSION_IMAGES) {
      return {
        status: "error",
        message: `Debes subir entre 1 y ${MAX_SUBMISSION_IMAGES} imagenes`,
      }
    }

    const files: File[] = []
    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`image_${i}`)
      if (file instanceof File) {
        files.push(file)
      }
    }

    if (files.length === 0) {
      return { status: "error", message: "Debes adjuntar al menos una imagen" }
    }

    if (files.length > MAX_SUBMISSION_IMAGES) {
      return {
        status: "error",
        message: `Solo puedes adjuntar hasta ${MAX_SUBMISSION_IMAGES} imagenes`,
      }
    }

    const invalidFile = files.find((file) => !isValidSubmissionImage(file))
    if (invalidFile) {
      return {
        status: "error",
        message: `Solo se permiten imagenes (${ALLOWED_IMAGE_EXTENSIONS.map((ext) => ext.toUpperCase()).join(", ")})`,
      }
    }

    const tooLargeFile = files.find((file) => file.size > MAX_SUBMISSION_IMAGE_SIZE_BYTES)
    if (tooLargeFile) {
      return {
        status: "error",
        message: `Cada imagen debe pesar menos de ${MAX_SUBMISSION_IMAGE_SIZE_MB}MB`,
      }
    }

    const ownership = await tasksRepo.getTaskOwnership(taskId)
    if (!ownership) {
      return { status: "error", message: "Tarea no encontrada" }
    }

    if (ownership.teacherId !== user.id) {
      return { status: "error", message: "No tienes permiso para entregar esta tarea" }
    }

    if (ownership.status !== "in_progress" && ownership.status !== "submitted") {
      return { status: "error", message: "Solo puedes entregar tareas en progreso" }
    }

    const milestone = await milestonesRepo.findMilestoneOwner(milestoneId)
    if (!milestone || milestone.taskId !== taskId) {
      return { status: "error", message: "Hito de pago no encontrado" }
    }

    if (milestone.submissionId) {
      const reviewStatus = await submissionsRepo.getSubmissionReviewStatus(milestone.submissionId)
      if (reviewStatus && reviewStatus !== "changes_requested") {
        return { status: "error", message: "Este hito ya tiene una entrega registrada" }
      }
    }

    const uploadedImages: { objectName: string; path: string }[] = []

    for (const [index, imageFile] of files.entries()) {
      const fileExt = resolveImageExtension(imageFile)
      const fileName = `${taskId}/${Date.now()}_${index}.${fileExt}`

      const uploadResult = await uploadToMinio({
        bucket: SUBMISSION_BUCKET,
        file: imageFile,
        objectName: fileName,
      }).catch((error) => {
        console.error("Error uploading submission image to MinIO:", error)
        return null
      })

      if (!uploadResult) {
        if (uploadedImages.length > 0) {
          await Promise.all(
            uploadedImages.map((file) => deleteFromMinio(SUBMISSION_BUCKET, file.objectName)),
          )
        }
        return { status: "error", message: "Error al subir las imagenes" }
      }

      uploadedImages.push({
        objectName: uploadResult.objectName,
        path: `${SUBMISSION_BUCKET}/${uploadResult.objectName}`,
      })
    }

    const saveResult = await saveSubmissionForMilestone(
      {
        taskId,
        teacherId: user.id,
        milestoneId,
        content: description,
        attachments: uploadedImages.map((file) => file.path),
        version: milestone.milestoneNumber ?? null,
      },
      { tasksRepo, milestonesRepo, submissionsRepo },
    )

    if (saveResult.status === "error" || !saveResult.submissionId) {
      if (uploadedImages.length > 0) {
        await Promise.all(
          uploadedImages.map((file) => deleteFromMinio(SUBMISSION_BUCKET, file.objectName)),
        )
      }
      return { status: "error", message: saveResult.status === "error" ? saveResult.message : "No se pudo registrar la entrega" }
    }

    revalidatePath("/workspace/mis-trabajos")
    revalidatePath("/workspace/mis-tareas")

    await createNotification({
      userId: user.id,
      type: "task",
      title: "Nueva entrega recibida",
      message: `Se envio una entrega para el Hito ${milestone.milestoneNumber}: ${milestone.title ?? "Hito"}`,
      link: `/workspace/mis-tareas?taskId=${taskId}&action=review&milestoneId=${milestoneId}`,
      metadata: {
        taskId,
        milestoneId,
        submissionId: saveResult.submissionId,
      },
    })

    return {
      status: "success",
      message: `Entrega enviada para ${milestone.title ?? "el hito"}`,
    }
  } catch (error) {
    console.error("Unexpected error submitting work:", error)
    return { status: "error", message: "Error inesperado al enviar el trabajo" }
  }
}

export async function approveSubmission(submissionId: string): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    // Get submission with task info
    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        task_id,
        is_approved,
        review_status,
        task:tasks!inner (
          id,
          student_id,
          status,
          title
        ),
        payment_milestone:payment_milestones (
          id,
          milestone_number,
          title
        )
      `)
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      return { status: "error", message: "Entrega no encontrada" }
    }

    const task = Array.isArray(submission.task) ? submission.task[0] : submission.task

    // Verify user is the student
    if (task.student_id !== user.id) {
      return { status: "error", message: "No tienes permiso para aprobar esta entrega" }
    }

    // Allow approval while la tarea estÃƒÂ¡ marcada como 'submitted' o sigue "en progreso" por otros hitos
    if (task.status !== "submitted" && task.status !== "in_progress") {
      return { status: "error", message: "Solo puedes aprobar entregas pendientes" }
    }

    // Check if already approved
    if (submission.is_approved === true || submission.review_status === "approved") {
      return { status: "error", message: "Esta entrega ya fue aprobada" }
    }

    // Update submission
    const { error: updateSubmissionError } = await supabase
      .from("task_submissions")
      .update({
        is_approved: true,
        reviewed_at: new Date().toISOString(),
        review_status: "approved",
      })
      .eq("id", submissionId)

    if (updateSubmissionError) {
      console.error("Error updating submission:", updateSubmissionError)
      return { status: "error", message: "Error al aprobar la entrega" }
    }

    // Update task status based on remaining milestones
    const nextStatus = await determineTaskStatusFromMilestones(supabase, submission.task_id)
    const { error: updateTaskError } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", submission.task_id)

    if (updateTaskError) {
      console.error("Error updating task status:", updateTaskError)
    }

    revalidatePath("/workspace/mis-tareas")
    revalidatePath("/workspace/mis-trabajos")

    // Notify student
    const paymentMilestone = Array.isArray(submission.payment_milestone)
      ? submission.payment_milestone[0]
      : submission.payment_milestone

    if (paymentMilestone) {
      await createNotification({
        userId: submission.task.student_id,
        type: "task_approved",
        title: "Entrega aprobada",
        message: `Tu entrega para el Hito ${paymentMilestone.milestone_number} ha sido aprobada.`,
        link: `/workspace/mis-trabajos?taskId=${submission.task_id}`,
        metadata: {
          taskId: submission.task_id,
          submissionId,
          milestoneId: paymentMilestone.id,
        },
      })
    }

    return { status: "success", message: "Trabajo aprobado exitosamente" }
  } catch (error) {
    console.error("Unexpected error approving submission:", error)
    return { status: "error", message: "Error inesperado al aprobar el trabajo" }
  }
}

/**
 * Reject a submission (student action)
 */
export async function rejectSubmission(
  submissionId: string,
  feedback: string
): Promise<ActionState> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    // Validate feedback
    if (!feedback || feedback.trim().length < 10) {
      return { status: "error", message: "Debes proporcionar una razÃƒÂ³n detallada (mÃƒÂ­n. 10 caracteres)" }
    }

    // Get submission with task info
    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        task_id,
        is_approved,
        task:tasks!inner (
          id,
          student_id,
          status,
          title
        )
      `)
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      return { status: "error", message: "Entrega no encontrada" }
    }

    const task = Array.isArray(submission.task) ? submission.task[0] : submission.task

    // Verify user is the student
    if (task.student_id !== user.id) {
      return { status: "error", message: "No tienes permiso para rechazar esta entrega" }
    }

    // Block change requests on completed tasks
    if (task.status === "completed") {
      return { status: "error", message: "La tarea ya está completada; no puedes solicitar cambios" }
    }

    // Verify task is in a valid state for rejection (submitted or in_progress)
    if (!["submitted", "in_progress"].includes(task.status)) {
      return { status: "error", message: "No se puede rechazar la entrega en el estado actual de la tarea" }
    }

    // Update submission
    const { error: updateSubmissionError } = await supabase
      .from("task_submissions")
      .update({
        is_approved: false,
        reviewed_at: new Date().toISOString(),
        student_feedback: feedback,
        review_status: "changes_requested",
      })
      .eq("id", submissionId)

    if (updateSubmissionError) {
      console.error("Error updating submission:", updateSubmissionError)
      return { status: "error", message: "Error al rechazar la entrega" }
    }

    // Update task status back to in_progress so teacher can resubmit
    const { error: updateTaskError } = await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", submission.task_id)

    if (updateTaskError) {
      console.error("Error updating task status:", updateTaskError)
    }

    revalidatePath("/workspace/mis-tareas")
    revalidatePath("/workspace/mis-trabajos")

    return { status: "success", message: "Trabajo rechazado. El profesor fue notificado." }
  } catch (error) {
    console.error("Unexpected error rejecting submission:", error)
    return { status: "error", message: "Error inesperado al rechazar el trabajo" }
  }
}

/**
 * Get threaded comments for a submission
 */
export async function getSubmissionComments(
  submissionId: string
): Promise<{ comments: SubmissionComment[]; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { comments: [], error: "No autenticado" }
    }

    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        task:tasks (
          student_id,
          teacher_id
        )
      `)
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      return { comments: [], error: "Entrega no encontrada" }
    }

    const task = Array.isArray(submission.task) ? submission.task[0] : submission.task
    const isParticipant = task?.student_id === user.id || task?.teacher_id === user.id

    if (!isParticipant) {
      return { comments: [], error: "No tienes permisos para ver los comentarios" }
    }

    const { data, error } = await supabase
      .from("submission_comments")
      .select(`
        id,
        submission_id,
        author_id,
        author_role,
        message,
        created_at,
        author:profiles!submission_comments_author_id_fkey (
          name,
          profile_picture_url
        )
      `)
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching submission comments:", error)
      return { comments: [], error: "No se pudieron cargar los comentarios" }
    }

    return { comments: (data as SubmissionComment[]) ?? [] }
  } catch (error) {
    console.error("Unexpected error fetching submission comments:", error)
    return { comments: [], error: "Error inesperado al cargar comentarios" }
  }
}

/**
 * Create a feedback comment for a submission
 */
export async function createSubmissionComment(
  submissionId: string,
  message: string
): Promise<{ status: "error" | "success"; message: string; comment?: SubmissionComment }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { status: "error", message: "No autenticado" }
    }

    const cleanedMessage = message.trim()
    if (cleanedMessage.length < 5) {
      return { status: "error", message: "El comentario debe tener al menos 5 caracteres" }
    }

    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(`
        id,
        task:tasks (
          student_id,
          teacher_id
        )
      `)
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      return { status: "error", message: "Entrega no encontrada" }
    }

    const task = Array.isArray(submission.task) ? submission.task[0] : submission.task
    const isStudent = task?.student_id === user.id
    const isTeacher = task?.teacher_id === user.id

    if (!isStudent && !isTeacher) {
      return { status: "error", message: "No puedes comentar en esta entrega" }
    }

    const authorRole: SubmissionComment["author_role"] = isStudent ? "student" : "teacher"

    const { data, error } = await supabase
      .from("submission_comments")
      .insert({
        submission_id: submissionId,
        author_id: user.id,
        author_role: authorRole,
        message: cleanedMessage,
      })
      .select(`
        id,
        submission_id,
        author_id,
        author_role,
        message,
        created_at,
        author:profiles!submission_comments_author_id_fkey (
          name,
          profile_picture_url
        )
      `)
      .single()

    if (error || !data) {
      console.error("Error creating submission comment:", error)
      return { status: "error", message: "No se pudo guardar el comentario" }
    }

    revalidatePath("/workspace/mis-tareas")
    revalidatePath("/workspace/mis-trabajos")

    return {
      status: "success",
      message: "Comentario enviado al docente",
      comment: data as SubmissionComment,
    }
  } catch (error) {
    console.error("Unexpected error creating submission comment:", error)
    return { status: "error", message: "Error inesperado al enviar el comentario" }
  }
}

/**
 * Get submission for a task (for student to review)
 */
export async function getSubmissionByTaskId(taskId: string): Promise<{
  submission: SubmissionWithTeacher | null
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { submission: null, error: "No autenticado" }
    }

    const { data, error } = await supabase
      .from("task_submissions")
      .select(`
        *,
        teacher:profiles!task_submissions_teacher_id_fkey (
          name,
          profile_picture_url
        )
      `)
      .eq("task_id", taskId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Error fetching submission:", error)
      return { submission: null, error: "Error al obtener la entrega" }
    }

    const submission = data as SubmissionWithTeacher
    const signedAttachments = await signSubmissionAttachments(
      (submission.attachments as string[] | null | undefined) ?? null,
    )

    return { submission: signedAttachments ? { ...submission, attachments: signedAttachments } : submission }
  } catch (error) {
    console.error("Unexpected error fetching submission:", error)
    return { submission: null, error: "Error inesperado" }
  }
}

async function determineTaskStatusFromMilestones(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string
) {
  try {
    const { data: milestones, error } = await supabase
      .from("payment_milestones")
      .select("submission_id")
      .eq("task_id", taskId)

    if (error || !milestones || milestones.length === 0) {
      return "completed"
    }

    const submissionIds = milestones
      .map((milestone) => milestone.submission_id)
      .filter((id): id is string => Boolean(id))

    let approvedIds = new Set<string>()
    if (submissionIds.length > 0) {
      const { data: submissions } = await supabase
        .from("task_submissions")
        .select("id, is_approved, review_status")
        .in("id", submissionIds)

      if (submissions) {
        approvedIds = new Set(
          submissions
            .filter(
              (submission) =>
                submission.is_approved === true || submission.review_status === "approved"
            )
            .map((submission) => submission.id)
        )
      }
    }

    const pending = milestones.some((milestone) => {
      if (!milestone.submission_id) {
        return true
      }

      return !approvedIds.has(milestone.submission_id)
    })

    return pending ? "in_progress" : "completed"
  } catch (error) {
    console.error("Error determining task status from milestones:", error)
    return "in_progress"
  }
}
