import type { CourseModuleInput, CoursesRepository } from "@/domain/courses"

export type CreateModuleResult =
  | { status: "success" }
  | { status: "error"; message: string }

export async function createModule(
  input: CourseModuleInput,
  deps: { coursesRepo: CoursesRepository },
): Promise<CreateModuleResult> {
  try {
    await deps.coursesRepo.createModule(input)
    return { status: "success" }
  } catch (error) {
    console.error("createModule use-case error", error)
    return { status: "error", message: "No pudimos crear el modulo" }
  }
}
