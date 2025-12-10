import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"

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
      objective?: string
      level?: string
      minutes?: number
    }

    const topic = (body.topic || "").trim()
    const objective = (body.objective || "").trim()
    const level = (body.level || "").trim()
    const lengthMinutes = typeof body.minutes === "number" && !Number.isNaN(body.minutes) ? Math.max(1, body.minutes) : 10

    if (!topic) return NextResponse.json({ error: "Falta el tema" }, { status: 400 })

    const apiKey =
      process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_KEY
    const useDeepseek = Boolean(process.env.DEEPSEEK_API_KEY)
    if (!apiKey) return NextResponse.json({ error: "Configura DEEPSEEK_API_KEY" }, { status: 500 })

    const prompt = [
      "Genera contenido explicativo en español (markdown simple) para una actividad de texto.",
      `Tema central: ${topic}.`,
      objective ? `Objetivo de aprendizaje: ${objective}.` : "",
      level ? `Nivel del estudiante: ${level}.` : "",
      `Extensión aproximada: ${Math.max(2, Math.min(12, Math.round(lengthMinutes / 2)))} párrafos cortos.`,
      "Incluye títulos y viñetas cuando ayuden. No generes preguntas ni opciones de respuesta.",
      "Mantén un tono claro y conciso, sin relleno ni saludo.",
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
          temperature: 0.6,
          messages: [
            { role: "system", content: "Eres un asistente docente que escribe contenidos claros y accionables en Markdown." },
            { role: "user", content: prompt },
          ],
        }),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      console.error("ai content error", text)
      return NextResponse.json({ error: "No pudimos generar contenido" }, { status: 500 })
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) return NextResponse.json({ error: "Respuesta vacía de la IA" }, { status: 500 })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("generate content error", error)
    return NextResponse.json({ error: "Error generando contenido" }, { status: 500 })
  }
}
