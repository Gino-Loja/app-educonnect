import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconBriefcase } from "@tabler/icons-react"
import { getAssignedTasks } from "@/lib/data/task-actions"
import { TasksWorkList } from "@/components/tasks/TasksWorkList"
import { TasksFilterSelect } from "@/components/tasks/TasksFilterSelect"
import type { Database } from "@/model/schema"

type TaskStatusFilter = Database["public"]["Enums"]["task_status"] | "all"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MisTrabajosPage({ searchParams }: Props) {
  const params = await searchParams
  const status = (params.status as TaskStatusFilter) || "all"
  const page = Number(params.page) || 1

  const result = await getAssignedTasks({
    page,
    limit: 12,
    status: status === "all" ? undefined : status,
  })

  const inProgressCount = result.tasks.filter(t => t.status === "in_progress").length
  const submittedCount = result.tasks.filter(t => t.status === "submitted").length

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <IconBriefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Mis Trabajos</h1>
            <p className="text-muted-foreground">
              Tareas que tienes asignadas actualmente
            </p>
          </div>
        </div>

        {result.tasks.length > 0 && (
          <TasksFilterSelect defaultValue={status} />
        )}
      </div>

      {/* Stats */}
      {result.tasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de trabajos</p>
            <p className="text-2xl font-bold">{result.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">En Progreso</p>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Enviados</p>
            <p className="text-2xl font-bold text-purple-600">{submittedCount}</p>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {result.tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <IconBriefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {status === "all"
                  ? "No hay trabajos asignados"
                  : `No hay trabajos con estado "${status}"`
                }
              </h3>
              <p className="mb-4">
                {status === "all"
                  ? "Cuando un estudiante acepte alguna de tus propuestas, aparecerán aquí"
                  : "Intenta con otro filtro"
                }
              </p>
              <Button asChild>
                <Link href="/workspace/marketplace">Ver Tareas Disponibles</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TasksWorkList tasks={result.tasks} />
      )}
    </div>
  )
}
