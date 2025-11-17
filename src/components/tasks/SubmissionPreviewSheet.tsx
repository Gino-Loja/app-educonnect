"use client"

import { useState } from "react"
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
} from "@tabler/icons-react"
import { approveSubmission, rejectSubmission } from "@/lib/data/submission-actions"
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
  teacher?: {
    name: string | null
    profile_picture_url: string | null
  }
}

interface SubmissionPreviewSheetProps {
  submission: Submission
  taskTitle: string
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmissionPreviewSheet({
  submission,
  taskTitle,
  studentName,
  open,
  onOpenChange,
}: SubmissionPreviewSheetProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const images = submission.attachments || []
  const hasImages = images.length > 0

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const result = await approveSubmission(submission.id)
      if (result.status === "success") {
        toast.success(result.message)
        setShowApproveDialog(false)
        onOpenChange(false)
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Trabajo Entregado</SheetTitle>
            <SheetDescription>
              Revisa el trabajo para: <strong>{taskTitle}</strong>
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Teacher Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <IconPhoto className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Entregado por {submission.teacher?.name || "Profesor"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(submission.submitted_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            {/* Images Gallery */}
            {hasImages && (
              <div className="space-y-3">
                <Label>Imágenes del Trabajo ({images.length})</Label>

                {/* Main Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                  <div
                    onContextMenu={handleContextMenu}
                    className="select-none relative w-full h-full"
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`Imagen ${currentImageIndex + 1}`}
                      fill
                      className="object-contain pointer-events-none"
                      draggable={false}
                    />

                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/10 backdrop-blur-[1px] px-6 py-3 rounded-lg transform -rotate-12">
                        <p className="text-white/40 text-2xl font-bold select-none">
                          PREVIEW - {studentName}
                        </p>
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
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={prevImage}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
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
                  <div className="grid grid-cols-5 gap-2">
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
                        <Image
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>Descripción del Trabajo</Label>
              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 p-4">
              <div className="flex gap-3">
                <IconPhoto className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Vista previa protegida
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Las imágenes están protegidas contra descarga directa. Si apruebas el trabajo,
                    podrás acceder a las versiones finales.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                className="flex-1"
                disabled={isSubmitting}
              >
                <IconX className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                variant="default"
                onClick={() => setShowApproveDialog(true)}
                className="flex-1"
                disabled={isSubmitting}
              >
                <IconCheck className="mr-2 h-4 w-4" />
                Aprobar Trabajo
              </Button>
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
              Por favor explica al profesor por qué estás rechazando el trabajo para que pueda
              hacer las correcciones necesarias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Razón del rechazo</Label>
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
                  Rechazando...
                </>
              ) : (
                "Rechazar Trabajo"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
