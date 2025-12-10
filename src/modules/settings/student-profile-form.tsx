"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { upsertStudentProfile } from "@/lib/data/role-profile-actions"

type StudentProfileFormProps = {
  initialData: {
    academic_level: string
    major: string
    subjects_of_interest: string[]
    preferred_learning_style: string
    budget_range: string
    max_budget_per_task: number | null
  }
}

export function StudentProfileForm({ initialData }: StudentProfileFormProps) {
  const [state, formAction, pending] = useActionState(upsertStudentProfile, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {state?.status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{state.message}</p>
      )}
      {state?.status === "success" && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
          {state.message}
        </p>
      )}

      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="academic_level">Nivel académico</Label>
          <Input id="academic_level" name="academic_level" defaultValue={initialData.academic_level} placeholder="Universitario, Posgrado..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="major">Carrera / especialidad</Label>
          <Input id="major" name="major" defaultValue={initialData.major} placeholder="Ej. Ingeniería, Derecho..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subjects_of_interest">Materias de interés (separadas por coma)</Label>
          <Textarea
            id="subjects_of_interest"
            name="subjects_of_interest"
            defaultValue={initialData.subjects_of_interest.join(", ")}
            placeholder="Matemáticas, Física, Programación"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_learning_style">Estilo de aprendizaje preferido</Label>
          <Input
            id="preferred_learning_style"
            name="preferred_learning_style"
            defaultValue={initialData.preferred_learning_style}
            placeholder="Clases en vivo, ejercicios guiados, videos, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_range">Rango de presupuesto</Label>
          <Input id="budget_range" name="budget_range" defaultValue={initialData.budget_range} placeholder="Ej. $50 - $150" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_budget_per_task">Presupuesto máximo por tarea</Label>
          <Input
            id="max_budget_per_task"
            name="max_budget_per_task"
            type="number"
            step="0.01"
            defaultValue={initialData.max_budget_per_task ?? ""}
            placeholder="Ej. 200"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="bg-blue-600 text-white hover:bg-blue-700">
        {pending ? "Guardando..." : "Guardar perfil de estudiante"}
      </Button>
    </form>
  )
}
