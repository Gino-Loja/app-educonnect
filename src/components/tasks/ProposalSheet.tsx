"use client"

import { useEffect, useRef, useState, useActionState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconCash, IconCalendar, IconInfoCircle } from "@tabler/icons-react"
import { createProposal, updateProposal, ActionState } from "@/lib/data/proposal-actions"
import { toast } from "sonner"
import type { Task } from "@/lib/data/task-actions"
import { Spinner } from "@/components/ui/spinner"

interface ExistingProposal {
  id: string
  proposed_amount: number
  estimated_hours: number
  cover_letter: string
}

interface ProposalSheetProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  existingProposal?: ExistingProposal | null
}

const initialState: ActionState = {
  status: "error",
  message: "",
}

export function ProposalSheet({ task, open, onOpenChange, onSuccess, existingProposal = null }: ProposalSheetProps) {
  const isEditMode = existingProposal !== null
  const [state, formAction, pending] = useActionState(
    isEditMode ? updateProposal : createProposal,
    initialState
  )
  const prevStateRef = useRef<ActionState | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [proposedAmount, setProposedAmount] = useState(
    existingProposal?.proposed_amount.toString() || ""
  )
  const [estimatedHours, setEstimatedHours] = useState(
    existingProposal?.estimated_hours.toString() || ""
  )
  const [coverLetter, setCoverLetter] = useState(
    existingProposal?.cover_letter || ""
  )

  // Initialize form with existing values when opening in edit mode
  useEffect(() => {
    if (open && existingProposal) {
      setProposedAmount(existingProposal.proposed_amount.toString())
      setEstimatedHours(existingProposal.estimated_hours.toString())
      setCoverLetter(existingProposal.cover_letter)
    } else if (open && !existingProposal) {
      // Reset form when opening in create mode
      setProposedAmount("")
      setEstimatedHours("")
      setCoverLetter("")
    }
  }, [open, existingProposal])

  // Determinar si hay un presupuesto de referencia
  const hasBudget = task.budget_min !== null || task.budget_max !== null

  // Determinar si el precio es fijo (no negociable)
  const isFixedPrice = task.payment_type === "fixed"

  // Calcular el precio fijo basado en el presupuesto del estudiante
  const fixedPriceAmount = isFixedPrice && hasBudget
    ? task.budget_max !== null
      ? task.budget_max
      : task.budget_min
    : null

  // Si el precio es fijo, establecer el monto automáticamente
  useEffect(() => {
    if (isFixedPrice && fixedPriceAmount !== null && !existingProposal) {
      setProposedAmount(fixedPriceAmount.toString())
    }
  }, [isFixedPrice, fixedPriceAmount, existingProposal])

  useEffect(() => {
    if (state && state !== prevStateRef.current && state.message) {
      if (state.status === "success") {
        toast.success(state.message)
        onOpenChange(false)
        // Reset form
        setProposedAmount("")
        setEstimatedHours("")
        setCoverLetter("")
        formRef.current?.reset()
        onSuccess?.()
      } else if (state.status === "error") {
        toast.error(state.message)
      }
      prevStateRef.current = state
    }
  }, [state, onOpenChange, onSuccess])

  const handleSubmit = (formData: FormData) => {
    if (isEditMode && existingProposal) {
      formData.append("id", existingProposal.id)
    } else {
      formData.append("task_id", task.id)
    }
    formAction(formData)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Editar Propuesta" : "Enviar Propuesta"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Modifica tu propuesta antes de que el estudiante la acepte"
              : "Envía tu propuesta para trabajar en esta tarea"
            }
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-6 py-6 mx-4">
          {/* Task Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-semibold line-clamp-2">{task.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
            <div className="flex flex-col gap-2">
              {hasBudget && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconInfoCircle className="h-4 w-4" />
                  <span>
                    {isFixedPrice ? "Precio Fijo:" : "Presupuesto del estudiante:"}
                    {task.budget_min !== null && task.budget_max !== null
                      ? ` $${task.budget_min} - $${task.budget_max}`
                      : task.budget_min !== null
                      ? ` Desde $${task.budget_min}`
                      : ` Hasta $${task.budget_max}`}
                  </span>
                </div>
              )}
              {task.payment_type && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.payment_type === "fixed"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                      : task.payment_type === "per_hour"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                  }`}>
                    {task.payment_type === "fixed"
                      ? "Precio Fijo"
                      : task.payment_type === "per_hour"
                      ? "Por Hora"
                      : "Negociable"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Proposed Amount */}
          <div className="space-y-2">
            <Label htmlFor="proposed_amount" className="flex items-center gap-2">
              <IconCash className="h-4 w-4" />
              {isFixedPrice ? "Precio Fijo ($)" : "Precio Propuesto ($)"} *
            </Label>
            <Input
              id="proposed_amount"
              name={isFixedPrice ? "" : "proposed_amount"}
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 150"
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value)}
              required
              disabled={pending || isFixedPrice}
              className={isFixedPrice ? "bg-muted" : ""}
            />
            {/* Campo oculto para enviar el valor cuando es precio fijo */}
            {isFixedPrice && (
              <input
                type="hidden"
                name="proposed_amount"
                value={proposedAmount}
              />
            )}
            {isFixedPrice ? (
              <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                <IconInfoCircle className="h-3 w-3" />
                Este es un proyecto de precio fijo. El estudiante ha establecido un presupuesto de ${fixedPriceAmount} que no es negociable.
              </p>
            ) : hasBudget ? (
              <p className="text-xs text-muted-foreground">
                Sugerencia: Considera el presupuesto del estudiante al proponer tu precio
              </p>
            ) : null}
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimated_hours" className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4" />
              Horas Estimadas *
            </Label>
            <Input
              id="estimated_hours"
              name="estimated_hours"
              type="number"
              min="1"
              max="1000"
              placeholder="Ej: 10"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              ¿Cuántas horas estimas que te tomará completar esta tarea?
            </p>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="cover_letter">
              Carta de Presentación *
            </Label>
            <Textarea
              id="cover_letter"
              name="cover_letter"
              placeholder="Explica por qué eres la persona ideal para esta tarea, tu experiencia relevante y cómo abordarías el trabajo..."
              rows={8}
              minLength={10}
              maxLength={2000}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
              disabled={pending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 10 caracteres</span>
              <span>{coverLetter.length}/2000</span>
            </div>
          </div>

          <SheetFooter className="gap-2 w-full sm:gap-0 flex flex-row items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Spinner className="mr-2" />
                  {isEditMode ? "Actualizando..." : "Enviando..."}
                </>
              ) : (
                isEditMode ? "Actualizar Propuesta" : "Enviar Propuesta"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
