"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { upsertTeacherProfile } from "@/lib/data/role-profile-actions"

type TeacherProfileFormProps = {
  initialData: {
    hourly_rate: number
    specialties: string[]
    subjects: string[]
    languages: string[]
    education_level: string
    teaching_experience_years: number | null
    portfolio_url: string
    accepts_urgent_tasks: boolean
    accepts_long_term: boolean
    teaching_methodology: string
  }
}

export function TeacherProfileForm({ initialData }: TeacherProfileFormProps) {
  const [state, formAction, pending] = useActionState(upsertTeacherProfile, undefined)

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
          <Label htmlFor="hourly_rate">Tarifa por hora (USD)</Label>
          <Input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialData.hourly_rate ?? 0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialties">Especialidades (separadas por coma)</Label>
          <Textarea
            id="specialties"
            name="specialties"
            defaultValue={initialData.specialties.join(", ")}
            placeholder="Ej. Cálculo, Redacción académica, Estadística"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subjects">Materias que enseñas (coma)</Label>
          <Textarea
            id="subjects"
            name="subjects"
            defaultValue={initialData.subjects.join(", ")}
            placeholder="Matemáticas, Física, Programación"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="languages">Idiomas (coma)</Label>
          <Input id="languages" name="languages" defaultValue={initialData.languages.join(", ")} placeholder="Español, Inglés" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="education_level">Nivel educativo</Label>
          <Input
            id="education_level"
            name="education_level"
            defaultValue={initialData.education_level}
            placeholder="Licenciatura, Maestría..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teaching_experience_years">Años de experiencia</Label>
          <Input
            id="teaching_experience_years"
            name="teaching_experience_years"
            type="number"
            min="0"
            step="1"
            defaultValue={initialData.teaching_experience_years ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portfolio_url">Portafolio / web</Label>
          <Input id="portfolio_url" name="portfolio_url" defaultValue={initialData.portfolio_url} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teaching_methodology">Metodología de enseñanza</Label>
          <Textarea
            id="teaching_methodology"
            name="teaching_methodology"
            defaultValue={initialData.teaching_methodology}
            placeholder="Describe cómo trabajas con los estudiantes"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <Checkbox name="accepts_urgent_tasks" defaultChecked={initialData.accepts_urgent_tasks} />
            <span className="text-sm">Acepto tareas urgentes</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <Checkbox name="accepts_long_term" defaultChecked={initialData.accepts_long_term} />
            <span className="text-sm">Disponible para proyectos largos</span>
          </label>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="bg-blue-600 text-white hover:bg-blue-700">
        {pending ? "Guardando..." : "Guardar perfil docente"}
      </Button>
    </form>
  )
}
