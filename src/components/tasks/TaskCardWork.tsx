"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  IconCalendar,
  IconClock,
  IconCash,
  IconFileUpload,
  IconEye,
} from "@tabler/icons-react"
import { Database } from "@/model/schema"
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

const statusConfig = {
  in_progress: { label: "En Progreso", variant: "default" as const, color: "text-blue-600" },
  submitted: { label: "Enviado", variant: "secondary" as const, color: "text-purple-600" },
  completed: { label: "Completado", variant: "outline" as const, color: "text-green-600" },
}

const priorityConfig = {
  low: { label: "Baja", color: "text-gray-600" },
  normal: { label: "Normal", color: "text-blue-600" },
  high: { label: "Alta", color: "text-orange-600" },
  urgent: { label: "Urgente", color: "text-red-600" },
}

export function TaskCardWork({
  task,
  selectedProposal,
  onViewDetails,
  onSubmitWork,
}: TaskCardWorkProps) {
  const studentName = task.student?.name || "Estudiante"
  const studentInitials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const statusInfo = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.in_progress
  const priorityInfo = priorityConfig[task.priority]

  const daysUntilDue = task.due_date
    ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 2 && daysUntilDue >= 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2">{task.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {task.subject}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.academic_level}
              </Badge>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={task.student?.profile_picture_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {studentInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{studentName}</p>
            <p className="text-xs text-muted-foreground">Cliente</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {selectedProposal && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <IconCash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Acordado</p>
                  <p className="font-semibold">${selectedProposal.proposed_amount}</p>
                </div>
              </div>
              {selectedProposal.estimated_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Horas estimadas</p>
                    <p className="font-semibold">{selectedProposal.estimated_hours}h</p>
                  </div>
                </div>
              )}
            </>
          )}

          {task.due_date && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <IconCalendar className={`h-4 w-4 ${isOverdue ? "text-red-600" : isUrgent ? "text-orange-600" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Fecha límite</p>
                <p className={`font-semibold ${isOverdue ? "text-red-600" : isUrgent ? "text-orange-600" : ""}`}>
                  {formatDistanceToNow(new Date(task.due_date), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <span className={`text-xs font-medium ${priorityInfo.color}`}>
            Prioridad: {priorityInfo.label}
          </span>
        </div>
      </CardContent>

      <CardFooter className="gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails?.(task.id)}
          className="flex-1"
        >
          <IconEye className="h-4 w-4 mr-1" />
          Ver Detalles
        </Button>
        {task.status === "in_progress" && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onSubmitWork?.(task.id)}
            className="flex-1"
          >
            <IconFileUpload className="h-4 w-4 mr-1" />
            Enviar Trabajo
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
