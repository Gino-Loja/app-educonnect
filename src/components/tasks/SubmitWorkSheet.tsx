"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  IconUpload,
  IconX,
  IconCloudUpload,
  IconInfoCircle,
} from "@tabler/icons-react"
import { submitWork } from "@/lib/data/submission-actions"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import { cn } from "@/lib/utils"

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"]
const ACCEPTED_IMAGE_FORMATS_LABEL = "JPG, JPEG, PNG, WEBP o HEIC"

interface SubmitWorkSheetProps {
  taskId: string
  taskTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const isAcceptedImage = (file: File) => {
  if (file.type) {
    return file.type.startsWith("image/")
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  return ACCEPTED_IMAGE_EXTENSIONS.includes(extension)
}

const formatFileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

const truncateFileName = (name: string, maxLength = 32) => {
  if (!name) return "Imagen"
  return name.length <= maxLength ? name : `${name.slice(0, maxLength - 3)}...`
}

export function SubmitWorkSheet({
  taskId,
  taskTitle,
  open,
  onOpenChange,
}: SubmitWorkSheetProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [confirmQuality, setConfirmQuality] = useState(false)
  const [confirmInstructions, setConfirmInstructions] = useState(false)

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  useEffect(() => {
    if (!open) {
      setPreviewUrls((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url))
        return []
      })
      setImages([])
      setDescription("")
      setConfirmQuality(false)
      setConfirmInstructions(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open])

  const remainingSlots = MAX_IMAGES - images.length
  const totalSizeBytes = images.reduce((acc, file) => acc + file.size, 0)
  const progress = Math.min((images.length / MAX_IMAGES) * 100, 100)

  const processIncomingFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return

    const sanitizedFiles = incomingFiles.filter((file) => file && file.size > 0)
    const invalidFiles = sanitizedFiles.filter((file) => !isAcceptedImage(file))

    if (invalidFiles.length > 0) {
      toast.error(`Solo se permiten imágenes (${ACCEPTED_IMAGE_FORMATS_LABEL})`)
      return
    }

    const oversizedFiles = sanitizedFiles.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES)
    if (oversizedFiles.length > 0) {
      toast.error(`Las imágenes deben pesar menos de ${MAX_IMAGE_SIZE_MB}MB`)
      return
    }

    if (remainingSlots <= 0) {
      toast.error(`Solo puedes subir ${MAX_IMAGES} imágenes por entrega`)
      return
    }

    const filesToAdd = sanitizedFiles.slice(0, remainingSlots)
    if (sanitizedFiles.length > remainingSlots) {
      toast.error("Alcanzaste el número máximo de imágenes")
    }

    const newPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file))

    setImages((prev) => [...prev, ...filesToAdd])
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    processIncomingFiles(Array.from(event.target.files || []))
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    processIncomingFiles(Array.from(event.dataTransfer.files || []))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (images.length === 0) {
      toast.error("Debes subir al menos una imagen del trabajo realizado")
      return
    }

    if (description.trim().length < 20) {
      toast.error("Agrega una descripción con al menos 20 caracteres")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("task_id", taskId)
      formData.append("description", description.trim())
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })
      formData.append("image_count", images.length.toString())

      const result = await submitWork(formData)

      if (result.status === "success") {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
        setDescription("")
        setImages([])
        setPreviewUrls([])
        setConfirmQuality(false)
        setConfirmInstructions(false)
        fileInputRef.current && (fileInputRef.current.value = "")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error submitting work:", error)
      toast.error("No se pudo enviar el trabajo, intenta nuevamente")
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit =
    images.length > 0 &&
    description.trim().length >= 20 &&
    confirmQuality &&
    confirmInstructions &&
    !isSubmitting

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex flex-col sm:max-w-3xl px-3 pb-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-2xl">Enviar trabajo</SheetTitle>
          <SheetDescription>
            Comparte la evidencia final para que el estudiante pueda revisarla y desbloquear el
            siguiente hito. Solo aceptamos entregas en formato de imagen.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-8 flex-1 overflow-auto pr-1">
          <Card className="border-dashed bg-muted/30">
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entregando</p>
                  <p className="text-lg font-semibold leading-tight text-foreground">{taskTitle}</p>
                </div>
                <Badge variant="secondary" className="self-start">
                  Docente
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {images.length}/{MAX_IMAGES} imágenes seleccionadas
                  </span>
                  <span>{formatFileSize(totalSizeBytes)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-1">
                Evidencias visuales <span className="text-red-500">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:text-slate-900"
                    aria-label="Ver consejos para una buena entrega"
                  >
                    <IconInfoCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left">
                  <p className="text-xs font-semibold text-primary-foreground">Consejos para una buena entrega</p>
                  <p className="mt-1 text-[11px] text-primary-foreground/80">
                    Ayuda al estudiante a revisarla rápido y sin dudas.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-primary-foreground/90">
                    <li>Incluye capturas claras del resultado, mostrando fórmulas o comentarios clave.</li>
                    <li>Sube cada archivo en orden y nómbralos siguiendo la estructura del estudiante.</li>
                    <li>Detalla cambios importantes o puntos que requieran revisión especial.</li>
                  </ul>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-primary-foreground/70">
                    Formatos permitidos: {ACCEPTED_IMAGE_FORMATS_LABEL}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">
              Arrastra tus capturas o selecciónalas desde tu equipo. Formatos permitidos:{" "}
              {ACCEPTED_IMAGE_FORMATS_LABEL}.
            </p>

            <div
              className={cn(
                "group relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition-all",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
              )}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconCloudUpload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">Arrastra y suelta tus imágenes</p>
                <p className="text-sm text-muted-foreground">
                  Máximo {MAX_IMAGES} archivos • {MAX_IMAGE_SIZE_MB} MB c/u
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Badge variant="outline" className="border-dashed px-3 py-1 text-xs">
                  {remainingSlots > 0
                    ? `${remainingSlots} espacio${remainingSlots === 1 ? "" : "s"} disponible${
                        remainingSlots === 1 ? "" : "s"
                      }`
                    : "Límite alcanzado"}
                </Badge>
                <Button
                  type="button"
                  variant="secondary"
                  className="justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={remainingSlots <= 0}
                >
                  <IconUpload className="mr-2 h-4 w-4" />
                  Seleccionar imágenes
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {previewUrls.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {previewUrls.map((url, index) => {
                  const file = images[index]
                  return (
                    <div key={url} className="group rounded-2xl border bg-card shadow-sm">
                      <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                        <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-sm text-foreground shadow transition hover:bg-background"
                          onClick={() => removeImage(index)}
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                          #{String(index + 1).padStart(2, "0")}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {truncateFileName(file?.name ?? `Imagen ${index + 1}`)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file ? formatFileSize(file.size) : ""}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Imagen
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción del trabajo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Explica qué incluye la entrega, anexos importantes y consideraciones para el estudiante."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Mínimo 20 caracteres</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-dashed bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">Checklist rápida antes de enviar</p>
            <div className="flex items-start gap-3 rounded-xl bg-background/70 p-3">
              <Checkbox
                id="quality-check"
                checked={confirmQuality}
                onCheckedChange={(checked) => setConfirmQuality(Boolean(checked))}
              />
              <div className="space-y-1">
                <Label htmlFor="quality-check" className="text-sm font-medium leading-none">
                  Verifiqué que la calidad es la esperada
                </Label>
                <p className="text-xs text-muted-foreground">
                  La entrega incluye todo lo solicitado y no contiene errores visibles.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-background/70 p-3">
              <Checkbox
                id="instructions-check"
                checked={confirmInstructions}
                onCheckedChange={(checked) => setConfirmInstructions(Boolean(checked))}
              />
              <div className="space-y-1">
                <Label htmlFor="instructions-check" className="text-sm font-medium leading-none">
                  Dejé instrucciones claras para el estudiante
                </Label>
                <p className="text-xs text-muted-foreground">
                  Expliqué los archivos adjuntos y próximos pasos para que pueda aprobarlo rápido.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar trabajo"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
