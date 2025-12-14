'use server'

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { getMinioClient } from "@/utils/minio/client"
import { markLessonCompleted as markLessonCompletedUC } from "@/application/enrollments/markLessonCompleted"
import { startPurchase as startPurchaseUC } from "@/application/enrollments/startPurchase"
import { createCourse as createCourseUC } from "@/application/courses/createCourse"
import { publishCourse as publishCourseUC } from "@/application/courses/publishCourse"
import { createModule as createModuleUC } from "@/application/courses/createModule"
import { createLesson as createLessonUC } from "@/application/courses/createLesson"
import { updateCourseDetails as updateCourseDetailsUC } from "@/application/courses/updateCourseDetails"
import { updateModuleDetails } from "@/application/courses/updateModule"
import { updateLessonDetails } from "@/application/courses/updateLesson"
import { deleteModuleById } from "@/application/courses/deleteModule"
import { deleteLessonById } from "@/application/courses/deleteLesson"
import { verifyCoursePayment as verifyCoursePaymentUC } from "@/application/payments/verifyCoursePayment"
import type { StartPurchaseResult } from "@/domain/enrollments"
import { makeCoursesRepository } from "@/infrastructure/supabase/courses-repo"
import {
  makeEnrollmentsRepository,
  makeLessonProgressRepository,
} from "@/infrastructure/supabase/enrollments-repo"
import { makePaymentsRepository } from "@/infrastructure/supabase/payments-repo"
import {
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  deleteLessonSchema,
  deleteModuleSchema,
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

type ActionState = StartPurchaseResult

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

  const enrollmentsRepo = makeEnrollmentsRepository(supabase)
  const result = await startPurchaseUC(
    {
      ...payload,
      studentId: userResult.user.id,
    },
    { enrollmentsRepo },
  )

  if (result.status === "success") {
    revalidatePath("/workspace/mis-cursos")
    revalidatePath(`/workspace/cursos/${payload.courseId}`)
  }

  return result
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

  const repo = makeCoursesRepository(supabase)
  const result = await createCourseUC(
    {
      teacherId: userResult.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      coverUrl: parsed.data.coverUrl,
    },
    { coursesRepo: repo },
  )

  if (result.status === "error") {
    return { status: "error", message: result.message }
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

  const repo = makeCoursesRepository(supabase)
  const teacherId = await repo.getCourseTeacher(courseId)
  if (!teacherId) return { status: "error", message: "Curso no encontrado" }

  if (teacherId !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No puedes publicar este curso" }
  }

  const result = await publishCourseUC(courseId, { coursesRepo: repo })
  if (result.status === "error") {
    return { status: "error", message: result.message }
  }
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

  const repo = makeCoursesRepository(supabase)
  const teacherId = await repo.getCourseTeacher(parsed.data.courseId)
  if (!teacherId || teacherId !== userResult.user.id) {
    return { status: "error", message: "No autorizado" }
  }

  const result = await createModuleUC(
    {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      position: parsed.data.position,
    },
    { coursesRepo: repo },
  )

  if (result.status === "error") {
    return { status: "error", message: result.message }
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

  const repo = makeCoursesRepository(supabase)
  const result = await createLessonUC(
    {
      moduleId: parsed.data.moduleId,
      title: parsed.data.title,
      contentType: parsed.data.contentType || (file ? file.type : null),
      contentUrl,
      textContent: parsed.data.textContent,
      durationMinutes: parsed.data.durationMinutes,
      position: parsed.data.position,
      passScore: parsed.data.passScore,
      questions: parsed.data.questions,
    },
    { coursesRepo: repo },
  )

  if (result.status === "error") {
    return { status: "error", message: result.message }
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()
  const repo = makeCoursesRepository(supabase)
  const teacherId = await repo.getCourseTeacher(parsed.data.id)

  if (!teacherId) return { status: "error", message: "Curso no encontrado" }

  if (teacherId !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const result = await updateCourseDetailsUC(
    {
      ...parsed.data,
      description: parsed.data.description ?? null,
      status: parsed.data.status ?? "draft",
    },
    { coursesRepo: repo },
  )
  if (result.status === "error") {
    return { status: "error", message: result.message }
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

  const coursesRepo = makeCoursesRepository(supabase)
  const moduleData = await coursesRepo.getModuleWithCourse(parsed.data.id)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (!moduleData) return { status: "error", message: "Modulo no encontrado" }
  if (moduleData.courseTeacherId !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const result = await updateModuleDetails({ ...parsed.data, description: parsed.data.description ?? null }, { coursesRepo })
  if (result.status === "error") {
    return { status: "error", message: result.message }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleData.courseId}`)
  return { status: "success", message: "Modulo actualizado" }
}

export async function deleteModule(payload: DeleteModuleInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = deleteModuleSchema.safeParse(payload)
  if (!parsed.success) return { status: "error", message: "Modulo no valido" }

  const coursesRepo = makeCoursesRepository(supabase)
  const moduleData = await coursesRepo.getModuleWithCourse(parsed.data.id)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (!moduleData) return { status: "error", message: "Modulo no encontrado" }
  if (moduleData.courseTeacherId !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  const result = await deleteModuleById(parsed.data.id, { coursesRepo })
  if (result.status === "error") {
    return { status: "error", message: result.message }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${moduleData.courseId}`)
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

  const coursesRepo = makeCoursesRepository(supabase)
  const lesson = await coursesRepo.getLessonWithCourse(parsed.data.id)
  if (!lesson) return { status: "error", message: "Leccion no encontrada" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()
  if (lesson.courseTeacherId !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  let contentUrl = parsed.data.contentUrl ?? lesson.contentUrl ?? null
  if (file && file.size > 0) {
    // Delete the old file from MinIO if it exists
    if (lesson.contentUrl) {
      await deleteLessonAsset(lesson.contentUrl)
    }

    // Upload the new file
    contentUrl = await uploadLessonAsset(file, userResult.user.id)
  }

  const contentType = parsed.data.contentType || (file ? file.type : lesson.contentType) || null
  const durationMinutes =
    typeof parsed.data.durationMinutes === "number" ? parsed.data.durationMinutes : lesson.durationMinutes

  const result = await updateLessonDetails(
    {
      id: parsed.data.id,
      title: parsed.data.title,
      contentType,
      contentUrl,
      textContent: parsed.data.textContent ?? lesson.textContent,
      durationMinutes,
      passScore: parsed.data.passScore ?? lesson.passScore,
      questions: parsed.data.questions,
    },
    { coursesRepo },
  )

  if (result.status === "error") {
    return { status: "error", message: result.message }
  }

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${lesson.courseId}`)
  return { status: "success", message: "Leccion actualizada" }
}

export async function deleteLesson(payload: DeleteLessonInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const parsed = deleteLessonSchema.safeParse(payload)
  if (!parsed.success) return { status: "error", message: "Leccion no valida" }

  const coursesRepo = makeCoursesRepository(supabase)
  const lesson = await coursesRepo.getLessonWithCourse(parsed.data.id)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).single()

  if (!lesson) return { status: "error", message: "Leccion no encontrada" }

  if (lesson.courseTeacherId !== userResult.user.id && profile?.role !== "admin") {
    return { status: "error", message: "No autorizado" }
  }

  // Delete the file from MinIO if it exists
  if (lesson.contentUrl) {
    await deleteLessonAsset(lesson.contentUrl)
  }

  const result = await deleteLessonById(parsed.data.id, { coursesRepo })
  if (result.status === "error") return result

  revalidatePath("/workspace/mis-cursos")
  revalidatePath(`/workspace/mis-cursos/${lesson.courseId}`)
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
  const paymentsRepo = makePaymentsRepository(supabase)

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

  const payments = await paymentsRepo.listPendingPayments()
  return payments.map((payment) => ({
    id: payment.id,
    method: payment.method,
    status: payment.status,
    proof_url: payment.proofUrl,
    proof_url_signed: payment.proofUrlSigned ?? null,
    created_at: payment.createdAt,
    enrollment: {
      id: payment.enrollment.id,
      status: payment.enrollment.status,
      course_id: payment.enrollment.courseId,
      paid_amount: payment.enrollment.paidAmount,
      student: payment.enrollment.student,
      course: payment.enrollment.course
        ? {
            ...payment.enrollment.course,
            teacher: payment.enrollment.course.teacher
              ? {
                  ...payment.enrollment.course.teacher,
                  email: payment.enrollment.course.teacher.email ?? "",
                }
              : null,
          }
        : payment.enrollment.course,
    },
  }))
}

/**
 * Agrega pagos verificados a un payout y marca payments.payout_id.
 */
export async function payOutTeacher(teacherId: string): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const paymentsRepo = makePaymentsRepository(supabase)

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

  const eligible = await paymentsRepo.getVerifiedPaymentsForTeacher(teacherId)

  if (eligible.length === 0) {
    return { status: "error", message: "No hay pagos verificados pendientes para este docente" }
  }

  const amount = eligible.reduce((acc, curr) => acc + (curr?.paidAmount || 0), 0)

  const payout = await paymentsRepo.createPayout(teacherId, amount)

  const paymentIds = eligible.map((p) => p?.id).filter(Boolean) as string[]

  await paymentsRepo.linkPaymentsToPayout(paymentIds, payout.id)

  revalidatePath("/admin/courses/payouts")

  return { status: "success", message: "Payout registrado y pagos marcados" }
}

/**
 * Marca un pago como verificado y activa la inscripcion.
 */
export async function verifyCoursePayment(paymentId: string): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const paymentsRepo = makePaymentsRepository(supabase)

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

  const result = await verifyCoursePaymentUC(paymentId, user.id, { paymentsRepo })
  if (result.status === "error") {
    return { status: "error", message: result.message }
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
  const paymentsRepo = makePaymentsRepository(supabase)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { payments: [], error: "No autenticado" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return { payments: [], error: "No autorizado" }
  }

  const payments = await paymentsRepo.listTeacherPayments(user.id)
  return { payments }
}

export async function getCoursePaymentsInCustody(): Promise<CoursePaymentInCustody[]> {
  const supabase = await createClient()
  const paymentsRepo = makePaymentsRepository(supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return []

  return paymentsRepo.listPaymentsInCustody()
}

/** 
 * Marca leccion como completada para una inscripcion activa.
 */
export async function markLessonCompleted(payload: MarkLessonInput): Promise<PurchaseFormState> {
  const supabase = await createClient()
  const { data: userResult } = await supabase.auth.getUser()
  if (!userResult.user) return { status: "error", message: "No autenticado" }

  const progressRepo = makeLessonProgressRepository(supabase)
  const result = await markLessonCompletedUC(
    { lessonId: payload.lessonId, studentId: userResult.user.id },
    { progressRepo },
  )

  if (result.status === "success") {
    revalidatePath(`/workspace/cursos/${result.courseId}`)
  }

  return { status: result.status, message: result.message }
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
    return { status: "error", message: "InscripciÃƒÂ³n no encontrada" }
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
    return { status: "error", message: "No pudimos activar la inscripciÃƒÂ³n" }
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
    return { status: "error", message: "No pudimos rechazar la inscripciÃƒÂ³n" }
  }

  revalidatePath("/admin/transactions")
  revalidatePath("/workspace/mis-cursos")

  return { status: "success", message: "Pago rechazado." }
}
