"use client"

import { useState } from "react"
import { Task } from "@/lib/data/task-actions"
import { TaskCard } from "./TaskCard"
import { SubmissionPreviewSheet } from "./SubmissionPreviewSheet"
import { getSubmissionByTaskId } from "@/lib/data/submission-actions"
import { Button } from "@/components/ui/button"
import { IconEye } from "@tabler/icons-react"
import { toast } from "sonner"

interface TasksListWithSubmissionProps {
  tasks: Task[]
  studentName: string
}

export function TasksListWithSubmission({
  tasks,
  studentName,
}: TasksListWithSubmissionProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submission, setSubmission] = useState<any | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleViewSubmission = async (task: Task) => {
    setLoading(true)
    try {
      const result = await getSubmissionByTaskId(task.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (!result.submission) {
        toast.error("No se encontró la entrega")
        return
      }

      setSelectedTask(task)
      setSubmission(result.submission)
      setSheetOpen(true)
    } catch (error) {
      console.error("Error loading submission:", error)
      toast.error("Error al cargar la entrega")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task}>
            {/* Show "Ver Entrega" button if task is submitted */}
            {task.status === "submitted" && (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewSubmission(task)
                }}
                disabled={loading}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Ver Entrega
              </Button>
            )}
          </TaskCard>
        ))}
      </div>

      {/* Submission Preview Modal */}
      {selectedTask && submission && (
        <SubmissionPreviewSheet
          submission={submission}
          taskTitle={selectedTask.title}
          studentName={studentName}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
