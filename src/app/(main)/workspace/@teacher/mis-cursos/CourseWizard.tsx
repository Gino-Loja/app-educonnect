"use client"

import Image from "next/image"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconChevronLeft, IconChevronRight, IconPlus, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type CourseDraft = {
  title: string
  price: number
  description?: string
  coverFile?: File | null
}

type LessonDraft = {
  id: string
  title: string
  type: "video" | "image" | "link" | "file" | "text" | "quiz"
  content?: string
  file?: File | null
  durationMinutes?: number
  questions?: QuestionDraft[]
  aiTopic?: string
  aiDifficulty?: "facil" | "medio" | "dificil"
  aiCount?: number
  aiTypes?: { multiple_choice: boolean; true_false: boolean }
  aiFeedback?: boolean
  aiLoading?: boolean
}

type QuestionDraft = {
  id: string
  prompt: string
  type: "multiple_choice" | "true_false"
  options?: string[]
  correctAnswer?: string
  feedback?: string
}

type ModuleDraft = {
  id: string
  title: string
  description?: string
  lessons: LessonDraft[]
}

const steps = [
  { id: 1, label: "Curso" },
  { id: 2, label: "Módulos" },
  { id: 3, label: "Actividades" },
  { id: 4, label: "Publicar" },
]

function CoverPreview({ file }: { file?: File | null }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  if (!url) return null
  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-slate-50 p-2">
      <p className="mb-1 text-xs font-semibold text-slate-600">Portada</p>
      <Image src={url} alt="Portada del curso" width={800} height={160} className="h-40 w-full rounded-md object-cover" />
    </div>
  )
}

function LessonFilePreview({ file, type }: { file?: File | null; type: LessonDraft["type"] }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  if (!file || !previewUrl) return null

  if (type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewUrl} alt={file.name} className="h-40 w-full rounded-md object-cover" />
    )
  }

  if (type === "video") {
    return (
      <video controls className="h-40 w-full rounded-md bg-black object-cover">
        <source src={previewUrl} />
      </video>
    )
  }

  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-2 text-xs text-slate-600">
      Archivo seleccionado: <span className="font-medium">{file.name}</span>
    </div>
  )
}

export function CourseWizard() {
  const [step, setStep] = useState(1)
  const [course, setCourse] = useState<CourseDraft>({ title: "", price: 0 })
  const [modules, setModules] = useState<ModuleDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const stepBlocked = useMemo(() => {
    return {
      2: !course.title,
      3: modules.length === 0,
      4: !course.title || modules.length === 0,
    }
  }, [course.title, modules.length])

  const nextStep = () => setStep((prev) => Math.min(4, prev + 1))
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1))

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "Nuevo módulo", description: "", lessons: [] },
    ])
  }

  const updateModule = (id: string, data: Partial<ModuleDraft>) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)))
  }

  const removeModule = (id: string) => setModules((prev) => prev.filter((m) => m.id !== id))

  const addLesson = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  id: crypto.randomUUID(),
                  title: "Nueva actividad",
                  type: "text",
                  content: "",
                  questions: [],
                  aiTopic: "",
                  aiDifficulty: "medio",
                  aiCount: 5,
                  aiTypes: { multiple_choice: true, true_false: false },
                  aiFeedback: true,
                },
              ],
            }
          : m,
      ),
    )
  }

  const updateLesson = (moduleId: string, lessonId: string, data: Partial<LessonDraft>) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...data } : l)) }
          : m,
      ),
    )
  }

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m,
      ),
    )
  }

  const addManualQuestion = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId
                  ? {
                      ...l,
                      questions: [
                        ...(l.questions || []),
                        {
                          id: crypto.randomUUID(),
                          prompt: "Nueva pregunta",
                          type: "multiple_choice",
                          options: ["", "", "", ""],
                          correctAnswer: "",
                          feedback: "",
                        },
                      ],
                    }
                  : l,
              ),
            }
          : m,
      ),
    )
  }

  const updateQuestion = (moduleId: string, lessonId: string, questionId: string, data: Partial<QuestionDraft>) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId
                  ? {
                      ...l,
                      questions: (l.questions || []).map((q) => (q.id === questionId ? { ...q, ...data } : q)),
                    }
                  : l,
              ),
            }
          : m,
      ),
    )
  }

  const removeQuestion = (moduleId: string, lessonId: string, questionId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, questions: (l.questions || []).filter((q) => q.id !== questionId) } : l,
              ),
            }
          : m,
      ),
    )
  }

  const generateQuestions = async (moduleId: string, lessonId: string) => {
    const lesson = modules.find((m) => m.id === moduleId)?.lessons.find((l) => l.id === lessonId)
    if (!lesson) return

    const topic = (lesson.aiTopic || lesson.title || "Tema del curso").trim()
    const count = Math.max(1, lesson.aiCount || 5)
    const selectedTypes = Object.entries(lesson.aiTypes || { multiple_choice: true, true_false: false })
      .filter(([, v]) => v)
      .map(([k]) => k) as QuestionDraft["type"][]

    if (selectedTypes.length === 0) {
      setError("Selecciona al menos un tipo de pregunta")
      return
    }

    updateLesson(moduleId, lessonId, { aiLoading: true })
    try {
      const res = await fetch("/api/courses/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          count,
          types: selectedTypes,
          difficulty: lesson.aiDifficulty || "medio",
          feedback: lesson.aiFeedback ?? true,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || "No pudimos generar preguntas")
        updateLesson(moduleId, lessonId, { aiLoading: false })
        return
      }

      const data = (await res.json()) as { questions: QuestionDraft[] }
      const generated = (data.questions || []).map((q) => ({
        id: crypto.randomUUID(),
        prompt: q.prompt,
        type: q.type,
        options: q.options && q.options.length ? q.options : q.type === "true_false" ? ["Verdadero", "Falso"] : ["", "", "", ""],
        correctAnswer: q.correctAnswer || "",
        feedback: q.feedback || "",
      }))

      updateLesson(moduleId, lessonId, { questions: generated, aiLoading: false })
    } catch (err) {
      console.error(err)
      setError("No pudimos generar preguntas")
      updateLesson(moduleId, lessonId, { aiLoading: false })
    }
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    const modulesPayload = modules.map((m, moduleIndex) => ({
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l, lessonIndex) => {
        const fileKey = l.file ? `lesson-file-${moduleIndex}-${lessonIndex}` : undefined
        if (fileKey && l.file) {
          formData.set(fileKey, l.file)
        }
        return {
          title: l.title,
          contentType: l.type,
          contentUrl: l.content,
          durationMinutes: l.durationMinutes,
          fileKey,
          questions: (l.questions || []).map((q, questionIndex) => ({
            prompt: q.prompt,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            feedback: q.feedback,
            position: questionIndex + 1,
          })),
        }
      }),
    }))

    const payload = {
      course: {
        title: course.title,
        price: course.price,
        description: course.description,
      },
      modules: modulesPayload,
    }

    formData.set("payload", JSON.stringify(payload))
    if (course.coverFile) {
      formData.set("cover", course.coverFile)
    }
    const res = await fetch("/api/courses/publish", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(data.error || "No pudimos publicar el curso")
      setSubmitting(false)
      return
    }
    router.push("/workspace/mis-cursos")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step >= s.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {step > s.id ? <IconCheck className="h-4 w-4" /> : s.id}
            </div>
            <span className="text-sm font-medium text-slate-700">{s.label}</span>
            {s.id < steps.length ? <div className="h-px w-8 bg-slate-200" /> : null}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Nuevo curso</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                placeholder="Título del curso"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio (USD)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={course.price}
                onChange={(e) => setCourse({ ...course, price: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe el curso"
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cover">Portada (opcional, máx. 10MB)</Label>
              <Input
                id="cover"
                name="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCourse({ ...course, coverFile: e.target.files?.[0] || null })}
              />
              <CoverPreview file={course.coverFile} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Módulos</h3>
            <Button
              type="button"
              className="bg-green-500 text-white hover:bg-green-600"
              onClick={addModule}
              disabled={!course.title}
            >
              <IconPlus className="mr-2 h-4 w-4" />
              Añadir Nuevo Módulo
            </Button>
          </div>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Añade tu primer módulo.</p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="space-y-2 rounded-lg border bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={mod.title}
                    onChange={(e) => updateModule(mod.id, { title: e.target.value })}
                    className="h-11 rounded-lg border-green-200 bg-white text-base"
                  />
                  <button type="button" onClick={() => removeModule(mod.id)} className="text-red-500">
                    <IconTrash className="h-5 w-5" />
                  </button>
                </div>
                <Textarea
                  value={mod.description || ""}
                  onChange={(e) => updateModule(mod.id, { description: e.target.value })}
                  placeholder="Descripción breve"
                  className="rounded-lg border-green-200"
                  rows={2}
                />
              </div>
            ))
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Actividades por módulo</h3>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Crea un módulo primero.</p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold">{mod.title}</h4>
                    <p className="text-xs text-muted-foreground">{mod.description || "Sin descripción"}</p>
                  </div>
                  <button type="button" onClick={() => removeModule(mod.id)} className="text-red-500">
                    <IconTrash className="h-5 w-5" />
                  </button>
                </div>
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateLesson(mod.id, lesson.id, { title: e.target.value })}
                        placeholder="Título de la actividad..."
                        className="h-11 rounded-lg border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeLesson(mod.id, lesson.id)}
                        className="text-red-500"
                      >
                        <IconTrash className="h-5 w-5" />
                      </button>
                    </div>
                    <select
                      value={lesson.type}
                      onChange={(e) => {
                        const newType = e.target.value as LessonDraft["type"]
                        if (newType === "quiz") {
                          updateLesson(mod.id, lesson.id, {
                            type: newType,
                            aiTopic: lesson.aiTopic ?? lesson.title,
                            aiDifficulty: lesson.aiDifficulty || "medio",
                            aiCount: lesson.aiCount ?? 5,
                            aiTypes: lesson.aiTypes || { multiple_choice: true, true_false: false },
                            aiFeedback: lesson.aiFeedback ?? true,
                            questions: lesson.questions || [],
                          })
                          return
                        }

                        const isFileType = ["video", "image", "file"].includes(newType)
                        const shouldKeepContent = newType === "text" || newType === "link"
                        updateLesson(mod.id, lesson.id, {
                          type: newType,
                          content: shouldKeepContent ? lesson.content || "" : "",
                          file: isFileType ? lesson.file ?? null : null,
                          questions: [],
                          aiLoading: false,
                        })
                      }}
                      className="h-11 w-full rounded-lg border border-slate-200 px-3"
                    >
                      <option value="video">Video</option>
                      <option value="image">Imagen</option>
                      <option value="link">Enlace</option>
                      <option value="file">Archivo</option>
                      <option value="text">Texto</option>
                      <option value="quiz">Examen</option>
                    </select>
                    {lesson.type !== "quiz" ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm text-slate-700">Contenido o instrucciones</Label>
                          {lesson.type === "text" ? (
                            <Textarea
                              value={lesson.content || ""}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { content: e.target.value })}
                              rows={4}
                              placeholder="Escribe el contenido aqui"
                              className="rounded-lg border-slate-200"
                            />
                          ) : lesson.type === "link" ? (
                            <Input
                              type="url"
                              value={lesson.content || ""}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { content: e.target.value })}
                              placeholder="https://..."
                              className="h-11"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Este tipo usa un archivo multimedia. Adjunta el recurso abajo.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {["video", "image", "file"].includes(lesson.type) ? (
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm text-slate-700">Archivo del recurso</Label>
                              <Input
                                type="file"
                                onChange={(e) => updateLesson(mod.id, lesson.id, { file: e.target.files?.[0] || null })}
                              />
                              <LessonFilePreview file={lesson.file} type={lesson.type} />
                            </div>
                          ) : null}
                          <div className="w-full min-w-[120px] max-w-[160px] space-y-2 sm:w-auto">
                            <Label className="text-sm text-slate-700">Duracion estimada (min)</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="15"
                              value={lesson.durationMinutes ?? ""}
                              onChange={(e) => {
                                const value = Number(e.target.value)
                                updateLesson(mod.id, lesson.id, {
                                  durationMinutes: Number.isNaN(value) ? undefined : Math.max(1, value),
                                })
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-sm text-slate-700">Tema principal</Label>
                            <Input
                              placeholder="Tema para la IA (ej: Fotosíntesis)"
                              value={lesson.aiTopic || ""}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { aiTopic: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-slate-700">Dificultad</Label>
                            <select
                              value={lesson.aiDifficulty || "medio"}
                              onChange={(e) =>
                                updateLesson(mod.id, lesson.id, { aiDifficulty: e.target.value as LessonDraft["aiDifficulty"] })
                              }
                              className="h-11 w-full rounded-lg border border-slate-200 px-3"
                            >
                              <option value="facil">Fácil</option>
                              <option value="medio">Medio</option>
                              <option value="dificil">Difícil</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-slate-700">Cantidad de preguntas</Label>
                            <Input
                              type="number"
                              min="1"
                              value={lesson.aiCount ?? 5}
                              onChange={(e) =>
                                updateLesson(mod.id, lesson.id, { aiCount: Math.max(1, Number(e.target.value) || 1) })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-slate-700">Tipos de pregunta</Label>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={lesson.aiTypes?.multiple_choice ?? true}
                                  onChange={(e) =>
                                    updateLesson(mod.id, lesson.id, {
                                      aiTypes: { ...(lesson.aiTypes || { true_false: false, multiple_choice: true }), multiple_choice: e.target.checked },
                                    })
                                  }
                                />
                                Opción múltiple
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={lesson.aiTypes?.true_false ?? false}
                                  onChange={(e) =>
                                    updateLesson(mod.id, lesson.id, {
                                      aiTypes: { ...(lesson.aiTypes || { true_false: false, multiple_choice: true }), true_false: e.target.checked },
                                    })
                                  }
                                />
                                Verdadero/Falso
                              </label>
                            </div>
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={lesson.aiFeedback ?? true}
                                onChange={(e) => updateLesson(mod.id, lesson.id, { aiFeedback: e.target.checked })}
                              />
                              Generar retroalimentación automática
                            </label>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => generateQuestions(mod.id, lesson.id)}
                            disabled={lesson.aiLoading}
                          >
                            {lesson.aiLoading ? "Generando..." : "⚡ Generar preguntas con IA"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-blue-300 text-slate-800"
                            onClick={() => addManualQuestion(mod.id, lesson.id)}
                          >
                            <IconPlus className="mr-2 h-4 w-4" />
                            Añadir pregunta manualmente
                          </Button>
                        </div>
                        {(lesson.questions || []).length > 0 ? (
                          <div className="space-y-3">
                            {(lesson.questions || []).map((q) => (
                              <div key={q.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      value={q.prompt}
                                      onChange={(e) =>
                                        updateQuestion(mod.id, lesson.id, q.id, { prompt: e.target.value })
                                      }
                                      placeholder="Enunciado de la pregunta"
                                    />
                                    <select
                                      value={q.type}
                                      onChange={(e) => {
                                        const newType = e.target.value as QuestionDraft["type"]
                                        const nextOptions =
                                          newType === "true_false"
                                            ? ["Verdadero", "Falso"]
                                            : (q.options && q.options.length > 0 ? q.options : ["", "", "", ""])
                                        const nextCorrect =
                                          newType === "true_false"
                                            ? "Verdadero"
                                            : (nextOptions[0] as string) || "Opción 1"
                                        updateQuestion(mod.id, lesson.id, q.id, {
                                          type: newType,
                                          options: nextOptions,
                                          correctAnswer: nextCorrect,
                                        })
                                      }}
                                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                                    >
                                      <option value="multiple_choice">Opción múltiple</option>
                                      <option value="true_false">Verdadero/Falso</option>
                                    </select>
                                    {q.type === "multiple_choice" ? (
                                      <div className="space-y-2">
                                        {(q.options || ["", "", "", ""]).map((opt, idx) => {
                                          const previous = opt
                                          const isCorrect = q.correctAnswer === opt || (!q.correctAnswer && idx === 0)
                                          return (
                                            <div key={`${q.id}-opt-${idx}`} className="flex items-center gap-2">
                                              <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={isCorrect}
                                                onChange={() =>
                                                  updateQuestion(mod.id, lesson.id, q.id, { correctAnswer: opt || `Opción ${idx + 1}` })
                                                }
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                              />
                                              <Input
                                                value={opt}
                                                onChange={(e) => {
                                                  const nextValue = e.target.value
                                                  const opts = [...(q.options || ["", "", "", ""])]
                                                  opts[idx] = nextValue
                                                  const shouldKeepCorrect = q.correctAnswer === previous || (!q.correctAnswer && idx === 0)
                                                  updateQuestion(mod.id, lesson.id, q.id, {
                                                    options: opts,
                                                    correctAnswer: shouldKeepCorrect ? nextValue : q.correctAnswer,
                                                  })
                                                }}
                                                placeholder={`Opción ${idx + 1}`}
                                              />
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        {["Verdadero", "Falso"].map((val) => (
                                          <label key={`${q.id}-${val}`} className="flex items-center gap-2 text-sm">
                                            <input
                                              type="radio"
                                              name={`correct-tf-${q.id}`}
                                              checked={(q.correctAnswer || "Verdadero") === val}
                                              onChange={() =>
                                                updateQuestion(mod.id, lesson.id, q.id, { correctAnswer: val, options: ["Verdadero", "Falso"] })
                                              }
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            {val}
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                    <Textarea
                                      value={q.feedback || ""}
                                      onChange={(e) => updateQuestion(mod.id, lesson.id, q.id, { feedback: e.target.value })}
                                      rows={2}
                                      placeholder="Retroalimentación (opcional)"
                                      className="rounded-lg border-slate-200"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeQuestion(mod.id, lesson.id, q.id)}
                                    className="text-red-500"
                                  >
                                    <IconTrash className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">Aún no hay preguntas. Genera con IA o añádelas manualmente.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center border border-slate-300 bg-white text-slate-800"
                  onClick={() => addLesson(mod.id)}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Añadir Actividad
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Vista previa y publicar</h3>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Curso:</p>
            <p>{course.title || "Sin título"}</p>
            <p>Precio: ${course.price.toFixed(2)}</p>
            <p className="text-muted-foreground">{course.description || "Sin descripción"}</p>
            <p className="font-semibold mt-2">Módulos: {modules.length}</p>
            {modules.map((m) => (
              <div key={m.id} className="text-xs text-muted-foreground">
                {m.title} — {m.lessons.length} actividades
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Los archivos de actividades y la portada se subirán a MinIO al publicar (límite aprox. 200MB por recurso).
          </p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          <form onSubmit={handlePublish} className="mt-4">
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
              {submitting ? "Publicando..." : "Publicar todo"}
            </Button>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 1}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={nextStep}
            disabled={step === 4 || !!stepBlocked[(step + 1) as keyof typeof stepBlocked]}
          >
            Siguiente
            <IconChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
