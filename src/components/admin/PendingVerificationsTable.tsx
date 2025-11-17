"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { PaymentMilestoneWithDetails } from "@/lib/data/payment-verification-actions"
import {
  approvePaymentProof,
  rejectPaymentProof,
} from "@/lib/data/payment-verification-actions"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconEye, IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTransition } from "react"

interface Props {
  verifications: PaymentMilestoneWithDetails[]
}

interface GroupedTask {
  taskId: string
  taskTitle: string
  studentName: string
  studentEmail: string
  teacherName: string | null
  teacherEmail: string | null
  milestones: PaymentMilestoneWithDetails[]
  totalAmount: number
  milestonesCount: number
}

interface TaskMilestonesDialogProps {
  task: GroupedTask
  open: boolean
  onClose: () => void
  onVerify: (payment: PaymentMilestoneWithDetails) => void
}

function TaskVerificationDialog({
  task,
  open,
  onClose,
  onVerify,
}: TaskMilestonesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificaciones Pendientes - {task.taskTitle}</DialogTitle>
          <DialogDescription>
            {task.milestonesCount}{" "}
            {task.milestonesCount === 1 ? "hito pendiente" : "hitos pendientes"}{" "}
            de verificación • Total: ${task.totalAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student and Teacher Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-2">Estudiante</h4>
              <p className="font-medium">{task.studentName}</p>
              <p className="text-sm text-muted-foreground">{task.studentEmail}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold mb-2">Profesor</h4>
              <p className="font-medium">{task.teacherName || "Sin asignar"}</p>
              {task.teacherEmail && (
                <p className="text-sm text-muted-foreground">
                  {task.teacherEmail}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Milestones Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hito</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {task.milestones.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Badge variant="outline">Hito {payment.milestone_number}</Badge>
                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {payment.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.submitted_at
                        ? format(new Date(payment.submitted_at), "PPp", {
                            locale: es,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">
                        {payment.payment_reference || "N/A"}
                      </code>
                    </TableCell>
                    <TableCell>
                      {payment.payment_proof_url ? (
                        <a
                          href={payment.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <IconExternalLink className="h-4 w-4" />
                          Ver
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => onVerify(payment)}>
                        Verificar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export function PendingVerificationsTable({ verifications }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTask, setSelectedTask] = useState<GroupedTask | null>(null)
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMilestoneWithDetails | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Group milestones by task
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, GroupedTask>()

    verifications.forEach((payment) => {
      const taskId = payment.task_id
      const taskTitle = payment.tasks.title

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          taskId,
          taskTitle,
          studentName: payment.student.name || "Sin nombre",
          studentEmail: payment.student.email,
          teacherName: payment.teacher?.name || null,
          teacherEmail: payment.teacher?.email || null,
          milestones: [],
          totalAmount: 0,
          milestonesCount: 0,
        })
      }

      const group = taskMap.get(taskId)!
      group.milestones.push(payment)
      group.totalAmount += payment.amount
      group.milestonesCount++
    })

    return Array.from(taskMap.values()).sort((a, b) =>
      a.taskTitle.localeCompare(b.taskTitle)
    )
  }, [verifications])

  const handleApprove = () => {
    if (!selectedPayment) return

    startTransition(async () => {
      const result = await approvePaymentProof(selectedPayment.id)

      if (result.status === "success") {
        toast.success(result.message)
        setSelectedPayment(null)
        setSelectedTask(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleReject = () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error("Debes proporcionar una razón para el rechazo")
      return
    }

    startTransition(async () => {
      const result = await rejectPaymentProof(selectedPayment.id, rejectionReason)

      if (result.status === "success") {
        toast.success(result.message)
        setSelectedPayment(null)
        setSelectedTask(null)
        setRejectionReason("")
        setShowRejectForm(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  if (groupedTasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No hay comprobantes pendientes de verificación
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarea</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Hitos Pendientes</TableHead>
              <TableHead>Monto Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedTasks.map((task) => (
              <TableRow key={task.taskId}>
                <TableCell className="font-medium">{task.taskTitle}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{task.studentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.studentEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {task.teacherName || "Sin asignar"}
                    </div>
                    {task.teacherEmail && (
                      <div className="text-sm text-muted-foreground">
                        {task.teacherEmail}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {task.milestonesCount}{" "}
                    {task.milestonesCount === 1 ? "hito" : "hitos"}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  ${task.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTask(task)}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    Verificar Hitos
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <TaskVerificationDialog
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onVerify={(payment) => setSelectedPayment(payment)}
        />
      )}

      {selectedPayment && (
        <Dialog
          open={!!selectedPayment}
          onOpenChange={() => {
            setSelectedPayment(null)
            setShowRejectForm(false)
            setRejectionReason("")
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verificación de Comprobante</DialogTitle>
              <DialogDescription>
                Hito {selectedPayment.milestone_number} - $
                {selectedPayment.amount.toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Payment Proof Image */}
              {selectedPayment.payment_proof_url && (
                <div>
                  <Label>Comprobante de Pago</Label>
                  <div className="mt-2">
                    <a
                      href={selectedPayment.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2"
                    >
                      <IconExternalLink className="h-4 w-4" />
                      Abrir en nueva pestaña
                    </a>
                    <div className="rounded-lg border overflow-hidden">
                      <img
                        src={selectedPayment.payment_proof_url}
                        alt="Comprobante"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reference */}
              <div>
                <Label>Referencia de Pago</Label>
                <code className="block mt-2 rounded bg-muted px-4 py-2">
                  {selectedPayment.payment_reference || "N/A"}
                </code>
              </div>

              {/* Rejection Form */}
              {showRejectForm && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="rejection-reason">Razón del Rechazo</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explica por qué se rechaza el comprobante..."
                      rows={4}
                      disabled={isPending}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              {!showRejectForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPayment(null)
                      setShowRejectForm(false)
                    }}
                    disabled={isPending}
                  >
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
