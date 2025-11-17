"use client"

import { useState, useTransition } from "react"
import { updateBankAccount } from "@/lib/data/admin-settings-actions"
import type { PlatformSettings } from "@/lib/data/admin-settings-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface BankAccountFormProps {
  initialData: PlatformSettings
}

export function BankAccountForm({ initialData }: BankAccountFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    bank_name: initialData.bank_name || "",
    account_holder: initialData.account_holder || "",
    account_number: initialData.account_number || "",
    account_type: initialData.account_type || "ahorros" as "ahorros" | "corriente",
    fiscal_id: initialData.fiscal_id || "",
    contact_email: initialData.contact_email || "",
    country: initialData.country || "",
    currency: initialData.currency || "",
    swift_code: initialData.swift_code || "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await updateBankAccount({
        bank_name: formData.bank_name || null,
        account_holder: formData.account_holder || null,
        account_number: formData.account_number || null,
        account_type: formData.account_type,
        fiscal_id: formData.fiscal_id || null,
        contact_email: formData.contact_email || null,
        country: formData.country || null,
        currency: formData.currency || null,
        swift_code: formData.swift_code || null,
      })

      if (result.status === "success") {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank Name */}
        <div className="space-y-2">
          <Label htmlFor="bank_name">Nombre del Banco</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => handleChange("bank_name", e.target.value)}
            placeholder="Ej: Banco Nacional"
            disabled={isPending}
          />
        </div>

        {/* Account Holder */}
        <div className="space-y-2">
          <Label htmlFor="account_holder">Titular de la Cuenta</Label>
          <Input
            id="account_holder"
            value={formData.account_holder}
            onChange={(e) => handleChange("account_holder", e.target.value)}
            placeholder="Nombre completo del titular"
            disabled={isPending}
          />
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="account_number">Número de Cuenta</Label>
          <Input
            id="account_number"
            value={formData.account_number}
            onChange={(e) => handleChange("account_number", e.target.value)}
            placeholder="0000-0000-0000-0000"
            disabled={isPending}
          />
        </div>

        {/* Account Type */}
        <div className="space-y-2">
          <Label htmlFor="account_type">Tipo de Cuenta</Label>
          <Select
            value={formData.account_type}
            onValueChange={(value) => handleChange("account_type", value)}
            disabled={isPending}
          >
            <SelectTrigger id="account_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ahorros">Ahorros</SelectItem>
              <SelectItem value="corriente">Corriente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fiscal ID */}
        <div className="space-y-2">
          <Label htmlFor="fiscal_id">Cédula / RUC / Id. Fiscal</Label>
          <Input
            id="fiscal_id"
            value={formData.fiscal_id}
            onChange={(e) => handleChange("fiscal_id", e.target.value)}
            placeholder="Número de identificación"
            disabled={isPending}
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contact_email">Correo de Contacto</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleChange("contact_email", e.target.value)}
            placeholder="contacto@ejemplo.com"
            disabled={isPending}
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="Ej: Ecuador"
            disabled={isPending}
          />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            placeholder="Ej: USD, EUR"
            disabled={isPending}
          />
        </div>

        {/* SWIFT Code */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="swift_code">
            Código SWIFT / BIC
            <span className="text-sm text-muted-foreground ml-2">
              (Para transferencias internacionales)
            </span>
          </Label>
          <Input
            id="swift_code"
            value={formData.swift_code}
            onChange={(e) => handleChange("swift_code", e.target.value)}
            placeholder="Ej: AAAABBCCXXX"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar Información Bancaria"}
        </Button>
      </div>
    </form>
  )
}
