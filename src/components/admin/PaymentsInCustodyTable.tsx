"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { PaymentMilestoneWithDetails } from "@/lib/data/payment-verification-actions"
import { markAsPaidToTeacher } from "@/lib/data/payment-verification-actions"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconEye } from "@tabler/icons-react"

interface Props {
  payments: PaymentMilestoneWithDetails[]
}

interface GroupedTask {
  taskId: string
  taskTitle: string
  teacherName: string | null
  teacherEmail: string | null
  teacherBank?: {
    bank_name: string | null
    account_holder: string | null
    account_number: string | null
    account_type: string | null
    account_alias: string | null
    country: string | null
    currency: string | null
  } | null
  milestones: PaymentMilestoneWithDetails[]
  totalAmount: number
  milestonesCount: number
}

interface TaskMilestonesDialogProps {
  task: GroupedTask
  open: boolean
  onClose: () => void
  onMarkAsPaid: (paymentId: string, amount: number) => void
  isPending: boolean
}

function TaskCustodyDialog({
  task,
  open,
  onClose,
  onMarkAsPaid,
  isPending,
}: TaskMilestonesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fondos en Custodia - {task.taskTitle}</DialogTitle>
          <DialogDescription>
            {task.milestonesCount}{" "}
            {task.milestonesCount === 1
              ? "hito en custodia"
              : "hitos en custodia"}{" "}
            • Total: ${task.totalAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Teacher Info */}
          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">Profesor</h4>
            <p className="font-medium">{task.teacherName || "Sin asignar"}</p>
            {task.teacherEmail && (
              <p className="text-sm text-muted-foreground">{task.teacherEmail}</p>
            )}
            {task.teacherBank && (
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                {task.teacherBank.bank_name && (
                  <p><span className="font-medium">Banco:</span> {task.teacherBank.bank_name}</p>
                )}
                {task.teacherBank.account_holder && (
                  <p><span className="font-medium">Titular:</span> {task.teacherBank.account_holder}</p>
                )}
                {task.teacherBank.account_number && (
                  <p><span className="font-medium">Cuenta:</span> {task.teacherBank.account_number}</p>
                )}
                {(task.teacherBank.account_alias || task.teacherBank.account_type) && (
                  <p>
                    <span className="font-medium">Alias/Tipo:</span> {task.teacherBank.account_alias || "—"}
                    {task.teacherBank.account_type ? ` • ${task.teacherBank.account_type}` : ""}
                  </p>
                )}
                {(task.teacherBank.country || task.teacherBank.currency) && (
                  <p>
                    <span className="font-medium">Pais/Moneda:</span> {task.teacherBank.country || "—"}
                    {task.teacherBank.currency ? ` • ${task.teacherBank.currency}` : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Milestones Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hito</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Verificado</TableHead>
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
                      {payment.verified_at
                        ? format(new Date(payment.verified_at), "PPp", {
                            locale: es,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" disabled={isPending}>
                            Marcar como Pagado
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar Transferencia
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que ya transferiste{" "}
                              <span className="font-semibold">
                                ${payment.amount.toFixed(2)}
                              </span>{" "}
                              a {task.teacherName}? Esta acción marcará el pago como
                              completado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                onMarkAsPaid(payment.id, payment.amount)
                              }
                            >
                              Sí, Marcar como Pagado
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export function PaymentsInCustodyTable({ payments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTask, setSelectedTask] = useState<GroupedTask | null>(null)

  // Group milestones by task
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, GroupedTask>()

    payments.forEach((payment) => {
      const taskId = payment.task_id
      const taskTitle = payment.tasks.title

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          taskId,
          taskTitle,
          teacherName: payment.teacher?.name || null,
          teacherEmail: payment.teacher?.email || null,
          teacherBank: payment.teacher?.bank || null,
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
  }, [payments])

  const handleMarkAsPaid = (paymentId: string) => {
    startTransition(async () => {
      const result = await markAsPaidToTeacher(paymentId)

      if (result.status === "success") {
        toast.success(result.message)
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
          No hay pagos en custodia para transferir
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
              <TableHead>Profesor</TableHead>
              <TableHead>Hitos en Custodia</TableHead>
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
                  <Badge variant="default">
                    {task.milestonesCount}{" "}
                    {task.milestonesCount === 1 ? "hito" : "hitos"}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-blue-600">
                  ${task.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTask(task)}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    Ver Hitos
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <TaskCustodyDialog
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onMarkAsPaid={handleMarkAsPaid}
          isPending={isPending}
        />
      )}
    </>
  )
}
