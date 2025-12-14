export type EnrollmentStatus =
  | "pending"
  | "active"
  | "rejected"
  | "completed"
  | string

export type PurchaseMethod = "transfer" | "efectivo" | string

export type StartPurchaseCommand = {
  studentId: string
  courseId: string
  method: PurchaseMethod
  proofUrl?: string
  notes?: string
}

export type StartPurchaseResult =
  | { status: "error"; message: string }
  | {
      status: "success"
      message: string
      enrollmentId: string
      paymentId: string
    }

export interface EnrollmentsRepository {
  getUserRole(userId: string): Promise<string | null>
  getCourseForPurchase(courseId: string): Promise<{ id: string; status: string } | null>
  findExistingEnrollment(
    courseId: string,
    studentId: string,
  ): Promise<{ id: string; status: EnrollmentStatus } | null>
  createPendingEnrollment(input: {
    courseId: string
    studentId: string
    proofUrl?: string
    notes?: string
  }): Promise<{ id: string }>
  createPaymentForEnrollment(input: {
    enrollmentId: string
    method: PurchaseMethod
    proofUrl?: string
  }): Promise<{ id: string }>
}

export type MarkLessonCompletedCommand = {
  lessonId: string
  studentId: string
}

export type MarkLessonResult =
  | { status: "error"; message: string }
  | { status: "success"; message: string; courseId: string }

export interface LessonProgressRepository {
  getLessonCourse(lessonId: string): Promise<{ courseId: string } | null>
  getActiveEnrollment(courseId: string, studentId: string): Promise<{ id: string } | null>
  saveLessonProgress(enrollmentId: string, lessonId: string): Promise<void>
}
