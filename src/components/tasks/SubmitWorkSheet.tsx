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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { IconUpload, IconX, IconPhoto } from "@tabler/icons-react"
import { submitWork } from "@/lib/data/submission-actions"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"

interface SubmitWorkSheetProps {
  taskId: string
  taskTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
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

  // Clean up preview URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Filter only images
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length !== files.length) {
      toast.error("Solo se permiten archivos de imagen")
    }

    // Limit to 5 images
    const totalImages = images.length + imageFiles.length
    if (totalImages > 5) {
      toast.error("Máximo 5 imágenes permitidas")
      return
    }

    // Check file sizes (max 5MB each)
    const oversizedFiles = imageFiles.filter((file) => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error("Las imágenes deben ser menores a 5MB")
      return
    }

    // Create preview URLs
    const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file))

    setImages([...images, ...imageFiles])
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    // Revoke the preview URL
    URL.revokeObjectURL(previewUrls[index])

    setImages(images.filter((_, i) => i !== index))
    setPreviewUrls(previewUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error("Debes subir al menos una imagen del trabajo realizado")
      return
    }

    if (!description.trim()) {
      toast.error("Debes agregar una descripción del trabajo")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("task_id", taskId)
      formData.append("description", description)

      // Append all images
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })
      formData.append("image_count", images.length.toString())

      const result = await submitWork(formData)

      if (result.status === "success") {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()

        // Reset form
        setDescription("")
        setImages([])
        setPreviewUrls([])
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error submitting work:", error)
      toast.error("Error al enviar el trabajo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Enviar Trabajo</SheetTitle>
          <SheetDescription>
            Sube capturas de pantalla del trabajo realizado para: <strong>{taskTitle}</strong>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>
              Imágenes del Trabajo <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Sube capturas de pantalla o imágenes del trabajo (máx. 5 imágenes, 5MB c/u)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            {images.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <IconUpload className="mr-2 h-4 w-4" />
                Seleccionar Imágenes ({images.length}/5)
              </Button>
            )}

            {/* Image Previews */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-video rounded-lg overflow-hidden border">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <IconX className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {(images[index].size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción del Trabajo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el trabajo realizado, qué incluye, consideraciones especiales, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 20 caracteres
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
            <div className="flex gap-3">
              <IconPhoto className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Importante
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  El estudiante podrá ver las imágenes pero no descargarlas directamente.
                  Las imágenes tendrán una marca de agua con el nombre del estudiante.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || images.length === 0 || description.length < 20}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar Trabajo"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
