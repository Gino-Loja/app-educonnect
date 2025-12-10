import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { IconBook, IconClock, IconSchool, IconShoppingCart } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/server"
import { signLessonUrl } from "@/lib/data/course-actions"

type EnrolledCourse = {
  id: string
  title: string
  teacher: string
  progress: number
  lessons: number
  completedLessons: number
  nextLesson: string
  status: "active" | "completed"
  signed_cover_url: string | null
}

type PublishedCourse = {
  id: string
  title: string
  description: string | null
  teacher: string
  price: number
  signed_cover_url: string | null
  moduleCount: number
  lessonCount: number
}

type EnrollmentRow = {
  id: string
  status: string
  course: {
    id: string
    title: string
    cover_url: string | null
    teacher: { name: string | null } | null
  } | null
}

type ModuleWithLessons = { id: string; lessons: { id: string }[] }
type LessonProgressRow = { lesson_id: string }
type PublishedCourseRow = {
  id: string
  title: string
  description: string | null
  price: number
  cover_url: string | null
  teacher: { name: string | null } | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export default async function MisCursosPage() {
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

  if (profile?.role !== "student" && profile?.role !== "admin") {
    redirect("/workspace")
  }

  // Fetch enrollments with course details
  const { data: enrollmentsData = [] } = await supabase
    .from("enrollments")
    .select(`
      id,
      status,
      course:courses!inner (
        id,
        title,
        cover_url,
        teacher:profiles!courses_teacher_id_fkey (
          name
        )
      )
    `)
    .eq("student_id", user.id)
    .in("status", ["active", "pending"])

  // Fetch lesson progress for each enrollment
  const enrolledCourses: EnrolledCourse[] = await Promise.all(
    (enrollmentsData as EnrollmentRow[]).map(async (enrollment) => {
      if (!enrollment.course) {
        return {
          id: "",
          title: "Curso sin datos",
          teacher: "Docente",
          progress: 0,
          lessons: 0,
          completedLessons: 0,
          nextLesson: "Curso no disponible",
          status: "active",
          signed_cover_url: null,
        }
      }
      const course = enrollment.course

      // Get all lessons for this course
      const { data: modules = [] } = await supabase
        .from("course_modules")
        .select(`
          id,
          lessons:lessons (
            id
          )
        `)
        .eq("course_id", course.id)

      const allLessonIds = (modules as ModuleWithLessons[]).flatMap((m) => m.lessons.map((l) => l.id))
      const totalLessons = allLessonIds.length

      // Get completed lessons
      const { data: completedLessons } = totalLessons > 0
        ? await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("student_id", user.id)
          .eq("completed", true)
          .in("lesson_id", allLessonIds)
        : { data: [] }

      const completedLessonsArray: LessonProgressRow[] = completedLessons ?? []
      const completedCount = completedLessonsArray.length
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

      // Get next incomplete lesson
      const { data: nextLessonData } = totalLessons > 0
        ? await supabase
          .from("lessons")
          .select("title")
          .in("id", allLessonIds)
          .order("position")
          .limit(1)
          .not("id", "in", `(${completedLessonsArray.map((l) => l.lesson_id).join(",") || "null"})`)
          .maybeSingle()
        : { data: null }

      const signed_cover_url = await signLessonUrl(course.cover_url)

      return {
        id: course.id,
        title: course.title,
        teacher: course.teacher?.name || "Docente",
        progress,
        lessons: totalLessons,
        completedLessons: completedCount,
        nextLesson: progress === 100 ? "Curso completado" : (nextLessonData?.title || "Comenzar curso"),
        status: progress === 100 ? "completed" : "active",
        signed_cover_url,
      }
    })
  )

  // Get enrolled course IDs to filter them out from catalog
  const enrolledCourseIds = (enrollmentsData as EnrollmentRow[])
    .map((e) => e.course?.id)
    .filter((id): id is string => Boolean(id))

  // Fetch all published courses
  const { data: publishedCoursesData = [] } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      price,
      cover_url,
      teacher:profiles!courses_teacher_id_fkey (
        name
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  // Fetch module and lesson counts for published courses
  const publishedCourses: PublishedCourse[] = await Promise.all(
    (publishedCoursesData as PublishedCourseRow[])
      .filter((course) => !enrolledCourseIds.includes(course.id))
      .map(async (course) => {
        // Get module count
        const { count: moduleCount } = await supabase
          .from("course_modules")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id)

        // Get lesson count
        const { data: modules = [] } = await supabase
          .from("course_modules")
          .select(`
            lessons:lessons (
              id
            )
          `)
          .eq("course_id", course.id)

        const lessonCount = (modules as ModuleWithLessons[]).flatMap((m) => m.lessons).length

        const signed_cover_url = await signLessonUrl(course.cover_url)

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          teacher: course.teacher?.name || "Docente",
          price: course.price,
          signed_cover_url,
          moduleCount: moduleCount || 0,
          lessonCount,
        }
      })
  )

  const activeCount = enrolledCourses.filter((course) => course.status === "active").length
  const completedCount = enrolledCourses.filter((course) => course.status === "completed").length

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <IconBook className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Cursos</h1>
            <p className="text-sm text-muted-foreground">
              Explora cursos disponibles y gestiona tus inscripciones.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="enrolled" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="enrolled">Mis Cursos ({enrolledCourses.length})</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo ({publishedCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos activos</CardTitle>
                <IconBook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-xs text-muted-foreground">Puedes continuar donde quedaste.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos completados</CardTitle>
                <IconSchool className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">Revisa materiales cuando quieras.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proxima leccion</CardTitle>
                <IconClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-base font-semibold">
                  {enrolledCourses.find((c) => c.status === "active")?.nextLesson || "Sin pendientes"}
                </div>
                <p className="text-xs text-muted-foreground">Retoma tu siguiente tema.</p>
              </CardContent>
            </Card>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <p className="text-lg font-semibold text-slate-800">Aun no tienes cursos</p>
                <p className="text-sm text-muted-foreground">
                  Explora el catálogo y compra tu primer curso para comenzar a aprender.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enrolledCourses.map((course) => (
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
                    <div className="relative aspect-video w-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <IconBook className="h-12 w-12 text-blue-400" />
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Con {course.teacher} · {course.lessons} lecciones
                      </CardDescription>
                    </div>
                    <Badge variant={course.status === "completed" ? "secondary" : "default"}>
                      {course.status === "completed" ? "Completado" : "En progreso"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avance general</p>
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className={`h-2 rounded-full ${course.status === "completed" ? "bg-emerald-500" : "bg-blue-600"}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{course.progress}% completado</p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Siguiente</p>
                        <p className="text-xs text-muted-foreground">{course.nextLesson}</p>
                      </div>
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/workspace/cursos/${course.id}`}>Abrir</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4 mt-6">
          {publishedCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <p className="text-lg font-semibold text-slate-800">No hay cursos disponibles</p>
                <p className="text-sm text-muted-foreground">
                  Por el momento no hay cursos publicados en el catálogo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {publishedCourses.map((course) => (
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
                    <div className="relative aspect-video w-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <IconBook className="h-12 w-12 text-indigo-400" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="outline" className="shrink-0">
                        {formatCurrency(course.price)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                      Por {course.teacher}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    {course.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{course.moduleCount} módulos</span>
                      <span>·</span>
                      <span>{course.lessonCount} lecciones</span>
                    </div>
                    <Button className="w-full mt-auto" asChild>
                      <Link href={`/workspace/cursos/${course.id}`}>
                        <IconShoppingCart className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
