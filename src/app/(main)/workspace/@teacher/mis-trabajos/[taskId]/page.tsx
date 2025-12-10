import type { ReactNode } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getTaskById } from "@/lib/data/task-actions"
import { getMilestonesByTaskId } from "@/lib/data/milestone-actions"
import { getTaskAttachments, type TaskAttachment } from "@/lib/data/attachment-actions"
import {
  getStudentReviewSummary,
  getMyStudentReview,
} from "@/lib/data/review-actions"
import { TaskMilestonesViewer } from "@/components/tasks/TaskMilestonesViewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SubmitWorkTrigger } from "./submit-work-trigger"
import { CompleteTaskButton } from "./complete-task-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ReviewWidget, type ReviewSummary } from "@/modules/reviews/review-widget"
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconCoins,
  IconDownload,
  IconFileText,
  IconMessage,
  IconSchool,
  IconUser,
  IconPhoto,
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
  params: Promise<{ taskId: string }>
}

type TaskSubmission = {
  id: string
  content: string
  attachments: string[] | null
  submitted_at: string
  version: number | null
  is_final: boolean | null
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Tamaño desconocido"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatAttachmentDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function Participant({ label, name, iconBg }: { label: string; name: string; iconBg: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
        <IconUser className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{name}</p>
      </div>
    </div>
  )
}

function AttachmentGroup({
  title,
  description,
  files,
}: {
  title: string
  description: string
  files: TaskAttachment[]
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {files.length > 0 && (
          <Badge variant="outline" className="rounded-full text-xs">
            {files.length} archivo{files.length === 1 ? "" : "s"}
          </Badge>
        )}
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay archivos disponibles.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <IconFileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAttachmentDate(file.created_at)} - {formatFileSize(file.file_size)}
                  </p>
                  {file.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">{file.description}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  <IconDownload className="h-4 w-4" />
                  <span className="sr-only">Descargar {file.file_name}</span>
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default async function TeacherWorkDetailPage({ params }: TaskDetailProps) {
  const { taskId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const taskResult = await getTaskById(taskId)
  if ("error" in taskResult) {
    notFound()
  }

  if (taskResult.teacher_id !== user.id) {
    redirect("/workspace/mis-trabajos")
  }

  const task = taskResult
  const { milestones: rawMilestones } = await getMilestonesByTaskId(taskId)
  const milestones = rawMilestones || []

  const { attachments } = await getTaskAttachments(taskId)
  const referenceAttachments = attachments.filter((att) => att.attachment_type === "task_reference")
  const milestoneSubmissions = attachments.filter((att) => att.attachment_type === "milestone_submission")
  const finalDeliveries = attachments.filter((att) => att.attachment_type === "final_delivery")

  const { data: submissions } = await supabase
    .from("task_submissions")
    .select("id, content, attachments, submitted_at, version, is_final")
    .eq("task_id", taskId)
    .order("version", { ascending: false })
    .returns<TaskSubmission[]>()

  const milestoneTotal = milestones.reduce((sum, m) => sum + m.amount, 0)
  const milestonePaid = milestones
    .filter((m) => m.status === "paid" || m.status === "in_custody")
    .reduce((sum, m) => sum + m.amount, 0)
  const milestoneProgress = milestoneTotal > 0 ? Math.round((milestonePaid / milestoneTotal) * 100) : 0

  const statusInfo = STATUS_LABELS[task.status] ?? {
    label: task.status,
    className: "bg-slate-100 text-slate-700",
  }
  const priorityInfo = PRIORITY_LABELS[task.priority] ?? PRIORITY_LABELS.normal

  const studentId = task.student_id
  const allowReview =
    Boolean(studentId) &&
    task.status !== "open" &&
    task.status !== "cancelled" &&
    task.status !== "disputed"

  const reviewSummary = studentId ? await getStudentReviewSummary(studentId) : null
  const myReview =
    studentId && allowReview ? await getMyStudentReview(studentId) : { review: null, status: "error" as const }

  const reviewSummaryForTask: ReviewSummary =
    myReview.review?.rating && myReview.review.rating >= 1 && myReview.review.rating <= 5
      ? {
          average: myReview.review.rating,
          count: 1,
          distribution: Array.from({ length: 5 }, (_, idx) =>
            idx === myReview.review!.rating! - 1 ? 1 : 0,
          ) as ReviewSummary["distribution"],
        }
      : { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Sin fecha"

  const assignmentDate = task.updated_at || task.created_at

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
    <div className="flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/mis-trabajos">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trabajo asignado</p>
            <h1 className="text-xl font-semibold leading-tight">{task.title}</h1>
          </div>
        </div>
        <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Avance del proyecto</CardTitle>
              <p className="text-sm text-muted-foreground">Hitos pagos y entregas programadas</p>
            </div>
            {milestones.length > 0 && (
              <TaskMilestonesViewer taskTitle={task.title} milestones={milestones} viewMode="teacher" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Liberado</span>
              <span className="font-semibold">{milestoneProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Hitos totales</p>
                <p className="text-base font-semibold">{milestones.length || 0}</p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">Fondos en custodia/pagados</p>
                <p className="text-base font-semibold">${milestonePaid.toFixed(2)} / ${milestoneTotal.toFixed(2)}</p>
              </div>
            </div>
            {milestones.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no hay hitos registrados para esta tarea.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordinación rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Mantén el contacto con el estudiante y envía tus entregas sin salir de esta vista.</p>
            <div className="flex flex-wrap gap-2">
              <SubmitWorkTrigger taskId={task.id} taskTitle={task.title} disabled={task.status !== "in_progress"} />
              <Button asChild variant="default">
                <Link href="/workspace/chat">
                  <IconMessage className="mr-2 h-4 w-4" />
                  Abrir chat
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/workspace/mis-trabajos">
                  Revisar hitos
                </Link>
              </Button>
              {(task.status === "in_progress" || task.status === "submitted") && (
                <CompleteTaskButton taskId={task.id} />
              )}
            </div>
            {task.status !== "in_progress" ? (
              <p className="text-xs text-muted-foreground">
                Solo puedes enviar entregas cuando la tarea está en progreso.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Envía avances o la entrega final adjuntando tus archivos.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de la tarea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                icon={
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <IconSchool className="h-5 w-5 text-blue-600" />
                  </div>
                }
                label="Materia y nivel"
                value={`${task.subject} - ${task.academic_level}`}
              />
              <DetailItem
                icon={
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                    <IconCalendar className="h-5 w-5 text-amber-600" />
                  </div>
                }
                label="Fecha límite"
                value={formatDate(task.due_date)}
              />
              <DetailItem
                icon={
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                    <IconCoins className="h-5 w-5 text-emerald-600" />
                  </div>
                }
                label="Presupuesto"
                value={formatBudget()}
              />
              <DetailItem
                icon={
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <IconClock className="h-5 w-5 text-slate-600" />
                  </div>
                }
                label="Horas estimadas"
                value={task.estimated_hours ? `${task.estimated_hours}h` : "Pendiente"}
              />
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
                    {task.installments && task.installments > 1 ? `${task.installments} pagos` : "Pago único"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {studentId && reviewSummary?.status === "success" && (
          <Card>
            <CardHeader>
              <CardTitle>Califica al estudiante</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewWidget
                targetId={studentId}
                targetType="student"
                summary={reviewSummaryForTask}
                reviews={[]}
                allowReview={allowReview}
                taskId={task.id}
                currentUser={{
                  id: user.id,
                  name: task.teacher?.name || "Tú",
                  avatar: task.teacher?.profile_picture_url || null,
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
                hideRecent
                hideDistribution
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Archivos y entregas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AttachmentGroup
              title="Referencias del estudiante"
              description="PDFs que el estudiante compartió para guiar el trabajo."
              files={referenceAttachments}
            />
            <AttachmentGroup
              title="Entregas por hito"
              description="Subidas acumuladas durante el proyecto."
              files={milestoneSubmissions}
            />
            <AttachmentGroup
              title="Entrega final"
              description="Archivos finales que compartiste con el estudiante."
              files={finalDeliveries}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entregas del docente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions && submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          Versión {submission.version ?? 1}
                        </Badge>
                        {submission.is_final ? (
                          <Badge className="rounded-full bg-emerald-100 text-emerald-700">Final</Badge>
                        ) : (
                          <Badge className="rounded-full bg-blue-100 text-blue-700">Parcial</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatAttachmentDate(submission.submitted_at)}</p>
                    </div>
                    <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{submission.content}</p>

                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Adjuntos</p>
                      {submission.attachments && submission.attachments.length > 0 ? (
                        <ul className="space-y-1">
                          {submission.attachments.map((fileUrl, index) => (
                            <li
                              key={`${submission.id}-${index}`}
                              className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                  <IconPhoto className="h-4 w-4" />
                                </div>
                                <span className="truncate">{fileUrl.split("/").pop()}</span>
                              </div>
                              <Button asChild size="sm" variant="ghost" className="shrink-0">
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                                  <IconDownload className="h-4 w-4" />
                                </a>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin archivos adjuntos.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no has registrado entregas para esta tarea.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Participant
                label="Estudiante"
                name={task.student?.name || "Estudiante"}
                iconBg="bg-blue-100 text-blue-700"
              />
              <Participant label="Docente" name={task.teacher?.name || "Tú"} iconBg="bg-emerald-100 text-emerald-700" />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Asignada</p>
                <p className="text-sm font-semibold">{formatDate(assignmentDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado actual</p>
                <p className="text-sm font-semibold capitalize">{statusInfo.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
