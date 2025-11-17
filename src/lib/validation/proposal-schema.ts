import { z } from "zod"

export const createProposalSchema = z.object({
  task_id: z.string().uuid("ID de tarea inválido"),
  proposed_amount: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  estimated_hours: z.number().min(1, "Las horas estimadas deben ser al menos 1").max(1000, "Las horas estimadas no pueden ser mayor a 1000"),
  cover_letter: z.string().min(10, "La carta de presentación debe tener al menos 10 caracteres").max(2000, "La carta de presentación no puede exceder 2000 caracteres"),
})

export const updateProposalSchema = z.object({
  id: z.string().uuid("ID de propuesta inválido"),
  proposed_amount: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
  estimated_hours: z.number().min(1, "Las horas estimadas deben ser al menos 1").max(1000, "Las horas estimadas no pueden ser mayor a 1000").optional(),
  cover_letter: z.string().min(10, "La carta de presentación debe tener al menos 10 caracteres").max(2000, "La carta de presentación no puede exceder 2000 caracteres").optional(),
})

export type CreateProposalInput = z.infer<typeof createProposalSchema>
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>
