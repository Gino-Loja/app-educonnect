"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import type { AdminActionResult } from "./actions"

interface VerifyPaymentButtonProps {
  paymentId: string
  action: (paymentId: string) => Promise<AdminActionResult>
}

export function VerifyPaymentButton({ paymentId, action }: VerifyPaymentButtonProps) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleVerify = () => {
    startTransition(async () => {
      setMessage(null)
      const result = await action(paymentId)
      setMessage(result.message ?? null)
      if (result.status === "success") {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={handleVerify}
        className="flex items-center gap-2"
      >
        {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
        Verificar
      </Button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  )
}
