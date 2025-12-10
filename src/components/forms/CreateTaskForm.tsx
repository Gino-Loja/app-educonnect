"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { createTask, type ActionState } from "@/lib/data/task-actions"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { InstallmentsSelector } from "@/components/forms/InstallmentsSelector"

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

export function CreateTaskForm() {
  const [state, formAction, pending] = useActionState(createTask, initialState)
  const [budgetMin, setBudgetMin] = useState<number | undefined>()
  const [budgetMax, setBudgetMax] = useState<number | undefined>()
  const [installments, setInstallments] = useState<number>(1)
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const referenceInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (state?.status === "success") {
      toast.success(state.message)
      setReferenceFiles([])
      if (referenceInputRef.current) {
        referenceInputRef.current.value = ""
      }
    } else if (state?.status === "error" && state.message) {
      toast.error(state.message)
    }
  }, [state])

  const handleReferenceFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setReferenceFiles(files)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nueva Tarea</CardTitle>
        <CardDescription>
          Completa el formulario para publicar tu tarea y recibir propuestas de profesores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título de la tarea <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="ej. Ayuda con ecuaciones diferenciales"
              required
              disabled={pending}
            />
            {state?.errors?.title && (
              <p className="text-sm text-red-500">{state.errors.title[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción detallada <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe en detalle qué necesitas..."
              rows={5}
              required
              disabled={pending}
            />
            {state?.errors?.description && (
              <p className="text-sm text-red-500">{state.errors.description[0]}</p>
            )}
          </div>

          {/* Subject and Academic Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">
                Materia <span className="text-red-500">*</span>
              </Label>
              <Select name="subject" required disabled={pending}>
                <SelectTrigger id="subject">
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
                <p className="text-sm text-red-500">{state.errors.subject[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_level">
                Nivel académico <span className="text-red-500">*</span>
              </Label>
              <Select name="academic_level" required disabled={pending}>
                <SelectTrigger id="academic_level">
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
                <p className="text-sm text-red-500">{state.errors.academic_level[0]}</p>
              )}
            </div>
          </div>

          {/* Difficulty and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select name="difficulty" disabled={pending}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Opcional" />
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
              <Label htmlFor="priority">Prioridad</Label>
              <Select name="priority" defaultValue="normal" disabled={pending}>
                <SelectTrigger id="priority">
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

          <div className="space-y-2">
            <Label htmlFor="reference_files">
              Documentos de referencia (PDF) <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="reference_files"
              name="reference_files"
              type="file"
              accept=".pdf"
              multiple
              ref={referenceInputRef}
              onChange={handleReferenceFilesChange}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">Solo archivos PDF. Tamano maximo por archivo: 10MB.</p>
            {referenceFiles.length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {referenceFiles.map((file) => (
                  <li key={file.name}>
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Presupuesto (USD)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  id="budget_min"
                  name="budget_min"
                  placeholder="Mínimo"
                  step="0.01"
                  min="0"
                  disabled={pending}
                  onChange={(e) => setBudgetMin(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                {state?.errors?.budget_min && (
                  <p className="text-sm text-red-500">{state.errors.budget_min[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  id="budget_max"
                  name="budget_max"
                  placeholder="Máximo"
                  step="0.01"
                  min="0"
                  disabled={pending}
                  onChange={(e) => setBudgetMax(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                {state?.errors?.budget_max && (
                  <p className="text-sm text-red-500">{state.errors.budget_max[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Select name="payment_type" defaultValue="negotiable" disabled={pending}>
                  <SelectTrigger id="payment_type">
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

          {/* Installments Selector */}
          <InstallmentsSelector
            budgetMin={budgetMin}
            budgetMax={budgetMax}
            value={installments}
            onChange={setInstallments}
          />
          <input type="hidden" name="installments" value={installments} />

          {/* Due Date and Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha límite</Label>
              <Input
                type="datetime-local"
                id="due_date"
                name="due_date"
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Horas estimadas</Label>
              <Input
                type="number"
                id="estimated_hours"
                name="estimated_hours"
                placeholder="ej. 2.5"
                step="0.1"
                min="0.1"
                disabled={pending}
              />
              {state?.errors?.estimated_hours && (
                <p className="text-sm text-red-500">{state.errors.estimated_hours[0]}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear Tarea"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
