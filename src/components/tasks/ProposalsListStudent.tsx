"use client"

import Link from "next/link"
import { AcceptProposalDialog } from "@/components/forms/AcceptProposalDialog"
import { acceptProposal, rejectProposal } from "@/lib/data/proposal-actions"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Database } from "@/model/schema"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowUpRight, IconCheck, IconX } from "@tabler/icons-react"

interface ProposalsListStudentProps {
  proposals: Array<{
    id: string
    proposed_amount: number
    estimated_hours: number | null
    cover_letter: string
    status: Database["public"]["Enums"]["proposal_status"]
    created_at: string
    teacher_id: string
    task?: {
      id: string
      title: string
      status?: string
      installments?: number | null
    }
    teacher?: {
      id?: string | null
      name: string | null
      profile_picture_url: string | null
    }
  }>
  total: number
  currentPage: number
  pageSize: number
  status: string
}

type ProposalItem = ProposalsListStudentProps["proposals"][number]
export function ProposalsListStudent({
  proposals,
  total,
  currentPage,
  pageSize,
  status,
}: ProposalsListStudentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingAction, setPendingAction] = useState<{
    type: "accept" | "reject"
    proposalId: string
  } | null>(null)

  // Accept dialog state
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [proposalToAccept, setProposalToAccept] = useState<ProposalItem | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const statusConfig = useMemo(
    () => ({
      pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
      accepted: { label: "Aceptada", className: "bg-green-100 text-green-700" },
      rejected: { label: "Rechazada", className: "bg-red-100 text-red-700" },
      withdrawn: { label: "Cancelada", className: "bg-slate-100 text-slate-700" },
    }),
    []
  )

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (status && status !== "all") params.set("status", status)
    if (page > 1) params.set("page", page.toString())
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const handleAccept = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    if (proposal) {
      setProposalToAccept(proposal)
      setAcceptDialogOpen(true)
    }
  }

  const handleReject = (proposalId: string) => {
    setPendingAction({ type: "reject", proposalId })
  }

  const confirmAccept = async () => {
    if (!proposalToAccept) return

    try {
      const result = await acceptProposal(proposalToAccept.id)

      if (result.status === "success") {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al aceptar la propuesta")
    } finally {
      setAcceptDialogOpen(false)
      setProposalToAccept(null)
    }
  }

  const confirmReject = async () => {
    if (!pendingAction) return

    try {
      const result = await rejectProposal(pendingAction.proposalId)

      if (result.status === "success") {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al rechazar la propuesta")
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesor</TableHead>
              <TableHead>Tarea</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead>Enviada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal) => {
              const teacherName = proposal.teacher?.name || "Profesor"
              const teacherId = proposal.teacher?.id || proposal.teacher_id
              const taskTitle = proposal.task?.title || "Tarea"
              const taskStatus = proposal.task?.status
              const isTaskCancelled = taskStatus === "cancelled"
              const statusInfo = statusConfig[proposal.status] || {
                label: proposal.status,
                className: "bg-slate-100 text-slate-700",
              }
              const isPending = proposal.status === "pending"
              const sentDistance = formatDistanceToNow(new Date(proposal.created_at), {
                addSuffix: true,
                locale: es,
              })

              return (
                <TableRow key={proposal.id} className={isTaskCancelled ? "bg-slate-50" : undefined}>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      {teacherId ? (
                        <Link
                          href={`/workspace/resenas?teacherId=${teacherId}`}
                          className="font-medium leading-tight text-blue-600 hover:underline"
                        >
                          {teacherName}
                        </Link>
                      ) : (
                        <p className="font-medium leading-tight">{teacherName}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">{proposal.cover_letter}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight line-clamp-2">{taskTitle}</p>
                      {isTaskCancelled && (
                        <Badge variant="destructive" className="text-xs w-fit">Tarea cancelada</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell className="align-top font-semibold">${proposal.proposed_amount.toFixed(2)}</TableCell>
                  <TableCell className="align-top">{proposal.estimated_hours ? `${proposal.estimated_hours}h` : "-"}</TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {sentDistance}
                  </TableCell>
                  <TableCell className="align-top text-right space-x-2">
                    {proposal.task?.id && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/workspace/mis-tareas/${proposal.task.id}`}>
                          <IconArrowUpRight className="h-4 w-4 mr-1" />
                          Ir a la tarea
                         </Link>
                       </Button>
                     )}
                {isPending && (
                  <>
                    <Button size="sm" onClick={() => handleAccept(proposal.id)}>
                      <IconCheck className="h-4 w-4 mr-1" />
                      Aceptar
                         </Button>
                         <Button size="sm" variant="destructive" onClick={() => handleReject(proposal.id)}>
                      <IconX className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </>
                )}
                {!isPending && !proposal.task?.id && <span className="text-xs text-muted-foreground">-</span>}
              </TableCell>
            </TableRow>
          )
        })}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {proposals.length} de {total} propuestas</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild
              >
                <Link href={buildPageUrl(Math.max(1, currentPage - 1))}>
                  Anterior
                </Link>
              </Button>
              <span className="text-xs">Página {currentPage} de {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild
              >
                <Link href={buildPageUrl(Math.min(totalPages, currentPage + 1))}>
                  Siguiente
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Accept Proposal Dialog with Payment Plan */}
      {proposalToAccept && (
        <AcceptProposalDialog
          open={acceptDialogOpen}
          onOpenChange={setAcceptDialogOpen}
          onConfirm={confirmAccept}
          proposal={proposalToAccept}
        />
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={!!pendingAction && pendingAction.type === "reject"}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar propuesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción rechazará la propuesta. El profesor será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject}>
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
