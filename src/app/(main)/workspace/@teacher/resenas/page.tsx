import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import {
  getStudentReviewSummary,
  listStudentReviews,
  getMyStudentReview,
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

type RankedStudent = {
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
  myReview?: StudentReviewRow | null
}

type StudentReviewRow = Database["public"]["Tables"]["student_reviews"]["Row"]
type ReviewWithProfile = StudentReviewRow & {
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

  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("id, name, profile_picture_url")
    .eq("id", user.id)
    .single()

  const { workedStudents, availableProfiles } = await loadStudentData(supabase, user.id)

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Reseñas</h1>
        <p className="text-muted-foreground">Califica con estrellas por tarea y deja comentarios aquí.</p>
      </div>

      <WorkedSection
        title="Estudiantes con los que trabajaste"
        entries={workedStudents}
        currentUser={{ id: user.id, name: teacherProfile?.name || "Tú", avatar: teacherProfile?.profile_picture_url || null }}
      />

      <AvailableSection title="Estudiantes disponibles" entries={availableProfiles || []} />
    </div>
  )
}

async function loadStudentData(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, teacherId: string) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, student_id, status, created_at")
    .eq("teacher_id", teacherId)
    .not("student_id", "is", null)
    .neq("status", "cancelled")

  const tasksByStudent = new Map<string, { count: number; lastTaskId: string | null; lastTaskTitle: string | null; lastCreated: string | null }>()
  for (const task of tasks || []) {
    const studentId = task.student_id as string
    const current = tasksByStudent.get(studentId) || { count: 0, lastTaskId: null, lastTaskTitle: null, lastCreated: null }
    const nextCount = current.count + 1
    const isRecent = !current.lastCreated || new Date(task.created_at || "").getTime() > new Date(current.lastCreated).getTime()
    tasksByStudent.set(studentId, {
      count: nextCount,
      lastTaskId: isRecent ? task.id : current.lastTaskId,
      lastTaskTitle: isRecent ? task.title : current.lastTaskTitle,
      lastCreated: isRecent ? task.created_at : current.lastCreated,
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

  const workedStudents: RankedStudent[] = await Promise.all(
    (workedProfiles || []).map(async (profile) => {
      const taskInfo = tasksByStudent.get(profile.id)!
      const ratingInfo = ratingMap.get(profile.id) || { average: 0, reviewCount: 0 }
      const summary = await getStudentReviewSummary(profile.id)
      const reviews = await listStudentReviews({ studentId: profile.id, limit: 5 })
      const myReview = await getMyStudentReview(profile.id)
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
    .eq("role", "student")

  if (workedStudentIds.length > 0) {
    availableQuery.not("id", "in", `(${workedStudentIds.join(",")})`)
  }

  const { data: availableProfiles } = await availableQuery.limit(8)

  return { workedStudents, availableProfiles }
}

function WorkedSection({
  title,
  entries,
  currentUser,
}: {
  title: string
  entries: RankedStudent[]
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
            No has dejado reseñas aún. Completa tareas con estudiantes para calificarlos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries
            .sort((a, b) => b.stats.average - a.stats.average)
            .map((student) => (
              <Card key={student.profile.id} className="flex flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-3">
                    <AvatarSquare name={student.profile.name} src={student.profile.profile_picture_url} />
                    <div>
                      <p className="text-base font-semibold">{student.profile.name || "Estudiante"}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.stats.tasksCount} tarea{student.stats.tasksCount === 1 ? "" : "s"} juntos · {student.stats.reviewCount} reseña{student.stats.reviewCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                      ⭐ {student.stats.average.toFixed(2)}
                    </Badge>
                    {student.stats.lastTaskTitle && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        Última tarea: {student.stats.lastTaskTitle}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ReviewWidget
                    targetId={student.profile.id}
                    targetType="student"
                    summary={student.summary}
                    reviews={(student.reviews as ReviewListItem[] | undefined) || []}
                    allowReview={Boolean(student.stats.lastTaskId)}
                    taskId={student.stats.lastTaskId || undefined}
                    currentUser={currentUser}
                    initialUserReview={
                      student.myReview
                        ? {
                            id: student.myReview.id,
                            rating: student.myReview.rating ?? 0,
                            comment: student.myReview.comment,
                            created_at: student.myReview.created_at,
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
            No hay más estudiantes disponibles para mostrar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((student) => (
            <Card key={student.id} className="p-4">
              <div className="flex items-center gap-3">
                <AvatarSquare name={student.name} src={student.profile_picture_url} />
                <div className="min-w-0">
                  <p className="text-base font-semibold line-clamp-1">{student.name || "Estudiante"}</p>
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
