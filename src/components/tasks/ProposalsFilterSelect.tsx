"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProposalsFilterSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleValueChange = (value: string) => {
    if (value === "all") {
      router.push(pathname)
    } else {
      router.push(`${pathname}?status=${value}`)
    }
  }

  return (
    <Select value={defaultValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        <SelectItem value="pending">Pendientes</SelectItem>
        <SelectItem value="accepted">Aceptadas</SelectItem>
        <SelectItem value="rejected">Rechazadas</SelectItem>
        <SelectItem value="withdrawn">Propuestas retiradas</SelectItem>
        <SelectItem value="task_cancelled">Tareas canceladas</SelectItem>
      </SelectContent>
    </Select>
  )
}
