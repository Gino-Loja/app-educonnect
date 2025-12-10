"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskMilestonesDialog } from "./TaskMilestonesDialog"
import type { PaymentMilestone } from "@/lib/data/milestone-actions"
import { IconRoad } from "@tabler/icons-react"

interface TaskMilestonesViewerProps {
  taskTitle: string
  milestones: PaymentMilestone[]
  viewMode?: "student" | "teacher" | "admin"
}

export function TaskMilestonesViewer({ taskTitle, milestones, viewMode = "student" }: TaskMilestonesViewerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <IconRoad className="h-4 w-4" />
        Ver avances
      </Button>

      <TaskMilestonesDialog
        taskTitle={taskTitle}
        milestones={milestones}
        open={open}
        onClose={() => setOpen(false)}
        viewMode={viewMode}
      />
    </>
  )
}
