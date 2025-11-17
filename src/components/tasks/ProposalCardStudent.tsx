"use client"

import { Button } from "@/components/ui/button"
import {
  IconCash,
  IconClock,
  IconCalendar,
  IconCheck,
  IconX,
  IconFileText,
  IconEye,
  IconUser,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { Database } from "@/model/schema"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale/es"

interface ProposalCardStudentProps {
  proposal: {
    id: string
    proposed_amount: number
    estimated_hours: number | null
    cover_letter: string
    status: Database["public"]["Enums"]["proposal_status"]
    created_at: string
    task?: {
      id: string
      title: string
      status?: string
    }
    teacher?: {
      name: string | null
      profile_picture_url: string | null
    }
  }
  onAccept?: (proposalId: string) => void
  onReject?: (proposalId: string) => void
  onViewSubmission?: (proposal: any) => void
  loadingSubmission?: boolean
}

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" },
  accepted: { label: "Aceptada", color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" },
  rejected: { label: "Rechazada", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" },
  withdrawn: { label: "Cancelada", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400" },
}

export function ProposalCardStudent({
  proposal,
  onAccept,
  onReject,
  onViewSubmission,
  loadingSubmission,
}: ProposalCardStudentProps) {
  const teacherName = proposal.teacher?.name || "Profesor sin nombre"

  const isPending = proposal.status === "pending"
  const isAccepted = proposal.status === "accepted"
  const taskStatus = proposal.task?.status
  const hasSubmission = isAccepted && (taskStatus === "submitted" || taskStatus === "completed")
  const statusInfo = statusConfig[proposal.status]

  const isRejected = proposal.status === "rejected"
  const isWithdrawn = proposal.status === "withdrawn"
  const isTaskCancelled = taskStatus === "cancelled"

  return (
    <div className={`p-6 rounded-xl border h-full flex flex-col hover:shadow-lg transition-shadow ${
      isTaskCancelled
        ? "bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 opacity-75"
        : isRejected
        ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
        : isWithdrawn
        ? "bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 opacity-75"
        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
    }`}>
      {/* Header: Teacher Info & Status */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <IconUser className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {teacherName}
            </h3>
          </div>
          {proposal.task && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              Para: {proposal.task.title}
            </p>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-semibold py-1 px-2.5 rounded-full whitespace-nowrap ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Task Cancelled Alert */}
      {isTaskCancelled && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg">
          <IconAlertTriangle className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tarea cancelada</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Has cancelado esta tarea. Esta propuesta ya no está activa.
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-700 mb-4"></div>

      {/* Pricing and time info */}
      <div className="flex justify-between items-center text-sm font-medium mb-4">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <IconCash className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">${proposal.proposed_amount}</span>
        </div>
        {proposal.estimated_hours && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <IconClock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{proposal.estimated_hours}h</span>
          </div>
        )}
      </div>

      {/* Cover letter preview */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <IconFileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Carta de presentación</p>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
          {proposal.cover_letter}
        </p>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
        <IconCalendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        <span>
          Enviada{" "}
          {formatDistanceToNow(new Date(proposal.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>

      {/* Task status badge for accepted proposals */}
      {isAccepted && taskStatus && (
        <div className="flex items-center justify-between text-sm mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <span className="text-slate-600 dark:text-slate-400">Estado del trabajo:</span>
          <span className="text-xs font-medium py-1 px-2.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {taskStatus === "in_progress" && "En progreso"}
            {taskStatus === "submitted" && "Entregado - Pendiente revisión"}
            {taskStatus === "completed" && "Completado"}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
        {/* Show accept/reject buttons for pending proposals */}
        {isPending && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onAccept?.(proposal.id)}
              className="flex-1"
            >
              <IconCheck className="h-4 w-4 mr-1" />
              Aceptar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject?.(proposal.id)}
              className="flex-1"
            >
              <IconX className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </div>
        )}

        {/* Show "Ver Entrega" button for accepted proposals with submission */}
        {hasSubmission && onViewSubmission && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewSubmission(proposal)}
            className="w-full"
            disabled={loadingSubmission}
          >
            <IconEye className="h-4 w-4 mr-1" />
            Ver Entrega
          </Button>
        )}
      </div>
    </div>
  )
}
