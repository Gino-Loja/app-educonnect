"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

type ActionResult = { status: "success" | "error"; message: string }

const bankSchema = z.object({
  teacher_id: z.string().uuid("Docente invalido"),
  bank_name: z.string().trim().min(2, "Ingresa el banco"),
  account_holder: z.string().trim().min(2, "Titular requerido"),
  account_number: z.string().trim().min(4, "Numero de cuenta invalido"),
  account_type: z.string().trim().optional(),
  routing_number: z.string().trim().optional(),
  account_alias: z.string().trim().optional(),
  country: z.string().trim().optional(),
  currency: z.string().trim().min(1, "Moneda requerida"),
})

export async function upsertTeacherBankAccount(_: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { status: "error", message: "Solo disponible para administradores" }
  }

  const parsed = bankSchema.safeParse({
    teacher_id: formData.get("teacher_id"),
    bank_name: formData.get("bank_name"),
    account_holder: formData.get("account_holder"),
    account_number: formData.get("account_number"),
    account_type: formData.get("account_type"),
    routing_number: formData.get("routing_number"),
    account_alias: formData.get("account_alias"),
    country: formData.get("country"),
    currency: formData.get("currency"),
  })

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("teacher_bank_accounts")
    .upsert(
      {
        teacher_id: data.teacher_id,
        bank_name: data.bank_name,
        account_holder: data.account_holder,
        account_number: data.account_number,
        account_type: data.account_type || null,
        routing_number: data.routing_number || null,
        account_alias: data.account_alias || null,
        country: data.country || null,
        currency: data.currency,
      },
      { onConflict: "teacher_id" },
    )

  if (error) {
    console.error("Error updating teacher bank account", error)
    return { status: "error", message: "No pudimos guardar la cuenta bancaria" }
  }

  revalidatePath("/admin/settings/cuenta-docente")
  revalidatePath("/admin/teachers/bank-accounts")

  return { status: "success", message: "Cuenta bancaria guardada" }
}
