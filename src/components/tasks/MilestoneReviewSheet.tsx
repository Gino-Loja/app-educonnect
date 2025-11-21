"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconClock, IconAlertCircle, IconEye } from "@tabler/icons-react"

type SubmissionPreview = {
  id: string
  content: string
  attachments: string[] | null
  submitted_at: string
  is_approved: boolean | null
  review_status?: "pending_review" | "changes_requested" | "approved"
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  }
}

export type MilestoneWithSubmission = {
  id: string
  milestone_number: number
  title: string
  description: string | null
  amount: number
  status: string
  due_date: string | null
  submission_id: string | null
  submission?: SubmissionPreview | null
}

const statusLabels: Record<
  string,
  { label: string; badge: string; description: string }
> = {
  pending_payment: {
    label: "Pendiente de pago",
    badge: "bg-orange-100 text-orange-700",
    description: "Esperando comprobante del estudiante",
  },
  pending_verification: {
    label: "En verificación",
    badge: "bg-amber-100 text-amber-700",
    description: "Equipo administrativo revisando el pago",
  },
  in_custody: {
    label: "Fondos en custodia",
    badge: "bg-blue-100 text-blue-700",
    description: "Listo para avanzar con la entrega",
  },
  paid: {
    label: "Pagado",
    badge: "bg-emerald-100 text-emerald-700",
    description: "Hito liberado y acreditado",
  },
  rejected: {
    label: "Rechazado",
    badge: "bg-red-100 text-red-700",
    description: "El comprobante necesita ajustes",
  },
}

interface MilestoneReviewSheetProps {
  taskTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  milestones: MilestoneWithSubmission[]
  loading: boolean
  error?: string | null
  onReviewSubmission: (milestone: MilestoneWithSubmission) => void
}

export function MilestoneReviewSheet({
  taskTitle,
  open,
  onOpenChange,
  milestones,
  loading,
  error,
  onReviewSubmission,
}: MilestoneReviewSheetProps) {
  const formatDate = (value?: string | null) => {
    if (!value) return "Sin fecha"
    try {
      return format(new Date(value), "PPP", { locale: es })
    } catch {
      return "Sin fecha"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto px-4 sm:px-8">
        <SheetHeader className="text-left">
          <SheetTitle>Hitos y avances</SheetTitle>
          <SheetDescription>
            Revisa el estado de cada hito vinculado a <span className="font-semibold text-foreground">{taskTitle}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <IconAlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : milestones.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Aún no hay hitos configurados para esta tarea.
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => {
                const statusMeta = statusLabels[milestone.status] || {
                  label: milestone.status,
                  badge: "bg-slate-100 text-slate-700",
                  description: "",
                }
                const hasSubmission = Boolean(milestone.submission && milestone.submission_id)
                const reviewStatus =
                  milestone.submission?.review_status ??
                  (milestone.submission?.is_approved === true
                    ? "approved"
                    : milestone.submission?.is_approved === false
                      ? "changes_requested"
                      : "pending_review")
                const isApproved =
                  reviewStatus === "approved" || milestone.submission?.is_approved === true
                const isRejected =
                  reviewStatus === "changes_requested" || milestone.submission?.is_approved === false
                const submissionStatusLabel =
                  reviewStatus === "approved"
                    ? "Aprobado"
                    : reviewStatus === "changes_requested"
                      ? "Solicitar reenvío"
                      : "Pendiente por revisar"
                const shouldShowReviewButton = hasSubmission && !isApproved

                return (
                  <div
                    key={milestone.id}
                    className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          Hito {milestone.milestone_number}
                        </p>
                        <h3 className="text-lg font-semibold text-foreground">{milestone.title}</h3>
                      </div>
                      <Badge className={`rounded-full ${statusMeta.badge}`}>{statusMeta.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{statusMeta.description}</p>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-foreground">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha objetivo</p>
                          <p className="font-semibold">{formatDate(milestone.due_date)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Monto</p>
                        <p className="font-semibold text-foreground">${milestone.amount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {shouldShowReviewButton ? (
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => onReviewSubmission(milestone)}
                        >
                          <IconEye className="mr-2 h-4 w-4" />
                          Revisar entrega
                        </Button>
                      ) : hasSubmission && isApproved ? (
                        <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                          Entrega aprobada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-xs">
                          Sin entrega todavía
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`rounded-full text-xs ${
                          isApproved
                            ? "border-emerald-200 text-emerald-700"
                            : isRejected
                              ? "border-rose-200 text-rose-700"
                              : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {submissionStatusLabel}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
