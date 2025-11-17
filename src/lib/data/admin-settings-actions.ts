"use server"

import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"
import { revalidatePath } from "next/cache"

export interface PlatformSettings {
  id: string
  commission_rate: number
  bank_name: string | null
  account_holder: string | null
  account_number: string | null
  account_type: "ahorros" | "corriente" | null
  fiscal_id: string | null
  contact_email: string | null
  country: string | null
  currency: string | null
  swift_code: string | null
  updated_at: string
  updated_by: string | null
  created_at: string
}

export interface UpdateSettingsData {
  commission_rate?: number
  bank_name?: string | null
  account_holder?: string | null
  account_number?: string | null
  account_type?: "ahorros" | "corriente" | null
  fiscal_id?: string | null
  contact_email?: string | null
  country?: string | null
  currency?: string | null
  swift_code?: string | null
}

/**
 * Get platform settings (admin only)
 */
export async function getPlatformSettings() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .single()

  if (error) {
    console.error("Error fetching platform settings:", error)
    return null
  }

  return data as PlatformSettings
}

/**
 * Get public bank account information (for students to make payments)
 * This only returns the necessary bank details, not sensitive admin settings
 */
export async function getPublicBankInfo() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("platform_settings")
    .select("bank_name, account_holder, account_number, account_type, fiscal_id")
    .maybeSingle()
  
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching public bank info:", error)
    return null
  }

  return data
}

/**
 * Update platform settings
 */
export async function updatePlatformSettings(
  updates: UpdateSettingsData
): Promise<{ status: "success" | "error"; message: string }> {
  try {
    const { user } = await requireAdmin()
    const supabase = await createClient()

    // Validate commission rate if provided
    if (updates.commission_rate !== undefined) {
      if (updates.commission_rate < 0 || updates.commission_rate > 100) {
        return {
          status: "error",
          message: "La tasa de comisión debe estar entre 0 y 100",
        }
      }
    }

    // Validate account type if provided
    if (updates.account_type && !["ahorros", "corriente"].includes(updates.account_type)) {
      return {
        status: "error",
        message: "Tipo de cuenta inválido",
      }
    }

    // Validate email format if provided
    if (updates.contact_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updates.contact_email)) {
        return {
          status: "error",
          message: "Formato de correo electrónico inválido",
        }
      }
    }

    // Get the settings ID (should only be one record)
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("id")
      .single()

    if (!settings) {
      return {
        status: "error",
        message: "No se encontró la configuración de la plataforma",
      }
    }

    // Update settings
    const { error } = await supabase
      .from("platform_settings")
      .update({
        ...updates,
        updated_by: user.id,
      })
      .eq("id", settings.id)

    if (error) {
      console.error("Error updating platform settings:", error)
      return {
        status: "error",
        message: "Error al actualizar la configuración",
      }
    }

    revalidatePath("/admin/settings")

    return {
      status: "success",
      message: "Configuración actualizada correctamente",
    }
  } catch (error) {
    console.error("Error in updatePlatformSettings:", error)
    return {
      status: "error",
      message: "Error al actualizar la configuración",
    }
  }
}

/**
 * Update commission rate only
 */
export async function updateCommissionRate(
  commissionRate: number
): Promise<{ status: "success" | "error"; message: string }> {
  return updatePlatformSettings({ commission_rate: commissionRate })
}

/**
 * Update bank account details
 */
export async function updateBankAccount(
  bankData: Omit<UpdateSettingsData, "commission_rate">
): Promise<{ status: "success" | "error"; message: string }> {
  return updatePlatformSettings(bankData)
}
