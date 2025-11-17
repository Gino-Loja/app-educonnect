"use client"

import type { Transaction, TransactionsResponse } from "@/lib/data/admin-transaction-actions"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface TransactionsTableProps {
  transactions: Transaction[]
  pagination: Pick<TransactionsResponse, "page" | "totalPages" | "total">
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  submitted: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
  approved: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  submitted: "Enviado",
  approved: "Aprobado",
  paid: "Pagado",
}

export function TransactionsTable({ transactions, pagination }: TransactionsTableProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarea</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Pago</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron transacciones
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <span className="font-medium line-clamp-1">
                      {transaction.task?.title || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {transaction.task?.student?.name || "Sin nombre"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.task?.student?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.task?.teacher ? (
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {transaction.task.teacher.name || "Sin nombre"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {transaction.task.teacher.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">${transaction.amount.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[transaction.status]}>
                      {statusLabels[transaction.status] || transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.paid_at
                      ? formatDistanceToNow(new Date(transaction.paid_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {transaction.created_at
                      ? formatDistanceToNow(new Date(transaction.created_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {transactions.length} de {pagination.total} transacciones
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => router.push(`/admin/transactions?page=${pagination.page - 1}`)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => router.push(`/admin/transactions?page=${pagination.page + 1}`)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
