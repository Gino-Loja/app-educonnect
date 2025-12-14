import type { CoursesRepository } from "@/domain/courses"

export type DeleteLessonResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export async function deleteLessonById(
  lessonId: string,
  deps: { coursesRepo: CoursesRepository },
): Promise<DeleteLessonResult> {
  try {
    await deps.coursesRepo.deleteLesson(lessonId)
    return { status: "success", message: "Leccion eliminada" }
  } catch (error) {
    console.error("deleteLessonById use-case error", error)
    return { status: "error", message: "No pudimos eliminar la leccion" }
  }
}
