import { Card, CardContent } from "@/components/ui/card"
import { IconFileText, IconCheck, IconX, IconClock, IconBan } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { getMyProposals } from "@/lib/data/proposal-actions"
import { ProposalsFilterSelect } from "@/components/tasks/ProposalsFilterSelect"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const allowedStatuses = ["pending", "accepted", "rejected", "withdrawn", "task_cancelled"] as const
type AllowedStatus = (typeof allowedStatuses)[number]

const isAllowedStatus = (value: string): value is AllowedStatus => {
  return allowedStatuses.includes(value as AllowedStatus)
}

export default async function MisPropuestasPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const rawStatus = (params.status as string) || "all"
  const status: AllowedStatus | "all" = isAllowedStatus(rawStatus) ? rawStatus : "all"
  const pageSize = 15

  const result = await getMyProposals({
    page,
    limit: pageSize,
    status,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize))

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

      {/* Proposals Table */}
      {result.proposals.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Enviada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.proposals.map((proposal) => {
                const isCancelled = proposal.task?.status === "cancelled"
                const statusConfig: Record<string, { label: string; className: string }> = {
                  pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
                  accepted: { label: "Aceptada", className: "bg-green-100 text-green-700" },
                  rejected: { label: "Rechazada", className: "bg-red-100 text-red-700" },
                  withdrawn: { label: "Retirada", className: "bg-slate-100 text-slate-700" },
                }
                const statusInfo = statusConfig[proposal.status] || { label: proposal.status, className: "bg-slate-100 text-slate-700" }
                const studentId = proposal.task?.student?.id
                const studentName = proposal.task?.student?.name || "Estudiante"

                return (
                  <TableRow key={proposal.id} className={isCancelled ? "bg-slate-50" : undefined}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold leading-tight line-clamp-2">{proposal.task?.title ?? "Tarea sin título"}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{proposal.task?.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        {studentId ? (
                          <Link
                            href={`/workspace/resenas?studentId=${studentId}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {studentName}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">{studentName}</p>
                        )}
                        {proposal.task?.status === "cancelled" && (
                          <Badge variant="destructive" className="text-xs w-fit">Tarea cancelada</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="align-top font-semibold">${proposal.proposed_amount.toFixed(2)}</TableCell>
                    <TableCell className="align-top">{proposal.estimated_hours ? `${proposal.estimated_hours}h` : "—"}</TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      {proposal.task ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/workspace/mis-trabajos/${proposal.task.id}`}>
                            Ver tarea
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin tarea</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground border-t">
            <span>Mostrando {result.proposals.length} de {result.total} propuestas</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild
                >
                  <Link href={buildPageLink(Math.max(1, page - 1), status)}>
                    Anterior
                  </Link>
                </Button>
                <span className="text-xs">Página {page} de {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  asChild
                >
                  <Link href={buildPageLink(Math.min(totalPages, page + 1), status)}>
                    Siguiente
                  </Link>
                </Button>
              </div>
            )}
          </div>
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

function buildPageLink(page: number, status: AllowedStatus | "all") {
  const params = new URLSearchParams()
  if (status !== "all") params.set("status", status)
  if (page > 1) params.set("page", page.toString())
  const query = params.toString()
  return query ? `?${query}` : ""
}
