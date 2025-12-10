import { NextResponse } from "next/server"

import { createLesson } from "@/lib/data/course-actions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { moduleId } = await context.params
  if (!moduleId) {
    return NextResponse.json({ error: "Modulo invalido" }, { status: 400 })
  }

  const formData = await request.formData()
  const title = ((formData.get("lessonTitle") as string | null) || "").trim()
  if (!title) {
    return NextResponse.json({ error: "El titulo es obligatorio" }, { status: 400 })
  }

  const contentType = (formData.get("lessonContentType") as string | null) || undefined
  const lessonUrl = (formData.get("lessonUrl") as string | null) || undefined
  const textContent =
    (formData.get("textContent") as string | null) || (contentType === "text" ? lessonUrl : undefined)
  const contentUrl = contentType === "text" ? undefined : lessonUrl
  const durationValue = Number(formData.get("lessonDuration") || 0)
  const passScoreValue = formData.get("lessonPassScore")
  const file = formData.get("lessonFile")
  const questionsRaw = formData.get("lessonQuestions") as string | null
  let questions: unknown
  if (questionsRaw) {
    try {
      questions = JSON.parse(questionsRaw) as unknown
    } catch {
      return NextResponse.json({ error: "Formato de preguntas no valido" }, { status: 400 })
    }
  }

  const result = await createLesson(
    {
      moduleId,
      title,
      contentType: contentType as "video" | "image" | "link" | "file" | "text" | "quiz" | undefined,
      contentUrl,
      textContent,
      durationMinutes: Number.isNaN(durationValue) || durationValue <= 0 ? undefined : durationValue,
      passScore:
        typeof passScoreValue === "string" && passScoreValue.trim() !== ""
          ? Math.min(100, Math.max(0, Number(passScoreValue)))
          : undefined,
      questions: Array.isArray(questions) ? questions : undefined,
    },
    file instanceof File ? file : null,
  )

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  return NextResponse.json({ status: "success" })
}
