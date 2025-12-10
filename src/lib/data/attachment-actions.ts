"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type AttachmentType = "task_reference" | "milestone_submission" | "final_delivery"

export interface TaskAttachment {
    id: string
    created_at: string
    task_id: string
    uploaded_by: string
    file_name: string
    file_url: string
    file_size: number | null
    file_type: string | null
    attachment_type: AttachmentType
    milestone_id: string | null
    description: string | null
    is_active: boolean
}

export type ActionState = {
    status: "success" | "error"
    message: string
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const FINAL_ALLOWED_STATUSES = ["in_custody", "paid"]

function sanitizeFileName(name: string) {
    return (name || "archivo").replace(/[^a-zA-Z0-9.-]/g, "_")
}

async function validateMilestone(
    supabase: Awaited<ReturnType<typeof createClient>>,
    taskId: string,
    milestoneId?: string | null,
    attachmentType?: AttachmentType
) {
    if (!milestoneId) {
        if (attachmentType && attachmentType !== "task_reference") {
            return { error: "Debes seleccionar un hito para adjuntar este archivo" }
        }
        return { milestone: null }
    }

    const { data: milestone, error } = await supabase
        .from("payment_milestones")
        .select("id, task_id, status, milestone_number")
        .eq("id", milestoneId)
        .single()

    if (error || !milestone || milestone.task_id !== taskId) {
        return { error: "Hito no encontrado para esta tarea" }
    }

    if (attachmentType === "final_delivery") {
        const { data: lastMilestone } = await supabase
            .from("payment_milestones")
            .select("id, milestone_number")
            .eq("task_id", taskId)
            .order("milestone_number", { ascending: false })
            .limit(1)
            .single()

        if (lastMilestone && milestone.milestone_number !== lastMilestone.milestone_number) {
            return { error: "Solo puedes adjuntar la entrega final en el último hito" }
        }

        if (!FINAL_ALLOWED_STATUSES.includes(milestone.status)) {
            return { error: "La entrega final solo se habilita cuando el pago del hito está en custodia o pagado" }
        }
    }

    return { milestone }
}

/**
 * Upload a task attachment
 */
export async function uploadTaskAttachment(
    taskId: string,
    file: File,
    attachmentType: AttachmentType,
    description?: string,
    milestoneId?: string
): Promise<ActionState & { attachmentId?: string }> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            return { status: "error", message: "No autenticado" }
        }

        const { data: task, error: taskError } = await supabase
            .from("tasks")
            .select("id, student_id, teacher_id")
            .eq("id", taskId)
            .single()

        if (taskError || !task) {
            return { status: "error", message: "Tarea no encontrada" }
        }

        const isStudentOwner = task.student_id === user.id
        const isAssignedTeacher = task.teacher_id === user.id

        if (attachmentType === "task_reference" || attachmentType === "milestone_submission") {
            if (!isStudentOwner) {
                return {
                    status: "error",
                    message: "Solo el estudiante puede adjuntar archivos de referencia o para avances",
                }
            }
        } else if (attachmentType === "final_delivery") {
            if (!isAssignedTeacher) {
                return { status: "error", message: "Solo el docente asignado puede adjuntar la entrega final" }
            }
        } else {
            return { status: "error", message: "Tipo de adjunto no permitido" }
        }

        const { error: milestoneError } = await validateMilestone(
            supabase,
            taskId,
            milestoneId,
            attachmentType
        )
        if (milestoneError) {
            return { status: "error", message: milestoneError }
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return { status: "error", message: "El archivo es demasiado grande. Máximo 10MB" }
        }

        const timestamp = Date.now()
        const sanitizedFileName = sanitizeFileName(file.name)
        const baseFolder =
            attachmentType === "task_reference"
                ? "referencias"
                : attachmentType === "milestone_submission"
                    ? "avances"
                    : "final"
        const storagePath = `${taskId}/${baseFolder}/${milestoneId || "general"}/${timestamp}_${sanitizedFileName}`

        const { error: uploadError } = await supabase.storage
            .from("task-attachments")
            .upload(storagePath, file, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            })

        if (uploadError) {
            console.error("Error uploading file:", uploadError)
            return { status: "error", message: "Error al subir el archivo" }
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from("task-attachments").getPublicUrl(storagePath)

        const { data: attachment, error: dbError } = await supabase
            .from("task_attachments")
            .insert({
                task_id: taskId,
                uploaded_by: user.id,
                file_name: file.name,
                file_url: publicUrl,
                file_size: file.size,
                file_type: file.type || null,
                attachment_type: attachmentType,
                milestone_id: milestoneId || null,
                description: description || null,
            })
            .select()
            .single()

        if (dbError) {
            console.error("Error creating attachment record:", dbError)
            await supabase.storage.from("task-attachments").remove([storagePath])
            return { status: "error", message: "Error al guardar el archivo" }
        }

        revalidatePath("/workspace/mis-tareas")
        revalidatePath(`/workspace/mis-tareas/${taskId}`)
        revalidatePath("/workspace/mis-trabajos")
        revalidatePath(`/workspace/mis-trabajos/${taskId}`)

        return {
            status: "success",
            message: "Archivo adjuntado exitosamente",
            attachmentId: attachment.id,
        }
    } catch (error) {
        console.error("Unexpected error uploading attachment:", error)
        return { status: "error", message: "Error inesperado al subir el archivo" }
    }
}

/**
 * Get attachments for a task (optionally filtered by milestone)
 */
export async function getTaskAttachments(
    taskId: string,
    milestoneId?: string
): Promise<{ attachments: TaskAttachment[]; error: string | null }> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from("task_attachments")
            .select("*")
            .eq("task_id", taskId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })

        if (milestoneId) {
            query = query.eq("milestone_id", milestoneId)
        }

        const { data, error } = await query

        if (error) {
            console.error("Error fetching attachments:", error)
            return { attachments: [], error: "Error al obtener archivos adjuntos" }
        }

        return { attachments: data as TaskAttachment[], error: null }
    } catch (error) {
        console.error("Unexpected error fetching attachments:", error)
        return { attachments: [], error: "Error inesperado" }
    }
}

/**
 * Delete a task attachment
 */
export async function deleteTaskAttachment(attachmentId: string): Promise<ActionState> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            return { status: "error", message: "No autenticado" }
        }

        const { data: attachment, error: fetchError } = await supabase
            .from("task_attachments")
            .select("*, tasks!inner(student_id, teacher_id)")
            .eq("id", attachmentId)
            .single()

        if (fetchError || !attachment) {
            return { status: "error", message: "Archivo no encontrado" }
        }

        const task = Array.isArray(attachment.tasks) ? attachment.tasks[0] : attachment.tasks
        const isOwner = task.student_id === user.id
        const isTeacher = task.teacher_id === user.id
        const isUploader = attachment.uploaded_by === user.id

        if (!isOwner && !isTeacher && !isUploader) {
            return { status: "error", message: "No tienes permiso para eliminar este archivo" }
        }

        const url = new URL(attachment.file_url)
        const pathParts = url.pathname.split("/")
        const storagePath = pathParts.slice(pathParts.indexOf("task-attachments") + 1).join("/")

        const { error: storageError } = await supabase.storage
            .from("task-attachments")
            .remove([storagePath])

        if (storageError) {
            console.error("Error deleting file from storage:", storageError)
        }

        const { error: dbError } = await supabase
            .from("task_attachments")
            .update({ is_active: false })
            .eq("id", attachmentId)

        if (dbError) {
            console.error("Error deleting attachment record:", dbError)
            return { status: "error", message: "Error al eliminar el archivo" }
        }

        revalidatePath("/workspace/mis-tareas")
        revalidatePath(`/workspace/mis-tareas/${attachment.task_id}`)
        revalidatePath("/workspace/mis-trabajos")
        revalidatePath(`/workspace/mis-trabajos/${attachment.task_id}`)

        return { status: "success", message: "Archivo eliminado exitosamente" }
    } catch (error) {
        console.error("Unexpected error deleting attachment:", error)
        return { status: "error", message: "Error inesperado al eliminar el archivo" }
    }
}
