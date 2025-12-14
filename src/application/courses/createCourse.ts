import type { CourseInput, CoursesRepository } from "@/domain/courses"

export type CreateCourseResult =
  | { status: "success"; courseId: string }
  | { status: "error"; message: string }

export async function createCourse(
  input: CourseInput,
  deps: { coursesRepo: CoursesRepository },
): Promise<CreateCourseResult> {
  try {
    const { id } = await deps.coursesRepo.createCourse(input)
    return { status: "success", courseId: id }
  } catch (error) {
    console.error("createCourse use-case error", error)
    return { status: "error", message: "No pudimos crear el curso" }
  }
}
