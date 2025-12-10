"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { PaymentMilestoneWithDetails } from "@/lib/data/payment-verification-actions"
import {
  approvePaymentProof,
  rejectPaymentProof,
} from "@/lib/data/payment-verification-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconExternalLink } from "@tabler/icons-react"

interface Props {
  payment: PaymentMilestoneWithDetails
  open: boolean
  onClose: () => void
}

export function PaymentVerificationDialog({ payment, open, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approvePaymentProof(payment.id)

      if (result.status === "success") {
        toast.success(result.message)
        onClose()
        // Refresh after closing dialog to ensure UI updates
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Debes proporcionar una razón para el rechazo")
      return
    }

    startTransition(async () => {
      const result = await rejectPaymentProof(payment.id, rejectionReason)

      if (result.status === "success") {
        toast.success(result.message)
        onClose()
        setRejectionReason("")
        setShowRejectForm(false)
        // Refresh after closing dialog to ensure UI updates
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificación de Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Revisa el comprobante y aprueba o rechaza el pago
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Información de la Tarea</h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tarea:</span>
                <span className="text-sm font-medium">{payment.tasks.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hito:</span>
                <Badge variant="outline">Hito {payment.milestone_number}</Badge>
              </div>
              {payment.description && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Descripción:
                  </span>
                  <span className="text-sm">{payment.description}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Student Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Estudiante</h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nombre:</span>
                <span className="text-sm font-medium">
                  {payment.student.name || "Sin nombre"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm">{payment.student.email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Detalles del Pago</h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monto:</span>
                <span className="text-lg font-bold text-green-600">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Referencia:</span>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {payment.payment_reference || "N/A"}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Fecha de envío:
                </span>
                <span className="text-sm">
                  {payment.submitted_at
                    ? format(new Date(payment.submitted_at), "PPp", {
                        locale: es,
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Proof */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Comprobante de Pago</h3>
            {payment.payment_proof_url ? (
                <div className="space-y-2">
                  <a
                    href={payment.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <IconExternalLink className="h-4 w-4" />
                  Ver comprobante en nueva pestaña
                </a>
                <div className="rounded-lg border overflow-hidden">
                  <Image
                    src={payment.payment_proof_url}
                    alt="Comprobante de pago"
                    width={1200}
                    height={675}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay comprobante adjunto
              </p>
            )}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Razón del Rechazo</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por qué se rechaza el comprobante..."
                  rows={4}
                  disabled={isPending}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!showRejectForm ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
              >
                Rechazar
              </Button>
              <Button onClick={handleApprove} disabled={isPending}>
                {isPending ? "Aprobando..." : "Aprobar y Mover a Custodia"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectionReason("")
                }}
                disabled={isPending}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending || !rejectionReason.trim()}
              >
                {isPending ? "Rechazando..." : "Confirmar Rechazo"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
