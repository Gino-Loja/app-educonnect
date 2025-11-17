"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconCalendar, IconCash, IconClock, IconUser } from "@tabler/icons-react"
import type { Task } from "@/lib/data/task-actions"
import { Database } from "@/model/schema"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale/es"

type TaskStatus = Database["public"]["Enums"]["task_status"]
type TaskPriority = Database["public"]["Enums"]["task_priority"]

export interface UserProposal {
  id: string
  status: Database["public"]["Enums"]["proposal_status"]
  proposed_amount: number
  estimated_hours: number
  cover_letter: string
}

interface TaskCardTeacherProps {
  task: Task
  onPropose?: (taskId: string) => void
  onEditProposal?: (taskId: string, proposal: UserProposal) => void
  showProposalButton?: boolean
  userProposal?: UserProposal | null
}

const statusColors: Record<TaskStatus, string> = {
  open: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  submitted: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  completed: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  disputed: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
}

const statusLabels: Record<TaskStatus, string> = {
  open: "Disponible",
  in_progress: "En Progreso",
  submitted: "Entregada",
  completed: "Completada",
  cancelled: "Cancelada",
  disputed: "En Disputa",
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  normal: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
}

const priorityLabels: Record<TaskPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
}

export function TaskCardTeacher({
  task,
  onPropose,
  onEditProposal,
  showProposalButton = true,
  userProposal = null
}: TaskCardTeacherProps) {
  const student = Array.isArray(task.student) ? task.student[0] : task.student
  const hasProposal = userProposal !== null
  const canEditProposal = hasProposal && userProposal.status === "pending"

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="space-y-3">
        {/* Student Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={student?.profile_picture_url || undefined} />
            <AvatarFallback>
              <IconUser className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {student?.name || "Estudiante"}
            </p>
            <p className="text-xs text-muted-foreground">
              Publicado {formatDistanceToNow(new Date(task.created_at), {
                addSuffix: true,
                locale: es
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={statusColors[task.status]}>
              {statusLabels[task.status]}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-2">{task.title}</h3>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {task.description}
        </p>

        {/* Subject and Academic Level */}
        <div className="flex flex-wrap gap-2">
          {task.subject && (
            <Badge variant="secondary">{task.subject}</Badge>
          )}
          {task.academic_level && (
            <Badge variant="secondary">{task.academic_level}</Badge>
          )}
          {task.priority && (
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          {/* Budget */}
          <div className="flex items-center gap-2">
            <IconCash className="h-4 w-4 text-muted-foreground" />
            {task.payment_type === "negotiable" ||
             (task.budget_min === null && task.budget_max === null) ? (
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Negociable
              </span>
            ) : (
              <span className="text-muted-foreground">
                Presupuesto:
                {task.budget_min !== null && task.budget_max !== null
                  ? ` $${task.budget_min} - $${task.budget_max}`
                  : task.budget_min !== null
                  ? ` Desde $${task.budget_min}`
                  : ` Hasta $${task.budget_max}`}
              </span>
            )}
          </div>

          {/* Deadline */}
          {task.due_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconCalendar className="h-4 w-4" />
              <span>
                Fecha límite: {new Date(task.due_date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Estimated Hours */}
          {task.estimated_hours && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconClock className="h-4 w-4" />
              <span>{task.estimated_hours} horas estimadas</span>
            </div>
          )}

          {/* Proposals Count */}
          {task.proposals_count !== undefined && task.proposals_count > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">{task.proposals_count}</span>
              <span>
                {task.proposals_count === 1 ? "propuesta recibida" : "propuestas recibidas"}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {showProposalButton && (
        <CardFooter className="pt-4 border-t">
          {hasProposal ? (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  Propuesta Enviada
                </Badge>
                {userProposal && (
                  <Badge variant="outline">
                    {userProposal.status === "pending" && "Pendiente"}
                    {userProposal.status === "accepted" && "Aceptada"}
                    {userProposal.status === "rejected" && "Rechazada"}
                    {userProposal.status === "withdrawn" && "Retirada"}
                  </Badge>
                )}
              </div>
              {canEditProposal && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => userProposal && onEditProposal?.(task.id, userProposal)}
                >
                  Editar Propuesta
                </Button>
              )}
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => onPropose?.(task.id)}
            >
              Enviar Propuesta
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
