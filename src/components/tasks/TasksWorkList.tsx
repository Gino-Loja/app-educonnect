"use client"

import { useState } from "react"
import { TaskCardWork } from "./TaskCardWork"
import { SubmitWorkSheet } from "./SubmitWorkSheet"
import type { Database } from "@/model/schema"

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  student?: {
    name: string | null
    profile_picture_url: string | null
  }
  proposal?: {
    proposed_amount: number
    estimated_hours: number
  }
}

interface TasksWorkListProps {
  tasks: Task[]
}

export function TasksWorkList({ tasks }: TasksWorkListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submitWorkOpen, setSubmitWorkOpen] = useState(false)

  const handleSubmitWork = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setSubmitWorkOpen(true)
    }
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <TaskCardWork
            key={task.id}
            task={task}
            selectedProposal={task.proposal}
            onViewDetails={(taskId) => {
              // console.log("View task details:", taskId)
              // TODO: Implement task details modal/sheet
            }}
            onSubmitWork={handleSubmitWork}
          />
        ))}
      </div>

      {selectedTask && (
        <SubmitWorkSheet
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          open={submitWorkOpen}
          onOpenChange={setSubmitWorkOpen}
        />
      )}
    </>
  )
}
