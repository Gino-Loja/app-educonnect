import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface RecentActivityProps {
  activity: {
    recentTasks: Array<{
      id: string
      title: string
      status: string
      created_at: string
      student: { name: string | null; email: string } | null
    }>
    recentUsers: Array<{
      id: string
      name: string | null
      email: string
      role: string
      created_at: string | null
    }>
  }
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400",
  disputed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
}

const statusLabels: Record<string, string> = {
  open: "Abierta",
  in_progress: "En Progreso",
  submitted: "Entregada",
  completed: "Completada",
  cancelled: "Cancelada",
  disputed: "En Disputa",
}

const roleLabels: Record<string, string> = {
  student: "Estudiante",
  teacher: "Profesor",
  admin: "Administrador",
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas Recientes</CardTitle>
          <CardDescription>Últimas 10 tareas creadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tareas recientes
              </p>
            ) : (
              activity.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.student?.name || task.student?.email || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(task.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                      statusColors[task.status] || statusColors.open
                    }`}
                  >
                    {statusLabels[task.status] || task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Recientes</CardTitle>
          <CardDescription>Últimos 10 registros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios recientes
              </p>
            ) : (
              activity.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    {user.created_at && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap ml-2">
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
