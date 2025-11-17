import { Card, CardContent } from "@/components/ui/card"
import { IconFileText, IconCheck, IconX, IconClock, IconBan } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getMyProposals } from "@/lib/data/proposal-actions"
import { ProposalCardTeacher } from "@/components/tasks/ProposalCardTeacher"
import { ProposalsFilterSelect } from "@/components/tasks/ProposalsFilterSelect"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MisPropuestasPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = (params.status as string) || "all"

  const result = await getMyProposals({
    page,
    limit: 12,
    status: status === "all" ? "all" : (status as "pending" | "accepted" | "rejected" | "withdrawn"),
  })

  const stats = {
    total: result.total,
    pending: result.proposals.filter((p) => p.status === "pending").length,
    accepted: result.proposals.filter((p) => p.status === "accepted").length,
    rejected: result.proposals.filter((p) => p.status === "rejected").length,
    withdrawn: result.proposals.filter((p) => p.status === "withdrawn").length,
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <IconFileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Mis Propuestas</h1>
            <p className="text-muted-foreground">
              {result.total > 0
                ? `Gestiona tus ${result.total} propuesta${result.total !== 1 ? "s" : ""} enviada${result.total !== 1 ? "s" : ""}`
                : "Gestiona todas tus ofertas enviadas"}
            </p>
          </div>
        </div>

        {result.proposals.length > 0 && (
          <ProposalsFilterSelect defaultValue={status} />
        )}
      </div>

      {/* Stats */}
      {result.proposals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <IconFileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                  <IconClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aceptadas</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <IconX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rechazadas</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/20">
                  <IconBan className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                  <p className="text-2xl font-bold">{stats.withdrawn}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proposals Grid */}
      {result.proposals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.proposals.map((proposal) => (
            <ProposalCardTeacher
              key={proposal.id}
              proposal={proposal}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <IconFileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {status !== "all"
                  ? `No hay propuestas ${status === "pending" ? "pendientes" : status === "accepted" ? "aceptadas" : status === "rejected" ? "rechazadas" : "canceladas"}`
                  : "No hay propuestas aún"}
              </h3>
              <p className="mb-4">
                {status !== "all"
                  ? "Intenta cambiar el filtro para ver otras propuestas"
                  : "Comienza a buscar tareas y envía tus primeras propuestas"}
              </p>
              <Button asChild>
                <Link href="/workspace/marketplace">
                  <IconFileText className="mr-2 h-4 w-4" />
                  Buscar Tareas
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
