import type { CoursesRepository, LessonUpdateInput } from "@/domain/courses"

export type UpdateLessonResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export async function updateLessonDetails(
  input: LessonUpdateInput,
  deps: { coursesRepo: CoursesRepository },
): Promise<UpdateLessonResult> {
  try {
    await deps.coursesRepo.updateLesson(input)
    if (input.questions) {
      await deps.coursesRepo.addLessonQuestions(input.id, input.questions)
    }
    return { status: "success", message: "Leccion actualizada" }
  } catch (error) {
    console.error("updateLessonDetails use-case error", error)
    return { status: "error", message: "No pudimos actualizar la leccion" }
  }
}
