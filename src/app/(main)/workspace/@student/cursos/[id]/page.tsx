import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { IconAlertCircle, IconArrowLeft, IconBook, IconCheck, IconClock, IconUsers, IconFileText } from "@tabler/icons-react"

import { CoursePurchaseForm } from "@/components/courses/CoursePurchaseForm"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCourseModulesWithLessons, signLessonUrl } from "@/lib/data/course-actions"
import { createClient } from "@/utils/supabase/server"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      `
        id,
        title,
        description,
        price,
        status,
        cover_url,
        teacher:profiles!courses_teacher_id_fkey (
          id,
          name,
          email
        )
      `,
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !course) {
    notFound()
  }

  const isAvailable = ["published", "unlisted"].includes(course.status)
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, paid_amount, proof_url")
    .eq("course_id", course.id)
    .eq("student_id", user.id)
    .maybeSingle()

  const isActive = enrollment?.status === "active"
  const isPending = enrollment?.status === "pending"
  const modules = await getCourseModulesWithLessons(course.id, isActive ? enrollment?.id : undefined)

  // Get course stats
  const totalModules = modules.length
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = isActive
    ? modules.reduce((acc, m) => acc + m.lessons.filter((l) => l.completed).length, 0)
    : 0
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Sign cover URL
  const signedCoverUrl = await signLessonUrl(course.cover_url)

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace/mis-cursos">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Volver a cursos
          </Link>
        </Button>
      </div>

      {/* Course Header with Cover Image */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          {signedCoverUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={signedCoverUrl}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center">
              <IconBook className="h-20 w-20 text-blue-400" />
            </div>
          )}

          {/* Course Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
                <Badge variant={course.status === "published" ? "default" : "secondary"} className="capitalize">
                  {course.status}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Por {course.teacher?.name || course.teacher?.email || "Docente"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <IconFileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{totalModules}</p>
                  <p className="text-xs text-muted-foreground">Módulos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <IconBook className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{totalLessons}</p>
                  <p className="text-xs text-muted-foreground">Lecciones</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <IconClock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatCurrency(course.price)}</p>
                  <p className="text-xs text-muted-foreground">Precio</p>
                </CardContent>
              </Card>
              {isActive && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <IconCheck className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-2xl font-bold">{progress}%</p>
                    <p className="text-xs text-muted-foreground">Completado</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {course.description || "Sin descripción disponible."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Compra manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-emerald-600" />
                Paga por transferencia o efectivo.
              </p>
              <p className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-emerald-600" />
                Sube el comprobante y queda en revisión.
              </p>
              <p className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-emerald-600" />
                Un admin activa tu acceso al curso.
              </p>
            </CardContent>
          </Card>

          {isPending ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-start gap-3 p-4">
                <IconAlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Pago en revisión</p>
                  <p className="text-amber-700 mt-1">
                    Ya registraste tu compra. Un administrador está verificando tu comprobante. Te avisaremos cuando se active el acceso.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isPending && !isActive ? (
            isAvailable ? (
              <CoursePurchaseForm courseId={course.id} />
            ) : (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Este curso no está disponible para compra en este momento.
                </CardContent>
              </Card>
            )
          ) : null}

          {isActive ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold mb-1 text-emerald-900">✓ Acceso activo</p>
                  <p className="text-sm text-emerald-700">
                    Tienes acceso completo a este curso. Accede al contenido para comenzar o continuar tu aprendizaje.
                  </p>
                </div>
                <Button className="w-full" asChild>
                  <Link href={`/workspace/cursos/${course.id}/contenido`}>
                    <IconBook className="mr-2 h-4 w-4" />
                    Acceder al curso
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
