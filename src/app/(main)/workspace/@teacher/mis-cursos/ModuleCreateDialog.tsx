'use client'

import { useState, type ReactNode } from "react"
import { IconPlus } from "@tabler/icons-react"

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

type ModuleCreateDialogProps = {
  courseId: string
  createAction: (formData: FormData) => Promise<void>
  trigger?: ReactNode
}

export function ModuleCreateDialog({ courseId, createAction, trigger }: ModuleCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const triggerNode =
    trigger ??
    (
      <Button className="w-full justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
        <IconPlus className="h-4 w-4" />
        Añadir módulo
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo módulo</DialogTitle>
          <DialogDescription>Organiza tu curso en bloques temáticos.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            setIsSaving(true)
            try {
              await createAction(formData)
              setOpen(false)
            } finally {
              setIsSaving(false)
            }
          }}
          className="space-y-4"
        >
          <input type="hidden" name="courseId" value={courseId} />
          <div className="space-y-2">
            <Label>Título del módulo</Label>
            <Input name="newModuleTitle" placeholder="Ej. Fundamentos" required />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea name="newModuleDescription" rows={3} placeholder="Describe qué aprenderán." />
          </div>
          <DialogFooter className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Crear módulo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
