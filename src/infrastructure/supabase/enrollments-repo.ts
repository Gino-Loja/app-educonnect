import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  EnrollmentsRepository,
  LessonProgressRepository,
  PurchaseMethod,
} from "@/domain/enrollments"

export function makeEnrollmentsRepository(supabase: SupabaseClient): EnrollmentsRepository {
  return {
    async getUserRole(userId: string): Promise<string | null> {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single()
      if (error || !data) return null
      return (data as { role: string }).role
    },

    async getCourseForPurchase(courseId: string): Promise<{ id: string; status: string } | null> {
      const { data, error } = await supabase.from("courses").select("id, status").eq("id", courseId).single()
      if (error || !data) return null
      return { id: data.id, status: (data as { status: string }).status }
    },

    async findExistingEnrollment(courseId: string, studentId: string) {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, status")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .in("status", ["pending", "active"])
        .maybeSingle()

      if (error && (error as { code?: string }).code !== "PGRST116") {
        throw error
      }

      return data ? { id: data.id as string, status: (data as { status: string }).status } : null
    },

    async createPendingEnrollment(input) {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          course_id: input.courseId,
          student_id: input.studentId,
          status: "pending",
          paid_amount: 0,
          proof_url: input.proofUrl,
          notes: input.notes,
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("Error creating enrollment")
      }

      return { id: data.id as string }
    },

    async createPaymentForEnrollment(input: {
      enrollmentId: string
      method: PurchaseMethod
      proofUrl?: string
    }) {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          enrollment_id: input.enrollmentId,
          method: input.method,
          status: "pending",
          proof_url: input.proofUrl,
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("Error creating payment")
      }

      return { id: data.id as string }
    },
  }
}

export function makeLessonProgressRepository(supabase: SupabaseClient): LessonProgressRepository {
  return {
    async getLessonCourse(lessonId: string): Promise<{ courseId: string } | null> {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, module:course_modules!inner(course_id)")
        .eq("id", lessonId)
        .single()

      if (error || !data) return null

      const { module: moduleField } = data as unknown as {
        module: { course_id?: string } | Array<{ course_id?: string }> | null
      }

      const moduleRelation = Array.isArray(moduleField) ? moduleField[0] : moduleField
      if (!moduleRelation) return null

      return { courseId: moduleRelation.course_id as string }
    },

    async getActiveEnrollment(courseId: string, studentId: string) {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle()

      if (error && (error as { code?: string }).code !== "PGRST116") {
        throw error
      }

      return data ? { id: data.id as string } : null
    },

    async saveLessonProgress(enrollmentId: string, lessonId: string): Promise<void> {
      const { error } = await supabase.from("lesson_progress").insert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
      })

      if (error && (error as { code?: string }).code !== "23505") {
        throw error
      }
    },
  }
}
