"use client"

import { useState, useEffect, useTransition } from "react"
import { Task } from "@/lib/data/task-actions"
import { TaskCard } from "./TaskCard"
import { SubmissionPreviewSheet } from "./SubmissionPreviewSheet"
import { getSubmissionByTaskId } from "@/lib/data/submission-actions"
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

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Submission preview
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submission, setSubmission] = useState<any | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)

  const totalPages = Math.ceil(total / initialPageSize)

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

  const handleViewSubmission = async (task: Task) => {
    setLoadingSubmission(true)
    try {
      const result = await getSubmissionByTaskId(task.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (!result.submission) {
        toast.error("No se encontró la entrega")
        return
      }

      setSelectedTask(task)
      setSubmission(result.submission)
      setSheetOpen(true)
    } catch (error) {
      console.error("Error loading submission:", error)
      toast.error("Error al cargar la entrega")
    } finally {
      setLoadingSubmission(false)
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
                {/* Show "Ver Entrega" button if task is submitted */}
                {task.status === "submitted" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewSubmission(task)
                    }}
                    disabled={loadingSubmission}
                  >
                    <IconEye className="mr-2 h-4 w-4" />
                    Ver Entrega
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

      {/* Submission Preview Modal */}
      {selectedTask && submission && (
        <SubmissionPreviewSheet
          submission={submission}
          taskTitle={selectedTask.title}
          studentName={studentName}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
