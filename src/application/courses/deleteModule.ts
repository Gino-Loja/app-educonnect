import type { CoursesRepository } from "@/domain/courses"

export type DeleteModuleResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export async function deleteModuleById(
  moduleId: string,
  deps: { coursesRepo: CoursesRepository },
): Promise<DeleteModuleResult> {
  try {
    await deps.coursesRepo.deleteModule(moduleId)
    return { status: "success", message: "Modulo eliminado" }
  } catch (error) {
    console.error("deleteModuleById use-case error", error)
    return { status: "error", message: "No pudimos eliminar el modulo" }
  }
}
