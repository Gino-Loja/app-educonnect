"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconCheck } from "@tabler/icons-react"
import { completeTask } from "@/lib/data/task-actions"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Props = {
    taskId: string
}

export function CompleteTaskButton({ taskId }: Props) {
    const [isPending, setIsPending] = useState(false)

    const handleComplete = async () => {
        setIsPending(true)
        try {
            const result = await completeTask(taskId)
            if (result.status === "success") {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Error completing task", error)
            toast.error("Ocurrió un error al completar la tarea")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <IconCheck className="mr-2 h-4 w-4" />
                    Finalizar Tarea
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Al finalizar la tarea, se habilitará la calificación para ambas partes.
                        Asegúrate de que todo el trabajo haya sido entregado y los pagos liberados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleComplete}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isPending ? "Finalizando..." : "Sí, finalizar tarea"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
