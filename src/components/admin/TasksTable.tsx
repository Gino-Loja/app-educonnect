"use client"

import type { AdminTask, AdminTasksResponse } from "@/lib/data/admin-task-actions"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface TasksTableProps {
  tasks: AdminTask[]
  pagination: Pick<AdminTasksResponse, "page" | "totalPages" | "total">
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  submitted: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400",
  disputed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
}

const statusLabels: Record<string, string> = {
  open: "Abierta",
  in_progress: "En Progreso",
  submitted: "Entregada",
  completed: "Completada",
  cancelled: "Cancelada",
  disputed: "En Disputa",
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
}

const priorityLabels: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
}

export function TasksTable({ tasks, pagination }: TasksTableProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarea</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron tareas
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {task.student?.name || "Sin nombre"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.student?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.teacher ? (
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {task.teacher.name || "Sin nombre"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {task.teacher.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[task.status]}>
                      {statusLabels[task.status] || task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[task.priority]}>
                      {priorityLabels[task.priority] || task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.budget_min !== null && task.budget_max !== null
                      ? `$${task.budget_min} - $${task.budget_max}`
                      : task.budget_min !== null
                      ? `Desde $${task.budget_min}`
                      : task.budget_max !== null
                      ? `Hasta $${task.budget_max}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(task.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {tasks.length} de {pagination.total} tareas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => router.push(`/admin/tasks?page=${pagination.page - 1}`)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => router.push(`/admin/tasks?page=${pagination.page + 1}`)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
