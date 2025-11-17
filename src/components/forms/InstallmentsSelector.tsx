"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { IconInfoCircle, IconCreditCard } from "@tabler/icons-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InstallmentsSelectorProps {
  budgetMin?: number
  budgetMax?: number
  value: number
  onChange: (value: number) => void
}

export function InstallmentsSelector({
  budgetMin,
  budgetMax,
  value,
  onChange,
}: InstallmentsSelectorProps) {
  // Calculate average budget for installment calculations
  const avgBudget = budgetMin && budgetMax ? (budgetMin + budgetMax) / 2 : (budgetMin || budgetMax || 0)

  // Only show installments option if budget > $50
  const showInstallments = avgBudget > 50

  if (!showInstallments) {
    return null
  }

  const installmentOptions = [
    { value: 1, label: "Pago único", description: `$${avgBudget.toFixed(2)} al completar` },
    { value: 2, label: "2 cuotas", description: `${(avgBudget / 2).toFixed(2)} por avance` },
    { value: 3, label: "3 cuotas", description: `$${(avgBudget / 3).toFixed(2)} por avance` },
    { value: 4, label: "4 cuotas", description: `$${(avgBudget / 4).toFixed(2)} por avance` },
    { value: 5, label: "5 cuotas", description: `$${(avgBudget / 5).toFixed(2)} por avance` },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <IconCreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
        <div className="flex-1">
          <Label className="text-base font-semibold text-slate-900 dark:text-white">
            Plan de Pagos
          </Label>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Divide el pago por avances del profesor
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <IconInfoCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
          Al dividir en cuotas, pagarás al profesor por cada avance que entregue. Esto te permite
          validar el progreso antes de pagar el monto total.
        </AlertDescription>
      </Alert>

      <RadioGroup
        value={value.toString()}
        onValueChange={(v) => onChange(parseInt(v))}
        className="space-y-3"
      >
        {installmentOptions.map((option) => (
          <label
            key={option.value}
            htmlFor={`installment-${option.value}`}
            className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <RadioGroupItem
              value={option.value.toString()}
              id={`installment-${option.value}`}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-900 dark:text-white">
                {option.label}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>

      {value > 1 && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <IconInfoCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-sm text-green-800 dark:text-green-300">
            El profesor deberá entregar {value} avances. Cada avance se pagará una vez lo apruebes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
