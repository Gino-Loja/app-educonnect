'use server'

import { revalidatePath } from "next/cache"

import { getMinioClient } from "@/utils/minio/client"
import { createClient } from "@/utils/supabase/server"
import {
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  deleteLessonSchema,
  deleteModuleSchema,
  markLessonSchema,
  startPurchaseSchema,
  updateCourseSchema,
  updateLessonSchema,
  updateModuleSchema,
  type CreateCourseInput,
  type CreateLessonInput,
  type CreateModuleInput,
  type DeleteLessonInput,
  type DeleteModuleInput,
  type MarkLessonInput,
  type StartPurchaseInput,
  type UpdateCourseInput,
  type UpdateLessonInput,
  type UpdateModuleInput,
} from "@/lib/validation/course-schema"

type ActionState =
  | { status: "error"; message: string }
  | { status: "success"; message: string; enrollmentId: string; paymentId: string }

export type PurchaseFormState =
  | { status: "idle"; message?: string }
  | { status: "error"; message: string }
  | { status: "success"; message: string }

export type PendingCoursePayment = {
  id: string
  method: string
  status: string
  proof_url: string | null
  proof_url_signed?: string | null
  created_at: string
  enrollment: {
    id: string
    status: string
    course_id: string
    paid_amount: number
    student: { id: string; name: string | null; email: string }
    course: {
      id: string
      title: string
      price: number
      teacher: { id: string; name: string | null; email: string } | null
    }
  }
}

export type CourseModuleWithLessons = {
  id: string
  title: string
  description: string | null
  position: number
  lessons: {
    id: string
    title: string
    position: number
    content_type: string | null
    content_url: string | null
    text_content?: string | null
    duration_minutes: number | null
    signed_url?: string | null
    completed?: boolean
    pass_score?: number | null
    questions?: {
      id: string
      type: "multiple_choice" | "true_false"
      prompt: string
      options?: string[] | null
      correctAnswer?: string | null
      feedback?: string | null
      position?: number | null
    }[]
  }[]
}

export type TeacherCoursePayment = {
  id: string
  status: string
  payout_id?: string | null
  method: string | null
  created_at: string
  verified_at?: string | null
  enrollment: {
    id: string
    status: string
    student?: { id: string; name: string | null; email: string | null }
    course?: {
      id: string
      title: string
      price: number
      teacher_id: string | null
      teacher?: { id: string; name: string | null; email: string | null } | null
    } | null
  } | null
}

export type CoursePaymentInCustody = TeacherCoursePayment

const COURSE_PROOF_BUCKET = process.env.MINIO_COURSE_PROOF_BUCKET || "course-proofs"
const MAX_PROOF_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const COURSE_ASSETS_BUCKET = process.env.MINIO_COURSE_ASSETS_BUCKET || "course-assets"
const MAX_ASSET_SIZE_BYTES = 200 * 1024 * 1024 // 200MB for videos/docs
const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024 // 10MB portada

function sanitizeFileName(name: string) {
  return (name || "comprobante").replace(/[^a-zA-Z0-9._-]/g, "_")
}

async function uploadProofToMinio(file: File, userId: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (file.size > MAX_PROOF_SIZE_BYTES) {
    throw new Error("El comprobante supera el tamano permitido (10MB)")
  }

  const minio = getMinioClient()

  const bucketExists = await minio.bucketExists(COURSE_PROOF_BUCKET).catch(() => false)
  if (!bucketExists) {
    await minio.makeBucket(COURSE_PROOF_BUCKET, "")
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const objectName = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`

  await minio.putObject(COURSE_PROOF_BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": file.type || "application/octet-stream",
  })

  // Guardamos solo la ruta para firmarla luego
  return objectName
}

async function getSignedProofUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  if (path.startsWith("http")) return path

  const minio = getMinioClient()
  const objectName = path.startsWith(`${COURSE_PROOF_BUCKET}/`)
    ? path.replace(`${COURSE_PROOF_BUCKET}/`, "")
    : path

  try {
    return await minio.presignedGetObject(COURSE_PROOF_BUCKET, objectName, 60 * 60) // 1h
  } catch {
    return null
  }
}

async function uploadLessonAsset(file: File, userId: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Archivo invalido")
  }
  if (file.size > MAX_ASSET_SIZE_BYTES) {
    throw new Error("El archivo supera el limite de 200MB")
  }

  const minio = getMinioClient()
  const bucketExists = await minio.bucketExists(COURSE_ASSETS_BUCKET).catch(() => false)
  if (!bucketExists) {
    await minio.makeBucket(COURSE_ASSETS_BUCKET, "")
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const objectName = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`

  await minio.putObject(COURSE_ASSETS_BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": file.type || "application/octet-stream",
  })

  return objectName
}

/**
 * Deletes a file from MinIO course assets bucket
 * @param objectName - The object name/path in MinIO (e.g., "userId/timestamp-filename.mp4")
 * @returns true if deleted successfully, false otherwise
 */
async function deleteLessonAsset(objectName: string | null): Promise<boolean> {
  if (!objectName) return false
  if (objectName.startsWith("http")) return false // External URL, not in MinIO

  try {
    const minio = getMinioClient()
    const cleanObjectName = objectName.startsWith(`${COURSE_ASSETS_BUCKET}/`)
      ? objectName.replace(`${COURSE_ASSETS_BUCKET}/`, "")
      : objectName

    await minio.removeObject(COURSE_ASSETS_BUCKET, cleanObjectName)
    return true
  } catch (error) {
    console.error("Error deleting lesson asset from MinIO:", error)
    return false
  }
}

export async function signLessonUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  if (path.startsWith("http")) return path

  const minio = getMinioClient()
  const objectName = path.startsWith(`${COURSE_ASSETS_BUCKET}/`)
    ? path.replace(`${COURSE_ASSETS_BUCKET}/`, "")
    : path

  try {
    return await minio.presignedGetObject(COURSE_ASSETS_BUCKET, objectName, 60 * 60) // 1h
  } catch {
    return null
  }
}

async function uploadCourseCover(file: File, userId: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Portada invalida")
  }
  if (file.size > MAX_COVER_SIZE_BYTES) {
    throw new Error("La portada supera el limite de 10MB")
  }
  const minio = getMinioClient()
  const bucketExists = await minio.bucketExists(COURSE_ASSETS_BUCKET).catch(() => false)
  if (!bucketExists) {
    await minio.makeBucket(COURSE_ASSETS_BUCKET, "")
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const objectName = `${userId}/cover-${Date.now()}-${sanitizeFileName(file.name)}`
  await minio.putObject(COURSE_ASSETS_BUCKET, objectName, buffer, buffer.length, {
    "Content-Type": file.type || "application/octet-stream",
  })
  return objectName
}

export async function uploadCourseCoverFile(file: File, userId: string) {
  return uploadCourseCover(file, userId)
}

export async function uploadLessonAssetFile(file: File, userId: string) {
  return uploadLessonAsset(file, userId)
}

/**
 * Crea una inscripcion pendiente y un pago pendiente para un curso.
 * - Solo estudiantes (role=student) o admin pueden iniciar.
 * - Bloquea compra si ya hay enrollment pending/active.
 */
export async function startPurchase(payload: StartPurchaseInput): Promise<ActionState> {
  const supabase = await createClient()

  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError || !userResult.user) {
    return { status: "error", message: "No autenticado" }
  }

  const parsed = startPurchaseSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }
  const { courseId, method, proofUrl, notes } = parsed.data

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .single()

  if (profileError || !profile) {
    return { status: "error", message: "No pudimos validar tu perfil" }
  }

  const isAdmin = profile.role === "admin"
  if (!isAdmin && profile.role !== "student") {
    return { status: "error", message: "Solo estudiantes pueden comprar cursos" }
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, status, teacher_id, price")
    .eq("id", courseId)
    .single()

  if (courseError || !course) {
    return { status: "error", message: "Curso no encontrado" }
  }

  if (course.status === "draft") {
    return { status: "error", message: "El curso no esta disponible para compra" }
  }

  const { data: existingEnrollment, error: existingError } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("course_id", courseId)
    .eq("student_id", userResult.user.id)
    .in("status", ["pending", "active"])
    .maybeSingle()

  if (existingError && (existingError as { code?: string }).code !== "PGRST116") {
    return { status: "error", message: "No pudimos verificar tu inscripcion" }
  }

  if (existingEnrollment) {
    return { status: "error", message: "Ya tienes una inscripcion en curso para este curso" }
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .insert({
      course_id: courseId,
      student_id: userResult.user.id,
      status: "pending",
      paid_amount: 0,
      proof_url: proofUrl,
      notes,
    })
    .select("id")
    .single()

  if (enrollmentError || !enrollment) {
    console.error("Error creating enrollment", enrollmentError)
    return { status: "error", message: "No pudimos registrar tu compra" }
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      enrollment_id: enrollment.id,
      method,
      status: "pending",
      proof_url: proofUrl,
    })
    .select("id")
    .single()

  if (paymentError || !payment) {
    console.error("Error creating payment", paymentError)
    return { status: "error", message: "No pudimos registrar tu pago" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/cursos/${courseId}`)

  return {
    status: "success",
    message: "Compra registrada. Un administrador verificara tu pago.",
    enrollmentId: enrollment.id,
    paymentId: payment.id,
  }
}

export async function createCourse(payload: CreateCourseInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError || !userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = createCourseSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .single()

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return { status: "error", message: "Solo docentes o admin pueden crear cursos" }
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: userResult.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      status: "draft",
      cover_url: parsed.data.coverUrl,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("Error creating course", error)
    return { status: "error", message: "No pudimos crear el curso" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath("/workspace/mis-cursos")
  return { status: "success", message: "Curso creado" }
}

export async function publishCourse(courseId: string): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .single()
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", courseId)
    .single()

  if (courseError || !course) return { status: "error", message: "Curso no encontrado" }
  if (course.teacher_id !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No puedes publicar este curso" }
  }

  const { error: updateError } = await supabase
    .from("courses")
    .update({ status: "published" })
    .eq("id", courseId)

  if (updateError) return { status: "error", message: "No pudimos publicar el curso" }
  revalidatePath("/workspace/mis-cursos")
  return { status: "success", message: "Curso publicado" }
}

export async function createModule(payload: CreateModuleInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = createModuleSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }

  const { data: course } = await supabase
    .from("courses")
    .select("teacher_id")
    .eq("id", parsed.data.courseId)
    .single()

  if (!course || (course.teacher_id !== userResult.user.id)) {
    return { status: "error", message: "No autorizado" }
  }

  const { error } = await supabase
    .from("course_modules")
    .insert({
      course_id: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      position: parsed.data.position ?? 1,
    })

  if (error) {
    console.error("Error creating module", error)
    return { status: "error", message: "No pudimos crear el modulo" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${parsed.data.courseId}`)
  return { status: "success", message: "Modulo creado" }
}

export async function createLesson(
  payload: CreateLessonInput,
  file?: File | null,
): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = createLessonSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }

  let contentUrl = parsed.data.contentUrl
  if (file && file.size > 0) {
    contentUrl = await uploadLessonAsset(file, userResult.user.id)
  }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, course_id, course:courses!inner(teacher_id)")
    .eq("id", parsed.data.moduleId)
    .single()

  if (moduleError || !moduleRow) {
    return { status: "error", message: "Modulo no encontrado" }
  }

  if (moduleRow.course.teacher_id !== userResult.user.id) {
    return { status: "error", message: "No autorizado" }
  }

  const { data: lessonRow, error } = await supabase
    .from("lessons")
    .insert({
      module_id: parsed.data.moduleId,
      title: parsed.data.title,
      content_type: parsed.data.contentType || (file ? file.type : null),
      content_url: contentUrl,
      text_content: parsed.data.textContent,
      duration_minutes: parsed.data.durationMinutes,
      position: parsed.data.position,
      pass_score: parsed.data.passScore,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating lesson", error)
    return { status: "error", message: "No pudimos crear la leccion" }
  }

  if (lessonRow && (parsed.data.questions || []).length) {
    const questionsPayload = (parsed.data.questions || [])
      .filter((q) => (q.prompt || "").trim().length > 0)
      .map((q, idx) => ({
        lesson_id: lessonRow.id,
        question_type: q.type,
        prompt: q.prompt,
        options: q.options && q.options.length ? q.options : q.type === "true_false" ? ["Verdadero", "Falso"] : null,
        correct_answer: q.correctAnswer || (q.type === "true_false" ? "Verdadero" : q.options?.[0] || null),
        feedback: q.feedback || null,
        position: q.position ?? idx + 1,
      }))
    if (questionsPayload.length) {
      await supabase.from("lesson_questions").insert(questionsPayload)
    }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleRow.course_id}`)
  return { status: "success", message: "Leccion creada" }
}

export async function updateCourseDetails(payload: UpdateCourseInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = updateCourseSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }

  const { data: courseRow, error: courseError } = await supabase
    .from("courses")
    .select("teacher_id")
    .eq("id", parsed.data.id)
    .single()
  if (courseError || !courseRow) return { status: "error", message: "Curso no encontrado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (courseRow.teacher_id !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const { error } = await supabase
    .from("courses")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      cover_url: parsed.data.coverUrl,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.id)

  if (error) {
    console.error("Error updating course", error)
    return { status: "error", message: "No pudimos actualizar el curso" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${parsed.data.id}`)
  return { status: "success", message: "Curso actualizado" }
}

export async function updateModule(payload: UpdateModuleInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = updateModuleSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, course_id, course:courses!inner(teacher_id)")
    .eq("id", parsed.data.id)
    .single()

  if (moduleError || !moduleRow) return { status: "error", message: "Modulo no encontrado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (moduleRow.course.teacher_id !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const { error } = await supabase
    .from("course_modules")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .eq("id", parsed.data.id)

  if (error) {
    console.error("Error updating module", error)
    return { status: "error", message: "No pudimos actualizar el modulo" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleRow.course_id}`)
  return { status: "success", message: "Modulo actualizado" }
}

export async function deleteModule(payload: DeleteModuleInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = deleteModuleSchema.safeParse(payload)
  if (!parsed.success) return { status: "error", message: "Modulo no valido" }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, course_id, course:courses!inner(teacher_id)")
    .eq("id", parsed.data.id)
    .single()
  if (moduleError || !moduleRow) return { status: "error", message: "Modulo no encontrado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (moduleRow.course.teacher_id !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const { error: deleteLessonsError } = await supabase.from("lessons").delete().eq("module_id", moduleRow.id)
  if (deleteLessonsError) {
    console.error("Error deleting module lessons", deleteLessonsError)
    return { status: "error", message: "No pudimos eliminar las lecciones del modulo" }
  }

  const { error } = await supabase.from("course_modules").delete().eq("id", moduleRow.id)
  if (error) {
    console.error("Error deleting module", error)
    return { status: "error", message: "No pudimos eliminar el modulo" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleRow.course_id}`)
  return { status: "success", message: "Modulo eliminado" }
}

export async function updateLesson(
  payload: UpdateLessonInput,
  file?: File | null,
): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = updateLessonSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message: msg }
  }

  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .select("id, module_id, content_url, content_type, duration_minutes, pass_score")
    .eq("id", parsed.data.id)
    .single()
  if (lessonError || !lessonRow) return { status: "error", message: "Leccion no encontrada" }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, course_id, course:courses!inner(teacher_id)")
    .eq("id", lessonRow.module_id)
    .single()
  if (moduleError || !moduleRow) return { status: "error", message: "Modulo no encontrado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (moduleRow.course.teacher_id !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  let contentUrl = parsed.data.contentUrl ?? lessonRow.content_url ?? null
  if (file && file.size > 0) {
    // Delete the old file from MinIO if it exists
    if (lessonRow.content_url) {
      await deleteLessonAsset(lessonRow.content_url)
    }

    // Upload the new file
    contentUrl = await uploadLessonAsset(file, userResult.user.id)
  }

  const contentType = parsed.data.contentType || (file ? file.type : lessonRow.content_type) || null
  const durationMinutes =
    typeof parsed.data.durationMinutes === "number" ? parsed.data.durationMinutes : lessonRow.duration_minutes

  const { error } = await supabase
    .from("lessons")
    .update({
      title: parsed.data.title,
      content_type: contentType,
      content_url: contentUrl,
      text_content: parsed.data.textContent,
      duration_minutes: durationMinutes,
      pass_score: parsed.data.passScore ?? lessonRow.pass_score,
    })
    .eq("id", parsed.data.id)

  if (error) {
    console.error("Error updating lesson", error)
    return { status: "error", message: "No pudimos actualizar la leccion" }
  }

  if (parsed.data.questions !== undefined) {
    await supabase.from("lesson_questions").delete().eq("lesson_id", lessonRow.id)
    const questionsPayload = (parsed.data.questions || [])
      .filter((q) => (q.prompt || "").trim().length > 0)
      .map((q, idx) => ({
        lesson_id: lessonRow.id,
        question_type: q.type,
        prompt: q.prompt,
        options: q.options && q.options.length ? q.options : q.type === "true_false" ? ["Verdadero", "Falso"] : null,
        correct_answer: q.correctAnswer || (q.type === "true_false" ? "Verdadero" : q.options?.[0] || null),
        feedback: q.feedback || null,
        position: q.position ?? idx + 1,
      }))
    if (questionsPayload.length) {
      await supabase.from("lesson_questions").insert(questionsPayload)
    }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleRow.course_id}`)
  return { status: "success", message: "Leccion actualizada" }
}

export async function deleteLesson(payload: DeleteLessonInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = deleteLessonSchema.safeParse(payload)
  if (!parsed.success) return { status: "error", message: "Leccion no valida" }

  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .select("id, module_id, content_url")
    .eq("id", parsed.data.id)
    .single()
  if (lessonError || !lessonRow) return { status: "error", message: "Leccion no encontrada" }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, course_id, course:courses!inner(teacher_id)")
    .eq("id", lessonRow.module_id)
    .single()
  if (moduleError || !moduleRow) return { status: "error", message: "Modulo no encontrado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (moduleRow.course.teacher_id !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  // Delete the file from MinIO if it exists
  if (lessonRow.content_url) {
    await deleteLessonAsset(lessonRow.content_url)
  }

  const { error } = await supabase.from("lessons").delete().eq("id", parsed.data.id)
  if (error) {
    console.error("Error deleting lesson", error)
    return { status: "error", message: "No pudimos eliminar la leccion" }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleRow.course_id}`)
  return { status: "success", message: "Leccion eliminada" }
}

/**
 * Server action utilizada en el formulario de compra (maneja upload opcional).
 */
export async function submitCoursePurchase(
  prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const courseId = String(formData.get("courseId") || "")
  const method = (formData.get("method") as "transfer" | "efectivo" | null) || "transfer"
  const notes = (formData.get("notes") as string | null) || undefined
  const file = formData.get("proof") as File | null

  let proofUrl: string | undefined

  try {
    const supabase = await createClient()
    const { data: userResult, error: userError } = await supabase.auth.getUser()
    if (userError || !userResult.user) {
      return { status: "error", message: "Debes iniciar sesion para comprar" }
    }

    if (file && file.size > 0) {
      proofUrl = (await uploadProofToMinio(file, userResult.user.id)) ?? undefined
    }

    const result = await startPurchase({ courseId, method, notes, proofUrl })
    if (result.status === "error") {
      return { status: "error", message: result.message }
    }

    return { status: "success", message: "Compra enviada. Revisaremos tu comprobante." }
  } catch (error) {
    console.error("submitCoursePurchase error", error)
    const message = error instanceof Error ? error.message : "Error al procesar la compra"
    return { status: "error", message }
  }
}

/**
 * Pagos pendientes para que el admin los verifique.
 */
export async function getPendingCoursePayments(): Promise<PendingCoursePayment[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return []

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      method,
      status,
      proof_url,
      created_at,
      enrollment:enrollments!payments_enrollment_id_fkey (
        id,
        status,
        course_id,
        paid_amount,
        student:profiles!enrollments_student_id_fkey (
          id,
          name,
          email
        ),
        course:courses!enrollments_course_id_fkey (
          id,
          title,
          price,
          teacher:profiles!courses_teacher_id_fkey (
            id,
            name,
            email
          )
        )
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (error || !data) {
    console.error("Error fetching pending course payments", error)
    return []
  }

  const payments = data as PendingCoursePayment[]
  const withSigned = await Promise.all(
    payments.map(async (payment) => ({
      ...payment,
      proof_url_signed: await getSignedProofUrl(payment.proof_url),
    })),
  )

  return withSigned
}

/**
 * Agrega pagos verificados a un payout y marca payments.payout_id.
 */
export async function payOutTeacher(teacherId: string): Promise<PurchaseFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { status: "error", message: "Solo administradores pueden registrar pagos a docentes" }
  }

  if (!teacherId) {
    return { status: "error", message: "Docente invalido" }
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      id,
      status,
      payout_id,
      enrollment:enrollments!payments_enrollment_id_fkey (
        paid_amount,
        course:courses!enrollments_course_id_fkey (
          teacher_id
        )
      )
    `)
    .eq("status", "verified")
    .is("payout_id", null)

  if (error || !payments) {
    console.error("Error fetching payments for payout", error)
    return { status: "error", message: "No pudimos calcular el pago" }
  }

  const eligible = payments.filter(
    (p) => p.enrollment?.course?.teacher_id === teacherId,
  )

  if (eligible.length === 0) {
    return { status: "error", message: "No hay pagos verificados pendientes para este docente" }
  }

  const amount = eligible.reduce(
    (acc, curr) => acc + (curr.enrollment?.paid_amount || 0),
    0,
  )

  const { data: payout, error: payoutError } = await supabase
    .from("payouts")
    .insert({
      teacher_id: teacherId,
      amount,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (payoutError || !payout) {
    console.error("Error creating payout", payoutError)
    return { status: "error", message: "No pudimos registrar el payout" }
  }

  const paymentIds = eligible.map((p) => p.id)

  const { error: updatePaymentsError } = await supabase
    .from("payments")
    .update({ payout_id: payout.id })
    .in("id", paymentIds)

  if (updatePaymentsError) {
    console.error("Error linking payments to payout", updatePaymentsError)
    return { status: "error", message: "Payout creado, pero no pudimos asociar los pagos" }
  }

  revalidatePath("/admin/courses/payouts")

  return { status: "success", message: "Payout registrado y pagos marcados" }
}

/**
 * Marca un pago como verificado y activa la inscripcion.
 */
export async function verifyCoursePayment(paymentId: string): Promise<PurchaseFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") {
    return { status: "error", message: "Solo administradores pueden verificar pagos" }
  }

  if (!paymentId) {
    return { status: "error", message: "ID de pago invalido" }
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(`
      id,
      status,
      enrollment:enrollments!payments_enrollment_id_fkey (
        id,
        status,
        course_id,
        student_id,
        course:courses!enrollments_course_id_fkey (
          id,
          price
        )
      )
    `)
    .eq("id", paymentId)
    .single()

  if (paymentError || !payment) {
    return { status: "error", message: "Pago no encontrado" }
  }

  if (payment.status !== "pending") {
    return { status: "error", message: "El pago ya fue procesado" }
  }

  const enrollmentId = payment.enrollment?.id
  const coursePrice = payment.enrollment?.course?.price ?? 0

  const { error: updatePaymentError } = await supabase
    .from("payments")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", paymentId)

  if (updatePaymentError) {
    console.error("Error updating payment", updatePaymentError)
    return { status: "error", message: "No pudimos actualizar el pago" }
  }

  if (enrollmentId) {
    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .update({
        status: "active",
        paid_amount: coursePrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollmentId)

    if (enrollmentError) {
      console.error("Error activating enrollment", enrollmentError)
      return { status: "error", message: "Pago verificado, pero no pudimos activar la inscripcion" }
    }
  }

  revalidatePath("/admin/courses/payments")
  revalidatePath("/workspace/mis-cursos")

  return { status: "success", message: "Pago verificado y inscripcion activada" }
}

/**
 * Obtiene modulos y lecciones con URLs firmadas y progreso opcional.
 */
export async function getCourseModulesWithLessons(
  courseId: string,
  enrollmentId?: string,
): Promise<CourseModuleWithLessons[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_modules")
    .select(
      `
        id,
        title,
        description,
        position,
        lessons:lessons (
          id,
          title,
          position,
          content_type,
        content_url,
        text_content,
        pass_score,
        duration_minutes,
        lesson_questions (
          id,
          question_type,
          prompt,
            options,
            correct_answer,
            feedback,
            position
          )
        )
      `,
    )
    .eq("course_id", courseId)
    .order("position", { ascending: true })

  if (error || !data) return []

  type LessonRow = {
    id: string
    title: string
    position: number
    content_type: string | null
    content_url: string | null
    text_content?: string | null
    duration_minutes: number | null
    pass_score?: number | null
    lesson_questions?: {
      id: string
      question_type: "multiple_choice" | "true_false"
      prompt: string
      options?: string[] | null
      correct_answer?: string | null
      feedback?: string | null
      position?: number | null
    }[]
  }

  type ModuleRow = {
    id: string
    title: string
    description: string | null
    position: number
    lessons: LessonRow[]
  }

  const modules = data as ModuleRow[]

  const completedIds: string[] = []
  if (enrollmentId) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("enrollment_id", enrollmentId)
    progress?.forEach((p) => completedIds.push(p.lesson_id))
  }

  return Promise.all(
    modules.map(async (module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      position: module.position,
      lessons: await Promise.all(
        (module.lessons || []).map(async (lesson) => ({
          ...lesson,
          signed_url: await signLessonUrl(lesson.content_url),
          questions: (lesson.lesson_questions || []).map((q, idx) => ({
            id: q.id,
            type: q.question_type === "true_false" ? "true_false" : "multiple_choice",
            prompt: q.prompt,
            options:
              q.question_type === "true_false"
                ? ["Verdadero", "Falso"]
                : q.options && q.options.length
                  ? q.options
                  : ["", "", "", ""],
            correctAnswer:
              q.correct_answer ||
              (q.question_type === "true_false" ? "Verdadero" : q.options?.[0] || ""),
            feedback: q.feedback || "",
            position: q.position ?? idx + 1,
          })),
          pass_score: lesson.pass_score ?? null,
          completed: completedIds.includes(lesson.id),
        })),
      ),
    })),
  )
}

/**
 * Pagos asociados a cursos de un docente (teacher).
 */
export async function getTeacherCoursePayments(): Promise<{ payments: TeacherCoursePayment[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { payments: [], error: "No autenticado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return { payments: [], error: "No autorizado" }
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        id,
        status,
        payout_id,
        method,
        created_at,
        verified_at,
        enrollment:enrollments!payments_enrollment_id_fkey (
          id,
          status,
          student:profiles!enrollments_student_id_fkey (
            id,
            name,
            email
          ),
          course:courses!enrollments_course_id_fkey (
            id,
            title,
            price,
            teacher_id
          )
        )
      `,
    )
    .eq("enrollment.course.teacher_id", user.id)
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.error("Error fetching teacher course payments", error)
    return { payments: [], error: "No pudimos obtener los pagos de tus cursos" }
  }

  return { payments: data as TeacherCoursePayment[] }
}

export async function getCoursePaymentsInCustody(): Promise<CoursePaymentInCustody[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        id,
        status,
        payout_id,
        method,
        created_at,
        verified_at,
        enrollment:enrollments!payments_enrollment_id_fkey (
          id,
          status,
          student:profiles!enrollments_student_id_fkey (
            id,
            name,
            email
          ),
          course:courses!enrollments_course_id_fkey (
            id,
            title,
            price,
            teacher_id,
            teacher:profiles!courses_teacher_id_fkey (
              id,
              name,
              email
            )
          )
        )
      `,
    )
    .eq("status", "verified")
    .is("payout_id", null)
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.error("Error fetching course payments in custody", error)
    return []
  }

  return data as CoursePaymentInCustody[]
}

/** 
 * Marca leccion como completada para una inscripcion activa.
 */
export async function markLessonCompleted(payload: MarkLessonInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = markLessonSchema.safeParse(payload)
  if (!parsed.success) {
    return { status: "error", message: "Datos invalidos" }
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id")
    .eq("id", parsed.data.lessonId)
    .single()

  if (!lesson) return { status: "error", message: "Leccion no encontrada" }

  const moduleId = (lesson as { module_id: string }).module_id

  const { data: moduleRow } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", moduleId)
    .single()
  if (!moduleRow) return { status: "error", message: "Modulo no encontrado" }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("course_id", moduleRow.course_id)
    .eq("student_id", userResult.user.id)
    .eq("status", "active")
    .single()

  if (!enrollment) {
    return { status: "error", message: "Necesitas una inscripcion activa para marcar progreso" }
  }

  const { error } = await supabase
    .from("lesson_progress")
    .insert({
      enrollment_id: enrollment.id,
      lesson_id: parsed.data.lessonId,
    })

  if (error && (error as { code?: string }).code !== "23505") {
    console.error("Error marking progress", error)
    return { status: "error", message: "No pudimos guardar el progreso" }
  }

  revalidatePath(`/workspace/cursos/${moduleRow.course_id}`)
  return { status: "success", message: "Leccion completada" }
}

/**
 * Approve a course payment and activate enrollment
 */
export async function approveCoursePayment(
  paymentId: string,
  enrollmentId: string,
): Promise<PurchaseFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { status: "error", message: "Solo administradores pueden aprobar pagos" }
  }

  // Get enrollment and course details
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      course:courses!enrollments_course_id_fkey (
        price
      )
    `)
    .eq("id", enrollmentId)
    .single()

  if (enrollmentError || !enrollment) {
    return { status: "error", message: "Inscripción no encontrada" }
  }

  // Update payment status to verified
  const { error: paymentError } = await supabase
    .from("payments")
    .update({ status: "verified" })
    .eq("id", paymentId)

  if (paymentError) {
    console.error("Error updating payment", paymentError)
    return { status: "error", message: "No pudimos actualizar el pago" }
  }

  // Update enrollment status to active and set paid amount
  const { error: enrollmentUpdateError } = await supabase
    .from("enrollments")
    .update({
      status: "active",
      paid_amount: enrollment.course.price,
    })
    .eq("id", enrollmentId)

  if (enrollmentUpdateError) {
    console.error("Error updating enrollment", enrollmentUpdateError)
    return { status: "error", message: "No pudimos activar la inscripción" }
  }

  revalidatePath("/admin/transactions")
  revalidatePath("/workspace/mis-cursos")

  return { status: "success", message: "Pago aprobado. El estudiante ahora tiene acceso al curso." }
}

/**
 * Reject a course payment
 */
export async function rejectCoursePayment(
  paymentId: string,
  enrollmentId: string,
  reason?: string,
): Promise<PurchaseFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { status: "error", message: "Solo administradores pueden rechazar pagos" }
  }

  // Update payment status to rejected
  const { error: paymentError } = await supabase
    .from("payments")
    .update({ status: "rejected" })
    .eq("id", paymentId)

  if (paymentError) {
    console.error("Error updating payment", paymentError)
    return { status: "error", message: "No pudimos actualizar el pago" }
  }

  // Update enrollment status to rejected
  const { error: enrollmentError } = await supabase
    .from("enrollments")
    .update({
      status: "rejected",
      notes: reason || "Pago rechazado por el administrador",
    })
    .eq("id", enrollmentId)

  if (enrollmentError) {
    console.error("Error updating enrollment", enrollmentError)
    return { status: "error", message: "No pudimos rechazar la inscripción" }
  }

  revalidatePath("/admin/transactions")
  revalidatePath("/workspace/mis-cursos")

  return { status: "success", message: "Pago rechazado." }
}
