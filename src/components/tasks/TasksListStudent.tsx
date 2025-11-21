"use client"

import { useState, useEffect, useTransition } from "react"
import { Task } from "@/lib/data/task-actions"
import { TaskCard } from "./TaskCard"
import { SubmissionPreviewSheet } from "./SubmissionPreviewSheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconChevronLeft, IconChevronRight, IconSearch, IconEye } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { MilestoneReviewSheet, MilestoneWithSubmission } from "./MilestoneReviewSheet"

interface TasksListStudentProps {
  initialTasks: Task[]
  initialTotal: number
  initialPage: number
  initialPageSize: number
  studentName: string
  onPageChange: (page: number) => Promise<{ tasks: Task[]; total: number }>
  onFiltersChange?: (filters: {
    status?: string
    search?: string
  }) => Promise<{ tasks: Task[]; total: number }>
  showFilters?: boolean
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Abiertas" },
  { value: "in_progress", label: "En progreso" },
  { value: "submitted", label: "Entregadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "disputed", label: "En disputa" },
]

type SubmissionPreview = {
  id: string
  content: string
  attachments: string[] | null
  submitted_at: string
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  }
}

export function TasksListStudent({
  initialTasks,
  initialTotal,
  initialPage,
  initialPageSize,
  studentName,
  onPageChange,
  onFiltersChange,
  showFilters = true,
}: TasksListStudentProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isPending, startTransition] = useTransition()
  const [milestoneSheetOpen, setMilestoneSheetOpen] = useState(false)
  const [milestoneTaskTitle, setMilestoneTaskTitle] = useState("")
  const [milestones, setMilestones] = useState<MilestoneWithSubmission[]>([])
  const [milestonesLoading, setMilestonesLoading] = useState(false)
  const [milestonesError, setMilestonesError] = useState<string | null>(null)
  const [selectedTaskForMilestones, setSelectedTaskForMilestones] = useState<Task | null>(null)
  const [previewMilestoneLabel, setPreviewMilestoneLabel] = useState<string | undefined>()

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Submission preview
  const [previewTask, setPreviewTask] = useState<Task | null>(null)
  const [previewSubmission, setPreviewSubmission] = useState<SubmissionPreview | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const totalPages = Math.ceil(total / initialPageSize)

  const refreshCurrentPage = () => {
    startTransition(async () => {
      const result = await onPageChange(currentPage)
      setTasks(result.tasks)
      setTotal(result.total)
    })
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isPending) return

    startTransition(async () => {
      const result = await onPageChange(newPage)
      setTasks(result.tasks)
      setTotal(result.total)
      setCurrentPage(newPage)
    })
  }

  const handleFiltersChange = () => {
    if (!onFiltersChange) return

    startTransition(async () => {
      const result = await onFiltersChange({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      })
      setTasks(result.tasks)
      setTotal(result.total)
      setCurrentPage(1)
    })
  }

  const fetchMilestonesForTask = async (taskId: string) => {
    setMilestonesLoading(true)
    setMilestonesError(null)
    try {
      const response = await fetch(`/api/tasks/${taskId}/milestones`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "No se pudieron obtener los hitos")
      }
      setMilestones(data.milestones ?? [])
    } catch (error) {
      console.error("Error fetching milestones:", error)
      setMilestones([])
      setMilestonesError(
        error instanceof Error ? error.message : "No se pudieron obtener los hitos"
      )
    } finally {
      setMilestonesLoading(false)
    }
  }

  const handleViewMilestones = async (task: Task) => {
    setSelectedTaskForMilestones(task)
    setMilestoneTaskTitle(task.title)
    setMilestoneSheetOpen(true)
    await fetchMilestonesForTask(task.id)
  }

  const handleReviewSubmission = (milestone: MilestoneWithSubmission) => {
    if (!milestone.submission || !selectedTaskForMilestones) {
      toast.error("Este hito aún no tiene entrega asociada")
      return
    }

    setPreviewTask(selectedTaskForMilestones)
    setPreviewSubmission(milestone.submission)
    setPreviewMilestoneLabel(milestone.title || `Hito ${milestone.milestone_number}`)
    setSheetOpen(true)
  }

  const handleMilestoneSheetChange = (open: boolean) => {
    setMilestoneSheetOpen(open)
    if (!open) {
      setSelectedTaskForMilestones(null)
      setMilestones([])
      setMilestonesError(null)
      setMilestoneTaskTitle("")
    }
  }

  const handleSubmissionUpdated = () => {
    refreshCurrentPage()
    if (selectedTaskForMilestones) {
      fetchMilestonesForTask(selectedTaskForMilestones.id)
    }
  }

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setPreviewTask(null)
      setPreviewSubmission(null)
      setPreviewMilestoneLabel(undefined)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onFiltersChange) {
        handleFiltersChange()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    if (onFiltersChange) {
      handleFiltersChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={isPending}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={isPending}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total === 0
              ? "No se encontraron tareas"
              : `Mostrando ${tasks.length} de ${total} tareas`}
          </span>
          {totalPages > 1 && (
            <span>
              Página {currentPage} de {totalPages}
            </span>
          )}
        </div>

        {/* Tasks Grid */}
        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(initialPageSize)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay tareas para mostrar</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task}>
                {/* Milestone review button */}
                {task.status !== "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewMilestones(task)
                    }}
                    disabled={
                      milestonesLoading && selectedTaskForMilestones?.id === task.id
                    }
                  >
                    <IconEye className="mr-2 h-4 w-4" />
                    Ver avances
                  </Button>
                )}
              </TaskCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isPending}
                    >
                      {pageNum}
                    </Button>
                  )
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum}>...</span>
                }
                return null
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {selectedTaskForMilestones && (
        <MilestoneReviewSheet
          taskTitle={milestoneTaskTitle}
          open={milestoneSheetOpen}
          onOpenChange={handleMilestoneSheetChange}
          milestones={milestones}
          loading={milestonesLoading}
          error={milestonesError}
          onReviewSubmission={handleReviewSubmission}
        />
      )}

      {/* Submission Preview Modal */}
      {previewTask && previewSubmission && (
        <SubmissionPreviewSheet
          submission={previewSubmission}
          taskTitle={previewTask.title}
          milestoneTitle={previewMilestoneLabel}
          studentName={studentName}
          open={sheetOpen}
          onOpenChange={handleSheetChange}
          onSubmissionUpdated={(nextStatus, submissionId) => {
            if (nextStatus && submissionId) {
              setMilestones((prev) =>
                prev.map((m) =>
                  m.submission?.id === submissionId
                    ? {
                        ...m,
                        submission: {
                          ...(m.submission as any),
                          review_status: nextStatus,
                          is_approved: nextStatus === "approved",
                        },
                      }
                    : m,
                ),
              )
            }
            handleSubmissionUpdated()
          }}
        />
      )}
    </>
  )
}




