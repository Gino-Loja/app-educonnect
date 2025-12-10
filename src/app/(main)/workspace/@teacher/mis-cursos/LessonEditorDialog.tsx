'use client'

import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IconPencil, IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react"

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

type LessonContentType = "video" | "image" | "file" | "link" | "text" | "quiz"
type LessonFileType = "video" | "image" | "file"
const FILE_TYPES: LessonFileType[] = ["video", "image", "file"]
const isFileType = (type: LessonContentType): type is LessonFileType =>
  FILE_TYPES.includes(type as LessonFileType)

type LessonQuestion = {
  id?: string
  prompt: string
  type: "multiple_choice" | "true_false"
  options?: string[] | null
  correctAnswer?: string | null
  feedback?: string | null
  position?: number | null
}

const normalizeLessonType = (value: string | null | undefined): LessonContentType => {
  const lower = (value || "").toLowerCase()
  if (lower.startsWith("video")) return "video"
  if (lower.startsWith("image")) return "image"
  if (lower.includes("pdf") || lower.includes("doc") || lower.includes("xls") || lower.includes("zip")) return "file"
  if (lower === "link") return "link"
  if (lower === "quiz") return "quiz"
  return lower === "file" ? "file" : lower === "text" ? "text" : "text"
}

const normalizeLessonQuestions = (questions?: Lesson["questions"]): LessonQuestion[] => {
  if (!questions || !Array.isArray(questions)) return []
  return questions.map((q, idx) => {
    const type = q.question_type === "true_false" || q.type === "true_false" ? "true_false" : "multiple_choice"
    const options =
      q.options && Array.isArray(q.options) && q.options.length > 0
        ? q.options
        : type === "true_false"
          ? ["Verdadero", "Falso"]
          : ["", "", "", ""]
    const fallbackCorrect = type === "true_false" ? "Verdadero" : options[0] || ""
    return {
      id: q.id,
      prompt: q.prompt || "",
      type,
      options,
      correctAnswer: q.correct_answer ?? q.correctAnswer ?? fallbackCorrect,
      feedback: q.feedback ?? "",
      position: q.position ?? idx + 1,
    }
  })
}

type Lesson = {
  id: string
  title: string
  content_type: string | null
  content_url: string | null
  text_content?: string | null
  duration_minutes: number | null
  signed_url?: string | null
  pass_score?: number | null
  questions?: {
    id?: string
    question_type?: string | null
    type?: "multiple_choice" | "true_false"
    prompt: string
    options?: string[] | null
    correct_answer?: string | null
    correctAnswer?: string | null
    feedback?: string | null
    position?: number | null
  }[]
}

type LessonEditorDialogProps = {
  lesson: Lesson
  deleteAction: (formData: FormData) => Promise<void>
  trigger?: ReactNode
}

export function LessonEditorDialog({ lesson, deleteAction, trigger }: LessonEditorDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedType, setSelectedType] = useState<LessonContentType>(normalizeLessonType(lesson.content_type))
  const [aiTopic, setAiTopic] = useState("")
  const [aiObjective, setAiObjective] = useState("")
  const [aiLevel, setAiLevel] = useState("universidad")
  const [aiMinutes, setAiMinutes] = useState(lesson.questions?.length || 5)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [questions, setQuestions] = useState<LessonQuestion[]>(normalizeLessonQuestions(lesson.questions))
  const [passScore, setPassScore] = useState<number>(Number(lesson.pass_score ?? 70))
  const [textContent, setTextContent] = useState(lesson.text_content ?? "")

  useEffect(() => {
    setSelectedType(normalizeLessonType(lesson.content_type))
    setAiMinutes(lesson.questions?.length || 5)
    setAiError(null)
    setAiMessage(null)
    setAiLoading(false)
    setResourceFile(null)
    setLocalPreviewUrl(null)
    setQuestions(normalizeLessonQuestions(lesson.questions))
    setPassScore(Number(lesson.pass_score ?? 70))
  }, [lesson.id, lesson.content_type, lesson.duration_minutes, lesson.questions, lesson.pass_score])

  useEffect(() => {
    if (!resourceFile) {
      setLocalPreviewUrl(null)
      return undefined
    }
    const objectUrl = URL.createObjectURL(resourceFile)
    setLocalPreviewUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [resourceFile])

  const shouldShowFileInput = isFileType(selectedType)
  const basePreviewUrl = lesson.signed_url ?? lesson.content_url ?? null
  const previewUrl = localPreviewUrl || basePreviewUrl
  const previewAssetType = resourceFile ? selectedType : normalizeLessonType(lesson.content_type)
  const hasAssetPreview = Boolean(previewUrl) && isFileType(previewAssetType)
  const serializedQuestions = JSON.stringify(
    questions.map((q, idx) => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.type === "true_false" ? ["Verdadero", "Falso"] : q.options || ["", "", "", ""],
      correctAnswer: q.correctAnswer || (q.type === "true_false" ? "Verdadero" : q.options?.[0] || ""),
      feedback: q.feedback,
      position: q.position ?? idx + 1,
    })),
  )
  const defaultQuestion = (position: number): LessonQuestion => ({
    id: crypto.randomUUID(),
    prompt: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    feedback: "",
    position,
  })

  const addQuestion = () => setQuestions((prev) => [...prev, defaultQuestion(prev.length + 1)])
  const updateQuestion = (index: number, data: Partial<LessonQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== index) return q
        const nextType = data.type ?? q.type
        const options =
          data.options ??
          q.options ??
          (nextType === "true_false" ? ["Verdadero", "Falso"] : ["", "", "", ""])
        const normalizedOptions =
          nextType === "true_false" ? ["Verdadero", "Falso"] : options.length ? options : ["", "", "", ""]
        const correctAnswer =
          data.correctAnswer ??
          q.correctAnswer ??
          (nextType === "true_false" ? "Verdadero" : normalizedOptions[0] || "")
        return {
          ...q,
          ...data,
          type: nextType,
          options: normalizedOptions,
          correctAnswer,
        }
      }),
    )
  }
  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index).map((q, idx) => ({ ...q, position: idx + 1 })))
  }

  const resolveVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
      if (match?.[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    if (url.includes("vimeo.com")) {
      const match = url.match(/vimeo\.com\/(\d+)/)
      if (match?.[1]) {
        return `https://player.vimeo.com/video/${match[1]}`
      }
    }
    return url
  }

  const closeDialog = () => {
    setOpen(false)
    setAiMessage(null)
    setAiError(null)
    setAiLoading(false)
    setErrorMessage(null)
    setSelectedType(normalizeLessonType(lesson.content_type))
    setAiMinutes(lesson.questions?.length || 5)
    setResourceFile(null)
    setLocalPreviewUrl(null)
    setQuestions(normalizeLessonQuestions(lesson.questions))
    setPassScore(Number(lesson.pass_score ?? 70))
    setTextContent(lesson.text_content ?? "")
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeDialog()
    } else {
      setOpen(true)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/courses/lessons/${lesson.id}`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setErrorMessage(data.error || "No pudimos actualizar la actividad")
        return
      }
      closeDialog()
      router.refresh()
    } catch (error) {
      console.error(error)
      setErrorMessage("No pudimos actualizar la actividad")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const formData = new FormData()
    formData.append("lessonId", lesson.id)
    setIsDeleting(true)
    try {
      await deleteAction(formData)
      closeDialog()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerateQuestions = async () => {
    const topic = (aiTopic || lesson.title || "").trim()
    const objective = aiObjective.trim()
    const questionCount = Math.max(1, Math.min(20, Math.round(aiMinutes) || 5))

    if (!topic && !objective) {
      setAiError("Escribe el tema u objetivo para guiar a la IA.")
      setAiMessage(null)
      return
    }

    setAiError(null)
    setAiMessage(null)
    setSelectedType("quiz")
    setAiLoading(true)

    try {
      const response = await fetch("/api/courses/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "Examen del curso",
          objective: objective || undefined,
          level: aiLevel,
          minutes: aiMinutes,
          questionCount,
          types: ["multiple_choice", "true_false"],
          feedback: true,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setAiError(data.error || "No pudimos generar preguntas con IA")
        return
      }

      const data = (await response.json()) as {
        questions?: {
          id?: string
          prompt?: string
          type?: LessonQuestion["type"]
          options?: string[] | null
          correctAnswer?: string
          feedback?: string
        }[]
        error?: string
      }

      if (data.error) {
        setAiError(data.error)
        return
      }

      const generated: LessonQuestion[] =
        data.questions?.map((q, idx) => {
          const type: LessonQuestion["type"] = q.type === "true_false" ? "true_false" : "multiple_choice"
          const options =
            type === "true_false"
              ? ["Verdadero", "Falso"]
              : q.options && q.options.length > 0
                ? q.options
                : ["", "", "", ""]

          return {
            id: crypto.randomUUID(),
            prompt: q.prompt || "",
            type,
            options,
            correctAnswer: q.correctAnswer || (type === "true_false" ? "Verdadero" : options[0] || ""),
            feedback: q.feedback || "",
            position: idx + 1,
          }
        }) || []

      if (generated.length === 0) {
        setAiError("La IA no devolvio preguntas. Intenta con mas contexto.")
        return
      }

      setQuestions(generated)
      setPassScore((prev) => prev || 70)
      setAiMessage("Preguntas generadas con IA. Revisa y ajusta antes de guardar.")
    } catch (error) {
      console.error(error)
      setAiError("No pudimos generar preguntas con IA")
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateText = async () => {
    const topic = (aiTopic || lesson.title || "").trim()
    const objective = aiObjective.trim()
    if (!topic && !objective) {
      setAiError("Escribe el tema u objetivo para guiar a la IA.")
      setAiMessage(null)
      return
    }
    setAiError(null)
    setAiMessage(null)
    setSelectedType("text")
    setAiLoading(true)

    try {
      const response = await fetch("/api/courses/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "Contenido de la leccion",
          objective: objective || undefined,
          level: aiLevel,
          minutes: aiMinutes,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setAiError(data.error || "No pudimos generar contenido con IA")
        return
      }

      const data = (await response.json()) as { content?: string; error?: string }
      if (data.error) {
        setAiError(data.error)
        return
      }
      if (!data.content) {
        setAiError("La IA no devolvio contenido. Intenta con mas contexto.")
        return
      }
      setTextContent(data.content)
      setAiMessage("Contenido generado con IA. Revisa y ajusta antes de guardar.")
    } catch (error) {
      console.error(error)
      setAiError("No pudimos generar contenido con IA")
    } finally {
      setAiLoading(false)
    }
  }

  const triggerNode =
    trigger ??
    (
      <Button variant="outline" size="sm" className="gap-2">
        <IconPencil className="h-4 w-4" />
        Editar actividad
      </Button>
    )

  const renderPreview = () => {
    if (!hasAssetPreview || !previewUrl) return null
    if (previewAssetType === "image") {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={previewUrl} alt={lesson.title} className="h-40 w-full rounded-md object-cover" />
    }
    if (previewAssetType === "video") {
      if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(previewUrl)) {
        return (
          <video controls className="h-56 w-full rounded-md bg-black object-cover">
            <source src={previewUrl} />
          </video>
        )
      }
      return (
        <div className="aspect-video min-h-[14rem] w-full overflow-hidden rounded-md bg-black">
          <iframe
            src={resolveVideoEmbedUrl(previewUrl)}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )
    }
    return (
      <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 underline">
        Descargar recurso
      </a>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar actividad</DialogTitle>
          <DialogDescription>
            Ajusta el contenido de la leccion y, si lo necesitas, pide una sugerencia al asistente IA.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="lessonQuestions" value={serializedQuestions} />
          <input type="hidden" name="lessonPassScore" value={passScore} />
          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input
              name="lessonTitle"
              defaultValue={lesson.title}
              required
              className="h-11 border-blue-400 focus-visible:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de actividad</Label>
            <select
              name="lessonContentType"
              value={selectedType}
              onChange={(event) => {
                const nextType = normalizeLessonType(event.target.value)
                setSelectedType(nextType)
                setAiMessage(null)
                setAiError(null)
                if (nextType !== "text") {
                  setTextContent(lesson.text_content ?? "")
                }
                if (!isFileType(nextType)) {
                  setResourceFile(null)
                }
                if (nextType === "quiz" && questions.length === 0) {
                  setQuestions([defaultQuestion(1)])
                }
                if (nextType !== "quiz") {
                  setQuestions([])
                  setPassScore(70)
                }
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="video">Video</option>
              <option value="image">Imagen</option>
              <option value="link">Enlace</option>
              <option value="file">Archivo</option>
              <option value="text">Texto</option>
              <option value="quiz">Examen</option>
            </select>
          </div>
          {["text", "quiz"].includes(selectedType) ? (
            <div className="rounded-2xl border border-b-blue-400  p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-800">
                <IconSparkles className="h-5 w-5" />
                <p className="text-sm font-semibold">Asistente IA</p>
              </div>
              <Input
                placeholder="Tema principal (ej: Revolucion Francesa)"
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
              />
              <Input
                placeholder="Objetivo de la leccion"
                value={aiObjective}
                onChange={(event) => setAiObjective(event.target.value)}
              />
              <div
                className={
                  selectedType === "quiz"
                    ? "grid gap-2 md:grid-cols-[1fr,160px]"
                    : "grid gap-2"
                }
              >
                <select
                  value={aiLevel}
                  onChange={(event) => setAiLevel(event.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="bachillerato">Bachillerato</option>
                  <option value="universidad">Universidad</option>
                  <option value="profesional">Profesional</option>
                </select>
                {selectedType === "quiz" ? (
                  <div className="flex flex-col gap-1">
                    <label className="block text-sm text-slate-700"># de preguntas</label>
                    <Input
                      placeholder="Cantidad de preguntas"
                      aria-label="Cantidad de preguntas"
                      type="number"
                      min={1}
                      max={20}
                      value={aiMinutes}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setAiMinutes(Number.isNaN(value) ? 5 : Math.max(1, Math.min(20, value)))
                      }}
                    />
                  </div>
                ) : null}
              </div>
              {selectedType === "quiz" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-blue-300"
                  onClick={handleGenerateQuestions}
                  disabled={aiLoading}
                >
                  <IconSparkles className="mr-2 h-4 w-4" />
                  {aiLoading ? "Generando..." : "Generar preguntas con IA"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleGenerateText}
                  disabled={aiLoading}
                >
                  <IconSparkles className="mr-2 h-4 w-4" />
                  {aiLoading ? "Generando..." : "Generar con IA"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                La IA usara el tema, objetivo, nivel y numero de preguntas de este cuadro de ayuda.
              </p>
              {aiMessage ? <p className="text-xs text-blue-700">{aiMessage}</p> : null}
              {aiError ? <p className="text-xs text-rose-600">{aiError}</p> : null}
            </div>
          ) : null}

          {selectedType !== "quiz" ? (
            <div className="space-y-2">
              <Label className="sr-only">Recurso</Label>
              {hasAssetPreview ? <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">{renderPreview()}</div> : null}
              {selectedType === "text" ? (
                <textarea
                  name="textContent"
                  value={textContent}
                  onChange={(event) => setTextContent(event.target.value)}
                  rows={10}
                  placeholder="Escribe el contenido en Markdown aqui..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-mono"
                />
              ) : selectedType === "link" ? (
                <Input
                  name="lessonUrl"
                  type="url"
                  defaultValue={lesson.content_url ?? ""}
                  placeholder="https://..."
                />
              ) : (
                <input type="hidden" name="lessonUrl" value={lesson.content_url ?? ""} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input type="hidden" name="lessonUrl" value="" />
              <div className="rounded-2xl border border-blue-400 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold ">Preguntas del examen</p>
                    <p className="text-xs text-muted-foreground">
                      Crea preguntas de opción múltiple o verdadero/falso. Se guardarán con la actividad.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <label className="font-semibold">Puntaje para aprobar:</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={passScore}
                        onChange={(event) => setPassScore(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
                        className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <Button type="button" size="sm" onClick={addQuestion}>
                    <IconPlus className="mr-1 h-4 w-4" />
                    Anadir pregunta
                  </Button>
                </div>
                {questions.length === 0 ? (
                  <p className="text-xs text-blue-800">Agrega al menos una pregunta para este examen.</p>
                ) : null}
                <div className="space-y-3">
                  {questions.map((question, index) => {
                    const options =
                      question.type === "true_false"
                        ? ["Verdadero", "Falso"]
                        : (question.options && question.options.length ? question.options : ["", "", "", ""])
                    return (
                      <div key={question.id ?? index} className="space-y-2 rounded-xl border border-blue-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">Pregunta {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-600"
                            onClick={() => removeQuestion(index)}
                          >
                            <IconTrash className="mr-1 h-4 w-4" />
                            Quitar
                          </Button>
                        </div>
                        <Input
                          value={question.prompt}
                          onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                          placeholder="Enunciado de la pregunta"
                        />
                        <select
                          value={question.type}
                          onChange={(event) => {
                            const newType = event.target.value as LessonQuestion["type"]
                            updateQuestion(index, {
                              type: newType,
                              options: newType === "true_false" ? ["Verdadero", "Falso"] : options,
                              correctAnswer: newType === "true_false" ? "Verdadero" : options[0] || "",
                            })
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <option value="multiple_choice">Opción múltiple</option>
                          <option value="true_false">Verdadero/Falso</option>
                        </select>
                        {question.type === "multiple_choice" ? (
                          <div className="space-y-2">
                            {options.map((opt, optIndex) => {
                              const isCorrect = (question.correctAnswer || "") === opt || (!question.correctAnswer && optIndex === 0)
                              return (
                                <div key={`${question.id ?? index}-opt-${optIndex}`} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id ?? index}`}
                                    className="h-4 w-4 text-blue-600 focus-visible:ring-blue-500"
                                    checked={isCorrect}
                                    onChange={() => updateQuestion(index, { correctAnswer: opt || `Opcion ${optIndex + 1}` })}
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(event) => {
                                      const nextValue = event.target.value
                                      const nextOptions = [...options]
                                      nextOptions[optIndex] = nextValue
                                      const shouldKeepCorrect = isCorrect
                                      updateQuestion(index, {
                                        options: nextOptions,
                                        correctAnswer: shouldKeepCorrect ? nextValue : question.correctAnswer,
                                      })
                                    }}
                                    placeholder={`Opción ${optIndex + 1}`}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {["Verdadero", "Falso"].map((value) => (
                              <label key={`${question.id ?? index}-${value}`} className="flex items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name={`correct-tf-${question.id ?? index}`}
                                  className="h-4 w-4 text-blue-600 focus-visible:ring-blue-500"
                                  checked={(question.correctAnswer || "Verdadero") === value}
                                  onChange={() => updateQuestion(index, { correctAnswer: value, options: ["Verdadero", "Falso"] })}
                                />
                                {value}
                              </label>
                            ))}
                          </div>
                        )}
                        <textarea
                          value={question.feedback || ""}
                          onChange={(event) => updateQuestion(index, { feedback: event.target.value })}
                          rows={2}
                          placeholder="Retroalimentación (opcional)"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Duracion estimada (minutos)</Label>
            <Input
              name="lessonDuration"
              type="number"
              min={1}
              step={1}
              defaultValue={lesson.duration_minutes ?? ""}
            />
          </div>

          {shouldShowFileInput ? (
            <div className="space-y-2">
              <Label>Archivo (opcional)</Label>
              <Input
                type="file"
                name="lessonFile"
                onChange={(event) => setResourceFile(event.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Si subes un archivo nuevo reemplazara el actual para tus estudiantes.
              </p>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" className="justify-start text-slate-600" onClick={closeDialog}>
              Cancelar
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-rose-600 hover:text-rose-600"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                <IconTrash className="h-4 w-4" />
                {isDeleting ? "Eliminando..." : "Eliminar actividad"}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </DialogFooter>
          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  )
}
