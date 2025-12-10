'use client'

import { useState, type ReactNode } from "react"
import { IconPencil, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Module = {
  id: string
  title: string
  description: string | null
}

type ModuleEditorDialogProps = {
  module: Module
  updateAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
  trigger?: ReactNode
}

export function ModuleEditorDialog({ module, updateAction, deleteAction, trigger }: ModuleEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const formData = new FormData()
    formData.append("moduleId", module.id)
    setIsDeleting(true)
    try {
      await deleteAction(formData)
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const triggerNode =
    trigger ??
    (
      <Button variant="ghost" size="icon">
        <IconPencil className="h-4 w-4" />
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar módulo</DialogTitle>
          <DialogDescription>Actualiza el nombre o la descripción del módulo.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            setIsSaving(true)
            try {
              await updateAction(formData)
              setOpen(false)
            } finally {
              setIsSaving(false)
            }
          }}
          className="space-y-4"
        >
          <input type="hidden" name="moduleId" value={module.id} />
          <div className="space-y-2">
            <Label>Título</Label>
            <Input name="moduleTitle" defaultValue={module.title} required />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea name="moduleDescription" defaultValue={module.description ?? ""} rows={3} />
          </div>
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-rose-600 hover:text-rose-600"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <IconTrash className="h-4 w-4" />
              {isDeleting ? "Eliminando..." : "Eliminar módulo"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
