"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  IconCheck,
  IconCreditCard,
  IconShieldCheck,
  IconAlertCircle,
} from "@tabler/icons-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AcceptProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  proposal: {
    id: string
    proposed_amount: number
    teacher?: {
      name: string | null
    }
    task?: {
      title: string
      installments?: number | null
    }
  }
}

export function AcceptProposalDialog({
  open,
  onOpenChange,
  onConfirm,
  proposal,
}: AcceptProposalDialogProps) {
  const teacherName = proposal.teacher?.name || "el profesor"
  const taskTitle = proposal.task?.title || "esta tarea"
  const installments = proposal.task?.installments || 1
  const amount = proposal.proposed_amount
  const installmentAmount = amount / installments

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <IconCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl">
              Acuerdo de Tarea
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400">
            Estás a punto de aceptar la propuesta de <span className="font-semibold text-slate-900 dark:text-white">{teacherName}</span> para
            la tarea &quot;<span className="font-semibold">{taskTitle}</span>&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <IconCreditCard className="w-5 h-5" />
              <span className="font-semibold">Resumen del Acuerdo:</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Monto Total:</span>
                <span className="font-semibold text-slate-900 dark:text-white">${amount}</span>
              </div>

              {installments > 1 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Forma de Pago:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {installments} Cuotas
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Por Avance:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ${installmentAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Forma de Pago:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Pago Único</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Process Info */}
          {installments > 1 ? (
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <IconShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-1">Siguiente Paso: Pago</div>
                Al confirmar, deberás realizar el pago por transferencia bancaria y subir el comprobante
                para que el docente pueda comenzar. <strong>Pagarás ${installmentAmount.toFixed(2)} por cada
                avance que apruebes</strong> ({installments} avances en total).
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <IconShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-1">Siguiente Paso: Pago</div>
                Al confirmar, deberás realizar el pago por transferencia bancaria y subir el comprobante
                para que el docente pueda comenzar.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Al aceptar esta propuesta, <strong>todas las demás propuestas para esta tarea
              serán rechazadas automáticamente</strong>.
            </AlertDescription>
          </Alert>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
              He leído y acepto los términos del servicio. Entiendo que debo realizar el pago
              para que el profesor pueda comenzar con el trabajo.
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <IconCheck className="w-4 h-4 mr-2" />
            Confirmar Acuerdo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
