import type { PaymentRepository } from "@/domain/payments"

export type VerifyPaymentResult =
  | { status: "ok"; message: string }
  | { status: "error"; message: string }

export async function verifyCoursePayment(
  paymentId: string,
  adminId: string,
  deps: { paymentsRepo: PaymentRepository },
): Promise<VerifyPaymentResult> {
  if (!paymentId) {
    return { status: "error", message: "ID de pago invalido" }
  }
  const payment = await deps.paymentsRepo.getPaymentWithEnrollment(paymentId)
  if (!payment) {
    return { status: "error", message: "Pago no encontrado" }
  }
  if (payment.status !== "pending") {
    return { status: "error", message: "El pago ya fue procesado" }
  }

  await deps.paymentsRepo.markPaymentVerified(paymentId, adminId)

  if (payment.enrollment) {
    const { id: enrollmentId, coursePrice } = payment.enrollment
    await deps.paymentsRepo.activateEnrollment(enrollmentId, coursePrice)
  }

  return { status: "ok", message: "Pago verificado y inscripcion activada" }
}
