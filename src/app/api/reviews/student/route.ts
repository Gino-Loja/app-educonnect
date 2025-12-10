import { NextResponse } from "next/server"
import {
  createOrUpdateStudentReview,
  getMyStudentReview,
  getStudentReviewSummary,
  listStudentReviews,
} from "@/lib/data/review-actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")
  if (!studentId) {
    return NextResponse.json({ error: "studentId es requerido" }, { status: 400 })
  }

  const summary = await getStudentReviewSummary(studentId)
  const reviews = await listStudentReviews({ studentId, limit: 5 })
  const myReview = await getMyStudentReview(studentId)

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
  if (!body || !body.studentId || !body.taskId || !body.rating) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
  }

  const result = await createOrUpdateStudentReview({
    studentId: body.studentId,
    taskId: body.taskId,
    rating: body.rating,
    comment: body.comment || "",
  })

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  return NextResponse.json({ review: result.review, message: result.message })
}
