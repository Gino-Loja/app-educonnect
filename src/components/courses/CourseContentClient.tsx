"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { IconCheck, IconChevronDown, IconPlayerPlay, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { markLessonCompleted } from "@/lib/data/course-actions"
import { toast } from "sonner"

type LessonQuestion = {
  id: string
  type: "multiple_choice" | "true_false"
  prompt: string
  options?: string[] | null
  correctAnswer?: string | null
  feedback?: string | null
  position?: number | null
}

type Lesson = {
  id: string
  title: string
  content_type: string | null
  content_url?: string | null
  duration_minutes: number | null
  signed_url?: string | null
  text_content?: string | null
  questions?: LessonQuestion[]
  pass_score?: number | null
  completed: boolean
}

type Module = {
  id: string
  title: string
  description: string | null
  lessons: Lesson[]
}

interface Props {
  modules: Module[]
  courseTitle: string
}

export function CourseContentClient({ modules, courseTitle }: Props) {
  const [modulesState, setModulesState] = useState<Module[]>(modules)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({})
  const [attempts, setAttempts] = useState<Record<string, { score: number; passed: boolean }>>({})

  const selectedLesson = useMemo(() => {
    if (!selectedLessonId) return null
    for (const mod of modulesState) {
      const found = mod.lessons.find((l) => l.id === selectedLessonId)
      if (found) return found
    }
    return null
  }, [modulesState, selectedLessonId])

  async function handleMarkComplete(lessonId: string) {
    setLoading(true)
    try {
      const result = await markLessonCompleted({ lessonId })
      if (result.status === "success") {
        toast.success(result.message)
        setModulesState((prev) =>
          prev.map((mod) => ({
            ...mod,
            lessons: mod.lessons.map((l) => (l.id === lessonId ? { ...l, completed: true } : l)),
          })),
        )
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error marking lesson complete", error)
      toast.error("Error al marcar la lección")
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerChange(lessonId: string, questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] || {}),
        [questionId]: value,
      },
    }))
  }

  function getResourceType(url: string | null, contentType: string | null): "video" | "pdf" | "image" | "unknown" {
    if (!url) return "unknown"

    const urlLower = url.toLowerCase()
    const typeLower = contentType?.toLowerCase() || ""

    if (urlLower.includes(".mp4") || urlLower.includes(".webm") || typeLower.includes("video")) {
      return "video"
    }
    if (urlLower.includes(".pdf") || typeLower.includes("pdf")) {
      return "pdf"
    }
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)/) || typeLower.includes("image")) {
      return "image"
    }
    return "unknown"
  }

  function renderQuiz(lesson: Lesson) {
    const questions = lesson.questions || []
    if (!questions.length) {
      return (
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-muted-foreground">Este examen aún no tiene preguntas.</p>
        </div>
      )
    }

    const lessonAnswers = answers[lesson.id] || {}
    const passScore = typeof lesson.pass_score === "number" ? lesson.pass_score : 70
    const lastAttempt = attempts[lesson.id]

    const handleSubmit = async () => {
      const unanswered = questions.some((q) => !lessonAnswers[q.id])
      if (unanswered) {
        toast.error("Responde todas las preguntas antes de enviar.")
        return
      }
      const correct = questions.reduce((acc, q) => {
        const selected = lessonAnswers[q.id]
        const expected = q.correctAnswer || ""
        return acc + (selected === expected ? 1 : 0)
      }, 0)
      const score = Math.round((correct / questions.length) * 100)
      const passed = score >= passScore
      setAttempts((prev) => ({ ...prev, [lesson.id]: { score, passed } }))
      if (passed) {
        toast.success(`Aprobaste con ${score}% (${correct}/${questions.length}).`)
        if (!lesson.completed) {
          await handleMarkComplete(lesson.id)
        }
      } else {
        toast.error(`Obtuviste ${score}%. Necesitas ${passScore}% para aprobar.`)
      }
    }

    const handleReset = () => {
      setAnswers((prev) => ({ ...prev, [lesson.id]: {} }))
    }

    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">!</span>
            <div className="flex-1">
              <p className="font-semibold">Necesitas {passScore}% para aprobar.</p>
              {lastAttempt ? (
                <p className="text-xs">
                  Último intento:{" "}
                  <span className={lastAttempt.passed ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                    {lastAttempt.score}% ({lastAttempt.passed ? "Aprobado" : "No aprobado"})
                  </span>
                </p>
              ) : (
                <p className="text-xs text-amber-800">Sin intentos previos.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {questions.map((q, idx) => {
            const options =
              q.type === "true_false"
                ? ["Verdadero", "Falso"]
                : q.options && q.options.length
                  ? q.options
                  : ["", "", "", ""]
            const selected = lessonAnswers[q.id] || ""
            return (
              <div key={q.id} className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Pregunta {idx + 1}</div>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{q.prompt}</p>
                <div className="space-y-2">
                  {options.map((opt, optIndex) => {
                    const value = opt || `Opción ${optIndex + 1}`
                    const isSelected = selected === value
                    return (
                      <label
                        key={`${q.id}-${optIndex}`}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                          isSelected ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${lesson.id}-${q.id}`}
                          className="h-4 w-4 text-blue-600 focus-visible:ring-blue-500"
                          checked={isSelected}
                          onChange={() => handleAnswerChange(lesson.id, q.id, value)}
                        />
                        {value}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reintentar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Enviar respuestas
          </Button>
        </div>
      </div>
    )
  }

  function renderResource(lesson: Lesson) {
    const type = lesson.content_type?.toLowerCase()

    if (lesson.text_content && type === "text") {
      return (
        <div className="prose prose-slate max-w-none rounded-lg border bg-white p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.text_content}</div>
        </div>
      )
    }

    if (type === "quiz") {
      return renderQuiz(lesson)
    }

    const resourceUrl = lesson.signed_url || lesson.content_url || null
    if (!resourceUrl) {
      return (
        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">No hay recurso disponible</p>
        </div>
      )
    }

    const resourceType = getResourceType(resourceUrl, lesson.content_type)

    switch (resourceType) {
      case "video":
        return (
          <video key={resourceUrl} controls className="w-full aspect-video rounded-lg bg-black" src={resourceUrl}>
            Tu navegador no soporta el elemento de video.
          </video>
        )
      case "pdf":
        return <iframe src={resourceUrl} className="w-full aspect-video rounded-lg border" title={lesson.title} />
      case "image":
        return (
          <Image
            src={resourceUrl}
            alt={lesson.title}
            width={1200}
            height={675}
            className="w-full h-auto rounded-lg object-contain"
            sizes="100vw"
            priority={false}
          />
        )
      default:
        return (
          <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center gap-3 p-6">
            <p className="text-muted-foreground text-center">Tipo de recurso no soportado para visualización inline</p>
            <Button variant="outline" size="sm" asChild>
              <a href={resourceUrl} target="_blank" rel="noreferrer">
                Abrir en nueva pestaña
              </a>
            </Button>
          </div>
        )
    }
  }

  const modulesToShow = modulesState

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-80 border-r bg-slate-50 overflow-y-auto">
        <div className="p-4 space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground mb-3">CONTENIDO DEL CURSO</h2>
          {modulesToShow.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay módulos disponibles.</p>
          ) : (
            modulesToShow.map((module, moduleIndex) => (
              <Collapsible key={module.id} defaultOpen={moduleIndex === 0}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white transition-colors text-left">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{module.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {module.lessons.filter((l) => l.completed).length}/{module.lessons.length} lecciones
                    </p>
                  </div>
                  <IconChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {module.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`flex items-center gap-2 p-2 pl-6 rounded-md hover:bg-white transition-colors w-full text-left ${selectedLessonId === lesson.id ? "bg-white shadow-sm" : ""}`}
                    >
                      {lesson.completed ? (
                        <IconCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <p className="text-sm flex-1 line-clamp-1">{lesson.title}</p>
                      {(lesson.signed_url || lesson.content_url) && (
                        <IconPlayerPlay className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          {/* Mobile Course Title */}
          <div className="md:hidden">
            <h1 className="text-xl font-bold">{courseTitle}</h1>
          </div>

          {/* Resource Viewer */}
          {selectedLesson ? (
            <Card>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedLesson.content_type || "contenido"} - {selectedLesson.duration_minutes || "--"} min
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLessonId(null)} className="shrink-0">
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {renderResource(selectedLesson)}

                  <div className="flex justify-end">
                    <Button
                      variant={selectedLesson.completed ? "secondary" : "default"}
                      disabled={selectedLesson.completed || loading}
                      onClick={() => handleMarkComplete(selectedLesson.id)}
                    >
                      {selectedLesson.completed ? (
                        <>
                          <IconCheck className="mr-2 h-4 w-4" />
                          Completado
                        </>
                      ) : (
                        "Marcar como completado"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <IconPlayerPlay className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona una lección</h3>
                <p className="text-muted-foreground">Elige una lección del menú lateral para comenzar a aprender</p>
              </CardContent>
            </Card>
          )}

          {/* Mobile Module Navigation */}
          <div className="lg:hidden space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground">TODAS LAS LECCIONES</h2>
            {modulesToShow.map((module, moduleIndex) => (
              <Collapsible key={module.id} defaultOpen={moduleIndex === 0}>
                <Card>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
                    <div className="flex-1 text-left">
                      <p className="font-medium">{module.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {module.lessons.filter((l) => l.completed).length}/{module.lessons.length} lecciones
                      </p>
                    </div>
                    <IconChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t p-4 pt-3 space-y-2">
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`flex items-start gap-3 p-3 rounded-lg border bg-white w-full text-left ${selectedLessonId === lesson.id ? "ring-2 ring-blue-500" : ""}`}
                        >
                          {lesson.completed ? (
                            <IconCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {lesson.content_type || "contenido"} - {lesson.duration_minutes || "--"} min
                            </p>
                          </div>
                          {(lesson.signed_url || lesson.content_url) && (
                            <IconPlayerPlay className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
