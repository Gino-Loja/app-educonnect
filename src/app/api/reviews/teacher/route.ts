import { NextResponse } from "next/server"
import {
  createOrUpdateTeacherReview,
  getMyTeacherReview,
  getTeacherReviewSummary,
  listTeacherReviews,
} from "@/lib/data/review-actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get("teacherId")
  if (!teacherId) {
    return NextResponse.json({ error: "teacherId es requerido" }, { status: 400 })
  }

  const summary = await getTeacherReviewSummary(teacherId)
  const reviews = await listTeacherReviews({ teacherId, limit: 5 })
  const myReview = await getMyTeacherReview(teacherId)

  if (summary.status === "error") {
    return NextResponse.json({ error: summary.message || "No se pudo cargar resumen" }, { status: 500 })
  }

  return NextResponse.json({
    summary: summary.summary,
    reviews: reviews.status === "success" ? reviews.reviews : [],
    myReview: myReview.review || null,
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || !body.teacherId || !body.taskId || !body.rating) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
  }

  const result = await createOrUpdateTeacherReview({
    teacherId: body.teacherId,
    taskId: body.taskId,
    rating: body.rating,
    comment: body.comment || "",
  })

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  return NextResponse.json({ review: result.review, message: result.message })
}
