import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/model/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  IconBriefcase,
  IconClockHour4,
  IconFileText,
  IconStar,
  IconTrendingUp,
  IconSearch,
  IconCalendar,
} from "@tabler/icons-react"

type TaskStatus = Database["public"]["Tables"]["tasks"]["Row"]["status"]
type TaskRow = Pick<Database["public"]["Tables"]["tasks"]["Row"], "id" | "title" | "status" | "updated_at" | "due_date">

type TeacherDashboardStats = {
  totalEarnings: number
  completedTasks: number
  activeTasks: number
  pendingProposals: number
  rating: number
  totalReviews: number
}

type TeacherRecentTask = TaskRow & { student?: { name: string | null } | null }

const STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  disputed: "bg-amber-100 text-amber-800",
}

async function getTeacherDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
  const supabase = await createClient()

  const [taskRes, proposalRes, milestoneRes, reviewRes] = await Promise.all([
    supabase.from("tasks").select("id, status").eq("teacher_id", teacherId),
    supabase.from("proposals").select("id, status").eq("teacher_id", teacherId),
    supabase
      .from("payment_milestones")
      .select("amount, status, tasks!inner(teacher_id)")
      .eq("tasks.teacher_id", teacherId)
      .eq("status", "paid"),
    supabase.from("teacher_reviews").select("rating").eq("teacher_id", teacherId),
  ])

  const tasks = (taskRes.data as TaskRow[] | null) ?? []
  const proposals = proposalRes.data ?? []
  const paidMilestones = milestoneRes.data ?? []
  const reviews = reviewRes.data ?? []

  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "submitted").length
  const pendingProposals = proposals.filter((p) => p.status === "pending").length
  const totalEarnings = paidMilestones.reduce((sum, m) => sum + (m.amount ?? 0), 0)

  const totalReviews = reviews.length
  const rating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews).toFixed(2))
      : 0

  return { totalEarnings, completedTasks, activeTasks, pendingProposals, rating, totalReviews }
}

async function getRecentTasks(teacherId: string): Promise<TeacherRecentTask[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, updated_at, due_date, student:profiles!tasks_student_id_fkey(name)")
    .eq("teacher_id", teacherId)
    .order("updated_at", { ascending: false })
    .limit(5)

  return (data as TeacherRecentTask[] | null) ?? []
}

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      })
    : "Sin fecha"

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [stats, recentTasks] = await Promise.all([getTeacherDashboardStats(user.id), getRecentTasks(user.id)])

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard del Profesor</h1>
        <p className="text-muted-foreground">Gestiona tus propuestas, trabajos activos y ganancias</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">De {stats.completedTasks} tareas completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
            <IconClockHour4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">En progreso actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propuestas Pendientes</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">Esperando respuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating}/5</div>
            <p className="text-xs text-muted-foreground">Promedio de {stats.totalReviews} reseñas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/workspace/marketplace">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <IconSearch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Buscar Tareas</CardTitle>
                  <CardDescription>Encuentra nuevas oportunidades de trabajo</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/workspace/mis-propuestas">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <IconFileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle>Mis Propuestas</CardTitle>
                  <CardDescription>Gestiona tus ofertas enviadas ({stats.pendingProposals} pendientes)</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/workspace/mis-trabajos">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <IconBriefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Mis Trabajos</CardTitle>
                  <CardDescription>Tareas asignadas y en progreso ({stats.activeTasks} activas)</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Actividad Reciente</h2>
        <Card>
          <CardContent className="pt-6">
            {recentTasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No hay actividad reciente para mostrar</p>
                <Button asChild className="mt-4">
                  <Link href="/workspace/marketplace">Buscar Nuevas Tareas</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.student?.name ? `Estudiante: ${task.student.name}` : "Estudiante pendiente"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconCalendar className="h-4 w-4" />
                        <span>Última act.: {formatDate(task.updated_at)}</span>
                        <span className="ml-2">Vence: {formatDate(task.due_date)}</span>
                      </div>
                    </div>
                    <Badge className={`text-xs ${STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {(task.status as TaskStatus).replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
