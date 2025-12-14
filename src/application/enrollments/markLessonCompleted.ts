import type {
  LessonProgressRepository,
  MarkLessonCompletedCommand,
  MarkLessonResult,
} from "@/domain/enrollments"
import { markLessonSchema } from "@/lib/validation/course-schema"

export async function markLessonCompleted(
  input: MarkLessonCompletedCommand,
  deps: { progressRepo: LessonProgressRepository },
): Promise<MarkLessonResult> {
  if (!input.studentId) {
    return { status: "error", message: "No autenticado" }
  }

  const parsed = markLessonSchema.safeParse({ lessonId: input.lessonId })
  if (!parsed.success) {
    return { status: "error", message: "Datos invalidos" }
  }

  try {
    const lesson = await deps.progressRepo.getLessonCourse(parsed.data.lessonId)
    if (!lesson) {
      return { status: "error", message: "Leccion no encontrada" }
    }

    const enrollment = await deps.progressRepo.getActiveEnrollment(lesson.courseId, input.studentId)
    if (!enrollment) {
      return {
        status: "error",
        message: "Necesitas una inscripcion activa para marcar progreso",
      }
    }

    await deps.progressRepo.saveLessonProgress(enrollment.id, parsed.data.lessonId)

    return {
      status: "success",
      message: "Leccion completada",
      courseId: lesson.courseId,
    }
  } catch (error) {
    console.error("markLessonCompleted use-case error", error)
    return { status: "error", message: "No pudimos guardar el progreso" }
  }
}
