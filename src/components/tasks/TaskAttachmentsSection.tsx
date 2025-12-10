"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    IconFile,
    IconDownload,
    IconTrash,
    IconUpload,
    IconFileText,
    IconPhoto,
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
    uploadTaskAttachment,
    deleteTaskAttachment,
    type TaskAttachment,
    type AttachmentType,
} from "@/lib/data/attachment-actions"
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

interface TaskAttachmentsSectionProps {
    taskId: string
    attachments: TaskAttachment[]
    attachmentType: AttachmentType
    canUpload?: boolean
    canDelete?: boolean
    milestoneId?: string
    onAttachmentsChange?: () => void
}

export function TaskAttachmentsSection({
    taskId,
    attachments,
    attachmentType,
    canUpload = false,
    canDelete = false,
    milestoneId,
    onAttachmentsChange,
}: TaskAttachmentsSectionProps) {
    const inputId = useId()
    const [uploading, setUploading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [description, setDescription] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null)

    const filteredAttachments = attachments.filter(
        (att) => att.attachment_type === attachmentType
    )

    const uploadTitle =
        attachmentType === "task_reference"
            ? "Adjuntar documentos de referencia"
            : attachmentType === "final_delivery"
                ? "Adjuntar entrega final"
                : "Adjuntar archivos al hito"

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const oversized = files.filter((file) => file.size > 10 * 1024 * 1024)
        if (oversized.length > 0) {
            toast.error("Alguno de los archivos supera el límite de 10MB")
            return
        }
        setSelectedFiles(files)
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error("Por favor selecciona al menos un archivo")
            return
        }

        setUploading(true)
        try {
            for (const file of selectedFiles) {
                const result = await uploadTaskAttachment(
                    taskId,
                    file,
                    attachmentType,
                    description,
                    milestoneId
                )

                if (result.status === "success") {
                    toast.success(result.message)
                    if (onAttachmentsChange) {
                        onAttachmentsChange()
                    }
                } else {
                    toast.error(result.message)
                    break
                }
            }
            setSelectedFiles([])
            setDescription("")
            const fileInput = document.getElementById(inputId) as HTMLInputElement | null
            if (fileInput) fileInput.value = ""
        } catch (error) {
            console.error("Error uploading attachment", error)
            toast.error("Error al subir el archivo")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async () => {
        if (!attachmentToDelete) return

        try {
            const result = await deleteTaskAttachment(attachmentToDelete)
            if (result.status === "success") {
                toast.success(result.message)
                if (onAttachmentsChange) {
                    onAttachmentsChange()
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Error deleting attachment", error)
            toast.error("Error al eliminar el archivo")
        } finally {
            setDeleteDialogOpen(false)
            setAttachmentToDelete(null)
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Desconocido"
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const getFileIcon = (fileType: string | null) => {
        if (!fileType) return <IconFile className="w-5 h-5" />
        if (fileType.startsWith("image/")) return <IconPhoto className="w-5 h-5" />
        return <IconFileText className="w-5 h-5" />
    }

    return (
        <div className="space-y-4">
            {canUpload && (
                <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-semibold mb-3 text-sm">{uploadTitle}</h3>
                    <p className="text-xs text-muted-foreground">
                        Puedes subir varios archivos (máx. 10MB c/u).
                    </p>

                    <div className="space-y-3">
                        <div>
                            <Label htmlFor={inputId} className="text-sm">
                                Archivos (máximo 10MB c/u)
                            </Label>
                            <Input
                                id={inputId}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                disabled={uploading}
                                className="mt-1"
                            />
                            {selectedFiles.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Seleccionados: {selectedFiles.map((file) => file.name).join(", ")}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description" className="text-sm">
                                Descripción (opcional)
                            </Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Formato de entrega, requisitos..."
                                disabled={uploading}
                                className="mt-1"
                            />
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploading}
                            size="sm"
                            className="w-full"
                        >
                            <IconUpload className="w-4 h-4 mr-2" />
                            {uploading ? "Subiendo..." : "Subir archivo(s)"}
                        </Button>
                    </div>
                </div>
            )}

            {filteredAttachments.length > 0 ? (
                <div className="space-y-2">
                    <h3 className="font-semibold text-sm">
                        Archivos adjuntos ({filteredAttachments.length})
                    </h3>
                    <div className="space-y-2">
                        {filteredAttachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="text-slate-500 dark:text-slate-400">
                                        {getFileIcon(attachment.file_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                                        {attachment.description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {attachment.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(attachment.file_size)} -{" "}
                                            {new Date(attachment.created_at).toLocaleDateString("es-ES")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <a
                                            href={attachment.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                        >
                                            <IconDownload className="w-4 h-4" />
                                        </a>
                                    </Button>

                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAttachmentToDelete(attachment.id)
                                                setDeleteDialogOpen(true)
                                            }}
                                        >
                                            <IconTrash className="w-4 h-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No hay archivos adjuntos
                </p>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
