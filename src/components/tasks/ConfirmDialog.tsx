"use client"

import { useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  icon?: "warning" | "danger"
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  icon = "warning",
  onConfirm,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm()
      onOpenChange(false)
    })
  }

  const IconComponent = icon === "danger" ? IconTrash : IconAlertTriangle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                variant === "destructive"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
              }`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Procesando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Specialized components for common use cases

interface DeleteTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  taskTitle: string
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  taskTitle,
}: DeleteTaskDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar Tarea"
      description={`¿Estás seguro de que deseas eliminar la tarea "${taskTitle}"? Esta acción no se puede deshacer y se eliminará permanentemente de la base de datos.`}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="destructive"
      icon="danger"
      onConfirm={onConfirm}
    />
  )
}

interface CancelTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  taskTitle: string
  hasTeacher?: boolean
}

export function CancelTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  taskTitle,
  hasTeacher = false,
}: CancelTaskDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancelar Tarea"
      description={
        hasTeacher
          ? `¿Estás seguro de que deseas cancelar la tarea "${taskTitle}"? Ya hay un profesor asignado trabajando en ella. La tarea permanecerá en tu historial como cancelada.`
          : `¿Estás seguro de que deseas cancelar la tarea "${taskTitle}"? La tarea permanecerá en tu historial como cancelada.`
      }
      confirmLabel="Cancelar Tarea"
      cancelLabel="Volver"
      variant="destructive"
      icon="warning"
      onConfirm={onConfirm}
    />
  )
}
