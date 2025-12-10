"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { getTaskAttachments, type TaskAttachment } from "@/lib/data/attachment-actions"

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
  taskId?: string
  milestoneId?: string
  studentName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmissionUpdated?: (nextStatus?: Submission["review_status"], submissionId?: string) => void
}

export function SubmissionPreviewSheet({
  submission,
  taskTitle,
  milestoneTitle,
  taskId,
  milestoneId,
  studentName,
  open,
  onOpenChange,
  onSubmissionUpdated,
}: SubmissionPreviewSheetProps) {
  const contactInfoPatterns = useMemo(
    () => [
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // emails
      /\b(?:\+?\d[\d\s\-().]{7,}\d)\b/, // phone numbers with country code / separators
      /\b(?:whatsapp|wsp|telegram|tel[eé]fono|celular|phone)\s*:?\s*\+?\d[\d\s\-().]{5,}\d\b/i, // explicit contact mentions
    ],
    [],
  )

  const containsContactInfo = useCallback(
    (text: string) => contactInfoPatterns.some((regex) => regex.test(text)),
    [contactInfoPatterns],
  )

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
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)

  const isCommentSharingContactInfo = useMemo(
    () => containsContactInfo(commentText),
    [commentText, containsContactInfo],
  )
  const isRejectionSharingContactInfo = useMemo(
    () => containsContactInfo(rejectionReason),
    [containsContactInfo, rejectionReason],
  )

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
  const submitterName = submission.teacher?.name || studentName || "Profesor"
  const hasImages = images.length > 0
  const isApproved = submission.review_status === "approved" || submission.is_approved === true

  useEffect(() => {
    if (!open) return
    loadComments()
  }, [loadComments, open])

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!open || !taskId || !milestoneId) {
        setAttachments([])
        return
      }
      setAttachmentsLoading(true)
      const result = await getTaskAttachments(taskId, milestoneId)
      if (!result.error) {
        setAttachments(result.attachments)
      }
      setAttachmentsLoading(false)
    }
    fetchAttachments()
  }, [taskId, milestoneId, open])

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

    if (containsContactInfo(rejectionReason)) {
      toast.error("Por seguridad, no compartas correos, telefonos u otros datos de contacto.")
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

    if (containsContactInfo(trimmed)) {
      toast.error("Por seguridad, no compartas correos, telefonos u otros datos de contacto.")
      return
    }

    setIsCommentSubmitting(true)
    try {
      const result = await createSubmissionComment(submission.id, trimmed)
      if (result.status === "success" && result.comment) {
        const newComment = result.comment
        setComments((prev) => [...prev, newComment])
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
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto p-0 border-l shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 dark:bg-slate-950/80 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-1">
              <SheetTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Revisión de Entrega
                {milestoneTitle && (
                  <Badge variant="outline" className="ml-2 font-normal text-xs rounded-full px-2.5 py-0.5 border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {milestoneTitle}
                  </Badge>
                )}
              </SheetTitle>
              <Badge
                className={`rounded-full px-3 py-1 text-xs font-medium border-0 ${statusLabel[submission.review_status || "pending_review"].className}`}
              >
                {statusLabel[submission.review_status || "pending_review"].label}
              </Badge>
            </div>
            <SheetDescription className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {taskTitle} • Enviado {submittedAtLabel} por <span className="font-medium text-slate-700 dark:text-slate-300">{submitterName}</span>
            </SheetDescription>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* Images Gallery */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Evidencias ({images.length})
                </Label>
              </div>

              {hasImages ? (
                <div className="group relative bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                    <div
                      onContextMenu={handleContextMenu}
                      className="relative w-full h-full"
                    >
                      {imageLoadErrors[currentImageIndex] ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white p-6">
                          <IconPhotoCancel className="h-12 w-12 opacity-50" />
                          <div>
                            <p className="text-sm font-medium">Imagen no disponible</p>
                            <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                              El archivo no se pudo cargar. Puede haber sido eliminado o movido.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={images[currentImageIndex]}
                          alt={`Evidencia ${currentImageIndex + 1}`}
                          fill
                          className="object-contain"
                          unoptimized
                          draggable={false}
                          onError={() => handleImageError(currentImageIndex)}
                        />
                      )}

                      {/* Watermark */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
                          <p className="text-white/90 text-sm font-medium tracking-widest">
                            VISTA PREVIA
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={prevImage}
                        >
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={nextImage}
                        >
                          <IconChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </div>

                  {/* Thumbnails Strip */}
                  {images.length > 1 && (
                    <div className="flex gap-2 p-2 overflow-x-auto bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 scrollbar-hide">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-12 w-20 flex-shrink-0 rounded-md overflow-hidden transition-all ${currentImageIndex === index
                            ? "ring-2 ring-blue-500 opacity-100"
                            : "opacity-60 hover:opacity-100"
                            }`}
                        >
                          <Image
                            src={img}
                            alt={`Thumb ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <IconPhoto className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Sin evidencias visuales</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">El profesor no adjuntó imágenes.</p>
                </div>
              )}
            </div>

            {/* Content & Comments Stack */}
            <div className="space-y-8">
              {/* Description */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Descripción del Avance
                </Label>
                <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {submission.content}
                  </p>
                </div>
              </div>

              {/* Attached files (any format) */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Archivos adjuntos del avance
                </Label>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  {attachmentsLoading ? (
                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Cargando adjuntos...</div>
                  ) : attachments.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 dark:text-slate-400">No hay archivos adjuntos para este avance.</div>
                  ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                      {attachments.map((file) => (
                        <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{file.file_name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {file.file_type || "Archivo"} • {(file.file_size ? (file.file_size / (1024 * 1024)).toFixed(2) : "N/A")} MB
                            </p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                              <IconDownload className="h-4 w-4 mr-1" />
                              Descargar
                            </a>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Comentarios
                  </Label>
                  <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {comments.length}
                  </Badge>
                </div>

                <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                  {/* Comments List */}
                  <div className="p-4 overflow-y-auto max-h-[400px] space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
                    {commentsLoading ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 gap-2">
                        <Spinner className="h-5 w-5" />
                        <span className="text-xs">Cargando charla...</span>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 gap-2">
                        <IconMessage className="h-8 w-8 opacity-20" />
                        <p className="text-xs text-center max-w-[180px]">
                          Inicia la conversación con el profesor sobre este avance.
                        </p>
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isMe = comment.author_role !== "teacher"; // Assuming student view
                        return (
                          <div key={comment.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8 border border-white shadow-sm flex-shrink-0">
                              <AvatarImage src={comment.author?.profile_picture_url || undefined} />
                              <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                                {comment.author?.name?.substring(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe
                                ? "bg-blue-600 text-white rounded-tr-sm"
                                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm"
                                }`}>
                                <p className="leading-snug break-all whitespace-pre-wrap">{comment.message}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 px-1">
                                {formatDistanceToNow(new Date(comment.created_at), { locale: es })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Textarea
                          placeholder="Escribe un comentario..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[44px] max-h-32 py-3 px-4 resize-none rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 pr-12 text-sm"
                          rows={1}
                        />
                        {isCommentSharingContactInfo && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Evita compartir correos, teléfonos o datos de contacto. Usa el chat interno.
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        className="absolute right-1 bottom-1 h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleAddComment}
                        disabled={isCommentSubmitting || commentText.trim().length < 2 || isCommentSharingContactInfo}
                      >
                        {isCommentSubmitting ? <Spinner className="h-4 w-4 text-white" /> : <IconSend className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 dark:bg-slate-950/80 dark:border-slate-800/60">
            <div className="flex gap-3 max-w-md mx-auto w-full">
              {true && (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1 h-11 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-rose-400 transition-colors"
                  disabled={isSubmitting}
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Solicitar Cambios
                </Button>
              )}

              {!isApproved ? (
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="flex-[2] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  <IconCheck className="mr-2 h-5 w-5" />
                  Aprobar Entrega
                </Button>
              ) : (
                <div className="flex-[2] h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50 font-medium">
                  <IconCheck className="h-5 w-5" />
                  Aprobado
                </div>
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
              Mínimo 10 caracteres. No compartas datos de contacto.
            </p>
            {isRejectionSharingContactInfo && (
              <p className="text-xs text-amber-600 mt-1">
                Por seguridad, retira correos, telefonos u otros datos de contacto.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || rejectionReason.length < 10 || isRejectionSharingContactInfo}
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
