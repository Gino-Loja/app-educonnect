"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconClock, IconCurrencyDollar, IconUser, IconAlertTriangle } from "@tabler/icons-react"
import { Database } from "@/model/schema"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Proposal = Database["public"]["Tables"]["proposals"]["Row"] & {
  task?: {
    id: string
    title: string
    description: string
    subject: string
    academic_level: string
    due_date: string | null
    budget_min: number | null
    budget_max: number | null
    status: Database["public"]["Enums"]["task_status"]
    student?: {
      name: string | null
      profile_picture_url: string | null
    }
  }
}

interface ProposalCardTeacherProps {
  proposal: Proposal
}

export function ProposalCardTeacher({ proposal }: ProposalCardTeacherProps) {
  const statusConfig: Record<
    Database["public"]["Enums"]["proposal_status"],
    { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }
  > = {
    pending: {
      label: "Pendiente",
      variant: "default",
      color: "text-yellow-600",
    },
    accepted: {
      label: "Aceptada",
      variant: "default",
      color: "text-green-600",
    },
    rejected: {
      label: "Rechazada",
      variant: "destructive",
      color: "text-red-600",
    },
    withdrawn: {
      label: "Cancelada",
      variant: "secondary",
      color: "text-slate-600",
    },
  }

  const config = statusConfig[proposal.status]

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const studentName = proposal.task?.student?.name || "Estudiante"
  const studentAvatar = proposal.task?.student?.profile_picture_url || ""
  const isRejected = proposal.status === "rejected"
  const isWithdrawn = proposal.status === "withdrawn"
  const isTaskCancelled = proposal.task?.status === "cancelled"

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      isTaskCancelled
        ? "bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 opacity-75"
        : isRejected
        ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
        : isWithdrawn
        ? "bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 opacity-75"
        : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={studentAvatar} alt={studentName} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm font-medium truncate">{studentName}</p>
              </div>
              <h3 className="font-semibold text-base line-clamp-1">{proposal.task?.title}</h3>
            </div>
          </div>
          <Badge variant={config.variant} className="ml-2 flex-shrink-0">
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Cancelled Alert */}
        {isTaskCancelled && (
          <div className="flex items-start gap-2 p-3 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg">
            <IconAlertTriangle className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tarea cancelada</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                El estudiante ha cancelado esta tarea. Esta propuesta ya no está activa.
              </p>
            </div>
          </div>
        )}

        {/* Task Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Materia:</span>
            <Badge variant="outline">{proposal.task?.subject}</Badge>
            <Badge variant="outline">{proposal.task?.academic_level}</Badge>
          </div>

          {proposal.task?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {proposal.task.description}
            </p>
          )}
        </div>

        {/* Proposal Details */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <IconCurrencyDollar className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Propuesta</p>
              <p className="text-sm font-semibold">${proposal.proposed_amount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <IconClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Horas estimadas</p>
              <p className="text-sm font-semibold">{proposal.estimated_hours}h</p>
            </div>
          </div>
        </div>

        {/* Cover Letter Preview */}
        {proposal.cover_letter && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Carta de presentación</p>
            <p className="text-sm line-clamp-2">{proposal.cover_letter}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Enviada {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: es })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
