import type { CourseModuleUpdateInput, CoursesRepository } from "@/domain/courses"

export type UpdateModuleResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export async function updateModuleDetails(
  input: CourseModuleUpdateInput,
  deps: { coursesRepo: CoursesRepository },
): Promise<UpdateModuleResult> {
  try {
    await deps.coursesRepo.updateModule(input)
    return { status: "success", message: "Modulo actualizado" }
  } catch (error) {
    console.error("updateModuleDetails use-case error", error)
    return { status: "error", message: "No pudimos actualizar el modulo" }
  }
}
