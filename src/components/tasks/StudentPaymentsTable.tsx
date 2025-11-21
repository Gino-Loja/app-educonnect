"use client"

import { useState, useMemo } from "react"
import type { PaymentMilestone } from "@/lib/data/milestone-actions"
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
import { UploadPaymentProofDialog } from "./UploadPaymentProofDialog"
import { TaskMilestonesDialog } from "./TaskMilestonesDialog"
import { IconEye } from "@tabler/icons-react"

type MilestoneWithTask = PaymentMilestone & {
  tasks?: {
    title?: string | null
    status?: string | null
  }
}

interface Props {
  milestones: MilestoneWithTask[]
}

interface GroupedTask {
  taskId: string
  taskTitle: string
  taskStatus: string
  milestones: PaymentMilestone[]
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  milestonesCount: number
  paidCount: number
  pendingPaymentCount: number
  pendingVerificationCount: number
}

export function StudentPaymentsTable({ milestones }: Props) {
  const [selectedMilestone, setSelectedMilestone] =
    useState<PaymentMilestone | null>(null)
  const [selectedTask, setSelectedTask] = useState<GroupedTask | null>(null)

  // Group milestones by task
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, GroupedTask>()

    milestones.forEach((milestone) => {
      const taskId = milestone.task_id
      const taskTitle = milestone.tasks?.title || "Tarea"
      const taskStatus = milestone.tasks?.status || "open"

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          taskId,
          taskTitle,
          milestones: [],
          taskStatus,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          milestonesCount: 0,
          paidCount: 0,
          pendingPaymentCount: 0,
          pendingVerificationCount: 0,
        })
      }

      const group = taskMap.get(taskId)!
      group.taskStatus = taskStatus || group.taskStatus
      group.milestones.push(milestone)
      group.totalAmount += milestone.amount
      group.milestonesCount++

      if (milestone.status === "paid") {
        group.paidAmount += milestone.amount
        group.paidCount++
      } else {
        group.pendingAmount += milestone.amount
      }

      if (
        milestone.status === "pending_payment" ||
        milestone.status === "rejected"
      ) {
        group.pendingPaymentCount++
      }
      if (milestone.status === "pending_verification") {
        group.pendingVerificationCount++
      }
    })

    return Array.from(taskMap.values()).sort((a, b) =>
      a.taskTitle.localeCompare(b.taskTitle)
    )
  }, [milestones])

  if (groupedTasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No tienes tareas con pagos pendientes
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
              <TableHead>Hitos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagado</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedTasks.map((task) => {
              const isCancelled = task.taskStatus === "cancelled"
              return (
              <TableRow
                key={task.taskId}
                className={isCancelled ? "bg-red-50/70 text-red-900" : undefined}
              >
                <TableCell className="font-medium">{task.taskTitle}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {task.milestonesCount}{" "}
                      {task.milestonesCount === 1 ? "hito" : "hitos"}
                    </Badge>
                    {task.paidCount > 0 && (
                      <Badge variant="outline" className="bg-green-50">
                        {task.paidCount} pagado
                        {task.paidCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ${task.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  ${task.paidAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-amber-600 font-medium">
                  ${task.pendingAmount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {task.pendingPaymentCount > 0 && (
                      <Badge variant="destructive" className="w-fit">
                        {task.pendingPaymentCount} por pagar
                      </Badge>
                    )}
                    {isCancelled && (
                      <Badge variant="destructive" className="w-fit bg-red-600 text-white">
                        Tarea cancelada
                      </Badge>
                    )}
                    {task.pendingVerificationCount > 0 && (
                      <Badge variant="secondary" className="w-fit">
                        {task.pendingVerificationCount} en verificación
                      </Badge>
                    )}
                    {task.paidCount === task.milestonesCount && (
                      <Badge variant="outline" className="bg-green-50 w-fit">
                        ✓ Completado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTask(task)}
                    disabled={isCancelled || (selectedTask?.taskId === task.taskId && isCancelled)}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    {isCancelled ? "Cancelada" : "Ver Hitos"}
                  </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>

      {selectedMilestone && (
        <UploadPaymentProofDialog
          milestone={selectedMilestone}
          open={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
        />
      )}

      {selectedTask && (
        <TaskMilestonesDialog
          taskTitle={selectedTask.taskTitle}
          milestones={selectedTask.milestones}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onActionClick={(milestone) => {
            setSelectedTask(null)
            setSelectedMilestone(milestone)
          }}
          viewMode="student"
        />
      )}
    </>
  )
}
