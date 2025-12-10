import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

type SubmissionRow = {
  id: string
  content: string | null
  attachments: string[] | null
  submitted_at: string | null
  is_approved: boolean | null
  review_status?: string | null
  student_feedback?: string | null
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  } | null
}

type MilestoneWithSubmission = {
  id: string
  task_id: string
  milestone_number: number
  title: string
  description: string | null
  amount: number
  status: string
  due_date: string | null
  submission_id: string | null
  payment_reference: string | null
  payment_proof_url: string | null
  submission: SubmissionRow | SubmissionRow[] | null
}

type RawSubmissionRow = Omit<SubmissionRow, "attachments"> & { attachments: unknown }
type MilestoneWithRawSubmission = Omit<MilestoneWithSubmission, "submission"> & {
  submission: RawSubmissionRow | RawSubmissionRow[] | null
}

const deriveReviewStatus = (submission: { review_status?: string | null; is_approved?: boolean | null } | null) => {
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
          student_feedback,
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

    const normalizedMilestones = (milestones ?? []).map((milestone: MilestoneWithRawSubmission) => {
      const submission = Array.isArray(milestone.submission)
        ? milestone.submission[0] ?? null
        : milestone.submission ?? null

      const normalizedAttachments = Array.isArray(submission?.attachments)
        ? submission.attachments.filter((file): file is string => typeof file === "string")
        : null

      return {
        ...milestone,
        submission: submission
          ? {
              ...submission,
              attachments: normalizedAttachments,
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
