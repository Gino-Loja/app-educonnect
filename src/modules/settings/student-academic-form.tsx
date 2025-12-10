"use client"

import { useActionState } from "react"
import { updateStudentAcademicSettings } from "@/lib/data/role-profile-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type StudentAcademicFormProps = {
  initialData: {
    academic_level: string
    subjects_of_interest: string[]
  }
}

export function StudentAcademicForm({ initialData }: StudentAcademicFormProps) {
  const [state, formAction, pending] = useActionState(updateStudentAcademicSettings, undefined)

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

      <div className="space-y-2">
        <Label htmlFor="academic_level">Nivel académico</Label>
        <Input
          id="academic_level"
          name="academic_level"
          defaultValue={initialData.academic_level}
          placeholder="Universitario, Posgrado..."
        />
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

      <Button type="submit" disabled={pending} className="bg-blue-600 text-white hover:bg-blue-700">
        {pending ? "Guardando..." : "Guardar preferencias académicas"}
      </Button>
    </form>
  )
}
