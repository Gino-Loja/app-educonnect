export type ProfileRole = "student" | "teacher" | "admin" | string

export type Profile = {
  id: string
  email: string
  role: ProfileRole
  name?: string | null
  lastname?: string | null
  onboardingCompleted?: boolean | null
  profileVisibility?: string | null
}

export type EnsureProfileInput = {
  id: string
  email: string
  defaultRole?: ProfileRole
  name?: string | null
  profileVisibility?: string | null
  profileCompletionPercentage?: number | null
}

export type ProfileUpdateInput = {
  id: string
  name?: string | null
  lastname?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  country?: string | null
  profilePictureUrl?: string | null
  websiteUrl?: string | null
  linkedinUrl?: string | null
  city?: string | null
  state?: string | null
  bio?: string | null
  onboardingCompleted?: boolean
  profileVisibility?: string | null
  profileCompletionPercentage?: number | null
  isActive?: boolean
}

export type TeacherProfileInput = {
  teacherId: string
  hourlyRate: number
  specialties: string[]
  subjects: string[]
  languages: string[]
  educationLevel?: string | null
  teachingExperienceYears?: number | null
  portfolioUrl?: string | null
  acceptsUrgentTasks: boolean
  acceptsLongTerm: boolean
  teachingMethodology?: string | null
}

export type StudentProfileInput = {
  studentId: string
  academicLevel?: string | null
  major?: string | null
  subjectsOfInterest: string[]
  preferredLearningStyle?: string | null
  budgetRange?: string | null
  maxBudgetPerTask?: number | null
}

export type TeacherFinancialSettingsInput = {
  teacherId: string
  hourlyRate: number
  currency: string
  paymentInfo: {
    primary_account: {
      bank_name: string
      account_number: string
      account_holder: string
      account_type?: string | null
      routing_number?: string | null
      alias?: string | null
    }
  }
}

export type TeacherAcademicSettingsInput = {
  teacherId: string
  subjects: string[]
  educationLevel?: string | null
}

export type StudentAcademicSettingsInput = {
  studentId: string
  academicLevel?: string | null
  subjectsOfInterest: string[]
}

export interface ProfilesRepository {
  findById(id: string): Promise<Profile | null>
  ensureProfile(input: EnsureProfileInput): Promise<Profile>
  updateProfile(input: ProfileUpdateInput): Promise<void>
  getRole(id: string): Promise<ProfileRole | null>
  upsertTeacherProfile(input: TeacherProfileInput): Promise<void>
  upsertStudentProfile(input: StudentProfileInput): Promise<void>
  updateTeacherFinancialSettings(input: TeacherFinancialSettingsInput): Promise<void>
  updateTeacherAcademicSettings(input: TeacherAcademicSettingsInput): Promise<void>
  updateStudentAcademicSettings(input: StudentAcademicSettingsInput): Promise<void>
}
