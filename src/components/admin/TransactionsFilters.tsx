"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TransactionsFiltersProps {
  defaultStatus?: string
}

export function TransactionsFilters({
  defaultStatus = "all",
}: TransactionsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all" || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete("page")
    router.push(`/admin/transactions?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-end">
      {/* Status Filter */}
      <Select defaultValue={defaultStatus} onValueChange={(value) => updateFilter("status", value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="in_progress">En Progreso</SelectItem>
          <SelectItem value="submitted">Enviado</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="paid">Pagado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
