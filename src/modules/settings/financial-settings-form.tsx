"use client"

import { useActionState } from "react"
import { updateTeacherFinancialSettings } from "@/lib/data/role-profile-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type FinancialSettingsFormProps = {
  initialData: {
    hourly_rate: number
    currency: string
    bank_name: string
    country?: string
    account_number: string
    account_holder: string
    account_type?: string
    account_alias?: string
  }
}

type FinancialSettingsDisplayProps = FinancialSettingsFormProps & {
  showRateFields?: boolean
}

export function FinancialSettingsForm({ initialData, showRateFields = true }: FinancialSettingsDisplayProps) {
  const [state, formAction, pending] = useActionState(updateTeacherFinancialSettings, undefined)

  return (
    <form action={formAction} className="space-y-6">
      {state?.status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{state.message}</p>
      )}
      {state?.status === "success" && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
          {state.message}
        </p>
      )}

      {!showRateFields && <input type="hidden" name="hourly_rate" value={initialData.hourly_rate ?? 0} />}
      <div className="grid gap-4 md:grid-cols-2">
        {showRateFields && (
          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Tarifa por hora</Label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              step="0.01"
              min="0"
            defaultValue={initialData.hourly_rate ?? 0}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="currency">Moneda</Label>
        <Input
          id="currency"
          name="currency"
          defaultValue={initialData.currency || "USD"}
          placeholder="USD, EUR, MXN..."
          required
        />
      </div>
        <div className="space-y-2">
        <Label htmlFor="country">Pais</Label>
        <Input
          id="country"
          name="country"
          defaultValue={initialData.country || ""}
          placeholder="Pais del banco"
        />
      </div>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-800">Cuenta bancaria principal</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Banco</Label>
            <Input id="bank_name" name="bank_name" defaultValue={initialData.bank_name || ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_holder">Titular</Label>
            <Input id="account_holder" name="account_holder" defaultValue={initialData.account_holder || ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">Numero de cuenta</Label>
            <Input id="account_number" name="account_number" defaultValue={initialData.account_number || ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_type">Tipo de cuenta</Label>
            <Input id="account_type" name="account_type" defaultValue={initialData.account_type || ""} placeholder="Ahorros, Corriente..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_alias">Alias / referencia</Label>
            <Input id="account_alias" name="account_alias" defaultValue={initialData.account_alias || ""} placeholder="Ej. Cuenta principal" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="bg-blue-600 text-white hover:bg-blue-700">
        {pending ? "Guardando..." : showRateFields ? "Guardar parametros financieros" : "Guardar cuenta bancaria"}
      </Button>
    </form>
  )
}
