import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { getMyTasks, GetTasksOptions } from "@/lib/data/task-actions"
import { TasksListStudent } from "@/components/tasks/TasksListStudent"
import { createClient } from "@/utils/supabase/server"

export default async function MisTareasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const status = params.status || "all"
  const search = params.search

  const options: GetTasksOptions = {
    page,
    pageSize: 9,
    status: status as GetTasksOptions["status"],
    search,
  }

  const result = await getMyTasks(options)

  // Get student name for watermark
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let studentName = "Estudiante"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    studentName = profile?.name || user.email?.split("@")[0] || "Estudiante"
  }

  if ("error" in result) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Mis Tareas</h1>
            <p className="text-muted-foreground">Gestiona tus tareas educativas</p>
          </div>
          <Button asChild>
            <Link href="/workspace/mis-tareas/nueva">
              <IconPlus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">{result.error}</p>
        </div>
      </div>
    )
  }

  async function handlePageChange(newPage: number) {
    "use server"
    const result = await getMyTasks({ ...options, page: newPage })
    if ("error" in result) { 
      return { tasks: [], total: 0 }
    }
    return { tasks: result.tasks, total: result.total }
  }

  async function handleFiltersChange(filters: { status?: string; search?: string }) {
    "use server"
    const result = await getMyTasks({
      ...options,
      page: 1,
      status: filters.status as GetTasksOptions["status"],
      search: filters.search,
    })
    if ("error" in result) {
      return { tasks: [], total: 0 }
    }
    return { tasks: result.tasks, total: result.total }
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mis Tareas</h1>
          <p className="text-muted-foreground">Gestiona tus tareas educativas</p>
        </div>
        <Button asChild>
          <Link href="/workspace/mis-tareas/nueva">
            <IconPlus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Link>
        </Button>
      </div>

      <TasksListStudent
        initialTasks={result.tasks}
        initialTotal={result.total}
        initialPage={result.page}
        initialPageSize={result.pageSize}
        studentName={studentName}
        onPageChange={handlePageChange}
        onFiltersChange={handleFiltersChange}
        showFilters={true}
      />
    </div>
  )
}
