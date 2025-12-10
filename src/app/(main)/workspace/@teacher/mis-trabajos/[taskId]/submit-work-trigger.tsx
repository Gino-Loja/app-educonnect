"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SubmitWorkSheet } from "@/components/tasks/SubmitWorkSheet"
import { IconFileUpload } from "@tabler/icons-react"

type Props = {
  taskId: string
  taskTitle: string
  disabled?: boolean
}

export function SubmitWorkTrigger({ taskId, taskTitle, disabled }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        className="bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <IconFileUpload className="mr-2 h-4 w-4" />
        Enviar trabajo
      </Button>
      <SubmitWorkSheet taskId={taskId} taskTitle={taskTitle} open={open} onOpenChange={setOpen} />
    </>
  )
}
