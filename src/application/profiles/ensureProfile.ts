import type { EnsureProfileInput, ProfilesRepository, ProfileRole } from "@/domain/profiles"

export type EnsureProfileResult = {
  role: ProfileRole | null
}

export async function ensureProfileForUser(
  input: EnsureProfileInput,
  deps: { profilesRepo: ProfilesRepository },
): Promise<EnsureProfileResult> {
  try {
    const profile = await deps.profilesRepo.ensureProfile({
      ...input,
      defaultRole: input.defaultRole ?? "student",
    })

    return { role: profile.role ?? null }
  } catch (error) {
    console.error("ensureProfileForUser use-case error", error)
    return { role: input.defaultRole ?? null }
  }
}
