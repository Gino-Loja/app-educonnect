import type { CoursesRepository } from "@/domain/courses"

export type PublishCourseResult =
  | { status: "success" }
  | { status: "error"; message: string }

export async function publishCourse(
  courseId: string,
  deps: { coursesRepo: CoursesRepository },
): Promise<PublishCourseResult> {
  try {
    await deps.coursesRepo.publishCourse(courseId)
    return { status: "success" }
  } catch (error) {
    console.error("publishCourse use-case error", error)
    return { status: "error", message: "No pudimos publicar el curso" }
  }
}
