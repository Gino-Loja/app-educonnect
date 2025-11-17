import { z } from "zod"

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),

  description: z
    .string()
    .min(20, "La descripción debe tener al menos 20 caracteres"),

  subject: z
    .string()
    .min(1, "Debes seleccionar una materia"),

  academic_level: z
    .string()
    .min(1, "Debes seleccionar un nivel académico"),

  difficulty: z
    .enum(["easy", "medium", "hard"])
    .optional(),

  topic_tags: z
    .array(z.string())
    .default([]),

  budget_min: z
    .number()
    .min(0, "El presupuesto mínimo debe ser mayor o igual a 0")
    .optional()
    .nullable(),

  budget_max: z
    .number()
    .min(0, "El presupuesto máximo debe ser mayor o igual a 0")
    .optional()
    .nullable(),

  payment_type: z
    .enum(["per_hour", "fixed", "negotiable"])
    .default("negotiable"),

  due_date: z
    .string()
    .optional()
    .nullable(),

  estimated_hours: z
    .number()
    .min(0.1, "Las horas estimadas deben ser mayores a 0")
    .optional()
    .nullable(),

  priority: z
    .enum(["low", "normal", "high", "urgent"])
    .default("normal"),

  installments: z
    .number()
    .int()
    .min(1, "Mínimo 1 cuota")
    .max(5, "Máximo 5 cuotas")
    .default(1),
}).refine(
  (data) => {
    if (data.budget_min && data.budget_max) {
      return data.budget_max >= data.budget_min
    }
    return true
  },
  {
    message: "El presupuesto máximo debe ser mayor o igual al mínimo",
    path: ["budget_max"],
  }
)

export type CreateTaskInput = z.infer<typeof createTaskSchema>
