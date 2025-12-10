import { z } from "zod"

export const startPurchaseSchema = z.object({
  courseId: z.string().uuid({ message: "Curso no valido" }),
  method: z.enum(["transfer", "efectivo"], { message: "Metodo de pago no valido" }),
  proofUrl: z.string().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
  notes: z.string().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
})

export type StartPurchaseInput = z.infer<typeof startPurchaseSchema>

export const createCourseSchema = z.object({
  title: z.string().min(3, "Titulo requerido"),
  description: z.string().max(2000).optional().or(z.literal("")).transform((v) => v || undefined),
  price: z.number().min(0, "Precio invalido"),
  coverUrl: z.string().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
})
export type CreateCourseInput = z.infer<typeof createCourseSchema>

export const updateCourseSchema = createCourseSchema.extend({
  id: z.string().uuid(),
  status: z.enum(["draft", "published"]).optional(),
})
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

export const createModuleSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(3, "Titulo requerido"),
  description: z.string().max(1000).optional().or(z.literal("")).transform((v) => v || undefined),
  position: z.number().int().min(1).optional(),
})
export type CreateModuleInput = z.infer<typeof createModuleSchema>

export const updateModuleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, "Titulo requerido"),
  description: z.string().max(1000).optional().or(z.literal("")).transform((v) => v || undefined),
})
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>

export const deleteModuleSchema = z.object({
  id: z.string().uuid(),
})
export type DeleteModuleInput = z.infer<typeof deleteModuleSchema>

const lessonTypes = ["video", "image", "link", "file", "text", "quiz"] as const
const lessonQuestionTypes = ["multiple_choice", "true_false"] as const

export const lessonQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  prompt: z.string().min(1, "Pregunta requerida"),
  type: z.enum(lessonQuestionTypes),
  options: z.array(z.string().max(500)).optional(),
  correctAnswer: z.string().max(500).optional(),
  feedback: z.string().max(2000).optional(),
  position: z.number().int().min(1).optional(),
})

export const createLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(3, "Titulo requerido"),
  contentType: z.enum(lessonTypes).optional(),
  contentUrl: z.string().max(1000).optional().or(z.literal("")).transform((v) => v || undefined),
  textContent: z.string().max(50000).optional().or(z.literal("")).transform((v) => v || undefined),
  durationMinutes: z.number().int().min(1).optional(),
  position: z.number().int().min(1).optional(),
  questions: z.array(lessonQuestionSchema).optional(),
  passScore: z.number().int().min(0).max(100).optional(),
})
export type CreateLessonInput = z.infer<typeof createLessonSchema>

export const updateLessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, "Titulo requerido"),
  contentType: z.enum(lessonTypes).optional(),
  contentUrl: z.string().max(1000).optional().or(z.literal("")).transform((v) => v || undefined),
  textContent: z.string().max(50000).optional().or(z.literal("")).transform((v) => v || undefined),
  durationMinutes: z.number().int().min(1).optional(),
  questions: z.array(lessonQuestionSchema).optional(),
  passScore: z.number().int().min(0).max(100).optional(),
})
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>

export const deleteLessonSchema = z.object({
  id: z.string().uuid(),
})
export type DeleteLessonInput = z.infer<typeof deleteLessonSchema>

export const markLessonSchema = z.object({
  lessonId: z.string().uuid(),
})
export type MarkLessonInput = z.infer<typeof markLessonSchema>
