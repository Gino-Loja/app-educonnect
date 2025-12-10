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

type SubmissionPreview = {
  id: string
  content: string
  attachments: string[] | null
  submitted_at: string
  is_approved?: boolean | null
  review_status?: "pending_review" | "changes_requested" | "approved"
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  }
}

export function TasksListWithSubmission({
  tasks,
  studentName,
}: TasksListWithSubmissionProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submission, setSubmission] = useState<SubmissionPreview | null>(null)
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
        toast.error("No se encontro la entrega")
        return
      }

      const normalizedAttachments = Array.isArray(result.submission.attachments)
        ? result.submission.attachments.filter((file): file is string => typeof file === "string")
        : null

      setSelectedTask(task)
      setSubmission({
        id: result.submission.id,
        content: result.submission.content || "",
        attachments: normalizedAttachments,
        submitted_at: result.submission.submitted_at || new Date().toISOString(),
        is_approved: result.submission.is_approved,
        review_status: result.submission.review_status || undefined,
        teacher: result.submission.teacher ?? undefined,
      })
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
