import { getAdminTasks } from "@/lib/data/admin-task-actions"
import { TasksTable } from "@/components/admin/TasksTable"
import { TasksFilters } from "@/components/admin/TasksFilters"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminTasksPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = (params.status as string) || "all"
  const search = (params.search as string) || ""

  const result = await getAdminTasks({
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supervisión de Tareas</h1>
        <p className="text-muted-foreground">
          Administra y supervisa todas las tareas de la plataforma
        </p>
      </div>

      {/* Filters */}
      <TasksFilters defaultStatus={status} defaultSearch={search} />

      {/* Tasks Table */}
      <TasksTable tasks={result.tasks} pagination={result} />
    </div>
  )
}
