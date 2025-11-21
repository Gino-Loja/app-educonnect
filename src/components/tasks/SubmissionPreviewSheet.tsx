"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  IconCheck,
  IconX,
  IconPhoto,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconPhotoCancel,
  IconMessage,
  IconSend,
} from "@tabler/icons-react"
import {
  approveSubmission,
  rejectSubmission,
  getSubmissionComments,
  createSubmissionComment,
  SubmissionComment,
} from "@/lib/data/submission-actions"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"

interface Submission {
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

interface SubmissionPreviewSheetProps {
  submission: Submission
  taskTitle: string
  milestoneTitle?: string
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmissionUpdated?: (nextStatus?: Submission["review_status"], submissionId?: string) => void
}

export function SubmissionPreviewSheet({
  submission,
  taskTitle,
  milestoneTitle,
  studentName,
  open,
  onOpenChange,
  onSubmissionUpdated,
}: SubmissionPreviewSheetProps) {
  const router = useRouter()
  const statusLabel: Record<NonNullable<Submission["review_status"]>, { label: string; className: string }> = {
    pending_review: { label: "Pendiente por revisar", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200" },
    approved: { label: "Aprobado", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" },
    changes_requested: { label: "Solicitar reenvío", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200" },
  }
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<number, boolean>>({})
  const [comments, setComments] = useState<SubmissionComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "")

  const images = useMemo(() => {
    const rawImages = submission.attachments || []
    if (rawImages.length === 0) {
      return []
    }

    return rawImages.map((imageUrl) => {
      if (!imageUrl) return imageUrl
      if (imageUrl.startsWith("http")) {
        return imageUrl
      }

      if (!supabaseUrl) {
        return imageUrl
      }

      const normalizedPath = imageUrl.startsWith("/storage")
        ? imageUrl.replace(/^\/+/, "")
        : `storage/v1/object/public/${imageUrl.replace(/^\/+/, "")}`

      return `${supabaseUrl}/${normalizedPath}`
    })
  }, [submission.attachments, supabaseUrl])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const result = await getSubmissionComments(submission.id)
      if (result.error) {
        setComments([])
        toast.error(result.error)
      } else {
        setComments(result.comments || [])
      }
    } catch (error) {
      console.error("Error loading comments:", error)
      toast.error("No se pudieron cargar los comentarios")
    } finally {
      setCommentsLoading(false)
    }
  }, [submission.id])

  const submittedAtLabel = useMemo(
    () =>
      formatDistanceToNow(new Date(submission.submitted_at), {
        addSuffix: true,
        locale: es,
      }),
    [submission.submitted_at],
  )
  const attachmentsCount = images.length
  const teacherInitials = submission.teacher?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PR"
  const hasImages = images.length > 0
  const isApproved = submission.review_status === "approved" || submission.is_approved === true
  const isChangesRequested =
    submission.review_status === "changes_requested" || submission.is_approved === false

  useEffect(() => {
    if (!open) return
    loadComments()
  }, [loadComments, open])

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const result = await approveSubmission(submission.id)
      if (result.status === "success") {
        toast.success(result.message)
        setShowApproveDialog(false)
        onOpenChange(false)
        onSubmissionUpdated?.("approved", submission.id)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error approving submission:", error)
      toast.error("Error al aprobar el trabajo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) {
      toast.error("Debes proporcionar una razón detallada (mín. 10 caracteres)")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await rejectSubmission(submission.id, rejectionReason)
      if (result.status === "success") {
        toast.success(result.message)
        setShowRejectDialog(false)
        setRejectionReason("")
        onOpenChange(false)
        onSubmissionUpdated?.("changes_requested", submission.id)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error rejecting submission:", error)
      toast.error("Error al rechazar el trabajo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    const trimmed = commentText.trim()
    if (trimmed.length < 5) {
      toast.error("Comparte un comentario un poco más detallado (mín. 5 caracteres)")
      return
    }

    setIsCommentSubmitting(true)
    try {
      const result = await createSubmissionComment(submission.id, trimmed)
      if (result.status === "success" && result.comment) {
        setComments((prev) => [...prev, result.comment])
        setCommentText("")
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error adding submission comment:", error)
      toast.error("No se pudo enviar el comentario")
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Prevent right-click on images
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    toast.info("Las imágenes no se pueden descargar directamente")
  }

  const handleImageError = (index: number) => {
    setImageLoadErrors((prev) => ({
      ...prev,
      [index]: true,
    }))
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto px-0 sm:px-6">
          <div className="px-6">
            <SheetHeader className="space-y-2">
              <SheetTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Revisión del trabajo
              </SheetTitle>
            <SheetDescription className="text-base">
              Analiza los avances enviados para <span className="font-semibold text-foreground">{taskTitle}</span> y decide si apruebas o solicitas cambios.
            </SheetDescription>
            {milestoneTitle && (
              <Badge variant="outline" className="w-fit rounded-full border-dashed px-3 py-1 text-xs">
                {milestoneTitle}
              </Badge>
            )}
            </SheetHeader>

            <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-900/40">
                    <AvatarImage src={submission.teacher?.profile_picture_url || undefined} alt={submission.teacher?.name || "Profesor"} />
                    <AvatarFallback className="font-semibold">{teacherInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300">Profesor</p>
                    <p className="text-lg font-semibold text-foreground">{submission.teacher?.name || "Profesor asignado"}</p>
                    <p className="text-xs text-muted-foreground">Subido {submittedAtLabel}</p>
                  </div>
                </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary" className="rounded-full px-3">
                  <span className="font-semibold">{attachmentsCount}</span> evidencia{attachmentsCount === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3">
                  Vista para: {studentName}
                </Badge>
                <Badge
                  className={`rounded-full px-3 ${statusLabel[submission.review_status || "pending_review"].className}`}
                >
                  {statusLabel[submission.review_status || "pending_review"].label}
                </Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
                <p className="text-base font-semibold text-foreground">
                  {statusLabel[submission.review_status || "pending_review"].label}
                </p>
              </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tiempo de respuesta</p>
                  <p className="text-base font-semibold text-foreground">Aprueba o pide cambios</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tarea</p>
                  <p className="text-base font-semibold text-foreground line-clamp-1">{taskTitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-6 px-6 pb-8">
            {/* Images Gallery */}
            {hasImages ? (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/50 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Evidencias visuales</Label>
                    <p className="text-xs text-muted-foreground">Revisa cada captura para validar la calidad del avance.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-dashed">
                    {currentImageIndex + 1} de {images.length}
                  </Badge>
                </div>

                {/* Main Image */}
                <div className="relative aspect-video rounded-2xl overflow-hidden border bg-slate-900 text-white shadow-lg dark:border-slate-700">
                  <div
                    onContextMenu={handleContextMenu}
                    className="select-none relative w-full h-full"
                  >
                    {imageLoadErrors[currentImageIndex] ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white">
                        <IconPhotoCancel className="h-10 w-10" />
                        <div>
                          <p className="text-sm font-semibold">No pudimos cargar esta evidencia</p>
                          <p className="text-xs text-white/70">
                            Verifica que el archivo exista en el bucket <span className="font-semibold">task-progress</span> o pide al profesor que lo reenvíe.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={images[currentImageIndex]}
                        alt={`Imagen ${currentImageIndex + 1}`}
                        fill
                        className="object-contain pointer-events-none"
                        unoptimized
                        draggable={false}
                        onError={() => handleImageError(currentImageIndex)}
                      />
                    )}

                    {/* Watermark */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/30 backdrop-blur px-6 py-3 rounded-xl transform -rotate-6">
                          <p className="text-white/80 text-xl font-semibold tracking-wider select-none">
                            PREVIEW · {studentName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* No Download Warning */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <IconDownload className="h-3 w-3" />
                      <span>Solo vista previa</span>
                    </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 text-slate-800 hover:bg-white"
                          onClick={prevImage}
                        >
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 text-slate-800 hover:bg-white"
                          onClick={nextImage}
                        >
                          <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all ${
                          currentImageIndex === index
                            ? "border-blue-600 ring-2 ring-blue-600/20"
                            : "border-transparent hover:border-muted-foreground/50"
                        }`}
                      >
                        {imageLoadErrors[index] ? (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
                            Error
                          </div>
                        ) : (
                          <Image
                            src={img}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={() => handleImageError(index)}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center">
                <IconPhoto className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No se adjuntaron evidencias visuales</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Solicita al profesor que suba capturas o documentos de avance para poder revisarlos desde esta pantalla.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Detalles de la entrega
              </Label>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{submission.content}</p>
              </div>
            </div>

            {/* Feedback Thread */}
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Retroalimentación para el docente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Deja comentarios sin rechazar la entrega; el profesor recibirá tus notas para ajustar el avance.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full px-3">
                  {comments.length} comentario{comments.length === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="max-h-64 space-y-3 overflow-y-auto overflow-x-hidden rounded-2xl border border-dashed border-muted/40 bg-muted/20 p-3">
                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    Cargando comentarios...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconMessage className="h-4 w-4" />
                    Aún no hay comentarios en esta entrega.
                  </div>
                ) : (
                  comments.map((comment) => {
                    const authorName =
                      comment.author?.name ||
                      (comment.author_role === "teacher"
                        ? submission.teacher?.name || "Profesor"
                        : studentName)
                    const commentInitials =
                      authorName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "US"

                    return (
                      <div
                        key={comment.id}
                        className="flex gap-3 rounded-xl bg-white/80 p-3 shadow-sm dark:bg-slate-900/40"
                      >
                        <Avatar className="h-9 w-9 border border-slate-100 dark:border-slate-800">
                          <AvatarImage
                            src={comment.author?.profile_picture_url || undefined}
                            alt={authorName}
                          />
                          <AvatarFallback className="text-xs font-semibold">
                            {commentInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{authorName}</p>
                              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                                {comment.author_role === "teacher" ? "Docente" : "Estudiante"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-comment" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Nuevo comentario
                </Label>
                <Textarea
                  id="submission-comment"
                  placeholder="Comparte observaciones o ajustes recomendados para que el profesor lo revise..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Se enviará al docente asignado y quedará visible en esta entrega.
                  </p>
                  <Button
                    className="sm:w-auto"
                    onClick={handleAddComment}
                    disabled={isCommentSubmitting || commentText.trim().length < 5}
                  >
                    {isCommentSubmitting ? (
                      <>
                        <Spinner className="mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <IconSend className="mr-2 h-4 w-4" />
                        Enviar comentario
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row">
              {!isApproved && (
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Solicitar reenvío
                </Button>
              )}
              {!isApproved && (
                <Button
                  variant="default"
                  onClick={() => setShowApproveDialog(true)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <IconCheck className="mr-2 h-4 w-4" />
                  Aprobar trabajo
                </Button>
              )}
              {isApproved && (
                <Badge className="w-full justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                  Trabajo aprobado
                </Badge>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar este trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Al aprobar, la tarea se marcará como completada y el profesor recibirá una
              notificación. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Aprobando...
                </>
              ) : (
                "Sí, Aprobar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar este trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Pide ajustes al profesor y mantén la tarea en “volver a enviar” para que suba una nueva versión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Retroalimentación para reenvío</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explica qué necesita ser corregido o mejorado..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 10 caracteres
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || rejectionReason.length < 10}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Enviando solicitud...
                </>
              ) : (
                "Solicitar reenvío"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

