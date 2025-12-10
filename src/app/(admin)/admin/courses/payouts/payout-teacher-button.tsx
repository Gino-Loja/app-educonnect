"use client"

import { useTransition, useState } from "react"
import { IconCheck, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { type PurchaseFormState } from "@/lib/data/course-actions"

interface Props {
  teacherId: string
  amountLabel: string
  action: (teacherId: string) => Promise<PurchaseFormState>
}

export function PayoutTeacherButton({ teacherId, amountLabel, action }: Props) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const handlePayout = () => {
    startTransition(async () => {
      setMessage(null)
      const result = await action(teacherId)
      setMessage(result.message ?? null)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={handlePayout}
        disabled={pending}
        className="flex items-center gap-2"
      >
        {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
        Pagar a docente ({amountLabel})
      </Button>
      {message ? <span className="text-xs text-muted-foreground text-right">{message}</span> : null}
    </div>
  )
}
