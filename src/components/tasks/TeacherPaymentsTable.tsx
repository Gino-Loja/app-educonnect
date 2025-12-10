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
import { TaskMilestonesDialog } from "./TaskMilestonesDialog"
import { IconEye } from "@tabler/icons-react"

type PaymentMilestoneWithTask = PaymentMilestone & {
  tasks?: {
    title?: string | null
    student?: {
      name: string | null
      email: string | null
    } | null
  }
}

interface Props {
  milestones: PaymentMilestoneWithTask[]
}

interface GroupedTask {
  taskId: string
  taskTitle: string
  studentName: string
  studentEmail: string
  milestones: PaymentMilestone[]
  totalAmount: number
  paidAmount: number
  inCustodyAmount: number
  milestonesCount: number
  paidCount: number
  inCustodyCount: number
  pendingCount: number
}

export function TeacherPaymentsTable({ milestones }: Props) {
  const [selectedTask, setSelectedTask] = useState<GroupedTask | null>(null)

  // Group milestones by task
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, GroupedTask>()

    milestones.forEach((milestone) => {
      const taskId = milestone.task_id
      const taskTitle = milestone.tasks?.title || "Tarea"
      const student = milestone.tasks?.student

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          taskId,
          taskTitle,
          studentName: student?.name || "Estudiante",
          studentEmail: student?.email || "",
          milestones: [],
          totalAmount: 0,
          paidAmount: 0,
          inCustodyAmount: 0,
          milestonesCount: 0,
          paidCount: 0,
          inCustodyCount: 0,
          pendingCount: 0,
        })
      }

      const group = taskMap.get(taskId)!
      group.milestones.push(milestone)
      group.totalAmount += milestone.amount
      group.milestonesCount++

      if (milestone.status === "paid") {
        group.paidAmount += milestone.amount
        group.paidCount++
      } else if (milestone.status === "in_custody") {
        group.inCustodyAmount += milestone.amount
        group.inCustodyCount++
      } else {
        group.pendingCount++
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
          No tienes tareas con pagos asociados
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
              <TableHead>Hitos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Recibido</TableHead>
              <TableHead>En Custodia</TableHead>
              <TableHead>Estado</TableHead>
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
                <TableCell className="text-blue-600 font-medium">
                  ${task.inCustodyAmount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {task.paidCount === task.milestonesCount && (
                      <Badge variant="outline" className="bg-green-50 w-fit">
                        ✓ Totalmente Pagado
                      </Badge>
                    )}
                    {task.inCustodyCount > 0 && (
                      <Badge variant="default" className="w-fit">
                        {task.inCustodyCount} en custodia
                      </Badge>
                    )}
                    {task.pendingCount > 0 && (
                      <Badge variant="secondary" className="w-fit">
                        {task.pendingCount} pendiente
                        {task.pendingCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
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
        <TaskMilestonesDialog
          taskTitle={selectedTask.taskTitle}
          milestones={selectedTask.milestones}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          viewMode="teacher"
        />
      )}
    </>
  )
}
