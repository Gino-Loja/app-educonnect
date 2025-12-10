import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import {
  getTeacherReviewSummary,
  listTeacherReviews,
  getMyTeacherReview,
} from "@/lib/data/review-actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReviewWidget } from "@/modules/reviews/review-widget"
import type { Database } from "@/model/schema"
import type { ReviewListItem } from "@/modules/reviews/review-widget"

type Profile = {
  id: string
  name: string | null
  profile_picture_url: string | null
}

type RankedTeacher = {
  profile: Profile
  stats: {
    average: number
    reviewCount: number
    tasksCount: number
    lastTaskId: string | null
    lastTaskTitle: string | null
  }
  summary: { average: number; count: number; distribution: [number, number, number, number, number] }
  reviews: ReviewWithProfile[]
  myReview?: TeacherReviewRow | null
}

type TeacherReviewRow = Database["public"]["Tables"]["teacher_reviews"]["Row"]
type ReviewWithProfile = TeacherReviewRow & {
  reviewer: {
    id: string
    name: string | null
    avatar: string | null
  }
}

const DEFAULT_SUMMARY = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] as [
  number,
  number,
  number,
  number,
  number,
] }

export default async function ResenasPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) redirect("/login")

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id, name, profile_picture_url")
    .eq("id", user.id)
    .single()

  const { workedTeachers, availableProfiles } = await loadTeacherData(supabase, user.id)

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Reseñas</h1>
        <p className="text-muted-foreground">Califica con estrellas por tarea y deja comentarios aquí.</p>
      </div>

      <WorkedSection
        title="Docentes con los que trabajaste"
        entries={workedTeachers}
        currentUser={{ id: user.id, name: studentProfile?.name || "Tú", avatar: studentProfile?.profile_picture_url || null }}
      />

      <AvailableSection title="Docentes disponibles" entries={availableProfiles || []} />
    </div>
  )
}

async function loadTeacherData(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, studentId: string) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, teacher_id, status, created_at")
    .eq("student_id", studentId)
    .not("teacher_id", "is", null)
    .neq("status", "cancelled")

  const tasksByTeacher = new Map<string, { count: number; lastTaskId: string | null; lastTaskTitle: string | null; lastCreated: string | null }>()
  for (const task of tasks || []) {
    const teacherId = task.teacher_id as string
    const current = tasksByTeacher.get(teacherId) || { count: 0, lastTaskId: null, lastTaskTitle: null, lastCreated: null }
    const nextCount = current.count + 1
    const isRecent = !current.lastCreated || new Date(task.created_at || "").getTime() > new Date(current.lastCreated).getTime()
    tasksByTeacher.set(teacherId, {
      count: nextCount,
      lastTaskId: isRecent ? task.id : current.lastTaskId,
      lastTaskTitle: isRecent ? task.title : current.lastTaskTitle,
      lastCreated: isRecent ? task.created_at : current.lastCreated,
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

  const workedTeachers: RankedTeacher[] = await Promise.all(
    (workedProfiles || []).map(async (profile) => {
      const taskInfo = tasksByTeacher.get(profile.id)!
      const ratingInfo = ratingMap.get(profile.id) || { average: 0, reviewCount: 0 }
      const summary = await getTeacherReviewSummary(profile.id)
      const reviews = await listTeacherReviews({ teacherId: profile.id, limit: 5 })
      const myReview = await getMyTeacherReview(profile.id)
      return {
        profile,
        stats: {
          average: ratingInfo.average,
          reviewCount: ratingInfo.reviewCount,
          tasksCount: taskInfo.count,
          lastTaskId: taskInfo.lastTaskId,
          lastTaskTitle: taskInfo.lastTaskTitle,
        },
        summary: summary.status === "success" ? summary.summary || DEFAULT_SUMMARY : DEFAULT_SUMMARY,
        reviews: reviews.status === "success" ? reviews.reviews || [] : [],
        myReview: myReview.review || undefined,
      }
    }),
  )

  const availableQuery = supabase
    .from("profiles")
    .select("id, name, profile_picture_url")
    .eq("role", "teacher")

  if (workedTeacherIds.length > 0) {
    availableQuery.not("id", "in", `(${workedTeacherIds.join(",")})`)
  }

  const { data: availableProfiles } = await availableQuery.limit(8)

  return { workedTeachers, availableProfiles }
}

function WorkedSection({
  title,
  entries,
  currentUser,
}: {
  title: string
  entries: RankedTeacher[]
  currentUser: { id: string; name: string | null; avatar: string | null }
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="outline">{entries.length} listado</Badge>
      </div>
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground text-center">
            No has dejado reseñas aún. Completa tareas con docentes para calificarlos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries
            .sort((a, b) => b.stats.average - a.stats.average)
            .map((teacher) => (
              <Card key={teacher.profile.id} className="flex flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-3">
                    <AvatarSquare name={teacher.profile.name} src={teacher.profile.profile_picture_url} />
                    <div>
                      <p className="text-base font-semibold">{teacher.profile.name || "Docente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {teacher.stats.tasksCount} tarea{teacher.stats.tasksCount === 1 ? "" : "s"} juntos · {teacher.stats.reviewCount} reseña{teacher.stats.reviewCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                      ⭐ {teacher.stats.average.toFixed(2)}
                    </Badge>
                    {teacher.stats.lastTaskTitle && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        Última tarea: {teacher.stats.lastTaskTitle}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ReviewWidget
                    targetId={teacher.profile.id}
                    targetType="teacher"
                    summary={teacher.summary}
                    reviews={(teacher.reviews as ReviewListItem[] | undefined) || []}
                    allowReview={Boolean(teacher.stats.lastTaskId)}
                    taskId={teacher.stats.lastTaskId || undefined}
                    currentUser={currentUser}
                    initialUserReview={
                      teacher.myReview
                        ? {
                            id: teacher.myReview.id,
                            rating: teacher.myReview.rating ?? 0,
                            comment: teacher.myReview.comment,
                            created_at: teacher.myReview.created_at,
                          }
                        : undefined
                    }
                  />
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </section>
  )
}

function AvailableSection({ title, entries }: { title: string; entries: Profile[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="outline">{entries.length} listado</Badge>
      </div>
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground text-center">
            No hay otros docentes disponibles para mostrar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((teacher) => (
            <Card key={teacher.id} className="p-4">
              <div className="flex items-center gap-3">
                <AvatarSquare name={teacher.name} src={teacher.profile_picture_url} />
                <div className="min-w-0">
                  <p className="text-base font-semibold line-clamp-1">{teacher.name || "Docente"}</p>
                  <p className="text-xs text-muted-foreground">Disponible para nuevos trabajos</p>
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
