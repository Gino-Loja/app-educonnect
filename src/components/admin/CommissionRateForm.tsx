"use client"

import { useState, useTransition } from "react"
import { updateCommissionRate } from "@/lib/data/admin-settings-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

interface CommissionRateFormProps {
  initialRate: number
}

export function CommissionRateForm({ initialRate }: CommissionRateFormProps) {
  const [rate, setRate] = useState(initialRate)
  const [isPending, startTransition] = useTransition()

  const handleSliderChange = (values: number[]) => {
    setRate(values[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setRate(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await updateCommissionRate(rate)

      if (result.status === "success") {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="commission-rate">Tasa de Comision (%)</Label>
            <p className="text-xs text-muted-foreground">
              Configura la tasa de comision que la plataforma retiene de cada transaccion.
            </p>
            <Slider
              id="commission-rate"
              min={0}
              max={100}
              step={0.5}
              value={[rate]}
              onValueChange={handleSliderChange}
              className="w-full"
              disabled={isPending}
            />
          </div>
          <div className="w-24">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={rate}
              onChange={handleInputChange}
              disabled={isPending}
              className="text-center font-semibold text-lg"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            La plataforma retendra el <span className="font-semibold text-slate-900">{rate}%</span> de cada transaccion.
          </p>
          <p className="text-sm text-slate-700 mt-2">
            Ejemplo: En una tarea de $100, la plataforma recibira ${(rate).toFixed(2)} y el profesor recibira ${(100 - rate).toFixed(2)}.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || rate === initialRate}>
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  )
}
