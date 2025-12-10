"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TaskCardWork } from "./TaskCardWork"
import { SubmitWorkSheet } from "./SubmitWorkSheet"
import type { Database } from "@/model/schema"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconStar, IconStarFilled } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

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
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [submitWorkOpen, setSubmitWorkOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewTask, setReviewTask] = useState<Task | null>(null)
  const [rating, setRating] = useState(0)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)

  const handleSubmitWork = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setSubmitWorkOpen(true)
    }
  }

  const handleOpenReview = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setReviewTask(task)
      setReviewOpen(true)
      setRating(0)
      // Prefetch existing review (if any)
      setReviewLoading(true)
      fetch(`/api/reviews/student?studentId=${task.student_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.myReview) {
            setRating(data.myReview.rating || 0)
          }
        })
        .finally(() => setReviewLoading(false))
    }
  }

  const handleSendReview = async () => {
    if (!reviewTask) return
    if (rating < 1) {
      toast.error("Selecciona una calificación")
      return
    }
    setSubmittingReview(true)
    try {
      const response = await fetch("/api/reviews/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: reviewTask.student_id,
          taskId: reviewTask.id,
          rating,
          comment: "",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "No se pudo guardar la reseña")
      } else {
        toast.success("Reseña enviada")
        setReviewOpen(false)
      }
    } catch (error) {
      console.error("Error submitting review", error)
      toast.error("Error al enviar la reseña")
    } finally {
      setSubmittingReview(false)
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
              router.push(`/workspace/mis-trabajos/${taskId}`)
            }}
            onSubmitWork={handleSubmitWork}
            onReview={handleOpenReview}
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

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calificar al estudiante</DialogTitle>
            <DialogDescription>
              Deja tu reseña para el estudiante de este trabajo completado.
            </DialogDescription>
          </DialogHeader>
          {reviewTask && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{reviewTask.title}</p>
                <p className="text-xs text-muted-foreground">
                  Estudiante: {reviewTask.student?.name || "Estudiante"}
                </p>
              </div>
              {reviewLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <Skeleton key={idx} className="h-6 w-6 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-20 w-full rounded-md" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = rating >= star
                      const Icon = active ? IconStarFilled : IconStar
                      return (
                        <button
                          key={star}
                          type="button"
                          className="p-1"
                          onClick={() => setRating(star)}
                        >
                          <Icon className={`h-6 w-6 ${active ? "text-amber-400" : "text-slate-300"}`} />
                        </button>
                      )
                    })}
                  </div>
              <Button onClick={handleSendReview} disabled={submittingReview || reviewLoading}>
                {submittingReview ? "Enviando..." : "Guardar calificación"}
              </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
