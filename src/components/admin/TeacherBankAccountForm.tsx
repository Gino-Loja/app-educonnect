"use client"

import { useActionState, useEffect, useMemo, useState, type ChangeEvent } from "react"
import { upsertTeacherBankAccount } from "@/lib/data/admin-teacher-bank-actions"
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

type Teacher = {
  id: string
  name: string | null
  email: string | null
}

type BankAccount = {
  teacher_id: string
  bank_name: string | null
  account_holder: string | null
  account_number: string | null
  account_type: string | null
  account_alias: string | null
  country: string | null
  currency: string | null
}

type FormState = {
  bank_name: string
  account_holder: string
  account_number: string
  account_type: string
  account_alias: string
  country: string
  currency: string
}

type Props = {
  teachers: Teacher[]
  accounts: BankAccount[]
}

const emptyForm: FormState = {
  bank_name: "",
  account_holder: "",
  account_number: "",
  account_type: "",
  account_alias: "",
  country: "",
  currency: "USD",
}

export function TeacherBankAccountForm({ teachers, accounts }: Props) {
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]?.id || "")
  const accountsByTeacher = useMemo(
    () =>
      accounts.reduce<Record<string, BankAccount>>((acc, account) => {
        acc[account.teacher_id] = account
        return acc
      }, {}),
    [accounts],
  )

  const buildFormState = (teacherId: string): FormState => {
    const account = accountsByTeacher[teacherId]
    if (!account) return emptyForm
    return {
      bank_name: account.bank_name || "",
      account_holder: account.account_holder || "",
      account_number: account.account_number || "",
      account_type: account.account_type || "",
      account_alias: account.account_alias || "",
      country: account.country || "",
      currency: account.currency || "USD",
    }
  }

  const [form, setForm] = useState<FormState>(buildFormState(selectedTeacher))
  const [state, formAction, pending] = useActionState(upsertTeacherBankAccount, undefined)

  useEffect(() => {
    setForm(buildFormState(selectedTeacher))
  }, [selectedTeacher])

  const handleChange =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

  if (teachers.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay docentes disponibles.</p>
  }

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

      <input type="hidden" name="teacher_id" value={selectedTeacher} />

      <div className="space-y-2">
        <Label>Docente</Label>
        <Select
          value={selectedTeacher}
          onValueChange={(value) => setSelectedTeacher(value)}
          disabled={pending}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un docente" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name || "Docente sin nombre"} {teacher.email ? `(${teacher.email})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Banco</Label>
            <Input
              id="bank_name"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange("bank_name")}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_holder">Titular</Label>
            <Input
              id="account_holder"
              name="account_holder"
              value={form.account_holder}
              onChange={handleChange("account_holder")}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">Numero de cuenta</Label>
            <Input
              id="account_number"
              name="account_number"
              value={form.account_number}
              onChange={handleChange("account_number")}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_type">Tipo de cuenta</Label>
            <Input
              id="account_type"
              name="account_type"
              value={form.account_type}
              onChange={handleChange("account_type")}
              disabled={pending}
              placeholder="Ahorros, Corriente..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_alias">Alias / referencia</Label>
            <Input
              id="account_alias"
              name="account_alias"
              value={form.account_alias}
              onChange={handleChange("account_alias")}
              disabled={pending}
              placeholder="Ej. Cuenta principal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Pais</Label>
            <Input
              id="country"
              name="country"
              value={form.country}
              onChange={handleChange("country")}
              disabled={pending}
              placeholder="Pais del banco"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Input
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleChange("currency")}
              disabled={pending}
              placeholder="USD, EUR, MXN..."
              required
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="bg-blue-600 text-white hover:bg-blue-700">
        {pending ? "Guardando..." : "Guardar cuenta bancaria"}
      </Button>
    </form>
  )
}
