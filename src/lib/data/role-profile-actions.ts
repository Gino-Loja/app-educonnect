"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

type ActionResult = { status: "success" | "error"; message: string }

const listFromString = (value: FormDataEntryValue | null) =>
  (typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []) as string[]

const teacherSchema = z.object({
  hourly_rate: z.coerce.number().min(0, "La tarifa debe ser mayor o igual a 0"),
  specialties: z.array(z.string()).default([]),
  subjects: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  education_level: z.string().optional(),
  teaching_experience_years: z
    .preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(0).nullable())
    .optional(),
  portfolio_url: z.string().url("URL inválida").optional().or(z.literal("")),
  accepts_urgent_tasks: z.boolean().default(false),
  accepts_long_term: z.boolean().default(false),
  teaching_methodology: z.string().optional(),
})

export async function upsertTeacherProfile(_: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const parsed = teacherSchema.safeParse({
    hourly_rate: formData.get("hourly_rate"),
    specialties: listFromString(formData.get("specialties")),
    subjects: listFromString(formData.get("subjects")),
    languages: listFromString(formData.get("languages")),
    education_level: formData.get("education_level") as string,
    teaching_experience_years: formData.get("teaching_experience_years"),
    portfolio_url: formData.get("portfolio_url") as string,
    accepts_urgent_tasks: formData.get("accepts_urgent_tasks") === "on",
    accepts_long_term: formData.get("accepts_long_term") === "on",
    teaching_methodology: formData.get("teaching_methodology") as string,
  })

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  const data = parsed.data

  const { error } = await supabase.from("teachers").upsert({
    id: user.id,
    hourly_rate: data.hourly_rate,
    specialties: data.specialties,
    subjects: data.subjects,
    languages: data.languages,
    education_level: data.education_level || null,
    teaching_experience_years: data.teaching_experience_years ?? null,
    portfolio_url: data.portfolio_url || null,
    accepts_urgent_tasks: data.accepts_urgent_tasks,
    accepts_long_term: data.accepts_long_term,
    teaching_methodology: data.teaching_methodology || null,
  })

  if (error) {
    console.error("Error upserting teacher profile", error)
    return { status: "error", message: "No se pudo guardar el perfil docente" }
  }

  revalidatePath("/workspace/configuracion")
  return { status: "success", message: "Perfil docente guardado" }
}

const studentSchema = z.object({
  academic_level: z.string().optional(),
  major: z.string().optional(),
  subjects_of_interest: z.array(z.string()).default([]),
  preferred_learning_style: z.string().optional(),
  budget_range: z.string().optional(),
  max_budget_per_task: z
    .preprocess((v) => (v === "" ? null : v), z.coerce.number().min(0).nullable())
    .optional(),
})

export async function upsertStudentProfile(_: unknown, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "No autenticado" }
  }

  const parsed = studentSchema.safeParse({
    academic_level: formData.get("academic_level") as string,
    major: formData.get("major") as string,
    subjects_of_interest: listFromString(formData.get("subjects_of_interest")),
    preferred_learning_style: formData.get("preferred_learning_style") as string,
    budget_range: formData.get("budget_range") as string,
    max_budget_per_task: formData.get("max_budget_per_task"),
  })

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  const data = parsed.data

  const { error } = await supabase.from("students").upsert({
    id: user.id,
    academic_level: data.academic_level || null,
    major: data.major || null,
    subjects_of_interest: data.subjects_of_interest,
    preferred_learning_style: data.preferred_learning_style || null,
    budget_range: data.budget_range || null,
    max_budget_per_task: data.max_budget_per_task ?? null,
  })

  if (error) {
    console.error("Error upserting student profile", error)
    return { status: "error", message: "No se pudo guardar el perfil de estudiante" }
  }

  revalidatePath("/workspace/configuracion")
  return { status: "success", message: "Perfil de estudiante guardado" }
}

const financialSchema = z.object({
  hourly_rate: z.coerce.number().min(0, "La tarifa debe ser mayor o igual a 0"),
  currency: z.string().trim().min(1, "Ingresa una moneda").max(5),
  bank_name: z.string().trim().min(2, "Ingresa el banco"),
  account_number: z.string().trim().min(4, "Número de cuenta inválido"),
  account_holder: z.string().trim().min(2, "Titular requerido"),
  account_type: z.string().trim().optional(),
  routing_number: z.string().trim().optional(),
  account_alias: z.string().trim().optional(),
})

const teacherAcademicSchema = z.object({
  subjects: z.array(z.string()).default([]),
  education_level: z.string().trim().optional(),
})

const studentAcademicSchema = z.object({
  academic_level: z.string().trim().optional(),
  subjects_of_interest: z.array(z.string()).default([]),
})

export async function updateTeacherFinancialSettings(_: unknown, formData: FormData): Promise<ActionResult> {
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

  if (profile?.role !== "teacher") {
    return { status: "error", message: "Solo disponible para docentes" }
  }

  const parsed = financialSchema.safeParse({
    hourly_rate: formData.get("hourly_rate"),
    currency: formData.get("currency"),
    bank_name: formData.get("bank_name"),
    account_number: formData.get("account_number"),
    account_holder: formData.get("account_holder"),
    account_type: formData.get("account_type"),
    routing_number: formData.get("routing_number"),
    account_alias: formData.get("account_alias"),
  })

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  const data = parsed.data

  const paymentInfo = {
    primary_account: {
      bank_name: data.bank_name,
      account_number: data.account_number,
      account_holder: data.account_holder,
      account_type: data.account_type || null,
      routing_number: data.routing_number || null,
      alias: data.account_alias || null,
    },
  }

  const { error } = await supabase.from("teachers").upsert({
    id: user.id,
    hourly_rate: data.hourly_rate,
    currency: data.currency,
    payment_info: paymentInfo,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error updating teacher financial settings", error)
    return { status: "error", message: "No se pudo guardar los parámetros financieros" }
  }

  revalidatePath("/workspace/configuracion/finanzas")
  return { status: "success", message: "Parámetros financieros guardados" }
}

export async function updateTeacherAcademicSettings(_: unknown, formData: FormData): Promise<ActionResult> {
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

  if (profile?.role !== "teacher") {
    return { status: "error", message: "Solo disponible para docentes" }
  }

  const parsed = teacherAcademicSchema.safeParse({
    subjects: listFromString(formData.get("subjects")),
    education_level: formData.get("education_level") as string,
  })

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("teachers")
    .update({
      subjects: data.subjects,
      education_level: data.education_level || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    console.error("Error updating teacher academic settings", error)
    return { status: "error", message: "No se pudo guardar la información académica" }
  }

  revalidatePath("/workspace/configuracion/academico")
  return { status: "success", message: "Información académica guardada" }
}

export async function updateStudentAcademicSettings(_: unknown, formData: FormData): Promise<ActionResult> {
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

  if (profile?.role !== "student") {
    return { status: "error", message: "Solo disponible para estudiantes" }
  }

  const parsed = studentAcademicSchema.safeParse({
    academic_level: formData.get("academic_level") as string,
    subjects_of_interest: listFromString(formData.get("subjects_of_interest")),
  })

  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Datos invalidos"
    return { status: "error", message }
  }

  const data = parsed.data

  const { error } = await supabase.from("students").upsert({
    id: user.id,
    academic_level: data.academic_level || null,
    subjects_of_interest: data.subjects_of_interest,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error updating student academic settings", error)
    return { status: "error", message: "No se pudo guardar la información académica" }
  }

  revalidatePath("/workspace/configuracion/academico")
  return { status: "success", message: "Información académica guardada" }
}
