import type {
  ProfileRole,
  ProfilesRepository,
  ProfileUpdateInput,
  StudentAcademicSettingsInput,
  StudentProfileInput,
  TeacherAcademicSettingsInput,
  TeacherFinancialSettingsInput,
  TeacherProfileInput,
} from "@/domain/profiles"

export type ProfileCommandResult =
  | { status: "success"; role?: ProfileRole | null }
  | { status: "error"; message: string }

export async function updateProfileDetails(
  input: ProfileUpdateInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<ProfileCommandResult> {
  try {
    await deps.profilesRepo.updateProfile(input)
    return { status: "success" }
  } catch (error) {
    console.error("updateProfileDetails use-case error", error)
    return { status: "error", message: "No se pudo actualizar el perfil" }
  }
}

export async function saveTeacherProfile(
  input: TeacherProfileInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<ProfileCommandResult> {
  try {
    await deps.profilesRepo.upsertTeacherProfile(input)
    return { status: "success" }
  } catch (error) {
    console.error("saveTeacherProfile use-case error", error)
    return { status: "error", message: "No se pudo guardar el perfil docente" }
  }
}

export async function saveStudentProfile(
  input: StudentProfileInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<ProfileCommandResult> {
  try {
    await deps.profilesRepo.upsertStudentProfile(input)
    return { status: "success" }
  } catch (error) {
    console.error("saveStudentProfile use-case error", error)
    return { status: "error", message: "No se pudo guardar el perfil de estudiante" }
  }
}

export async function updateTeacherFinancialSettings(
  input: TeacherFinancialSettingsInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<ProfileCommandResult> {
  try {
    await deps.profilesRepo.updateTeacherFinancialSettings(input)
    return { status: "success" }
  } catch (error) {
    console.error("updateTeacherFinancialSettings use-case error", error)
    return { status: "error", message: "No se pudieron guardar los datos financieros" }
  }
}

export async function updateTeacherAcademicSettings(
  input: TeacherAcademicSettingsInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<ProfileCommandResult> {
  try {
    await deps.profilesRepo.updateTeacherAcademicSettings(input)
    return { status: "success" }
  } catch (error) {
    console.error("updateTeacherAcademicSettings use-case error", error)
    return { status: "error", message: "No se pudo guardar la informacion academica" }
  }
}

export async function updateStudentAcademicSettings(
  input: StudentAcademicSettingsInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<ProfileCommandResult> {
  try {
    await deps.profilesRepo.updateStudentAcademicSettings(input)
    return { status: "success" }
  } catch (error) {
    console.error("updateStudentAcademicSettings use-case error", error)
    return { status: "error", message: "No se pudo guardar la informacion academica" }
  }
}
