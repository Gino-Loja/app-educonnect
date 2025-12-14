import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  PaymentRepository,
  PaymentWithEnrollment,
  PendingPayment,
  TeacherCoursePayment,
} from "@/domain/payments"
import { getMinioClient } from "@/utils/minio/client"

const COURSE_PROOF_BUCKET =
  process.env.MINIO_COURSE_PROOF_BUCKET || "course-proofs"

async function getSignedProofUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  if (path.startsWith("http")) return path

  const minio = getMinioClient()
  const objectName = path.startsWith(`${COURSE_PROOF_BUCKET}/`)
    ? path.replace(`${COURSE_PROOF_BUCKET}/`, "")
    : path

  try {
    return await minio.presignedGetObject(
      COURSE_PROOF_BUCKET,
      objectName,
      60 * 60, // 1h
    )
  } catch {
    return null
  }
}

export function makePaymentsRepository(
  supabase: SupabaseClient,
): PaymentRepository {
  return {
    async listPendingPayments(): Promise<PendingPayment[]> {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
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
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true })

      if (error || !data) {
        console.error("Error fetching pending course payments", error)
        return []
      }

      const payments = (data || []).map((payment) => {
        const enrollment = Array.isArray(payment.enrollment) ? payment.enrollment[0] : payment.enrollment
        const student = enrollment?.student
          ? Array.isArray(enrollment.student)
            ? enrollment.student[0]
            : enrollment.student
          : null
        const course = Array.isArray(enrollment?.course) ? enrollment.course[0] : enrollment?.course
        const teacher = course?.teacher
          ? Array.isArray(course.teacher)
            ? course.teacher[0]
            : course.teacher
          : null

        return {
          id: payment.id as string,
          method: payment.method as string,
          status: payment.status as string,
          proof_url: (payment.proof_url as string | null) ?? null,
          created_at: payment.created_at as string,
          enrollment: {
            id: enrollment?.id as string,
            status: enrollment?.status as string,
            course_id: enrollment?.course_id as string,
            paid_amount: (enrollment?.paid_amount as number | null) ?? 0,
            student: student
              ? {
                  id: (student.id as string) ?? "",
                  name: (student.name as string | null) ?? null,
                  email: (student.email as string) ?? "",
                }
              : { id: "", name: null, email: "" },
            course: {
              id: (course?.id as string) ?? "",
              title: (course?.title as string) ?? "",
              price: (course?.price as number | null) ?? 0,
              teacher: teacher
                ? {
                    id: (teacher.id as string) ?? "",
                    name: (teacher.name as string | null) ?? null,
                    email: (teacher.email as string | null) ?? null,
                  }
                : null,
            },
          },
        }
      })

      return Promise.all(
        payments.map(async (payment) => ({
          id: payment.id,
          method: payment.method,
          status: payment.status,
          proofUrl: payment.proof_url,
          proofUrlSigned: await getSignedProofUrl(payment.proof_url),
          createdAt: payment.created_at,
          enrollment: {
            id: payment.enrollment.id,
            status: payment.enrollment.status,
            courseId: payment.enrollment.course_id,
            paidAmount: payment.enrollment.paid_amount,
            student: payment.enrollment.student,
            course: {
              id: payment.enrollment.course.id,
              title: payment.enrollment.course.title,
              price: payment.enrollment.course.price,
              teacher: payment.enrollment.course.teacher,
            },
          },
        })),
      )
    },

    async getPaymentWithEnrollment(
      paymentId: string,
    ): Promise<PaymentWithEnrollment | null> {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          id,
          status,
          enrollment:enrollments!payments_enrollment_id_fkey (
            id,
            course_id,
            course:courses!enrollments_course_id_fkey (
              id,
              price
            )
          )
        `,
        )
        .eq("id", paymentId)
        .single()

      if (error || !data) {
        console.error("Error fetching payment", error)
        return null
      }

      const enrollmentRaw = Array.isArray(data.enrollment) ? data.enrollment[0] : data.enrollment
      const courseRaw = enrollmentRaw?.course
        ? Array.isArray(enrollmentRaw.course)
          ? enrollmentRaw.course[0]
          : enrollmentRaw.course
        : null

      return {
        id: data.id,
        status: data.status,
        enrollment: enrollmentRaw
          ? {
              id: enrollmentRaw.id as string,
              courseId: enrollmentRaw.course_id as string,
              coursePrice: (courseRaw?.price as number | null | undefined) ?? 0,
            }
          : null,
      }
    },

    async markPaymentVerified(
      paymentId: string,
      adminId: string,
    ): Promise<void> {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: adminId || null,
        })
        .eq("id", paymentId)

      if (error) {
        throw error
      }
    },

    async activateEnrollment(
      enrollmentId: string,
      amount: number,
    ): Promise<void> {
      const { error } = await supabase
        .from("enrollments")
        .update({
          status: "active",
          paid_amount: amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollmentId)

      if (error) {
        throw error
      }
    },

    async getVerifiedPaymentsForTeacher(teacherId: string) {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          id,
          status,
          payout_id,
          enrollment:enrollments!payments_enrollment_id_fkey (
            paid_amount,
            course:courses!enrollments_course_id_fkey (
              teacher_id
            )
          )
        `,
        )
        .eq("status", "verified")
        .is("payout_id", null)

      if (error || !data) {
        console.error("Error fetching payments for payout", error)
        return []
      }

      return data
        .filter((row) => (row.enrollment as { course?: { teacher_id?: string | null } | null } | null)?.course?.teacher_id === teacherId)
        .map((row) => {
          const enrollment = row.enrollment as { paid_amount?: number | null }
          return { id: row.id as string, paidAmount: enrollment.paid_amount ?? 0 }
        })
    },

    async createPayout(teacherId: string, amount: number) {
      const { data, error } = await supabase
        .from("payouts")
        .insert({
          teacher_id: teacherId,
          amount,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("No se pudo crear el payout")
      }

      return { id: data.id as string }
    },

    async linkPaymentsToPayout(paymentIds: string[], payoutId: string): Promise<void> {
      if (!paymentIds.length) return
      const { error } = await supabase
        .from("payments")
        .update({ payout_id: payoutId })
        .in("id", paymentIds)

      if (error) throw error
    },

    async listTeacherPayments(teacherId: string): Promise<TeacherCoursePayment[]> {
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
        .eq("enrollment.course.teacher_id", teacherId)
        .order("created_at", { ascending: false })

      if (error || !data) {
        console.error("Error fetching teacher payments", error)
        return []
      }

      return (data || []).map((payment) => {
        const enrollment = Array.isArray(payment.enrollment) ? payment.enrollment[0] : payment.enrollment
        const student = enrollment?.student
          ? Array.isArray(enrollment.student)
            ? enrollment.student[0]
            : enrollment.student
          : null
        const course = enrollment?.course
          ? Array.isArray(enrollment.course)
            ? enrollment.course[0]
            : enrollment.course
          : null
        const teacher = course?.teacher
          ? Array.isArray(course.teacher)
            ? course.teacher[0]
            : course.teacher
          : null

        return {
          id: payment.id as string,
          status: payment.status as TeacherCoursePayment["status"],
          payout_id: (payment.payout_id as string | null) ?? null,
          method: payment.method as string,
          created_at: payment.created_at as string,
          verified_at: (payment.verified_at as string | null) ?? null,
          enrollment: enrollment
            ? {
                id: enrollment.id as string,
                status: enrollment.status as string,
                student: student
                  ? {
                      id: (student.id as string) ?? "",
                      name: (student.name as string | null) ?? null,
                      email: (student.email as string | null) ?? null,
                    }
                  : undefined,
                course: course
                  ? {
                      id: (course.id as string) ?? "",
                      title: (course.title as string) ?? "",
                      price: (course.price as number | null) ?? 0,
                      teacher_id: (course.teacher_id as string | null) ?? null,
                      teacher: teacher
                        ? {
                            id: (teacher.id as string) ?? "",
                            name: (teacher.name as string | null) ?? null,
                            email: (teacher.email as string | null) ?? null,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        }
      })
    },

    async listPaymentsInCustody(): Promise<TeacherCoursePayment[]> {
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
        .eq("status", "in_custody")
        .order("created_at", { ascending: false })

      if (error || !data) {
        console.error("Error fetching payments in custody", error)
        return []
      }

      return (data || []).map((payment) => {
        const enrollment = Array.isArray(payment.enrollment) ? payment.enrollment[0] : payment.enrollment
        const student = enrollment?.student
          ? Array.isArray(enrollment.student)
            ? enrollment.student[0]
            : enrollment.student
          : null
        const course = enrollment?.course
          ? Array.isArray(enrollment.course)
            ? enrollment.course[0]
            : enrollment.course
          : null
        const teacher = course?.teacher
          ? Array.isArray(course.teacher)
            ? course.teacher[0]
            : course.teacher
          : null

        return {
          id: payment.id as string,
          status: payment.status as TeacherCoursePayment["status"],
          payout_id: (payment.payout_id as string | null) ?? null,
          method: payment.method as string,
          created_at: payment.created_at as string,
          verified_at: (payment.verified_at as string | null) ?? null,
          enrollment: enrollment
            ? {
                id: enrollment.id as string,
                status: enrollment.status as string,
                student: student
                  ? {
                      id: (student.id as string) ?? "",
                      name: (student.name as string | null) ?? null,
                      email: (student.email as string | null) ?? null,
                    }
                  : undefined,
                course: course
                  ? {
                      id: (course.id as string) ?? "",
                      title: (course.title as string) ?? "",
                      price: (course.price as number | null) ?? 0,
                      teacher_id: (course.teacher_id as string | null) ?? null,
                      teacher: teacher
                        ? {
                            id: (teacher.id as string) ?? "",
                            name: (teacher.name as string | null) ?? null,
                            email: (teacher.email as string | null) ?? null,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        }
      })
    },
  }
}
