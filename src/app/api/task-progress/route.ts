import { NextResponse } from "next/server"
import { submitWork } from "@/lib/data/submission-actions"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const result = await submitWork(formData)

    return NextResponse.json(result, {
      status: result.status === "success" ? 200 : 400,
    })
  } catch (error) {
    console.error("Error handling task progress upload:", error)
    return NextResponse.json(
      { status: "error", message: "Error inesperado al subir el progreso" },
      { status: 500 },
    )
  }
}
