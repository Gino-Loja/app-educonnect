"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/model/schema"
import {
  studentReviewSchema,
  teacherReviewSchema,
  type StudentReviewInput,
  type TeacherReviewInput,
} from "@/lib/validation/review-schema"

type TeacherReviewRow = Database["public"]["Tables"]["teacher_reviews"]["Row"]
type StudentReviewRow = Database["public"]["Tables"]["student_reviews"]["Row"]

type ReviewSummary = {
  average: number
  count: number
  distribution: [number, number, number, number, number]
}

type ReviewWithProfile<T> = T & {
  reviewer: {
    id: string
    name: string | null
    avatar: string | null
  }
}

const normalizeComment = (comment?: string) => comment?.trim() || null

async function getSessionRole() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { status: "error" as const, message: "No autenticado" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { status: "error" as const, message: "No se encontró tu perfil" }
  }

  return { status: "success" as const, userId: user.id, role: profile.role }
}

async function ensureTaskRelationship(
  params: { studentId: string; teacherId: string; taskId?: string | null },
) {
  const supabase = await createClient()
  let query = supabase
    .from("tasks")
    .select("id")
    .eq("student_id", params.studentId)
    .eq("teacher_id", params.teacherId)
    .neq("status", "cancelled")
    .not("selected_proposal_id", "is", null)
    .limit(1)

  if (params.taskId) {
    query = query.eq("id", params.taskId)
  }

  const { data, error } = await query

  if (error) {
    return { status: "error" as const, message: "No se pudo validar la relación" }
  }

  if (!data || data.length === 0) {
    return { status: "error" as const, message: "No puedes calificar sin un trabajo en común" }
  }

  return { status: "success" as const }
}

export async function createOrUpdateTeacherReview(
  payload: TeacherReviewInput,
  options?: { revalidatePathname?: string },
) {
  const parsed = teacherReviewSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.flatten().fieldErrors }
  }

  const auth = await getSessionRole()
  if (auth.status === "error") return auth
  if (auth.role !== "student") {
    return { status: "error" as const, message: "Solo estudiantes pueden calificar docentes" }
  }

  const relation = await ensureTaskRelationship({
    studentId: auth.userId,
    teacherId: parsed.data.teacherId,
    taskId: parsed.data.taskId,
  })
  if (relation.status === "error") return relation

  const supabase = await createClient()

  let existingQuery = supabase
    .from("teacher_reviews")
    .select("id")
    .eq("teacher_id", parsed.data.teacherId)
    .eq("student_id", auth.userId)

  if (parsed.data.taskId) {
    existingQuery = existingQuery.eq("task_id", parsed.data.taskId)
  } else {
    existingQuery = existingQuery.is("task_id", null)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  const upsertPayload = {
    teacher_id: parsed.data.teacherId,
    student_id: auth.userId,
    task_id: parsed.data.taskId ?? null,
    rating: (parsed.data.rating ?? null) as number, // Cast to number to satisfy generated types (nullable in DB but TS might expect number | undefined)
    comment: normalizeComment(parsed.data.comment),
  }

  const { data: saved, error } = existing
    ? await supabase
      .from("teacher_reviews")
      .update(upsertPayload)
      .eq("id", existing.id)
      .select()
      .single()
    : await supabase
      .from("teacher_reviews")
      .insert(upsertPayload)
      .select()
      .single()

  if (error || !saved) {
    return { status: "error" as const, message: "No se pudo guardar la reseña" }
  }

  if (options?.revalidatePathname) {
    revalidatePath(options.revalidatePathname)
  }

  return { status: "success" as const, message: "Reseña guardada", review: saved }
}

export async function createOrUpdateStudentReview(
  payload: StudentReviewInput,
  options?: { revalidatePathname?: string },
) {
  const parsed = studentReviewSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.flatten().fieldErrors }
  }

  const auth = await getSessionRole()
  if (auth.status === "error") return auth
  if (auth.role !== "teacher") {
    return { status: "error" as const, message: "Solo docentes pueden calificar estudiantes" }
  }

  const relation = await ensureTaskRelationship({
    studentId: parsed.data.studentId,
    teacherId: auth.userId,
    taskId: parsed.data.taskId,
  })
  if (relation.status === "error") return relation

  const supabase = await createClient()

  let existingQuery = supabase
    .from("student_reviews")
    .select("id")
    .eq("student_id", parsed.data.studentId)
    .eq("teacher_id", auth.userId)

  if (parsed.data.taskId) {
    existingQuery = existingQuery.eq("task_id", parsed.data.taskId)
  } else {
    existingQuery = existingQuery.is("task_id", null)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  const upsertPayload = {
    student_id: parsed.data.studentId,
    teacher_id: auth.userId,
    task_id: parsed.data.taskId ?? null,
    rating: (parsed.data.rating ?? null) as number,
    comment: normalizeComment(parsed.data.comment),
  }

  const { data: saved, error } = existing
    ? await supabase
      .from("student_reviews")
      .update(upsertPayload)
      .eq("id", existing.id)
      .select()
      .single()
    : await supabase
      .from("student_reviews")
      .insert(upsertPayload)
      .select()
      .single()

  if (error || !saved) {
    return { status: "error" as const, message: "No se pudo guardar la reseña" }
  }

  if (options?.revalidatePathname) {
    revalidatePath(options.revalidatePathname)
  }

  return { status: "success" as const, message: "Reseña guardada", review: saved }
}

export async function getTeacherReviewSummary(teacherId: string): Promise<{
  status: "success" | "error"
  message?: string
  summary?: ReviewSummary
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("teacher_reviews")
    .select("rating")
    .eq("teacher_id", teacherId)

  if (error) {
    return { status: "error", message: "No se pudo obtener la reputación del docente" }
  }

  let count = 0
  const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0]
  let total = 0

  for (const row of data || []) {
    if (row.rating) {
      const idx = Math.min(Math.max(Math.round(row.rating), 1), 5) - 1
      distribution[idx] += 1
      total += row.rating
      count++ // Only count rated reviews for average
    }
  }

  // If we want to return total count of reviews (including text-only) we might need another query or just use data.length
  // But for "Average Rating" display, we usually care about N ratings.
  // The UI shows "X reseñas" which usually implies total reviews.
  // Let's keep count as total reviews, but average is based on rated ones?
  // Actually, standard behavior: "4.5 (20 reviews)". If 5 are text-only, it might be confusing.
  // Let's stick to: count = number of RATINGS.
  // If the user wants to see text reviews, they are in the list.
  // So I will reset count to 0 and increment it only for rated reviews.

  // Reset count to be safe
  // count = 0; // Wait, I can't reassign const count from line 242.
  // Let's refactor this function slightly.


  const average = count > 0 ? Number((total / count).toFixed(2)) : 0

  return { status: "success", summary: { average, count, distribution } }
}

export async function getStudentReviewSummary(studentId: string): Promise<{
  status: "success" | "error"
  message?: string
  summary?: ReviewSummary
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("student_reviews")
    .select("rating")
    .eq("student_id", studentId)

  if (error) {
    return { status: "error", message: "No se pudo obtener la reputación del estudiante" }
  }

  let count = 0
  const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0]
  let total = 0

  for (const row of data || []) {
    if (row.rating) {
      const idx = Math.min(Math.max(Math.round(row.rating), 1), 5) - 1
      distribution[idx] += 1
      total += row.rating
      count++
    }
  }

  const average = count > 0 ? Number((total / count).toFixed(2)) : 0

  return { status: "success", summary: { average, count, distribution } }
}

export async function listTeacherReviews(params: {
  teacherId: string
  limit?: number
  offset?: number
}): Promise<{
  status: "success" | "error"
  message?: string
  reviews?: ReviewWithProfile<TeacherReviewRow>[]
}> {
  const supabase = await createClient()
  const limit = params.limit ?? 10
  const from = params.offset ?? 0
  const to = from + limit - 1

  const { data, error } = await supabase
    .from("teacher_reviews")
    .select(
      `
        id,
        rating,
        comment,
        created_at,
        student_id,
        student:profiles!teacher_reviews_student_id_fkey (
          id,
          name,
          profile_picture_url
        )
      `,
    )
    .eq("teacher_id", params.teacherId)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return { status: "error", message: "No se pudieron cargar las reseñas del docente" }
  }

  const normalized =
    data
      ?.map((row) => {
        const { student, ...rest } = row as unknown as {
          student_id: string
          student?: { id?: string | null; name?: string | null; profile_picture_url?: string | null }
          comment: string | null
          rating: number | null
          created_at: string
          id: string
          task_id: string | null
          teacher_id: string
        }
        return {
          ...rest,
          reviewer: {
            id: student?.id ?? row.student_id,
            name: student?.name ?? "Estudiante",
            avatar: student?.profile_picture_url ?? null,
          },
        }
      })
      .filter((review) => Boolean(review.comment && review.comment.trim().length > 0)) ?? []

  return { status: "success", reviews: normalized }
}

export async function listStudentReviews(params: {
  studentId: string
  limit?: number
  offset?: number
}): Promise<{
  status: "success" | "error"
  message?: string
  reviews?: ReviewWithProfile<StudentReviewRow>[]
}> {
  const supabase = await createClient()
  const limit = params.limit ?? 10
  const from = params.offset ?? 0
  const to = from + limit - 1

  const { data, error } = await supabase
    .from("student_reviews")
    .select(
      `
        id,
        rating,
        comment,
        created_at,
        teacher_id,
        teacher:profiles!student_reviews_teacher_id_fkey (
          id,
          name,
          profile_picture_url
        )
      `,
    )
    .eq("student_id", params.studentId)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return { status: "error", message: "No se pudieron cargar las reseñas del estudiante" }
  }

  const normalized =
    data
      ?.map((row) => {
        const { teacher, ...rest } = row as unknown as {
          teacher_id: string
          teacher?: { id?: string | null; name?: string | null; profile_picture_url?: string | null }
          comment: string | null
          rating: number | null
          created_at: string
          id: string
          task_id: string | null
          student_id: string
        }
        return {
          ...rest,
          reviewer: {
            id: teacher?.id ?? row.teacher_id,
            name: teacher?.name ?? "Docente",
            avatar: teacher?.profile_picture_url ?? null,
          },
        }
      })
      .filter((review) => Boolean(review.comment && review.comment.trim().length > 0)) ?? []

  return { status: "success", reviews: normalized }
}

export async function getMyTeacherReview(teacherId: string): Promise<{
  status: "success" | "error"
  message?: string
  review?: TeacherReviewRow | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data, error } = await supabase
    .from("teacher_reviews")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { status: "error", message: "No se pudo obtener tu reseña" }
  }

  return { status: "success", review: data ?? null }
}

export async function getMyStudentReview(studentId: string): Promise<{
  status: "success" | "error"
  message?: string
  review?: StudentReviewRow | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data, error } = await supabase
    .from("student_reviews")
    .select("*")
    .eq("student_id", studentId)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { status: "error", message: "No se pudo obtener tu reseña" }
  }

  return { status: "success", review: data ?? null }
}
