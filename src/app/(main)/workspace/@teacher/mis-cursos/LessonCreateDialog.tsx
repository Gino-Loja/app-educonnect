'use client'

import { FormEvent, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react"

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

type LessonCreateDialogProps = {
  moduleId: string
  trigger?: ReactNode
}

const FILE_TYPES = ["video", "image", "file"]
type LessonQuestion = {
  id: string
  prompt: string
  type: "multiple_choice" | "true_false"
  options?: string[] | null
  correctAnswer?: string | null
  feedback?: string | null
  position?: number | null
}

export function LessonCreateDialog({ moduleId, trigger }: LessonCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedType, setSelectedType] = useState("text")
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [aiTopic, setAiTopic] = useState("")
  const [aiObjective, setAiObjective] = useState("")
  const [aiLevel, setAiLevel] = useState("universidad")
  const [aiMinutes, setAiMinutes] = useState(5)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [textContent, setTextContent] = useState("")
  const [questions, setQuestions] = useState<LessonQuestion[]>([])
  const [passScore, setPassScore] = useState(70)
  const router = useRouter()

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
          data.options ?? q.options ?? (nextType === "true_false" ? ["Verdadero", "Falso"] : ["", "", "", ""])
        const normalizedOptions =
          nextType === "true_false" ? ["Verdadero", "Falso"] : options.length ? options : ["", "", "", ""]
        const correctAnswer =
          data.correctAnswer ?? q.correctAnswer ?? (nextType === "true_false" ? "Verdadero" : normalizedOptions[0] || "")
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

  useEffect(() => {
    if (!resourceFile) {
      setPreviewUrl(null)
      return undefined
    }
    const objectUrl = URL.createObjectURL(resourceFile)
    setPreviewUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [resourceFile])

  const handleGenerateQuestions = async () => {
    const topic = aiTopic.trim()
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
        headers: {
          "Content-Type": "application/json",
        },
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
        questions?: { prompt?: string; type?: LessonQuestion["type"]; options?: string[] | null; correctAnswer?: string; feedback?: string }[]
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
    const topic = aiTopic.trim()
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

  const triggerNode =
    trigger ??
    (
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs">
        <IconPlus className="h-3.5 w-3.5" />
        Anadir actividad
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva actividad</DialogTitle>
          <DialogDescription>Agrega materiales o evaluaciones a este modulo.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            setIsSaving(true)
            setErrorMessage(null)
            const formData = new FormData(event.currentTarget)
            try {
              const response = await fetch(`/api/courses/modules/${moduleId}/lessons`, {
                method: "POST",
                body: formData,
              })
              if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as { error?: string }
                setErrorMessage(data.error || "No pudimos crear la actividad")
                setIsSaving(false)
                return
              }
              setSelectedType("text")
              setResourceFile(null)
              setPreviewUrl(null)
              setQuestions([])
              setOpen(false)
              router.refresh()
            } catch (error) {
              console.error(error)
              setErrorMessage("No pudimos crear la actividad")
            } finally {
              setIsSaving(false)
            }
          }}
          className="space-y-4"
        >
          <input type="hidden" name="lessonQuestions" value={serializedQuestions} />
          <input type="hidden" name="lessonPassScore" value={passScore} />
          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input name="lessonTitle" placeholder="Ej. Introduccion" required />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              name="lessonContentType"
              value={selectedType}
              onChange={(event) => {
                const nextType = event.target.value
                setSelectedType(nextType)
                if (!FILE_TYPES.includes(nextType)) {
                  setResourceFile(null)
                }
                if (!["text", "quiz"].includes(nextType)) {
                  setAiMessage(null)
                  setAiError(null)
                }
                if (nextType === "quiz" && questions.length === 0) {
                  setQuestions([defaultQuestion(1)])
                  setPassScore((prev) => prev || 70)
                }
                if (nextType !== "quiz") {
                  setQuestions([])
                }
                if (nextType !== "text") {
                  setTextContent("")
                }
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              required
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
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
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
              <div className="grid gap-2">
                <select
                  value={aiLevel}
                  onChange={(event) => setAiLevel(event.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="bachillerato">Bachillerato</option>
                  <option value="universidad">Universidad</option>
                  <option value="profesional">Profesional</option>
                </select>
              </div>
              {selectedType === "quiz" ? (
                <div className="grid gap-2 sm:grid-cols-[1fr,160px]">
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
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-blue-300"
                    onClick={handleGenerateQuestions}
                    disabled={aiLoading}
                  >
                    <IconSparkles className="mr-2 h-4 w-4" />
                    {aiLoading && selectedType === "quiz" ? "Generando..." : "Generar preguntas con IA"}
                  </Button>
                </div>
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
                Usa este cuadro como ayuda: tema, objetivo, nivel y numero de preguntas alimentan a la IA de DeepSeek.
              </p>
              {aiMessage ? <p className="text-xs text-blue-700">{aiMessage}</p> : null}
              {aiError ? <p className="text-xs text-rose-600">{aiError}</p> : null}
            </div>
          ) : null}
          {selectedType !== "quiz" ? (
            <>
              <div className="space-y-2">
                <Label>Contenido o instrucciones</Label>
                {selectedType === "text" ? (
                  <textarea
                    name="textContent"
                    rows={5}
                    placeholder="Describe la actividad o pega el contenido aqui"
                    value={textContent}
                    onChange={(event) => setTextContent(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                ) : selectedType === "link" ? (
                  <Input name="lessonUrl" type="url" placeholder="https://..." required />
                ) : (
                  <>
                    <input type="hidden" name="lessonUrl" value="" />
                    <p className="text-xs text-muted-foreground">
                      Este tipo utiliza un archivo o recurso multimedia. Adjunta el material abajo.
                    </p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label>Duración estimada (min)</Label>
                <Input name="lessonDuration" type="number" min="1" step="1" />
              </div>
              {FILE_TYPES.includes(selectedType) ? (
                <div className="space-y-2">
                  <Label>Archivo</Label>
                  <Input
                    type="file"
                    name="lessonFile"
                    required
                    onChange={(event) => setResourceFile(event.target.files?.[0] || null)}
                  />
                  {previewUrl ? (
                    selectedType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Vista previa" className="h-40 w-full rounded-md object-cover" />
                    ) : selectedType === "video" ? (
                      <video controls className="h-56 w-full rounded-md bg-black object-cover">
                        <source src={previewUrl} />
                      </video>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Archivo seleccionado: <span className="font-medium">{resourceFile?.name}</span>
                      </p>
                    )
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <input type="hidden" name="lessonUrl" value="" />
              <div className="space-y-3 rounded-2xl border border-blue-200  p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold ">Preguntas del examen</p>
                    <p className="text-xs text-muted-foreground">
                      Agrega preguntas de opci¢n m£ltiple o verdadero/falso para esta actividad.
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
                    Añadir pregunta
                  </Button>
                </div>
                {questions.length === 0 ? (
                  <p className="text-xs text-blue-800">Agrega al menos una pregunta.</p>
                ) : null}
                <div className="space-y-3">
                  {questions.map((question, index) => {
                    const options =
                      question.type === "true_false"
                        ? ["Verdadero", "Falso"]
                        : (question.options && question.options.length ? question.options : ["", "", "", ""])
                    return (
                      <div key={question.id} className="space-y-2 rounded-xl border border-blue-200 bg-white p-3 shadow-sm">
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
                                <div key={`${question.id}-opt-${optIndex}`} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
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
                              <label key={`${question.id}-${value}`} className="flex items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name={`correct-tf-${question.id}`}
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
            </>
          )}
          <DialogFooter className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Crear actividad"}
            </Button>
          </DialogFooter>
          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  )
}
