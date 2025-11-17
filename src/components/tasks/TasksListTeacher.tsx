"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { TaskCardTeacher, type UserProposal } from "./TaskCardTeacher"
import { ProposalSheet } from "./ProposalSheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react"
import type { Task } from "@/lib/data/task-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface TasksListTeacherProps {
  initialTasks: Task[]
  initialTotal: number
  initialPage?: number
  initialPageSize?: number
  onPageChange?: (page: number) => Promise<{ tasks: Task[]; total: number }>
  onFiltersChange?: (filters: {
    subject?: string
    search?: string
  }) => Promise<{ tasks: Task[]; total: number }>
  showFilters?: boolean
  userProposalsMap?: Map<string, UserProposal> // Map of taskId -> UserProposal
}

const SUBJECTS = [
  { value: "all", label: "Todas las materias" },
  { value: "matematicas", label: "Matemáticas" },
  { value: "fisica", label: "Física" },
  { value: "quimica", label: "Química" },
  { value: "biologia", label: "Biología" },
  { value: "programacion", label: "Programación" },
  { value: "ingles", label: "Inglés" },
  { value: "historia", label: "Historia" },
  { value: "geografia", label: "Geografía" },
  { value: "literatura", label: "Literatura" },
  { value: "economia", label: "Economía" },
  { value: "otro", label: "Otro" },
]

export function TasksListTeacher({
  initialTasks,
  initialTotal,
  initialPage = 1,
  initialPageSize = 9,
  onPageChange,
  onFiltersChange,
  showFilters = true,
  userProposalsMap = new Map()
}: TasksListTeacherProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize] = useState(initialPageSize)
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("all")

  // Proposal sheet state
  const [proposalSheetOpen, setProposalSheetOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingProposal, setEditingProposal] = useState<UserProposal | null>(null)

  const totalPages = Math.ceil(total / pageSize)

  const handlePropose = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setEditingProposal(null)
      setProposalSheetOpen(true)
    }
  }

  const handleEditProposal = (taskId: string, proposal: UserProposal) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setEditingProposal(proposal)
      setProposalSheetOpen(true)
    }
  }

  const handleProposalSuccess = () => {
    // Refresh the page to get updated proposals from server
    router.refresh()
  }

  const handlePageChange = async (newPage: number) => {
    if (!onPageChange || newPage < 1 || newPage > totalPages) return

    startTransition(async () => {
      const result = await onPageChange(newPage)
      setTasks(result.tasks)
      setTotal(result.total)
      setCurrentPage(newPage)
    })
  }

  const handleFiltersChange = async () => {
    if (!onFiltersChange) return

    startTransition(async () => {
      const result = await onFiltersChange({
        subject: subject === "all" ? undefined : subject,
        search: search || undefined,
      })
      setTasks(result.tasks)
      setTotal(result.total)
      setCurrentPage(1)
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFiltersChange()
                }
              }}
              className="pl-9"
            />
          </div>

          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Materia" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((sub) => (
                <SelectItem key={sub.value} value={sub.value}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleFiltersChange} disabled={isPending}>
            Filtrar
          </Button>
        </div>
      )}

      {/* Tasks Grid */}
      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No se encontraron tareas disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tasks.map((task) => (
            <TaskCardTeacher
              key={task.id}
              task={task}
              onPropose={handlePropose}
              onEditProposal={handleEditProposal}
              userProposal={userProposalsMap.get(task.id) || null}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
            {Math.min(currentPage * pageSize, total)} de {total} tareas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
            >
              <IconChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
            >
              Siguiente
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Proposal Sheet */}
      {selectedTask && (
        <ProposalSheet
          task={selectedTask}
          open={proposalSheetOpen}
          onOpenChange={setProposalSheetOpen}
          onSuccess={handleProposalSuccess}
          existingProposal={editingProposal}
        />
      )}
    </div>
  )
}
