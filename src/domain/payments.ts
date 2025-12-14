export type PaymentStatus = "pending" | "verified" | "rejected" | "paid" | string
export type PaymentMethod = string

export type PaymentStudent = {
  id: string
  name: string | null
  email: string
}

export type PaymentTeacher = {
  id: string
  name: string | null
  email: string | null
}

export type PaymentCourse = {
  id: string
  title: string
  price: number
  teacher: PaymentTeacher | null
}

export type PaymentEnrollment = {
  id: string
  status: string
  courseId: string
  paidAmount: number
  student: PaymentStudent
  course: PaymentCourse
}

export type PendingPayment = {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  proofUrl: string | null
  proofUrlSigned?: string | null
  createdAt: string
  enrollment: PaymentEnrollment
}

export type PaymentWithEnrollment = {
  id: string
  status: PaymentStatus
  enrollment: {
    id: string
    courseId: string
    coursePrice: number
  } | null
}

export interface PaymentRepository {
  listPendingPayments(): Promise<PendingPayment[]>
  getPaymentWithEnrollment(paymentId: string): Promise<PaymentWithEnrollment | null>
  markPaymentVerified(paymentId: string, adminId: string): Promise<void>
  activateEnrollment(enrollmentId: string, amount: number): Promise<void>
  getVerifiedPaymentsForTeacher(teacherId: string): Promise<Array<{ id: string; paidAmount: number } | null>>
  createPayout(teacherId: string, amount: number): Promise<{ id: string }>
  linkPaymentsToPayout(paymentIds: string[], payoutId: string): Promise<void>
  listTeacherPayments(teacherId: string): Promise<TeacherCoursePayment[]>
  listPaymentsInCustody(): Promise<TeacherCoursePayment[]>
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
