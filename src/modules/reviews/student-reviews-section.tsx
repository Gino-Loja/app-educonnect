import {
  getMyStudentReview,
  getStudentReviewSummary,
  listStudentReviews,
} from "@/lib/data/review-actions"
import { createClient } from "@/utils/supabase/server"
import { ReviewWidget } from "./review-widget"

type StudentReviewsSectionProps = {
  studentId: string
  taskId?: string | null
}

export async function StudentReviewsSection({ studentId, taskId }: StudentReviewsSectionProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentUser:
    | {
      id: string
      name: string | null
      avatar: string | null
      role: string | null
    }
    | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, profile_picture_url, role")
      .eq("id", user.id)
      .maybeSingle()

    currentUser = {
      id: user.id,
      name: profile?.name ?? null,
      avatar: profile?.profile_picture_url ?? null,
      role: profile?.role ?? null,
    }
  }

  const [summaryRes, reviewsRes, myReviewRes] = await Promise.all([
    getStudentReviewSummary(studentId),
    listStudentReviews({ studentId, limit: 20 }),
    getMyStudentReview(studentId),
  ])

  const summary =
    summaryRes.status === "success" && summaryRes.summary
      ? summaryRes.summary
      : { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] as [number, number, number, number, number] }

  const reviews =
    reviewsRes.status === "success" && reviewsRes.reviews
      ? reviewsRes.reviews.map((r) => ({ ...r, rating: r.rating ?? 0 }))
      : []
  const myReview = myReviewRes.status === "success" ? myReviewRes.review : null

  return (
    <ReviewWidget
      targetId={studentId}
      targetType="student"
      summary={summary}
      reviews={reviews}
      taskId={taskId}
      allowReview={currentUser?.role === "teacher"}
      currentUser={
        currentUser
          ? { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }
          : undefined
      }
      initialUserReview={
        myReview
          ? {
            id: myReview.id,
            rating: myReview.rating ?? 0,
            comment: myReview.comment,
            created_at: myReview.created_at,
          }
          : null
      }
      mode="comment-only"
    />
  )
}
