import { getReceivedProposals } from "@/lib/data/proposal-actions"
import { ProposalsListStudent } from "@/components/tasks/ProposalsListStudent"
import { ProposalsFilterSelect } from "@/components/tasks/ProposalsFilterSelect"

type ProposalStatusFilter = "all" | "pending" | "accepted" | "rejected" | "withdrawn" | "task_cancelled"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PropuestasPage({ searchParams }: Props) {
  const params = await searchParams
  const status = (params.status as ProposalStatusFilter) || "all"
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15

  const result = await getReceivedProposals({
    page,
    limit: pageSize,
    status,
  })

  const stats = {
    pending: result.proposals.filter(p => p.status === "pending").length,
    accepted: result.proposals.filter(p => p.status === "accepted").length,
    rejected: result.proposals.filter(p => p.status === "rejected").length,
    withdrawn: result.proposals.filter(p => p.status === "withdrawn").length,
  }

  const emptyStateMessages: Record<string, string> = {
    pending: "No hay propuestas pendientes",
    accepted: "No hay propuestas aceptadas",
    rejected: "No hay propuestas rechazadas",
    withdrawn: "No hay propuestas retiradas",
    task_cancelled: "No tienes tareas canceladas",
  }

  const emptyMessage = status === "all"
    ? "No has recibido propuestas aún"
    : emptyStateMessages[status] || "No hay propuestas con este filtro"

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Propuestas Recibidas</h1>
          <p className="text-muted-foreground">
            Revisa y gestiona las propuestas de profesores para tus tareas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats.pending > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white">
              {stats.pending} pendiente{stats.pending !== 1 ? "s" : ""}
            </span>
          )}
          <ProposalsFilterSelect defaultValue={status} />
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de propuestas</p>
          <p className="text-2xl font-bold">{result.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.pending}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Aceptadas</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.accepted}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Rechazadas</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Proposals list */}
      {result.proposals.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <ProposalsListStudent
          proposals={result.proposals}
          total={result.total}
          currentPage={page}
          pageSize={pageSize}
          status={status}
        />
      )}

      {/* Pagination would go here if needed */}
    </div>
  )
}
