import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  EnsureProfileInput,
  Profile,
  ProfileUpdateInput,
  ProfilesRepository,
  StudentAcademicSettingsInput,
  StudentProfileInput,
  TeacherAcademicSettingsInput,
  TeacherFinancialSettingsInput,
  TeacherProfileInput,
} from "@/domain/profiles"

type ProfileRow = {
  id: string
  email: string
  role?: string | null
  name?: string | null
  lastname?: string | null
  onboarding_completed?: boolean | null
  profile_visibility?: string | null
}

const mapProfile = (data: ProfileRow): Profile => ({
  id: data.id,
  email: data.email,
  role: data.role ?? "student",
  name: data.name ?? null,
  lastname: data.lastname ?? null,
  onboardingCompleted: data.onboarding_completed ?? null,
  profileVisibility: data.profile_visibility ?? null,
})

export function makeProfilesRepository(supabase: SupabaseClient): ProfilesRepository {
  return {
    async findById(id: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, name, lastname, onboarding_completed, profile_visibility")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error("findById profiles repo error", error)
        return null
      }

      return data ? mapProfile(data) : null
    },

    async ensureProfile(input: EnsureProfileInput): Promise<Profile> {
      const { data: existing, error: findError } = await supabase
        .from("profiles")
        .select("id, email, role, name, lastname, onboarding_completed, profile_visibility")
        .eq("id", input.id)
        .maybeSingle()

      if (findError) {
        console.error("ensureProfile find error", findError)
      }

      if (existing) return mapProfile(existing)

      const defaultRole = input.defaultRole ?? "student"
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: input.id,
            email: input.email,
            role: defaultRole,
            name: input.name ?? null,
            onboarding_completed: false,
            profile_visibility: input.profileVisibility ?? "private",
            profile_completion_percentage: input.profileCompletionPercentage ?? 0,
            is_active: true,
          },
          { onConflict: "id" },
        )
        .select("id, email, role, name, lastname, onboarding_completed, profile_visibility")
        .single()

      if (error || !data) {
        throw error || new Error("No se pudo crear el perfil")
      }

      return mapProfile(data)
    },

    async updateProfile(input: ProfileUpdateInput): Promise<void> {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: input.name,
          lastname: input.lastname,
          phone: input.phone,
          date_of_birth: input.dateOfBirth,
          gender: input.gender,
          country: input.country,
          profile_picture_url: input.profilePictureUrl,
          website_url: input.websiteUrl,
          linkedin_url: input.linkedinUrl,
          city: input.city,
          state: input.state,
          bio: input.bio,
          onboarding_completed: input.onboardingCompleted ?? true,
          profile_visibility: input.profileVisibility ?? "public",
          profile_completion_percentage: input.profileCompletionPercentage ?? null,
          is_active: input.isActive ?? true,
        })
        .eq("id", input.id)

      if (error) throw error
    },

    async getRole(id: string) {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle()
      if (error) {
        console.error("getRole profiles repo error", error)
        return null
      }
      return data?.role ?? null
    },

    async upsertTeacherProfile(input: TeacherProfileInput): Promise<void> {
      const { error } = await supabase.from("teachers").upsert({
        id: input.teacherId,
        hourly_rate: input.hourlyRate,
        specialties: input.specialties,
        subjects: input.subjects,
        languages: input.languages,
        education_level: input.educationLevel ?? null,
        teaching_experience_years: input.teachingExperienceYears ?? null,
        portfolio_url: input.portfolioUrl ?? null,
        accepts_urgent_tasks: input.acceptsUrgentTasks,
        accepts_long_term: input.acceptsLongTerm,
        teaching_methodology: input.teachingMethodology ?? null,
      })

      if (error) throw error
    },

    async upsertStudentProfile(input: StudentProfileInput): Promise<void> {
      const { error } = await supabase.from("students").upsert({
        id: input.studentId,
        academic_level: input.academicLevel ?? null,
        major: input.major ?? null,
        subjects_of_interest: input.subjectsOfInterest,
        preferred_learning_style: input.preferredLearningStyle ?? null,
        budget_range: input.budgetRange ?? null,
        max_budget_per_task: input.maxBudgetPerTask ?? null,
      })

      if (error) throw error
    },

    async updateTeacherFinancialSettings(input: TeacherFinancialSettingsInput): Promise<void> {
      const { error } = await supabase
        .from("teachers")
        .upsert({
          id: input.teacherId,
          hourly_rate: input.hourlyRate,
          currency: input.currency,
          payment_info: input.paymentInfo,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },

    async updateTeacherAcademicSettings(input: TeacherAcademicSettingsInput): Promise<void> {
      const { error } = await supabase
        .from("teachers")
        .update({
          subjects: input.subjects,
          education_level: input.educationLevel ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.teacherId)

      if (error) throw error
    },

    async updateStudentAcademicSettings(input: StudentAcademicSettingsInput): Promise<void> {
      const { error } = await supabase.from("students").upsert({
        id: input.studentId,
        academic_level: input.academicLevel ?? null,
        subjects_of_interest: input.subjectsOfInterest,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
    },
  }
}
