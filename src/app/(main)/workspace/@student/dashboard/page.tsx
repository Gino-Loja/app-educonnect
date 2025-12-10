import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/model/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  IconBriefcase,
  IconCalendar,
  IconCurrencyDollar,
  IconFileText,
  IconStar,
  IconTrendingUp,
} from "@tabler/icons-react"

type TaskRow = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  "id" | "title" | "status" | "budget_min" | "budget_max" | "updated_at" | "due_date"
> & {
  teacher?: { name: string | null } | null
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  disputed: "bg-amber-100 text-amber-800",
}

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      })
    : "Sin fecha"

async function getStudentStats(studentId: string) {
  const supabase = await createClient()

  const [tasksRes, proposalsRes, milestonesRes, reviewsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, status, budget_min, budget_max, updated_at, due_date, teacher:profiles!tasks_teacher_id_fkey(name)")
      .eq("student_id", studentId),
    supabase.from("proposals").select("id, status, task:tasks!inner(student_id)").eq("task.student_id", studentId),
    supabase
      .from("payment_milestones")
      .select("amount, status, tasks!inner(student_id)")
      .eq("tasks.student_id", studentId),
    supabase.from("student_reviews").select("rating").eq("student_id", studentId),
  ])

  const tasks = (tasksRes.data as TaskRow[] | null) ?? []
  const proposals = proposalsRes.data ?? []
  const milestones = milestonesRes.data ?? []
  const reviews = reviewsRes.data ?? []

  const openTasks = tasks.filter((t) => t.status === "open").length
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "submitted").length
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const pendingProposals = proposals.filter((p) => p.status === "pending").length

  const custodyAmount = milestones
    .filter((m) => m.status === "in_custody")
    .reduce((sum, m) => sum + (m.amount ?? 0), 0)
  const paidAmount = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + (m.amount ?? 0), 0)

  const totalReviews = reviews.length
  const rating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews).toFixed(2))
      : 0

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return {
    stats: {
      openTasks,
      activeTasks,
      completedTasks,
      pendingProposals,
      custodyAmount,
      paidAmount,
      rating,
      totalReviews,
    },
    recentTasks,
  }
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { stats, recentTasks } = await getStudentStats(user.id)

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard del Estudiante</h1>
        <p className="text-muted-foreground">Resumen de tus tareas, propuestas y pagos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas abiertas</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTasks}</div>
            <p className="text-xs text-muted-foreground">Publicadas y esperando profesor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En progreso</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">Tareas en curso o entregadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fondos</CardTitle>
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">En custodia: ${stats.custodyAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pagado: ${stats.paidAmount.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propuestas</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">Propuestas pendientes de revisar</p>
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

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Actividad reciente</h2>
        <Card>
          <CardContent className="pt-6">
            {recentTasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Aún no tienes actividad reciente</p>
                <Button asChild className="mt-4">
                  <Link href="/workspace/mis-tareas">Ir a mis tareas</Link>
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
                        {task.teacher?.name ? `Profesor: ${task.teacher.name}` : "Profesor asignado próximamente"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconCalendar className="h-4 w-4" />
                        <span>Última act.: {formatDate(task.updated_at)}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>Vence: {formatDate(task.due_date)}</span>
                      </div>
                    </div>
                    <Badge className={`text-xs ${STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {task.status.replace("_", " ")}
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
