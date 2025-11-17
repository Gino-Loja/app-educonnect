"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TasksFilterSelectProps {
  defaultValue: string
}

export function TasksFilterSelect({ defaultValue }: TasksFilterSelectProps) {
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
        <SelectItem value="open">Abiertas</SelectItem>
        <SelectItem value="in_progress">En progreso</SelectItem>
        <SelectItem value="submitted">Entregadas</SelectItem>
        <SelectItem value="completed">Completadas</SelectItem>
        <SelectItem value="cancelled">Canceladas</SelectItem>
        <SelectItem value="disputed">En disputa</SelectItem>
      </SelectContent>
    </Select>
  )
}
