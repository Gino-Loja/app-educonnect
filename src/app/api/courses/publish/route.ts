import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { uploadCourseCoverFile, uploadLessonAssetFile } from "@/lib/data/course-actions"
import { createClient } from "@/utils/supabase/server"

type LessonPayload = {
  title: string
  contentType?: string
  contentUrl?: string
  durationMinutes?: number
  fileKey?: string
  questions?: {
    prompt: string
    type: "multiple_choice" | "true_false"
    options?: string[]
    correctAnswer?: string
    feedback?: string
    position?: number
  }[]
}

type ModulePayload = {
  title: string
  description?: string
  lessons: LessonPayload[]
}

type PublishPayload = {
  course: { title: string; price: number; description?: string }
  modules: ModulePayload[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const formData = await req.formData()
    const payloadString = formData.get("payload") as string | null
    if (!payloadString) {
      return NextResponse.json({ error: "Falta payload" }, { status: 400 })
    }

    const payload = JSON.parse(payloadString) as PublishPayload
    if (!payload?.course?.title) {
      return NextResponse.json({ error: "Curso inválido" }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role !== "teacher" && profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const cover = formData.get("cover") as File | null
    let coverUrl: string | undefined
    if (cover && cover.size > 0) {
      coverUrl = await uploadCourseCoverFile(cover, user.id)
    }

    const { data: courseRow, error: courseError } = await supabase
      .from("courses")
      .insert({
        teacher_id: user.id,
        title: payload.course.title,
        description: payload.course.description,
        price: Number(payload.course.price) || 0,
        status: "draft",
        cover_url: coverUrl,
      })
      .select("id")
      .single()

    if (courseError || !courseRow) {
      return NextResponse.json({ error: "No pudimos crear el curso" }, { status: 500 })
    }

    for (const [moduleIndex, mod] of (payload.modules || []).entries()) {
      const { data: moduleRow } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseRow.id,
          title: mod.title,
          description: mod.description,
          position: moduleIndex + 1,
        })
        .select("id")
        .single()

      if (!moduleRow) continue

      for (const [lessonIndex, lesson] of (mod.lessons || []).entries()) {
        const file = lesson.fileKey ? (formData.get(lesson.fileKey) as File | null) : null
        let contentUrl = lesson.contentUrl
        let contentType = lesson.contentType

        if (file && file.size > 0) {
          contentUrl = await uploadLessonAssetFile(file, user.id)
          contentType = contentType || file.type
        }

        const { data: lessonRow } = await supabase
          .from("lessons")
          .insert({
            module_id: moduleRow.id,
            title: lesson.title,
            content_type: contentType,
            content_url: contentUrl,
            duration_minutes: lesson.durationMinutes,
            position: lessonIndex + 1,
          })
          .select("id")
          .single()

        if (lessonRow && (lesson.questions || []).length > 0) {
          await supabase.from("lesson_questions").insert(
            (lesson.questions || []).map((q) => ({
              lesson_id: lessonRow.id,
              question_type: q.type,
              prompt: q.prompt,
              options: q.options || null,
              correct_answer: q.correctAnswer,
              feedback: q.feedback,
              position: q.position || 1,
            })),
          )
        }
      }
    }

    await supabase.from("courses").update({ status: "published" }).eq("id", courseRow.id)
    revalidatePath("/workspace/mis-cursos")

    return NextResponse.json({ ok: true, courseId: courseRow.id })
  } catch (error) {
    console.error("publish course error", error)
    return NextResponse.json({ error: "Error publicando el curso" }, { status: 500 })
  }
}
