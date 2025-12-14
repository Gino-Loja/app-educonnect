import type { CourseUpdateInput, CoursesRepository } from "@/domain/courses"

export type UpdateCourseResult =
  | { status: "success" }
  | { status: "error"; message: string }

export async function updateCourseDetails(
  input: CourseUpdateInput,
  deps: { coursesRepo: CoursesRepository },
): Promise<UpdateCourseResult> {
  try {
    await deps.coursesRepo.updateCourse(input)
    return { status: "success" }
  } catch (error) {
    console.error("updateCourseDetails use-case error", error)
    return { status: "error", message: "No pudimos actualizar el curso" }
  }
}
