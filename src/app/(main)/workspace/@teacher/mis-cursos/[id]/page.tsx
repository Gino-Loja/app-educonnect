import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  IconArrowLeft,
  IconBook,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  createModule,
  deleteLesson,
  deleteModule,
  signLessonUrl,
  updateCourseDetails,
  updateModule,
  uploadCourseCoverFile,
} from "@/lib/data/course-actions"
import { createClient } from "@/utils/supabase/server"
import { LessonEditorDialog } from "../LessonEditorDialog"
import { LessonCreateDialog } from "../LessonCreateDialog"
import { ModuleEditorDialog } from "../ModuleEditorDialog"
import { ModuleCreateDialog } from "../ModuleCreateDialog"
import { CourseEditorDialog } from "../CourseEditorDialog"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export default async function CourseManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "teacher" && profile?.role !== "admin") redirect("/workspace")

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, price, status, cover_url, created_at, updated_at")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single()

  if (courseError || !course) redirect("/workspace/mis-cursos")

  const { data: modulesData = [] } = await supabase
    .from("course_modules")
    .select(
      "id, title, description, position, lessons:lessons(id, title, content_type, content_url, text_content, duration_minutes, pass_score, position, questions:lesson_questions(id, question_type, prompt, options, correct_answer, feedback, position))",
    )
    .eq("course_id", course.id)
    .order("position", { ascending: true })

  const modules = await Promise.all(
    (modulesData || []).map(async (module) => ({
      ...module,
      lessons: await Promise.all(
        (module.lessons || []).map(async (lesson) => ({
          ...lesson,
          signed_url: await signLessonUrl(lesson.content_url),
          questions: (lesson.questions || []).map((q) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options.map((opt) => String(opt)) : null,
          })),
        })),
      ),
    })),
  )

  const coverUrl = await signLessonUrl(course.cover_url)

  const updateCourseAction = async (formData: FormData) => {
    "use server"
    const courseId = String(formData.get("courseId") || "")
    const title = ((formData.get("title") as string | null) || "").trim()
    const description = (formData.get("description") as string | null) || undefined
    const coverValue = (formData.get("coverUrl") as string | null) || undefined
    const priceValue = Number(formData.get("price") || 0)
    const statusValue = (formData.get("status") as string | null) || undefined
    const coverFile = formData.get("coverFile")

    let resolvedCoverUrl = coverValue
    if (coverFile instanceof File && coverFile.size > 0) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("No autenticado")
      }
      resolvedCoverUrl = await uploadCourseCoverFile(coverFile, user.id)
    }

    await updateCourseDetails({
      id: courseId,
      title,
      description,
      coverUrl: resolvedCoverUrl,
      price: Number.isNaN(priceValue) ? 0 : priceValue,
      status: statusValue as "draft" | "published" | undefined,
    })
  }

  const createModuleAction = async (formData: FormData) => {
    "use server"
    const courseId = String(formData.get("courseId") || "")
    const title = ((formData.get("newModuleTitle") as string | null) || "").trim()
    const description = (formData.get("newModuleDescription") as string | null) || undefined

    await createModule({
      courseId,
      title,
      description,
    })
  }

  const updateModuleAction = async (formData: FormData) => {
    "use server"
    const moduleId = String(formData.get("moduleId") || "")
    const title = ((formData.get("moduleTitle") as string | null) || "").trim()
    const description = (formData.get("moduleDescription") as string | null) || undefined

    await updateModule({
      id: moduleId,
      title,
      description,
    })
  }

  const deleteModuleAction = async (formData: FormData) => {
    "use server"
    const moduleId = String(formData.get("moduleId") || "")
    await deleteModule({ id: moduleId })
  }

  const deleteLessonAction = async (formData: FormData) => {
    "use server"
    const lessonId = String(formData.get("lessonId") || "")
    await deleteLesson({ id: lessonId })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link href="/workspace/mis-cursos">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Volver a cursos
          </Link>
        </Button>
        <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative h-48 w-full bg-slate-100">
              {coverUrl ? (
                <Image src={coverUrl} alt={course.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Sin portada</div>
              )}
            </div>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
                <p className="text-2xl font-bold text-lime-600">{formatCurrency(course.price)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">Estado</p>
                  <p className="text-muted-foreground capitalize">{course.status}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Actualizado <br />
                  {new Date(course.updated_at).toLocaleDateString()}
                </div>
              </div>
              <Button variant="secondary" className="w-full justify-center gap-2" asChild>
                <Link href={`/workspace/mis-cursos/${course.id}?tab=progress`}>
                  <IconUsers className="h-4 w-4" />
                  Gestionar alumnos
                </Link>
              </Button>
              <CourseEditorDialog
                course={{
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  price: course.price,
                  cover_url: course.cover_url,
                  status: (course.status as "draft" | "published") ?? "draft",
                  coverPreviewUrl: coverUrl ?? null,
                }}
                updateAction={updateCourseAction}
                trigger={
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <IconPencil className="h-4 w-4" />
                    Editar curso
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Estructura del curso</p>
                <Badge variant="outline">{modules.length} módulos</Badge>
              </div>
              <div className="space-y-2">
                {modules.map((module) => (
                  <div key={module.id} className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <IconGripVertical className="h-4 w-4 text-slate-400" />
                        <span>{module.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ModuleEditorDialog
                          module={{ id: module.id, title: module.title, description: module.description }}
                          updateAction={updateModuleAction}
                          deleteAction={deleteModuleAction}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Editar módulo">
                              <IconPencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <form action={deleteModuleAction}>
                          <input type="hidden" name="moduleId" value={module.id} />
                          <Button variant="ghost" size="icon" type="submit" aria-label="Eliminar módulo">
                            <IconTrash className="h-4 w-4 text-rose-600" />
                          </Button>
                        </form>
                      </div>
                    </div>
                    <div className="space-y-1 px-3 py-2">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-sm">
                          <div className="flex items-center gap-2">
                            <IconBook className="h-3.5 w-3.5 text-slate-500" />
                            <span>{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-2 justify-end shrink-0">
                            <LessonEditorDialog
                              lesson={lesson}
                              deleteAction={deleteLessonAction}
                            />
                            <form action={deleteLessonAction}>
                              <input type="hidden" name="lessonId" value={lesson.id} />
                              <Button variant="ghost" size="icon" type="submit" aria-label="Eliminar actividad">
                                <IconTrash className="h-3.5 w-3.5 text-rose-600" />
                              </Button>
                            </form>
                          </div>
                        </div>
                      ))}
                      {module.lessons.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin actividades</p>
                      ) : null}
                      <LessonCreateDialog
                        moduleId={module.id}
                        trigger={
                          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" type="button">
                            <IconPlus className="h-3.5 w-3.5" />
                            Añadir actividad
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay módulos aún. Crea el primero abajo.</p>
                ) : null}
              </div>
              <ModuleCreateDialog courseId={course.id} createAction={createModuleAction} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">


        </div>
      </div>
    </div>
  )
}
