import { z } from "zod"

export const createSubmissionSchema = z.object({
  task_id: z.string().uuid("ID de tarea inválido"),
  submission_text: z.string().min(50, "La descripción debe tener al menos 50 caracteres").max(5000, "La descripción no puede exceder 5000 caracteres"),
  submission_files_urls: z.array(z.string().url("URL inválida")).optional().nullable(),
})

export const updateSubmissionSchema = z.object({
  id: z.string().uuid("ID de entrega inválido"),
  submission_text: z.string().min(50, "La descripción debe tener al menos 50 caracteres").max(5000, "La descripción no puede exceder 5000 caracteres").optional(),
  submission_files_urls: z.array(z.string().url("URL inválida")).optional().nullable(),
})

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>
