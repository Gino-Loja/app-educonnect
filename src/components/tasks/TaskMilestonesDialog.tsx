"use client"

import type { PaymentMilestone } from "@/lib/data/milestone-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconExternalLink, IconUpload } from "@tabler/icons-react"

interface Props {
  taskTitle: string
  milestones: PaymentMilestone[]
  open: boolean
  onClose: () => void
  onActionClick?: (milestone: PaymentMilestone) => void
  viewMode: "student" | "teacher" | "admin"
}

const statusStyles: Record<
  string,
  {
    label: string
    badge: string
    dot: string
    cardAccent: string
    description: string
  }
> = {
  pending_payment: {
    label: "Pendiente de Pago",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-400",
    cardAccent: "border-orange-100 bg-orange-50/40",
    description: "Esperando comprobante del estudiante",
  },
  pending_verification: {
    label: "En Verificación",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    cardAccent: "border-amber-100 bg-amber-50/40",
    description: "Equipo admin revisando el pago",
  },
  in_custody: {
    label: "En Custodia",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    cardAccent: "border-blue-100 bg-blue-50/40",
    description: "Fondos retenidos hasta la entrega",
  },
  paid: {
    label: "Pagado",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    cardAccent: "border-emerald-100 bg-emerald-50/40",
    description: "Pago liberado y acreditado",
  },
  rejected: {
    label: "Rechazado",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-400",
    cardAccent: "border-red-100 bg-red-50/40",
    description: "El comprobante necesita correcciones",
  },
}

export function TaskMilestonesDialog({
  taskTitle,
  milestones,
  open,
  onClose,
  onActionClick,
  viewMode,
}: Props) {
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
  const paidAmount = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amount, 0)

  const progress = totalAmount === 0 ? 0 : Math.min(100, Math.round((paidAmount / totalAmount) * 100))

  const formatDate = (date?: string | null) => {
    if (!date) return null
    return format(new Date(date), "PP", { locale: es })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hitos de Pago - {taskTitle}</DialogTitle>
          <DialogDescription>
            {milestones.length} {milestones.length === 1 ? "hito" : "hitos"} de pago
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">${totalAmount.toFixed(2)}</p>
            <p className="text-xs text-slate-500">Monto distribuido en los hitos</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pagado</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">${paidAmount.toFixed(2)}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{progress}% liberado</p>
          </div>
          <div className="rounded-2xl bg-[#f5f7ff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pendiente</p>
            <p className="mt-2 text-2xl font-bold text-[#1d2f58]">
              ${(totalAmount - paidAmount).toFixed(2)}
            </p>
            <p className="text-xs text-[#5f6f94]">Aún por liberar</p>
          </div>
        </div>

        <div className="relative mt-6">
          <div className="absolute left-6 top-4 bottom-8 hidden w-px bg-slate-200/70 md:block" />
          <div className="space-y-4">
            {milestones
              .slice()
              .sort((a, b) => a.milestone_number - b.milestone_number)
              .map((milestone, index, sortedList) => {
                const statusInfo = statusStyles[milestone.status] || statusStyles.pending_payment
                const blockingMilestone = sortedList
                  .slice(0, index)
                  .find((m) => m.status === "pending_payment" || m.status === "rejected")
                const canUploadProof = !blockingMilestone

                return (
                  <div key={milestone.id} className="relative flex gap-4">
                    <div className="hidden flex-col items-center md:flex">
                      <span className={`z-10 flex size-5 items-center justify-center rounded-full border-2 border-white shadow ${statusInfo.dot}`} />
                      {index !== sortedList.length - 1 && <span className="mt-1 h-full w-px bg-slate-200/70" />}
                  </div>
                  <div
                    className={`flex-1 rounded-2xl border bg-white/80 p-4 shadow-sm transition-colors ${statusInfo.cardAccent}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-white/70 text-xs font-semibold">
                          Hito {milestone.milestone_number}
                        </Badge>
                        <p className="text-base font-semibold text-slate-900">
                          {milestone.description || "Entrega parcial"}
                        </p>
                        <p className="text-xs text-slate-500">{statusInfo.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          ${milestone.amount.toFixed(2)}
                        </p>
                        <Badge className={`${statusInfo.badge} mt-2 border`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Última actualización</p>
                        <p className="font-medium">
                          {formatDate(milestone.paid_at) ||
                            formatDate(milestone.verified_at) ||
                            formatDate(milestone.submitted_at) || (
                              <span className="text-slate-400">Sin registros</span>
                            )}
                        </p>
                      </div>
                      {viewMode === "student" && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Referencia</p>
                          {milestone.payment_reference ? (
                            <code className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-800">
                              {milestone.payment_reference}
                            </code>
                          ) : (
                            <span className="text-slate-400">Pendiente</span>
                          )}
                        </div>
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {viewMode === "student" ? "Acción" : "Detalle"}
                        </p>
                        <div className="mt-1 text-sm">
                          {viewMode === "student" && (
                            <>
                              {milestone.status === "pending_payment" && (
                                <>
                                  {canUploadProof ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => onActionClick?.(milestone)}
                                          aria-label="Subir comprobante"
                                          className="rounded-full"
                                        >
                                          <IconUpload className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Subir comprobante</TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-xs text-slate-500">
                                      Completa el hito {blockingMilestone?.milestone_number} antes de continuar.
                                    </p>
                                  )}
                                </>
                              )}
                              {milestone.status === "rejected" && (
                                <div className="space-y-2 text-left">
                                  {milestone.rejection_reason && (
                                    <p className="text-xs text-destructive">{milestone.rejection_reason}</p>
                                  )}
                                  {canUploadProof ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => onActionClick?.(milestone)}
                                          aria-label="Subir nuevo comprobante"
                                          className="rounded-full"
                                        >
                                          <IconUpload className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Subir comprobante</TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-xs text-slate-500">
                                      Completa el hito {blockingMilestone?.milestone_number} antes de continuar.
                                    </p>
                                  )}
                                </div>
                              )}
                              {milestone.status === "pending_verification" && (
                                <span className="text-xs text-slate-500">Esperando verificación</span>
                              )}
                              {milestone.status === "in_custody" && (
                                <span className="text-xs text-slate-500">Fondos en custodia</span>
                              )}
                              {milestone.status === "paid" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  ✓ Completado
                                </span>
                              )}
                            </>
                          )}
                          {viewMode === "teacher" && (
                            <div className="space-y-1 text-left text-xs">
                              {milestone.status === "pending_payment" && (
                                <p className="text-slate-500">Esperando pago del estudiante</p>
                              )}
                              {milestone.status === "pending_verification" && (
                                <p className="text-slate-500">En verificación por admin</p>
                              )}
                              {milestone.status === "in_custody" && (
                                <p className="text-blue-600 font-semibold">Fondos en custodia</p>
                              )}
                              {milestone.status === "paid" && (
                                <p className="text-emerald-600 font-semibold">✓ Pago recibido</p>
                              )}
                              {milestone.status === "rejected" && (
                                <p className="text-destructive">Comprobante rechazado</p>
                              )}
                            </div>
                          )}
                          {viewMode === "admin" && milestone.payment_proof_url && (
                            <a
                              href={milestone.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                            >
                              <IconExternalLink className="h-4 w-4" />
                              Ver comprobante
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
