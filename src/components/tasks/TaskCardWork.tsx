"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  IconCalendar,
  IconCash,
  IconClock,
  IconEye,
  IconPlus,
  IconFileUpload,
} from "@tabler/icons-react"
import type { Database } from "@/model/schema"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale/es"

interface TaskCardWorkProps {
  task: {
    id: string
    title: string
    description: string
    subject: string
    academic_level: string
    status: Database["public"]["Enums"]["task_status"]
    priority: Database["public"]["Enums"]["task_priority"]
    due_date: string | null
    created_at: string
    budget_min: number | null
    budget_max: number | null
    student?: {
      name: string | null
      profile_picture_url: string | null
    }
  }
  selectedProposal?: {
    proposed_amount: number
    estimated_hours: number | null
  }
  onViewDetails?: (taskId: string) => void
  onSubmitWork?: (taskId: string) => void
}

const statusStyles: Record<string, string> = {
  in_progress: "bg-blue-50 text-blue-600",
  submitted: "bg-purple-50 text-purple-600",
  completed: "bg-emerald-50 text-emerald-600",
}

const priorityStyles: Record<Database["public"]["Enums"]["task_priority"], { label: string; color: string }> = {
  low: { label: "Baja", color: "text-slate-500" },
  normal: { label: "Normal", color: "text-blue-600" },
  high: { label: "Alta", color: "text-orange-600" },
  urgent: { label: "Urgente", color: "text-red-600" },
}

export function TaskCardWork({ task, selectedProposal, onViewDetails, onSubmitWork }: TaskCardWorkProps) {
  const studentName = task.student?.name || "Estudiante"
  const studentInitials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const statusClass = statusStyles[task.status] ?? statusStyles.in_progress
  const priorityInfo = priorityStyles[task.priority] ?? priorityStyles.normal
  const isCancelled = task.status === "cancelled"

  const dueLabel =
    task.due_date &&
    formatDistanceToNow(new Date(task.due_date), {
      addSuffix: true,
      locale: es,
    })

  const statusLabel =
    task.status === "in_progress"
      ? "En Progreso"
      : task.status === "submitted"
        ? "Entregado"
        : task.status === "completed"
          ? "Completado"
          : "En curso"

  return (
    <Card
      className={`relative flex h-full flex-col rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isCancelled
          ? "border-red-200 bg-red-50/80 text-red-900 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-100"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40"
      }`}
    >
      {isCancelled && (
        <div className="absolute -top-2 left-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
          Cancelada
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-4 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-2 dark:text-white">{task.title}</h3>
            <div className="flex flex-wrap gap-1.5 text-[0.7rem] font-medium text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{task.subject}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{task.academic_level}</span>
            </div>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-slate-100">
            <AvatarImage src={task.student?.profile_picture_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700">{studentInitials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-slate-900">{studentName}</p>
            <p className="text-xs text-muted-foreground">Cliente</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2 text-sm">
          {task.due_date && (
            <div className="flex items-center gap-2.5">
              <IconCalendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha límite</p>
                <p className="font-semibold text-slate-900">{dueLabel}</p>
              </div>
            </div>
          )}

          {selectedProposal && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <IconCash className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Monto acordado</p>
                  <p className="font-semibold">${selectedProposal.proposed_amount}</p>
                </div>
              </div>
              {selectedProposal.estimated_hours ? (
                <div className="flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Horas estimadas</p>
                    <p className="font-semibold">{selectedProposal.estimated_hours}h</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-2">
            <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Prioridad</div>
            <span className={`text-sm font-semibold ${priorityInfo.color}`}>{priorityInfo.label}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 items-center justify-center border-t border-slate-100 sm:flex-row">
        <Button variant="outline" size="sm" onClick={() => onViewDetails?.(task.id)}>
          <IconEye className="h-4 w-4" />
          Ver Detalles
        </Button>

        <Button
          size="sm"
          className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => onSubmitWork?.(task.id)}
          disabled={task.status !== "in_progress"}
        >
          {task.status === "in_progress" ? (
            <>
              <IconPlus className="h-4 w-4" />
              Enviar Trabajo
            </>
          ) : (
            <>
              <IconFileUpload className="h-4 w-4" />
              Enviar Trabajo
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
