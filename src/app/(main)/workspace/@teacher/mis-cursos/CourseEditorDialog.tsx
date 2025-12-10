'use client'

import { useEffect, useRef, useState, type ReactNode } from "react"
import { IconPencil } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Course = {
  id: string
  title: string
  description: string | null
  price: number
  cover_url: string | null
  status: "draft" | "published"
  coverPreviewUrl?: string | null
}

type CourseEditorDialogProps = {
  course: Course
  updateAction: (formData: FormData) => Promise<void>
  trigger?: ReactNode
}

export function CourseEditorDialog({ course, updateAction, trigger }: CourseEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [coverUrl, setCoverUrl] = useState(course.cover_url ?? "")
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    course.coverPreviewUrl ?? (course.cover_url?.startsWith("http") ? course.cover_url : null),
  )
  const [showFileInput, setShowFileInput] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const initialCover = course.cover_url ?? ""
    setCoverUrl(initialCover)
    setPreviewUrl(course.coverPreviewUrl ?? (initialCover.startsWith("http") ? initialCover : null))
    setCoverFile(null)
    setShowFileInput(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [open, course.cover_url, course.coverPreviewUrl])

  useEffect(() => {
    if (!coverFile) return
    const objectUrl = URL.createObjectURL(coverFile)
    setPreviewUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [coverFile])

  const handleCoverChange = (value: string) => {
    setCoverUrl(value)
    setCoverFile(null)
    setPreviewUrl(value && value.startsWith("http") ? value : null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerNode =
    trigger ??
    (
      <Button variant="outline" size="sm" className="gap-2">
        <IconPencil className="h-4 w-4" />
        Editar curso
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar curso</DialogTitle>
          <DialogDescription>Actualiza la información visible para tus estudiantes.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            setIsSaving(true)
            try {
              await updateAction(formData)
              setOpen(false)
            } finally {
              setIsSaving(false)
            }
          }}
          className="space-y-4"
        >
          <input type="hidden" name="courseId" value={course.id} />
          <div className="space-y-2">
            <Label>Nombre del curso</Label>
            <Input name="title" defaultValue={course.title} required />
          </div>
          <div className="space-y-2">
            <Label>Portada o video</Label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              {previewUrl ? (
                previewUrl.match(/\.(mp4|mov|webm)$/i) ? (
                  <video controls className="h-48 w-full rounded-lg bg-black object-cover">
                    <source src={previewUrl} />
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={course.title} className="h-48 w-full rounded-lg object-cover" />
                )
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Sin portada</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowFileInput((prev) => !prev)}>
                {showFileInput ? "Listo" : "Cambiar imagen"}
              </Button>
              {coverUrl ? (
                <Button type="button" variant="ghost" onClick={() => handleCoverChange("")}>
                  Quitar portada
                </Button>
              ) : null}
            </div>
            <Input
              type="file"
              accept="image/*"
              name="coverFile"
              className={showFileInput ? "" : "hidden"}
              ref={fileInputRef}
              onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
            />
            <input type="hidden" name="coverUrl" value={coverUrl} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Estado</Label>
              <select
                name="status"
                defaultValue={course.status}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Precio (USD)</Label>
              <Input name="price" type="number" min="0" step="0.01" defaultValue={course.price} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              name="description"
              rows={4}
              defaultValue={course.description ?? ""}
              placeholder="Comparte objetivos, nivel y requisitos."
            />
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
