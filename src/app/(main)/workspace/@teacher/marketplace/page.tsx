import { getAvailableTasks, GetTasksOptions } from "@/lib/data/task-actions"
import { getMyProposals } from "@/lib/data/proposal-actions"
import { TasksListTeacher } from "@/components/tasks/TasksListTeacher"
import { IconSearch } from "@tabler/icons-react"
import type { UserProposal } from "@/components/tasks/TaskCardTeacher"

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; subject?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const subject = params.subject
  const search = params.search

  const options: GetTasksOptions = {
    page,
    pageSize: 9,
    subject,
    search,
  }

  const result = await getAvailableTasks(options)

  // Fetch user's proposals to show which tasks already have proposals
  const proposalsResult = await getMyProposals()
  const userProposalsMap = new Map<string, UserProposal>()

  if (proposalsResult.proposals) {
    proposalsResult.proposals.forEach((proposal) => {
      userProposalsMap.set(proposal.task_id, {
        id: proposal.id,
        status: proposal.status,
        proposed_amount: proposal.proposed_amount,
        estimated_hours: proposal.estimated_hours || 0,
        cover_letter: proposal.cover_letter,
      })
    })
  }

  if ("error" in result) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Tareas Disponibles</h1>
          <p className="text-muted-foreground">Encuentra nuevas oportunidades de trabajo</p>
        </div>

        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">{result.error}</p>
        </div>
      </div>
    )
  }

  async function handlePageChange(newPage: number) {
    "use server"
    const result = await getAvailableTasks({ ...options, page: newPage })
    if ("error" in result) {
      return { tasks: [], total: 0 }
    }
    return { tasks: result.tasks, total: result.total }
  }

  async function handleFiltersChange(filters: { subject?: string; search?: string }) {
    "use server"
    const result = await getAvailableTasks({
      ...options,
      page: 1,
      subject: filters.subject,
      search: filters.search,
    })
    if ("error" in result) {
      return { tasks: [], total: 0 }
    }
    return { tasks: result.tasks, total: result.total }
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
          <IconSearch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Tareas Disponibles</h1>
          <p className="text-muted-foreground">
            {result.total} {result.total === 1 ? "tarea disponible" : "tareas disponibles"}
          </p>
        </div>
      </div>

      <TasksListTeacher
        initialTasks={result.tasks}
        initialTotal={result.total}
        initialPage={result.page}
        initialPageSize={result.pageSize}
        onPageChange={handlePageChange}
        onFiltersChange={handleFiltersChange}
        showFilters={true}
        userProposalsMap={userProposalsMap}
      />
    </div>
  )
}
