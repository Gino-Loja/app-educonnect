"use client"

import type { PaymentMilestone } from "@/lib/data/milestone-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconExternalLink } from "@tabler/icons-react"

interface Props {
  taskTitle: string
  milestones: PaymentMilestone[]
  open: boolean
  onClose: () => void
  onActionClick?: (milestone: PaymentMilestone) => void
  viewMode: "student" | "teacher" | "admin"
}

const statusLabels: Record<string, { label: string; variant: any }> = {
  pending_payment: { label: "Pendiente de Pago", variant: "destructive" },
  pending_verification: { label: "En Verificación", variant: "secondary" },
  in_custody: { label: "En Custodia", variant: "default" },
  paid: { label: "Pagado", variant: "outline" },
  rejected: { label: "Rechazado", variant: "destructive" },
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hitos de Pago - {taskTitle}</DialogTitle>
          <DialogDescription>
            {milestones.length} {milestones.length === 1 ? "hito" : "hitos"} de
            pago • Total: ${totalAmount.toFixed(2)} • Pagado: $
            {paidAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hito</TableHead>
                {viewMode !== "student" && <TableHead>Descripción</TableHead>}
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                {viewMode === "student" && <TableHead>Referencia</TableHead>}
                <TableHead className="text-right">
                  {viewMode === "student" ? "Acciones" : "Detalles"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone: any) => {
                const statusInfo =
                  statusLabels[milestone.status] || statusLabels.pending_payment

                return (
                  <TableRow key={milestone.id}>
                    <TableCell>
                      <Badge variant="outline">
                        Hito {milestone.milestone_number}
                      </Badge>
                    </TableCell>
                    {viewMode !== "student" && (
                      <TableCell>
                        {milestone.description || (
                          <span className="text-muted-foreground">
                            Sin descripción
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-semibold">
                      ${milestone.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {milestone.paid_at ? (
                        <div>
                          <div className="font-medium">
                            Pagado:{" "}
                            {format(new Date(milestone.paid_at), "PP", {
                              locale: es,
                            })}
                          </div>
                        </div>
                      ) : milestone.verified_at ? (
                        <div>
                          <div className="text-muted-foreground">
                            Verificado:{" "}
                            {format(new Date(milestone.verified_at), "PP", {
                              locale: es,
                            })}
                          </div>
                        </div>
                      ) : milestone.submitted_at ? (
                        <div>
                          <div className="text-muted-foreground">
                            Enviado:{" "}
                            {format(new Date(milestone.submitted_at), "PP", {
                              locale: es,
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {viewMode === "student" && (
                      <TableCell>
                        {milestone.payment_reference ? (
                          <code className="rounded bg-muted px-2 py-1 text-sm">
                            {milestone.payment_reference}
                          </code>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {viewMode === "student" && (
                        <>
                          {milestone.status === "pending_payment" && (
                            <Button
                              size="sm"
                              onClick={() => onActionClick?.(milestone)}
                            >
                              Subir Comprobante
                            </Button>
                          )}
                          {milestone.status === "rejected" && (
                            <div className="space-y-2 text-left">
                              {milestone.rejection_reason && (
                                <p className="text-xs text-destructive">
                                  {milestone.rejection_reason}
                                </p>
                              )}
                              <Button
                                size="sm"
                                onClick={() => onActionClick?.(milestone)}
                              >
                                Subir Nuevo
                              </Button>
                            </div>
                          )}
                          {milestone.status === "pending_verification" && (
                            <span className="text-sm text-muted-foreground">
                              Esperando verificación
                            </span>
                          )}
                          {milestone.status === "in_custody" && (
                            <span className="text-sm text-muted-foreground">
                              Fondos en custodia
                            </span>
                          )}
                          {milestone.status === "paid" && (
                            <Badge variant="outline" className="bg-green-50">
                              ✓ Completado
                            </Badge>
                          )}
                        </>
                      )}
                      {viewMode === "teacher" && (
                        <div className="text-sm text-left space-y-1">
                          {milestone.status === "pending_payment" && (
                            <p className="text-muted-foreground">
                              Esperando pago del estudiante
                            </p>
                          )}
                          {milestone.status === "pending_verification" && (
                            <p className="text-muted-foreground">
                              En verificación por admin
                            </p>
                          )}
                          {milestone.status === "in_custody" && (
                            <p className="text-blue-600 font-medium">
                              Fondos en custodia
                            </p>
                          )}
                          {milestone.status === "paid" && (
                            <p className="text-green-600 font-medium">
                              ✓ Pago recibido
                            </p>
                          )}
                          {milestone.status === "rejected" && (
                            <p className="text-destructive">
                              Comprobante rechazado
                            </p>
                          )}
                        </div>
                      )}
                      {viewMode === "admin" && milestone.payment_proof_url && (
                        <a
                          href={milestone.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <IconExternalLink className="h-4 w-4" />
                          Ver comprobante
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
