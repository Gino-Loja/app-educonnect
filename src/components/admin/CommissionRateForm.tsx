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
          <div className="flex-1">
            <Label htmlFor="commission-rate">Tasa de Comisión (%)</Label>
            <div className="mt-2">
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
          </div>
          <div className="w-32">
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

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            La plataforma retendrá el{" "}
            <span className="font-semibold text-foreground">{rate}%</span> de cada
            transacción.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ejemplo: En una tarea de $100, la plataforma recibirá ${(rate).toFixed(2)} y
            el profesor recibirá ${(100 - rate).toFixed(2)}.
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
