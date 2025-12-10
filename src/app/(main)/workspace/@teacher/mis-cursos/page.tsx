import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { IconBook, IconCurrencyDollar, IconPlus, IconUsers, IconClock } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import { signLessonUrl } from "@/lib/data/course-actions"

type CourseWithStats = {
  id: string
  title: string
  status: string
  price: number
  updated_at: string
  cover_url: string | null
  signed_cover_url: string | null
  activeStudents: number
  paidAmount: number
}

const statusLabel: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  unlisted: "Oculto",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export default async function TeacherCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    redirect("/workspace")
  }

  const { data: courses = [] } = await supabase
    .from("courses")
    .select("id, title, status, price, updated_at, cover_url")
    .eq("teacher_id", user.id)
    .order("updated_at", { ascending: false })

  const courseIds = (courses || []).map((c) => c.id)
  const { data: enrollments = [] } = courseIds.length
    ? await supabase
      .from("enrollments")
      .select("course_id, status, paid_amount")
      .in("course_id", courseIds)
    : { data: [] as { course_id: string; status: string; paid_amount: number | null }[] }

  const safeEnrollments = enrollments || []

  const courseWithStats: CourseWithStats[] = await Promise.all(
    (courses || []).map(async (course) => {
      const related = safeEnrollments.filter((e) => e.course_id === course.id)
      const activeStudents = related.filter((e) => e.status === "active").length
      const paidAmount = related
        .filter((e) => e.status === "active")
        .reduce((acc, curr) => acc + (curr.paid_amount || 0), 0)

      const signed_cover_url = await signLessonUrl(course.cover_url)

      return {
        ...course,
        signed_cover_url,
        activeStudents,
        paidAmount,
      }
    })
  )

  const publishedCount = courseWithStats.filter((c) => c.status === "published").length
  const totalStudents = courseWithStats.reduce((acc, c) => acc + c.activeStudents, 0)
  const totalPaid = courseWithStats.reduce((acc, c) => acc + c.paidAmount, 0)

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <IconBook className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Mis cursos</h1>
            <p className="text-sm text-muted-foreground">
              Publica cursos y revisa inscripciones activas.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/workspace/mis-cursos/nuevo">
            <IconPlus className="mr-2 h-4 w-4" />
            Crear curso
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos publicados</CardTitle>
            <IconBook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
            <p className="text-xs text-muted-foreground">Visibles para estudiantes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes activos</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Inscripciones activas en tus cursos.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos verificados</CardTitle>
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Pagos confirmados por admin.</p>
          </CardContent>
        </Card>
      </div>

      {courseWithStats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="text-lg font-semibold text-slate-800">Aun no tienes cursos</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primer curso y publica cuando este listo. Los pagos se confirman manualmente por el admin.
            </p>
            <Button asChild>
              <Link href="/workspace/mis-cursos/nuevo">
                <IconPlus className="mr-2 h-4 w-4" />
                Crear curso
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courseWithStats.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden">
              {course.signed_cover_url ? (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <Image
                    src={course.signed_cover_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <IconBook className="h-12 w-12 text-slate-400" />
                </div>
              )}
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {course.activeStudents} estudiantes · {formatCurrency(course.price)}
                  </CardDescription>
                </div>
                <Badge variant={course.status === "published" ? "default" : "secondary"}>
                  {statusLabel[course.status] || course.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="rounded-lg border bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700">Estado</p>
                  <p className="text-xs text-muted-foreground">
                    {course.status === "published"
                      ? "Listado para estudiantes. Admin confirma pagos."
                      : "Completa el temario y publica cuando este listo."}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Ingresos verificados</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(course.paidAmount)}</p>
                  </div>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/workspace/mis-cursos/${course.id}`}>Gestionar</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconClock className="h-4 w-4" />
                  Ultima actualizacion: {new Date(course.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
