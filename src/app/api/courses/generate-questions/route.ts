import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"

type QuestionType = "multiple_choice" | "true_false"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "teacher" && profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = (await req.json()) as {
      topic?: string
      types?: QuestionType[]
      count?: number
      difficulty?: string
      feedback?: boolean
      objective?: string
      level?: string
      minutes?: number
      questionCount?: number
      context?: string
    }

    const topic = (body.topic || body.context || "").trim()
    const objective = (body.objective || "").trim()
    const level = (body.level || "").trim()
    const availableMinutes =
      typeof body.minutes === "number" && !Number.isNaN(body.minutes) ? Math.max(0, body.minutes) : undefined
    const desiredCount = body.count ?? body.questionCount
    const count = Math.max(
      1,
      Math.min(
        20,
        typeof desiredCount === "number" && !Number.isNaN(desiredCount)
          ? desiredCount
          : availableMinutes
            ? Math.max(1, Math.round(availableMinutes / 3))
            : 5,
      ),
    )
    const filteredTypes = (body.types || []).filter(
      (t): t is QuestionType => t === "multiple_choice" || t === "true_false",
    )
    const types = filteredTypes.length > 0 ? filteredTypes : (["multiple_choice", "true_false"] as QuestionType[])

    if (!topic) return NextResponse.json({ error: "Falta el tema" }, { status: 400 })

    const apiKey =
      process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_KEY
    const useDeepseek = Boolean(process.env.DEEPSEEK_API_KEY)
    if (!apiKey) return NextResponse.json({ error: "Configura DEEPSEEK_API_KEY" }, { status: 500 })

    const prompt = [
      "Genera preguntas de examen en espanol en formato JSON. Responde SOLO un JSON con la clave 'questions'.",
      "Cada pregunta debe tener: prompt (texto), type ('multiple_choice' o 'true_false'),",
      "options (si multiple_choice, un array de 4 opciones), correct_answer (texto), feedback (1-2 oraciones).",
      `Tema: ${topic}.`,
      objective ? `Objetivo de aprendizaje: ${objective}.` : "",
      level ? `Nivel del estudiante: ${level}.` : "",
      availableMinutes ? `Tiempo estimado disponible: ${availableMinutes} minutos.` : "",
      `Cantidad: ${count}.`,
      `Tipos permitidos: ${types.join(", ")}.`,
      `Dificultad: ${body.difficulty || "medio"}.`,
      body.feedback === false ? "No incluyas feedback si no se solicita." : "Incluye feedback breve (1-2 oraciones).",
      "No anadas texto fuera del JSON. Usa espanol neutro y opciones claras.",
    ]
      .filter(Boolean)
      .join("\n")

    const response = await fetch(
      useDeepseek ? "https://api.deepseek.com/v1/chat/completions" : "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: useDeepseek ? "deepseek-chat" : "gpt-4o-mini",
          temperature: 0.5,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Eres un asistente que genera preguntas de evaluacion en JSON conciso.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      console.error("ai error", text)
      return NextResponse.json({ error: "No pudimos generar preguntas" }, { status: 500 })
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content || "{}"
    let parsed: { questions?: unknown } = {}
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      console.error("parse ai json", err)
    }

    const rawQuestions = (parsed as { questions?: unknown }).questions
    const questions =
      Array.isArray(rawQuestions) && rawQuestions.length > 0
        ? rawQuestions.map((q) => {
            const obj = q as Record<string, unknown>
            const typeValue = obj.type === "true_false" ? "true_false" : "multiple_choice"
            const optionsValue =
              Array.isArray(obj.options) && obj.options.length > 0
                ? obj.options.filter((opt): opt is string => typeof opt === "string")
                : typeValue === "true_false"
                  ? ["Verdadero", "Falso"]
                  : []

            return {
              prompt: typeof obj.prompt === "string" ? obj.prompt : "",
              type: typeValue,
              options: optionsValue,
              correctAnswer:
                typeof (obj as { correct_answer?: unknown }).correct_answer === "string"
                  ? (obj as { correct_answer?: string }).correct_answer
                  : typeof (obj as { correctAnswer?: unknown }).correctAnswer === "string"
                    ? (obj as { correctAnswer?: string }).correctAnswer
                    : "",
              feedback: typeof obj.feedback === "string" ? obj.feedback : "",
            }
          })
        : []

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("generate questions error", error)
    return NextResponse.json({ error: "Error generando preguntas" }, { status: 500 })
  }
}
