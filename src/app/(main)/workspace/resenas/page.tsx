import { redirect } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import {
  getTeacherReviewSummary,
  listTeacherReviews,
  getMyTeacherReview,
  getStudentReviewSummary,
  listStudentReviews,
  getMyStudentReview,
} from "@/lib/data/review-actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReviewWidget, type ReviewSummary, type ReviewListItem } from "@/modules/reviews/review-widget"

type Profile = {
  id: string
  name: string | null
  profile_picture_url: string | null
}

type RankedEntity = {
  profile: Profile
  stats: {
    average: number
    reviewCount: number
    tasksCount: number
    lastTaskId: string | null
    lastTaskTitle: string | null
  }
}

const DEFAULT_SUMMARY = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] as [
  number,
  number,
  number,
  number,
  number,
] }

type ReviewsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams
  const focusTeacherId = (params.teacherId as string) || undefined
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name, profile_picture_url")
    .eq("id", user.id)
    .single()

  const role = profile?.role

  if (role === "teacher") {
    return await renderTeacherView(user.id, profile)
  }

  return await renderStudentView(user.id, profile, focusTeacherId)
}

async function renderStudentView(userId: string, studentProfile?: Profile | null, focusTeacherId?: string) {
  const supabase = await createClient()

  // Tasks del estudiante con docente asignado (no canceladas)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, teacher_id, status, created_at")
    .eq("student_id", userId)
    .not("teacher_id", "is", null)
    .neq("status", "cancelled")

  const tasksByTeacher = new Map<string, { count: number; lastTaskId: string | null; lastTaskTitle: string | null; lastCreated: string | null }>()
  for (const task of tasks || []) {
    const teacherId = task.teacher_id as string
    const current = tasksByTeacher.get(teacherId) || { count: 0, lastTaskId: null, lastTaskTitle: null, lastCreated: null }
    const nextCount = current.count + 1
    const isMoreRecent = !current.lastCreated || new Date(task.created_at || "").getTime() > new Date(current.lastCreated).getTime()
    tasksByTeacher.set(teacherId, {
      count: nextCount,
      lastTaskId: isMoreRecent ? task.id : current.lastTaskId,
      lastTaskTitle: isMoreRecent ? task.title : current.lastTaskTitle,
      lastCreated: isMoreRecent ? task.created_at : current.lastCreated,
    })
  }

  const workedTeacherIds = Array.from(tasksByTeacher.keys())

  const { data: ratingRows } = await supabase
    .from("teacher_reviews")
    .select("teacher_id, rating")

  const ratingMap = new Map<string, { average: number; reviewCount: number }>()
  for (const row of ratingRows || []) {
    const key = row.teacher_id as string
    const current = ratingMap.get(key) || { average: 0, reviewCount: 0 }
    const nextCount = current.reviewCount + 1
    const nextAverage = (current.average * current.reviewCount + Number(row.rating || 0)) / nextCount
    ratingMap.set(key, { average: nextAverage, reviewCount: nextCount })
  }

  const { data: workedProfiles } = workedTeacherIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, profile_picture_url")
        .in("id", workedTeacherIds)
        .eq("role", "teacher")
    : { data: [] }

  const workedTeachers: RankedEntity[] = (workedProfiles || []).map((profile) => {
    const taskInfo = tasksByTeacher.get(profile.id)!
    const ratingInfo = ratingMap.get(profile.id) || { average: 0, reviewCount: 0 }
    return {
      profile,
      stats: {
        average: ratingInfo.average,
        reviewCount: ratingInfo.reviewCount,
        tasksCount: taskInfo.count,
        lastTaskId: taskInfo.lastTaskId,
        lastTaskTitle: taskInfo.lastTaskTitle,
      },
    }
  })

  const topRatedIds = Array.from(ratingMap.entries())
    .filter(([id]) => !workedTeacherIds.includes(id))
    .sort((a, b) => b[1].average - a[1].average)
    .slice(0, 8)
    .map(([id]) => id)

  const availableQuery = supabase
    .from("profiles")
    .select("id, name, profile_picture_url")
    .eq("role", "teacher")

  if (topRatedIds.length > 0) {
    availableQuery.in("id", topRatedIds)
  } else if (workedTeacherIds.length > 0) {
    availableQuery.not("id", "in", `(${workedTeacherIds.join(",")})`)
  }

  const { data: availableProfiles } = await availableQuery.limit(8)

  const availableTeachers: RankedEntity[] = (availableProfiles || []).map((profile) => {
    const ratingInfo = ratingMap.get(profile.id) || { average: 0, reviewCount: 0 }
    return {
      profile,
      stats: {
        average: ratingInfo.average,
        reviewCount: ratingInfo.reviewCount,
        tasksCount: 0,
        lastTaskId: null,
        lastTaskTitle: null,
      },
    }
  })

  const workedWithDetails = await Promise.all(
    workedTeachers
      .sort((a, b) => b.stats.average - a.stats.average)
      .map(async (entry) => {
        const summary = await getTeacherReviewSummary(entry.profile.id)
        const reviews = await listTeacherReviews({ teacherId: entry.profile.id, limit: 5 })
        const myReview = await getMyTeacherReview(entry.profile.id)
        return {
          ...entry,
          summary: summary.status === "success" ? summary.summary || DEFAULT_SUMMARY : DEFAULT_SUMMARY,
          reviews: reviews.status === "success" ? ((reviews.reviews as ReviewListItem[]) || []) : [],
          myReview: myReview.review
            ? {
                id: myReview.review.id,
                rating: myReview.review.rating ?? 0,
                comment: myReview.review.comment,
                created_at: myReview.review.created_at,
              }
            : undefined,
        }
      }),
  )

  const focusTeacher =
    focusTeacherId &&
    (await (async () => {
      const { data: teacherProfile } = await supabase
        .from("profiles")
        .select("id, name, profile_picture_url, role")
        .eq("id", focusTeacherId)
        .single()

      if (!teacherProfile || teacherProfile.role !== "teacher") return null

      const [summary, reviews, myReview] = await Promise.all([
        getTeacherReviewSummary(focusTeacherId),
        listTeacherReviews({ teacherId: focusTeacherId, limit: 5 }),
        getMyTeacherReview(focusTeacherId),
      ])

      return {
        profile: teacherProfile,
        summary: summary.status === "success" ? summary.summary || DEFAULT_SUMMARY : DEFAULT_SUMMARY,
        reviews: reviews.status === "success" ? reviews.reviews || [] : [],
        myReview: myReview.review || undefined,
      }
    })())

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <Header title="Reseñas de docentes" description="Califica a tus docentes por tarea y deja comentarios aquí. Las calificaciones se basan en las tareas que has realizado con cada docente." />

      {focusTeacher && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Docente seleccionado</h2>
            <Badge variant="secondary">Perfil</Badge>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Image
                  src={focusTeacher.profile.profile_picture_url || "/avatar.png"}
                  alt={focusTeacher.profile.name || "Docente"}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-base font-semibold">{focusTeacher.profile.name || "Docente"}</p>
                  <p className="text-sm text-muted-foreground">
                    ★ {focusTeacher.summary.average.toFixed(2)} · {focusTeacher.summary.count} reseña
                    {focusTeacher.summary.count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <ReviewWidget
                  targetId={focusTeacher.profile.id}
                  targetType="teacher"
                  summary={focusTeacher.summary}
                  reviews={(focusTeacher.reviews as ReviewListItem[] | undefined) || []}
                  allowReview={true}
                  taskId={undefined}
                  currentUser={{ id: userId, name: studentProfile?.name || "Tú", avatar: studentProfile?.profile_picture_url || null }}
                  initialUserReview={
                    focusTeacher.myReview
                      ? {
                          id: focusTeacher.myReview.id,
                          rating: focusTeacher.myReview.rating ?? 0,
                          comment: focusTeacher.myReview.comment,
                          created_at: focusTeacher.myReview.created_at,
                        }
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <WorkedSection
        title="Docentes con los que trabajaste"
        entries={workedWithDetails}
        currentUser={{ id: userId, name: studentProfile?.name || "Tú", avatar: studentProfile?.profile_picture_url || null }}
        targetType="teacher"
      />

      <AvailableSection title="Docentes disponibles" entries={availableTeachers} />
    </div>
  )
}

async function renderTeacherView(userId: string, teacherProfile?: Profile | null) {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, student_id, status, created_at")
    .eq("teacher_id", userId)
    .not("student_id", "is", null)
    .neq("status", "cancelled")

  const tasksByStudent = new Map<string, { count: number; lastTaskId: string | null; lastTaskTitle: string | null; lastCreated: string | null }>()
  for (const task of tasks || []) {
    const studentId = task.student_id as string
    const current = tasksByStudent.get(studentId) || { count: 0, lastTaskId: null, lastTaskTitle: null, lastCreated: null }
    const nextCount = current.count + 1
    const isMoreRecent = !current.lastCreated || new Date(task.created_at || "").getTime() > new Date(current.lastCreated).getTime()
    tasksByStudent.set(studentId, {
      count: nextCount,
      lastTaskId: isMoreRecent ? task.id : current.lastTaskId,
      lastTaskTitle: isMoreRecent ? task.title : current.lastTaskTitle,
      lastCreated: isMoreRecent ? task.created_at : current.lastCreated,
    })
  }

  const workedStudentIds = Array.from(tasksByStudent.keys())

  const { data: ratingRows } = await supabase
    .from("student_reviews")
    .select("student_id, rating")

  const ratingMap = new Map<string, { average: number; reviewCount: number }>()
  for (const row of ratingRows || []) {
    const key = row.student_id as string
    const current = ratingMap.get(key) || { average: 0, reviewCount: 0 }
    const nextCount = current.reviewCount + 1
    const nextAverage = (current.average * current.reviewCount + Number(row.rating || 0)) / nextCount
    ratingMap.set(key, { average: nextAverage, reviewCount: nextCount })
  }

  const { data: workedProfiles } = workedStudentIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, profile_picture_url")
        .in("id", workedStudentIds)
        .eq("role", "student")
    : { data: [] }

  const workedStudents: RankedEntity[] = (workedProfiles || []).map((profile) => {
    const taskInfo = tasksByStudent.get(profile.id)!
    const ratingInfo = ratingMap.get(profile.id) || { average: 0, reviewCount: 0 }
    return {
      profile,
      stats: {
        average: ratingInfo.average,
        reviewCount: ratingInfo.reviewCount,
        tasksCount: taskInfo.count,
        lastTaskId: taskInfo.lastTaskId,
        lastTaskTitle: taskInfo.lastTaskTitle,
      },
    }
  })

  const topRatedIds = Array.from(ratingMap.entries())
    .filter(([id]) => !workedStudentIds.includes(id))
    .sort((a, b) => b[1].average - a[1].average)
    .slice(0, 8)
    .map(([id]) => id)

  const availableQuery = supabase
    .from("profiles")
    .select("id, name, profile_picture_url")
    .eq("role", "student")

  if (topRatedIds.length > 0) {
    availableQuery.in("id", topRatedIds)
  } else if (workedStudentIds.length > 0) {
    availableQuery.not("id", "in", `(${workedStudentIds.join(",")})`)
  }

  const { data: availableProfiles } = await availableQuery.limit(8)

  const availableStudents: RankedEntity[] = (availableProfiles || []).map((profile) => {
    const ratingInfo = ratingMap.get(profile.id) || { average: 0, reviewCount: 0 }
    return {
      profile,
      stats: {
        average: ratingInfo.average,
        reviewCount: ratingInfo.reviewCount,
        tasksCount: 0,
        lastTaskId: null,
        lastTaskTitle: null,
      },
    }
  })

  const workedWithDetails = await Promise.all(
    workedStudents
      .sort((a, b) => b.stats.average - a.stats.average)
      .map(async (entry) => {
        const summary = await getStudentReviewSummary(entry.profile.id)
        const reviews = await listStudentReviews({ studentId: entry.profile.id, limit: 5 })
        const myReview = await getMyStudentReview(entry.profile.id)
        return {
          ...entry,
          summary: summary.status === "success" ? summary.summary || DEFAULT_SUMMARY : DEFAULT_SUMMARY,
          reviews: reviews.status === "success" ? ((reviews.reviews as ReviewListItem[]) || []) : [],
          myReview: myReview.review
            ? {
                id: myReview.review.id,
                rating: myReview.review.rating ?? 0,
                comment: myReview.review.comment,
                created_at: myReview.review.created_at,
              }
            : undefined,
        }
      }),
  )

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <Header title="Reseñas de estudiantes" description="Califica con estrellas por tarea y deja tus reseñas escritas aquí. El ranking se basa en las tareas que has realizado con cada estudiante." />

      <WorkedSection
        title="Estudiantes con los que trabajaste"
        entries={workedWithDetails}
        currentUser={{ id: userId, name: teacherProfile?.name || "Tú", avatar: teacherProfile?.profile_picture_url || null }}
        targetType="student"
      />

      <AvailableSection title="Estudiantes disponibles" entries={availableStudents} />
    </div>
  )
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

type ReviewEntry = RankedEntity & {
  summary: ReviewSummary
  reviews: ReviewListItem[]
  myReview?: { id: string; rating: number; comment: string | null; created_at?: string | null }
}

function WorkedSection({
  title,
  entries,
  currentUser,
  targetType,
}: {
  title: string
  entries: ReviewEntry[]
  currentUser: { id: string; name: string | null; avatar: string | null }
  targetType: "teacher" | "student"
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="outline">{entries.length} listado</Badge>
      </div>
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No hay participantes para mostrar aún.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.profile.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <AvatarSquare name={entry.profile.name} src={entry.profile.profile_picture_url} />
                  <div>
                    <p className="text-base font-semibold">{entry.profile.name || (targetType === "teacher" ? "Docente" : "Estudiante")}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.stats.tasksCount} tarea{entry.stats.tasksCount === 1 ? "" : "s"} juntos · {entry.stats.reviewCount} reseña{entry.stats.reviewCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                    ⭐ {entry.stats.average.toFixed(2)}
                  </Badge>
                  {entry.stats.lastTaskTitle && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      Última tarea: {entry.stats.lastTaskTitle}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ReviewWidget
                  targetId={entry.profile.id}
                  targetType={targetType}
                  summary={entry.summary}
                  reviews={entry.reviews}
                  allowReview={Boolean(entry.stats.lastTaskId)}
                  taskId={entry.stats.lastTaskId || undefined}
                  currentUser={currentUser}
                  initialUserReview={entry.myReview}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function AvailableSection({ title, entries }: { title: string; entries: RankedEntity[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="outline">{entries.length} listado</Badge>
      </div>
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">No hay más participantes para mostrar.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries
            .sort((a, b) => b.stats.average - a.stats.average)
            .map((entry) => (
              <Card key={entry.profile.id} className="p-4">
                <div className="flex items-center gap-3">
                  <AvatarSquare name={entry.profile.name} src={entry.profile.profile_picture_url} />
                  <div className="min-w-0">
                    <p className="text-base font-semibold line-clamp-1">{entry.profile.name || "Perfil"}</p>
                    <p className="text-xs text-muted-foreground">
                      ⭐ {entry.stats.average.toFixed(2)} · {entry.stats.reviewCount} reseña{entry.stats.reviewCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </section>
  )
}

function AvatarSquare({ name, src }: { name: string | null; src: string | null }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name || "Perfil"}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold">
      {(name || "P")[0]}
    </div>
  )
}
