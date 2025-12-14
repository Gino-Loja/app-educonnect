import type {
  EnrollmentsRepository,
  StartPurchaseCommand,
  StartPurchaseResult,
} from "@/domain/enrollments"
import { startPurchaseSchema } from "@/lib/validation/course-schema"

export async function startPurchase(
  input: StartPurchaseCommand,
  deps: { enrollmentsRepo: EnrollmentsRepository },
): Promise<StartPurchaseResult> {
  if (!input.studentId) {
    return { status: "error", message: "No autenticado" }
  }

  const parsed = startPurchaseSchema.safeParse({
    courseId: input.courseId,
    method: input.method,
    proofUrl: input.proofUrl,
    notes: input.notes,
  })

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  try {
    const role = await deps.enrollmentsRepo.getUserRole(input.studentId)
    if (!role) {
      return { status: "error", message: "No pudimos validar tu perfil" }
    }

    const isAdmin = role === "admin"
    if (!isAdmin && role !== "student") {
      return { status: "error", message: "Solo estudiantes pueden comprar cursos" }
    }

    const course = await deps.enrollmentsRepo.getCourseForPurchase(parsed.data.courseId)
    if (!course) {
      return { status: "error", message: "Curso no encontrado" }
    }

    if (course.status === "draft") {
      return { status: "error", message: "El curso no esta disponible para compra" }
    }

    const existingEnrollment = await deps.enrollmentsRepo.findExistingEnrollment(
      course.id,
      input.studentId,
    )
    if (existingEnrollment) {
      return {
        status: "error",
        message: "Ya tienes una inscripcion en curso para este curso",
      }
    }

    const enrollment = await deps.enrollmentsRepo.createPendingEnrollment({
      courseId: course.id,
      studentId: input.studentId,
      proofUrl: parsed.data.proofUrl,
      notes: parsed.data.notes,
    })

    const payment = await deps.enrollmentsRepo.createPaymentForEnrollment({
      enrollmentId: enrollment.id,
      method: parsed.data.method,
      proofUrl: parsed.data.proofUrl,
    })

    return {
      status: "success",
      message: "Compra registrada. Un administrador verificara tu pago.",
      enrollmentId: enrollment.id,
      paymentId: payment.id,
    }
  } catch (error) {
    console.error("startPurchase use-case error", error)
    return { status: "error", message: "No pudimos registrar tu compra" }
  }
}
