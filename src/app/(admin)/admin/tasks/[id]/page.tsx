import Link from "next/link"
import { notFound } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"
import { getTaskById, type Task } from "@/lib/data/task-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconSchool,
} from "@tabler/icons-react"

type Props = {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: { label: "Abierta", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  in_progress: { label: "En progreso", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  submitted: { label: "Entregada", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  completed: { label: "Completada", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  cancelled: { label: "Cancelada", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  disputed: { label: "En disputa", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
}

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  high: { label: "Alta", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  urgent: { label: "Urgente", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
}

const formatDate = (date: string | null) =>
  date
    ? format(new Date(date), "dd/MM/yyyy")
    : "Sin fecha"

const formatRelative = (date: string | null) =>
  date
    ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
    : "Sin dato"

const formatBudget = (task: Task) => {
  if (task.budget_min !== null && task.budget_max !== null) return `$${task.budget_min} - $${task.budget_max}`
  if (task.budget_min !== null) return `Desde $${task.budget_min}`
  if (task.budget_max !== null) return `Hasta $${task.budget_max}`
  return "Negociable"
}

export default async function AdminTaskDetailPage({ params }: Props) {
  const { id } = await params
  const task = await getTaskById(id)

  if ("error" in task) {
    notFound()
  }

  const statusInfo = STATUS_LABELS[task.status] ?? { label: task.status, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" }
  const priorityInfo = PRIORITY_LABELS[task.priority] ?? PRIORITY_LABELS.normal

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconCalendar className="h-4 w-4" />
            <span>Creada {formatRelative(task.created_at)}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
            <Badge className={`text-xs ${priorityInfo.className}`}>Prioridad {priorityInfo.label}</Badge>
            <Badge variant="outline">ID {task.id}</Badge>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/tasks">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Volver a tareas
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Resumen rapido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prioridad</span>
              <Badge className={`text-xs ${priorityInfo.className}`}>{priorityInfo.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Presupuesto</span>
              <span className="font-medium">{formatBudget(task)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Entrega limite</span>
              <span className="font-medium">{formatDate(task.due_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Actualizado</span>
              <span className="font-medium">{formatRelative(task.updated_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconUser className="h-4 w-4" />
                <span>Estudiante</span>
              </div>
              <span className="font-medium">{task.student?.name || "Sin asignar"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconUser className="h-4 w-4" />
                <span>Profesor</span>
              </div>
              <span className="font-medium">{task.teacher?.name || "Sin asignar"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconSchool className="h-4 w-4" />
                <span>Materia</span>
              </div>
              <span className="font-medium">{task.subject || "Sin dato"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconClock className="h-4 w-4" />
                <span>Ultima actividad</span>
              </div>
              <span className="font-medium">
                {formatRelative(task.updated_at ?? task.created_at ?? null)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avance y pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold">
                {task.progress ? `${task.progress.completed}/${task.progress.total} (${task.progress.percentage}%)` : "Sin hitos"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pago minimo</span>
              <span className="font-medium">{task.budget_min !== null ? `$${task.budget_min}` : "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pago maximo</span>
              <span className="font-medium">{task.budget_max !== null ? `$${task.budget_max}` : "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Instalaciones</span>
              <span className="font-medium">{task.installments || 1}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descripcion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Nivel academico</p>
              <p className="font-medium">{task.academic_level || "Sin dato"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Tiempo estimado</p>
              <p className="font-medium">{task.estimated_hours ? `${task.estimated_hours} h` : "No indicado"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Fecha limite</p>
              <p className="font-medium">{formatDate(task.due_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
