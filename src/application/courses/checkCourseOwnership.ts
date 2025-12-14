import type { CoursesRepository } from "@/domain/courses"

export async function ensureTeacherCanEditCourse(
  courseId: string,
  teacherId: string,
  deps: { coursesRepo: CoursesRepository },
): Promise<boolean> {
  const ownerId = await deps.coursesRepo.getCourseTeacher(courseId)
  return ownerId === teacherId
}
