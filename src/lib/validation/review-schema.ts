import { z } from "zod"

const commentSchema = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres")
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed && trimmed.length > 0 ? trimmed : undefined
  })

export const teacherReviewSchema = z
  .object({
    teacherId: z.string().uuid("Docente inválido"),
    taskId: z.string().uuid("Tarea inválida").optional().nullable(),
    rating: z.number().int().min(1, "Selecciona una calificación").max(5, "Máximo 5 estrellas").optional().nullable(),
    comment: commentSchema,
  })
  .refine((data) => data.rating || data.comment, {
    message: "Debes agregar una calificación o un comentario",
    path: ["comment"],
  })

export const studentReviewSchema = z
  .object({
    studentId: z.string().uuid("Estudiante inválido"),
    taskId: z.string().uuid("Tarea inválida").optional().nullable(),
    rating: z.number().int().min(1, "Selecciona una calificación").max(5, "Máximo 5 estrellas").optional().nullable(),
    comment: commentSchema,
  })
  .refine((data) => data.rating || data.comment, {
    message: "Debes agregar una calificación o un comentario",
    path: ["comment"],
  })

export type TeacherReviewInput = z.infer<typeof teacherReviewSchema>
export type StudentReviewInput = z.infer<typeof studentReviewSchema>
