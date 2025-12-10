"use server"

import type { PostgrestError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"

export type CatalogType = "subject" | "level"

export type CatalogEntry = {
  id: string
  type: CatalogType
  label: string
  order_index: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const REVALIDATE_PATH = "/admin/settings/academico"

export async function listCatalog(type: CatalogType): Promise<CatalogEntry[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data } = await supabase
    .from("academic_catalog")
    .select("*")
    .eq("type", type)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("label", { ascending: true })

  return (data as CatalogEntry[]) || []
}

export async function addCatalogEntry(type: CatalogType, label: string, orderIndex?: number | null) {
  await requireAdmin()
  const supabase = await createClient()

  const cleanedLabel = label.trim()
  if (!cleanedLabel) {
    return { status: "error" as const, message: "Ingresa un nombre" }
  }

  const { error } = await supabase.from("academic_catalog").insert({
    type,
    label: cleanedLabel,
    order_index: typeof orderIndex === "number" ? orderIndex : null,
  })

  if (error) {
    if ((error as PostgrestError).code === "23505") {
      return { status: "error" as const, message: "Ya existe un valor con ese nombre" }
    }
    console.error("addCatalogEntry error", error)
    return { status: "error" as const, message: "No se pudo guardar" }
  }

  revalidatePath(REVALIDATE_PATH)
  return { status: "success" as const, message: "Guardado" }
}

export async function toggleCatalogEntry(id: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("academic_catalog")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) {
    console.error("toggleCatalogEntry error", error)
    return { status: "error" as const, message: "No se pudo actualizar" }
  }

  revalidatePath(REVALIDATE_PATH)
  return { status: "success" as const, message: "Actualizado" }
}

export async function deleteCatalogEntry(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("academic_catalog").delete().eq("id", id)

  if (error) {
    console.error("deleteCatalogEntry error", error)
    return { status: "error" as const, message: "No se pudo eliminar" }
  }

  revalidatePath(REVALIDATE_PATH)
  return { status: "success" as const, message: "Eliminado" }
}
