import type { PaymentRepository, PendingPayment } from "@/domain/payments"

export async function listPendingPayments(
  paymentsRepo: PaymentRepository,
): Promise<PendingPayment[]> {
  return paymentsRepo.listPendingPayments()
}
