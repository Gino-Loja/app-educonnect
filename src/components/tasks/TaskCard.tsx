import { Task } from "@/lib/data/task-actions"
import {
  IconClock,
  IconCalendar,
  IconCoins,
  IconUser,
  IconSchool
} from "@tabler/icons-react"
import Link from "next/link"
import { TaskCardActions } from "./TaskCardActions"

const STATUS_LABELS = {
  open: { label: "Abierta", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" },
  in_progress: { label: "En progreso", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" },
  submitted: { label: "Entregada", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400" },
  completed: { label: "Completada", color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" },
  cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400" },
  disputed: { label: "En disputa", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" },
}

const PRIORITY_LABELS = {
  low: { label: "Baja", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400" },
}

interface TaskCardProps {
  task: Task
  href?: string
  onClick?: () => void
  children?: React.ReactNode
}

export function TaskCard({ task, href, onClick, children }: TaskCardProps) {
  const statusInfo = STATUS_LABELS[task.status]
  const priorityInfo = PRIORITY_LABELS[task.priority]

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatBudget = () => {
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min} - $${task.budget_max}`
    } else if (task.budget_min) {
      return `Desde $${task.budget_min}`
    } else if (task.budget_max) {
      return `Hasta $${task.budget_max}`
    }
    return "Negociable"
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  // If href is provided, wrap in Link, otherwise use div with optional onClick
  if (href) {
    return (
      <Link href={href} className="block h-full">
        <TaskCardContent
          task={task}
          statusInfo={statusInfo}
          priorityInfo={priorityInfo}
          formatDate={formatDate}
          formatBudget={formatBudget}
        >
          {children}
        </TaskCardContent>
      </Link>
    )
  }

  return (
    <div onClick={handleClick} className="h-full">
      <TaskCardContent
        task={task}
        statusInfo={statusInfo}
        priorityInfo={priorityInfo}
        formatDate={formatDate}
        formatBudget={formatBudget}
        clickable={!!onClick}
      >
        {children}
      </TaskCardContent>
    </div>
  )
}

// Extracted card content to avoid duplication
function TaskCardContent({
  task,
  statusInfo,
  priorityInfo,
  formatDate,
  formatBudget,
  clickable = true,
  children
}: {
  task: Task
  statusInfo: { label: string; color: string }
  priorityInfo: { label: string; color: string }
  formatDate: (date: string | null) => string | null
  formatBudget: () => string
  clickable?: boolean
  children?: React.ReactNode
}) {
  const isCancelled = task.status === "cancelled"

  return (
    <div className={`p-6 rounded-xl border h-full flex flex-col hover:shadow-lg transition-shadow ${
      isCancelled
        ? "bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 opacity-75"
        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
    } ${clickable ? 'cursor-pointer' : ''}`}>
      {/* Header: Title, Description */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">
            {task.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {task.description}
          </p>
        </div>
      </div>

      {/* Status, Priority, Actions */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-semibold py-1 px-2.5 rounded-full whitespace-nowrap ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {task.priority !== "normal" && (
          <span className={`text-xs font-semibold py-1 px-2.5 rounded-full whitespace-nowrap ${priorityInfo.color}`}>
            {priorityInfo.label}
          </span>
        )}
        <div className="ml-auto">
          <TaskCardActions task={task} />
        </div>
      </div>

      {/* Tags: Subject, Level, Difficulty */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-medium py-1 px-2.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
          {task.subject}
        </span>
        <span className="text-xs font-medium py-1 px-2.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
          {task.academic_level}
        </span>
        {task.difficulty && (
          <span className="text-xs font-medium py-1 px-2.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 capitalize">
            {task.difficulty}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-700 mb-4"></div>

      {/* Student & Teacher Info */}
      <div className="space-y-3 mb-4">
        {/* Student Info */}
        {task.student && (
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            <IconUser className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
            <span>{task.student.name || "Estudiante"}</span>
          </div>
        )}

        {/* Teacher Info (if assigned) */}
        {task.teacher && (
          <div className="flex items-center text-sm">
            <IconSchool className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {task.teacher.name || "Profesor"}
            </span>
          </div>
        )}
      </div>

      {/* Budget & Hours */}
      <div className="flex justify-between items-center text-sm font-medium mb-4">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <IconCoins className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatBudget()}</span>
        </div>
        {task.estimated_hours && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <IconClock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{task.estimated_hours}h estimadas</span>
          </div>
        )}
      </div>

      {/* Due Date */}
      {task.due_date && (
        <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400">
          <IconCalendar className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
          <span>{formatDate(task.due_date)}</span>
        </div>
      )}

      {/* Additional content (e.g., action buttons) */}
      {children && (
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
          {children}
        </div>
      )}
    </div>
  )
}
