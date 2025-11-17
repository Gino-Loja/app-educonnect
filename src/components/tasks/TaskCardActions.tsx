"use client"

import { useState } from "react"
import { Task, deleteTask, cancelTask } from "@/lib/data/task-actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDots, IconEdit, IconTrash, IconX } from "@tabler/icons-react"
import { EditTaskSheet } from "./EditTaskSheet"
import { DeleteTaskDialog, CancelTaskDialog } from "./ConfirmDialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TaskCardActionsProps {
  task: Task
}

export function TaskCardActions({ task }: TaskCardActionsProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Determine which actions are available based on task status
  const canEdit = task.status === "open"
  const canDelete = task.status === "open"
  const canCancel = !["completed", "cancelled"].includes(task.status)

  const handleDelete = async () => {
    const result = await deleteTask(task.id)

    if (result.status === "success") {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleCancel = async () => {
    const result = await cancelTask(task.id)

    if (result.status === "success") {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleEditSuccess = () => {
    router.refresh()
  }

  // Don't show menu if no actions available
  if (!canEdit && !canDelete && !canCancel) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.preventDefault()}
          >
            <IconDots className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <EditTaskSheet
              task={task}
              onSuccess={handleEditSuccess}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              }
            />
          )}

          {canCancel && (
            <>
              {canEdit && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setCancelDialogOpen(true)
                }}
                className="text-orange-600"
              >
                <IconX className="mr-2 h-4 w-4" />
                Cancelar Tarea
              </DropdownMenuItem>
            </>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setDeleteDialogOpen(true)
                }}
                className="text-red-600"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteTaskDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        taskTitle={task.title}
      />

      <CancelTaskDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancel}
        taskTitle={task.title}
        hasTeacher={!!task.teacher_id}
      />
    </>
  )
}
