import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const deriveReviewStatus = (submission: any) => {
  if (!submission) return "pending_review"
  if (submission.review_status) return submission.review_status
  if (submission.is_approved === true) return "approved"
  if (submission.is_approved === false) return "changes_requested"
  return "pending_review"
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, student_id, teacher_id")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
    }

    const isParticipant = task.student_id === user.id || task.teacher_id === user.id
    if (!isParticipant) {
      return NextResponse.json({ error: "No tienes permiso para ver estos hitos" }, { status: 403 })
    }

    const { data: milestones, error } = await supabase
      .from("payment_milestones")
      .select(`
        id,
        task_id,
        milestone_number,
        title,
        description,
        amount,
        status,
        due_date,
        submission_id,
        payment_reference,
        payment_proof_url,
        submission:task_submissions!payment_milestones_submission_id_fkey (
          id,
          content,
          attachments,
          submitted_at,
          is_approved,
          review_status,
          teacher:profiles!task_submissions_teacher_id_fkey (
            name,
            profile_picture_url
          )
        )
      `)
      .eq("task_id", taskId)
      .order("milestone_number", { ascending: true })

    if (error) {
      console.error("Error fetching task milestones:", error)
      return NextResponse.json({ error: "Error al obtener los hitos" }, { status: 500 })
    }

    const normalizedMilestones = (milestones ?? []).map((milestone: any) => {
      const submission = Array.isArray(milestone.submission)
        ? milestone.submission[0] ?? null
        : milestone.submission ?? null

      return {
        ...milestone,
        submission: submission
          ? {
              ...submission,
              review_status: deriveReviewStatus(submission),
            }
          : null,
      }
    })

    return NextResponse.json({ milestones: normalizedMilestones })
  } catch (error) {
    console.error("Unexpected error fetching task milestones:", error)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
