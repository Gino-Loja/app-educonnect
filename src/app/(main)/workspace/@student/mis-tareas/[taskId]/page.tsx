import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/utils/supabase/server"
import { getTaskById } from "@/lib/data/task-actions"
import { getMilestonesByTaskId } from "@/lib/data/milestone-actions"
import { TaskCardActions } from "@/components/tasks/TaskCardActions"
import { TaskMilestonesViewer } from "@/components/tasks/TaskMilestonesViewer"
import {
  getTeacherReviewSummary,
  listTeacherReviews,
  getMyTeacherReview,
} from "@/lib/data/review-actions"
import { ReviewWidget, type ReviewListItem } from "@/modules/reviews/review-widget"
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconCoins,
  IconSchool,
  IconUser,
} from "@tabler/icons-react"

const STATUS_LABELS: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  open: { label: "Abierta", className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En progreso", className: "bg-amber-100 text-amber-700" },
  submitted: { label: "Entregada", className: "bg-purple-100 text-purple-700" },
  completed: { label: "Completada", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", className: "bg-slate-100 text-slate-700" },
  disputed: { label: "En disputa", className: "bg-red-100 text-red-700" },
}

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-slate-100 text-slate-700" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgente", className: "bg-red-100 text-red-700" },
}

type TaskDetailProps = {
  params: {
    taskId: string
  }
}

export default async function TaskDetailPage({ params }: TaskDetailProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const taskResult = await getTaskById(params.taskId)
  if ("error" in taskResult) {
    notFound()
  }

  if (taskResult.student_id !== user.id) {
    redirect("/workspace/mis-tareas")
  }

  const task = taskResult
  const { milestones: rawMilestones } = await getMilestonesByTaskId(params.taskId)
  const milestones = (rawMilestones || []).map((m) => ({
    id: m.id,
    task_id: m.task_id,
    milestone_number: m.milestone_number,
    title: m.title,
    description: m.description,
    amount: m.amount,
    due_date: m.due_date,
    status: m.status,
    submission_id: m.submission_id,
    payment_proof_url: m.payment_proof_url,
    payment_reference: m.payment_reference,
    submitted_at: m.submitted_at,
    verified_at: m.verified_at,
    verified_by: m.verified_by,
    paid_at: m.paid_at,
    paid_by: m.paid_by,
    rejection_reason: m.rejection_reason,
    created_at: m.created_at,
    updated_at: m.updated_at,
  }))

  const milestoneTotal = milestones.reduce((sum, m) => sum + m.amount, 0)
  const milestonePaid = milestones
    .filter((m) => m.status === "paid" || m.status === "in_custody")
    .reduce((sum, m) => sum + m.amount, 0)
  const milestoneProgress = milestoneTotal > 0 ? Math.round((milestonePaid / milestoneTotal) * 100) : 0

  const teacherId = task.teacher_id
  const allowReview =
    Boolean(teacherId) &&
    task.status !== "open" &&
    task.status !== "cancelled" &&
    task.status !== "disputed"

  const reviewSummary = teacherId ? await getTeacherReviewSummary(teacherId) : null
  const teacherReviews =
    teacherId && reviewSummary?.status === "success"
      ? await listTeacherReviews({ teacherId, limit: 5 })
      : { reviews: [] }
  const myReview =
    teacherId && allowReview
      ? await getMyTeacherReview(teacherId)
      : { review: null, status: "error" as const }

  const statusInfo = STATUS_LABELS[task.status] ?? {
    label: task.status,
    className: "bg-slate-100 text-slate-700",
  }
  const priorityInfo = PRIORITY_LABELS[task.priority] ?? PRIORITY_LABELS.normal

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      : "Sin fecha"

  const formatBudget = () => {
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min} - $${task.budget_max}`
    }
    if (task.budget_min) {
      return `Desde $${task.budget_min}`
    }
    if (task.budget_max) {
      return `Hasta $${task.budget_max}`
    }
    return "Negociable"
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/mis-tareas">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tarea</p>
            <h1 className="text-xl font-semibold leading-tight">{task.title}</h1>
          </div>
        </div>
        <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Progreso de hitos</CardTitle>
              <p className="text-sm text-muted-foreground">Seguimiento de pagos y avances</p>
            </div>
            {milestones.length > 0 && (
              <TaskMilestonesViewer taskTitle={task.title} milestones={milestones} />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completado</span>
              <span className="font-semibold">{milestoneProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Hitos</p>
                <p className="text-base font-semibold">
                  {task.progress?.completed ?? 0}/{task.progress?.total ?? 0} completados
                </p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Monto liberado</p>
                <p className="text-base font-semibold">${milestonePaid.toFixed(2)} / ${milestoneTotal.toFixed(2)}</p>
              </div>
            </div>
            {milestones.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aún no hay hitos creados para esta tarea.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Gestiona la tarea como en la tarjeta de listado: puedes editarla mientras esté abierta o cancelarla si ya no la necesitas.
            </p>
            <TaskCardActions task={task} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <IconSchool className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Materia y nivel</p>
                <p className="text-sm font-semibold">
                  {task.subject} - {task.academic_level}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                <IconCalendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha limite</p>
                <p className="text-sm font-semibold">{formatDate(task.due_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <IconCoins className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Presupuesto</p>
                <p className="text-sm font-semibold">{formatBudget()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <IconClock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horas estimadas</p>
                <p className="text-sm font-semibold">{task.estimated_hours ? `${task.estimated_hours}h` : "Pendiente"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                <span className="text-xs font-bold text-indigo-600">Pri</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Prioridad</p>
                <Badge className={`text-xs ${priorityInfo.className}`}>{priorityInfo.label}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                <span className="text-xs font-bold text-slate-600">Cuotas</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pago en hitos</p>
                <p className="text-sm font-semibold">
                  {task.installments && task.installments > 1
                    ? `${task.installments} pagos`
                    : "Pago unico"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <IconUser className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estudiante</p>
                <p className="text-sm font-semibold">{task.student?.name || "Estudiante"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <IconUser className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profesor asignado</p>
                <p className="text-sm font-semibold">
                  {task.teacher?.name || "Aun sin asignar"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Creada</p>
              <p className="text-sm font-semibold">{formatDate(task.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado actual</p>
              <p className="text-sm font-semibold capitalize">{statusInfo.label}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {teacherId && reviewSummary?.status === "success" && (
        <Card>
          <CardHeader>
            <CardTitle>Califica a tu docente</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewWidget
              targetId={teacherId}
              targetType="teacher"
              summary={reviewSummary.summary || { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }}
              reviews={(teacherReviews.reviews as ReviewListItem[] | undefined) || []}
              allowReview={allowReview}
              taskId={task.id}
              currentUser={{
                id: user.id,
                name: task.student?.name || "Tú",
                avatar: task.student?.profile_picture_url || null,
              }}
              initialUserReview={
                myReview.review
                  ? {
                      id: myReview.review.id,
                      rating: myReview.review.rating ?? 0,
                      comment: myReview.review.comment,
                      created_at: myReview.review.created_at,
                    }
                  : undefined
              }
              mode={task.status === "completed" ? "rating-only" : "full"}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
