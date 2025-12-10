"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { IconCheck, IconInfoCircle, IconUpload } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitCoursePurchase, type PurchaseFormState } from "@/lib/data/course-actions"

const initialState: PurchaseFormState = { status: "idle" }

interface CoursePurchaseFormProps {
  courseId: string
}

export function CoursePurchaseForm({ courseId }: CoursePurchaseFormProps) {
  const [state, formAction, isPending] = useActionState(submitCoursePurchase, initialState)
  const [fileName, setFileName] = useState<string>("")
  const formRef = useRef<HTMLFormElement>(null)
  const [isResetting, startReset] = useTransition()

  useEffect(() => {
    if (state.status === "success") {
      startReset(() => {
        formRef.current?.reset()
        setFileName("")
      })
    }
  }, [state.status])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border bg-white p-4 shadow-sm"
      encType="multipart/form-data"
    >
      <input type="hidden" name="courseId" value={courseId} />

      <div className="space-y-1">
        <Label htmlFor="method">Método de pago</Label>
        <select
          id="method"
          name="method"
          defaultValue="transfer"
          className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          disabled={isPending}
        >
          <option value="transfer">Transferencia</option>
          <option value="efectivo">Efectivo</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="proof">Comprobante (opcional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="proof"
            name="proof"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            disabled={isPending}
          />
        </div>
        {fileName ? <p className="text-xs text-muted-foreground">Archivo: {fileName}</p> : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notas para el admin (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Incluye referencia de pago o instrucciones adicionales"
          rows={3}
          disabled={isPending}
        />
      </div>

      {state.status === "error" ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <IconInfoCircle className="h-4 w-4" />
          <span>{state.message}</span>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <IconCheck className="h-4 w-4" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Se creará una inscripción pendiente. Un admin verificará tu pago.
        </div>
        <Button type="submit" disabled={isPending || isResetting}>
          <IconUpload className="mr-2 h-4 w-4" />
          {isPending ? "Enviando..." : "Comprar"}
        </Button>
      </div>
    </form>
  )
}
