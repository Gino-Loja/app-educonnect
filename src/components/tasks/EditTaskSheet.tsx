"use client"

import { useActionState, useEffect, useState, useRef } from "react"
import { updateTask, type ActionState, type Task } from "@/lib/data/task-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Spanish",
  "History",
  "Geography",
  "Economics",
  "Other",
]

const ACADEMIC_LEVELS = [
  "Elementary School",
  "Middle School",
  "High School",
  "University",
  "Graduate",
  "Professional",
]

const DIFFICULTIES = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Medio" },
  { value: "hard", label: "Difícil" },
]

const PAYMENT_TYPES = [
  { value: "per_hour", label: "Por hora" },
  { value: "fixed", label: "Precio fijo" },
  { value: "negotiable", label: "Negociable" },
]

const PRIORITIES = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
]

const initialState: ActionState = {
  status: "error",
  message: "",
}

interface EditTaskSheetProps {
  task: Task
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function EditTaskSheet({ task, trigger, onSuccess }: EditTaskSheetProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(updateTask, initialState)
  const prevStateRef = useRef<ActionState | null>(null)

  // Format datetime for input
  const formatDatetimeLocal = (date: string | null) => {
    if (!date) return ""
    const d = new Date(date)
    const offset = d.getTimezoneOffset()
    const localDate = new Date(d.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16)
  }

  useEffect(() => {
    // Only show toast if state actually changed (prevents duplicate toasts)
    if (state && state !== prevStateRef.current) {
      if (state.status === "success") {
        toast.success(state.message)
        setOpen(false)
        onSuccess?.()
      } else if (state.status === "error" && state.message) {
        toast.error(state.message)
      }
      prevStateRef.current = state
    }
  }, [state, onSuccess])

  // Only allow editing if task is 'open'
  if (task.status !== "open") {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || <Button variant="outline">Editar Tarea</Button>}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-2xl">
        <SheetHeader className="space-y-3 pb-6 border-b">
          <SheetTitle className="text-2xl">Editar Tarea</SheetTitle>
          <SheetDescription className="text-base">
            Actualiza la información de tu tarea. Los cambios se guardarán inmediatamente.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="space-y-8 mt-8 mx-auto pb-8">
          {/* Hidden field for task ID */}
          <input type="hidden" name="task_id" value={task.id} />

          {/* Información Básica Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">•</span> Información Básica
            </h3>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Título de la tarea <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={task.title}
                placeholder="ej. Ayuda con ecuaciones diferenciales"
                required
                disabled={pending}
                className="h-11"
              />
              {state?.errors?.title && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠</span> {state.errors.title[0]}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Descripción detallada <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={task.description}
                placeholder="Describe en detalle qué necesitas..."
                rows={5}
                required
                disabled={pending}
                className="resize-none"
              />
              {state?.errors?.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span>⚠</span> {state.errors.description[0]}
                </p>
              )}
            </div>
          </div>

          {/* Detalles Académicos Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">•</span> Detalles Académicos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject" className="text-sm font-medium">
                  Materia <span className="text-red-500">*</span>
                </Label>
                <Select name="subject" required disabled={pending} defaultValue={task.subject}>
                  <SelectTrigger id="edit-subject" className="h-11">
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state?.errors?.subject && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {state.errors.subject[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-academic_level" className="text-sm font-medium">
                  Nivel académico <span className="text-red-500">*</span>
                </Label>
                <Select name="academic_level" required disabled={pending} defaultValue={task.academic_level}>
                  <SelectTrigger id="edit-academic_level" className="h-11">
                    <SelectValue placeholder="Selecciona el nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state?.errors?.academic_level && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {state.errors.academic_level[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty" className="text-sm font-medium">Dificultad</Label>
                <Select name="difficulty" disabled={pending} defaultValue={task.difficulty || undefined}>
                  <SelectTrigger id="edit-difficulty" className="h-11">
                    <SelectValue placeholder="Selecciona dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((diff) => (
                      <SelectItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-sm font-medium">Prioridad</Label>
                <Select name="priority" disabled={pending} defaultValue={task.priority}>
                  <SelectTrigger id="edit-priority" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Presupuesto Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">•</span> Presupuesto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget_min" className="text-sm font-medium">Mínimo (USD)</Label>
                <Input
                  type="number"
                  id="edit-budget_min"
                  name="budget_min"
                  defaultValue={task.budget_min || undefined}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={pending}
                  className="h-11"
                />
                {state?.errors?.budget_min && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {state.errors.budget_min[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-budget_max" className="text-sm font-medium">Máximo (USD)</Label>
                <Input
                  type="number"
                  id="edit-budget_max"
                  name="budget_max"
                  defaultValue={task.budget_max || undefined}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={pending}
                  className="h-11"
                />
                {state?.errors?.budget_max && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {state.errors.budget_max[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-payment_type" className="text-sm font-medium">Tipo de pago</Label>
                <Select name="payment_type" disabled={pending} defaultValue={task.payment_type || "negotiable"}>
                  <SelectTrigger id="edit-payment_type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fechas y Tiempo Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary">•</span> Fechas y Tiempo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due_date" className="text-sm font-medium">Fecha límite</Label>
                <Input
                  type="datetime-local"
                  id="edit-due_date"
                  name="due_date"
                  defaultValue={formatDatetimeLocal(task.due_date)}
                  disabled={pending}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">Fecha y hora de entrega esperada</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estimated_hours" className="text-sm font-medium">Horas estimadas</Label>
                <Input
                  type="number"
                  id="edit-estimated_hours"
                  name="estimated_hours"
                  defaultValue={task.estimated_hours || undefined}
                  placeholder="ej. 2.5"
                  step="0.1"
                  min="0.1"
                  disabled={pending}
                  className="h-11"
                />
                {state?.errors?.estimated_hours && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠</span> {state.errors.estimated_hours[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-background pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
              size="lg"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} size="lg">
              {pending ? (
                <>
                  <span className="mr-2">Guardando</span>
                  <span className="animate-pulse">...</span>
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
