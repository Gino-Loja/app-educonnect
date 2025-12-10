"use client"

import { useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconStar, IconStarFilled } from "@tabler/icons-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  createOrUpdateStudentReview,
  createOrUpdateTeacherReview,
} from "@/lib/data/review-actions"

export type ReviewSummary = {
  average: number
  count: number
  distribution: [number, number, number, number, number]
}

export type ReviewListItem = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    id: string
    name: string | null
    avatar: string | null
  }
}

type ReviewWidgetProps = {
  targetId: string
  targetType: "teacher" | "student"
  summary: ReviewSummary
  reviews: ReviewListItem[]
  allowReview: boolean
  taskId?: string | null
  currentUser?: {
    id: string
    name: string | null
    avatar: string | null
  }
  initialUserReview?: {
    id: string
    rating: number
    comment: string | null
    created_at?: string | null
  } | null
  mode?: "full" | "comment-only" | "rating-only"
  hideRecent?: boolean
  hideDistribution?: boolean
}

const stars = [1, 2, 3, 4, 5]

type ReviewUpsertResponse =
  | { status: "error"; message?: unknown }
  | {
      status: "success"
      review: {
        id: string
        rating: number | null
        comment: string | null
        created_at: string
      }
    }

const initials = (name: string | null | undefined) => {
  if (!name) return "?"
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const formatDate = (date: string) => {
  try {
    return format(new Date(date), "d MMM yyyy", { locale: es })
  } catch {
    return ""
  }
}

const buildErrorMessage = (message: unknown) => {
  if (!message) return "Ocurrió un error"
  if (typeof message === "string") return message
  if (typeof message === "object") {
    const values = Object.values(message as Record<string, unknown>).flat().filter(Boolean)
    if (values.length > 0) {
      return values.join(". ")
    }
  }
  return "Ocurrió un error"
}

const updateSummary = (
  prev: ReviewSummary,
  previousRating: number | null,
  nextRating: number,
): ReviewSummary => {
  const distribution = [...prev.distribution] as ReviewSummary["distribution"]
  let count = prev.count
  let total = prev.average * prev.count

  if (previousRating && previousRating >= 1 && previousRating <= 5) {
    distribution[previousRating - 1] = Math.max(0, distribution[previousRating - 1] - 1)
    total -= previousRating
  } else {
    count += 1
  }

  distribution[nextRating - 1] = distribution[nextRating - 1] + 1
  total += nextRating

  const average = count > 0 ? Number((total / count).toFixed(2)) : 0
  return { average, count, distribution }
}

export function ReviewWidget({
  targetId,
  targetType,
  summary,
  reviews,
  allowReview,
  taskId,
  currentUser,
  initialUserReview,
  mode = "full",
  hideRecent = false,
  hideDistribution = false,
}: ReviewWidgetProps) {
  const [localSummary, setLocalSummary] = useState<ReviewSummary>(summary)
  const [localReviews, setLocalReviews] = useState<ReviewListItem[]>(reviews)
  const [userReview, setUserReview] = useState(initialUserReview ?? null)
  const [rating, setRating] = useState(initialUserReview?.rating ?? 0)
  const [comment, setComment] = useState(initialUserReview?.comment ?? "")
  const [isPending, startTransition] = useTransition()

  const averageStars = useMemo(() => {
    const filled = Math.floor(localSummary.average)
    const half = localSummary.average - filled >= 0.5
    return stars.map((star) => {
      if (star <= filled) return "full"
      if (star === filled + 1 && half) return "half"
      return "empty"
    })
  }, [localSummary.average])

  const submit = () => {
    if (!allowReview) {
      toast.error("No tienes permisos para calificar")
      return
    }
    if (mode !== "comment-only" && rating < 1) {
      toast.error("Selecciona una calificación")
      return
    }

    startTransition(async () => {
      if (targetType === "teacher") {
        const response = await createOrUpdateTeacherReview({
          teacherId: targetId,
          taskId: taskId,
          rating: mode === "comment-only" ? null : rating,
          comment: mode === "rating-only" ? "" : comment,
        })
        handleResponse(response)
      } else {
        const response = await createOrUpdateStudentReview({
          studentId: targetId,
          taskId: taskId,
          rating: mode === "comment-only" ? null : rating,
          comment: mode === "rating-only" ? "" : comment,
        })
        handleResponse(response)
      }

    })
  }

  const handleResponse = (response: ReviewUpsertResponse) => {
    if (response.status === "error") {
      toast.error(buildErrorMessage(response.message))
      return
    }

    const saved = response.review
    const reviewerProfile =
      currentUser || { id: "me", name: "Tú", avatar: null }

    setUserReview({
      ...saved,
      rating: saved.rating ?? 0,
    })
    if (saved.rating) {
      setLocalSummary((prev) => updateSummary(prev, userReview?.rating ?? null, saved.rating!))
    }
    setLocalReviews((prev) => {
      const updated: ReviewListItem = {
        id: saved.id,
        rating: saved.rating ?? 0,
        comment: saved.comment,
        created_at: saved.created_at,
        reviewer: reviewerProfile,
      }

      const existingIndex = prev.findIndex((r) => r.id === saved.id)
      if (existingIndex >= 0) {
        const clone = [...prev]
        clone[existingIndex] = { ...clone[existingIndex], ...updated }
        return clone.slice(0, 5)
      }

      return [updated, ...prev].slice(0, 5)
    })

    toast.success("Reseña guardada")
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <IconStarFilled className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                {localSummary.average.toFixed(2)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {localSummary.count} reseña{localSummary.count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {averageStars.map((state, idx) => (
                <IconStarFilled
                  key={idx}
                  className={`h-4 w-4 ${state === "full"
                    ? "text-amber-400"
                    : state === "half"
                      ? "text-amber-300"
                      : "text-slate-300 dark:text-slate-700"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
        {allowReview && (
          <Badge className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            Calificación habilitada
          </Badge>
        )}
      </div>

      {!hideDistribution && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          {stars
            .slice()
            .reverse()
            .map((star) => {
              const count = localSummary.distribution[star - 1]
              const percent = localSummary.count ? Math.round((count / localSummary.count) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-10 text-right text-[13px] font-medium">{star}★</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-amber-400/80 transition-[width]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-[12px] text-slate-500 dark:text-slate-400">
                    {count} ({percent}%)
                  </span>
                </div>
              )
            })}
        </div>
      )}

      {allowReview && (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Tu reseña</p>
            </div>
            <div className="flex items-center gap-2">
              {mode !== "comment-only" && stars.map((star) => {
                const isActive = rating >= star
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="rounded-full p-1 transition hover:scale-105"
                  >
                    {isActive ? (
                      <IconStarFilled className="h-7 w-7 text-amber-400" />
                    ) : (
                      <IconStar className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          {mode !== "rating-only" && (
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte detalles breves de tu experiencia"
              className="min-h-[100px]"
              maxLength={500}
            />
          )}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            {mode !== "rating-only" ? <span>{comment.length}/500</span> : <span />}
            <Button
              size="sm"
              onClick={submit}
              disabled={isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {userReview ? "Actualizar calificación" : "Calificar"}
            </Button>
          </div>
        </div>
      )}

      {!hideRecent && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Reseñas recientes
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">{localReviews.length} visibles</span>
          </div>
          <Separator />
          {localReviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Aún no hay reseñas para mostrar.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {localReviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.reviewer.avatar || undefined} />
                      <AvatarFallback className="text-xs">{initials(review.reviewer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {review.reviewer.name || "Usuario"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {stars.map((star) =>
                        star <= review.rating ? (
                          <IconStarFilled key={star} className="h-4 w-4 text-amber-400" />
                        ) : (
                          <IconStar key={star} className="h-4 w-4 text-slate-300 dark:text-slate-700" />
                        ),
                      )}
                    </div>
                  </div>
                  {review.comment && review.comment.trim().length > 0 && (
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div >
  )
}
