import { getReceivedProposals } from "@/lib/data/proposal-actions"
import { ProposalsListStudent } from "@/components/tasks/ProposalsListStudent"
import { ProposalsFilterSelect } from "@/components/tasks/ProposalsFilterSelect"
import { createClient } from "@/utils/supabase/server"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PropuestasPage({ searchParams }: Props) {
  const params = await searchParams
  const status = (params.status as string) || "all"
  const page = Number(params.page) || 1

  const result = await getReceivedProposals({
    page,
    limit: 10,
    status: status === "all" ? undefined : status as any,
  })

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

  const stats = {
    pending: result.proposals.filter(p => p.status === "pending").length,
    accepted: result.proposals.filter(p => p.status === "accepted").length,
    rejected: result.proposals.filter(p => p.status === "rejected").length,
    withdrawn: result.proposals.filter(p => p.status === "withdrawn").length,
  }

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
            {status === "all"
              ? "No has recibido propuestas aún"
              : `No hay propuestas con estado "${status}"`}
          </p>
        </div>
      ) : (
        <ProposalsListStudent proposals={result.proposals} studentName={studentName} />
      )}

      {/* Pagination would go here if needed */}
    </div>
  )
}
