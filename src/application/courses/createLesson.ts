import type { CoursesRepository, LessonInput } from "@/domain/courses"

export type CreateLessonResult =
  | { status: "success"; lessonId: string }
  | { status: "error"; message: string }

export async function createLesson(
  input: LessonInput,
  deps: { coursesRepo: CoursesRepository },
): Promise<CreateLessonResult> {
  try {
    const { id } = await deps.coursesRepo.createLesson(input)

    if (input.questions && input.questions.length) {
      await deps.coursesRepo.addLessonQuestions(id, input.questions)
    }

    return { status: "success", lessonId: id }
  } catch (error) {
    console.error("createLesson use-case error", error)
    return { status: "error", message: "No pudimos crear la leccion" }
  }
}
