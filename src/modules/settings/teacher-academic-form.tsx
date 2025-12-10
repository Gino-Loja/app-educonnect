"use client"

import { useActionState } from "react"
import { updateTeacherAcademicSettings } from "@/lib/data/role-profile-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type TeacherAcademicFormProps = {
  initialData: {
    education_level: string
    subjects: string[]
  }
}

export function TeacherAcademicForm({ initialData }: TeacherAcademicFormProps) {
  const [state, formAction, pending] = useActionState(updateTeacherAcademicSettings, undefined)

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
        <Label htmlFor="education_level">Nivel académico</Label>
        <Input
          id="education_level"
          name="education_level"
          defaultValue={initialData.education_level}
          placeholder="Licenciatura, Maestría..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subjects">Materias que impartes (separadas por coma)</Label>
        <Textarea
          id="subjects"
          name="subjects"
          defaultValue={initialData.subjects.join(", ")}
          placeholder="Matemáticas, Física, Programación"
        />
      </div>

      <Button type="submit" disabled={pending} className="bg-blue-600 text-white hover:bg-blue-700">
        {pending ? "Guardando..." : "Guardar materias y nivel"}
      </Button>
    </form>
  )
}
