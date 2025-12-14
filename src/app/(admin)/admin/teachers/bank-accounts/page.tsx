import { IconBuildingBank, IconShieldCheck } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/admin"

type BankAccountRow = {
  id: string
  bank_name: string
  account_holder: string
  account_number: string
  account_type: string | null
  account_alias: string | null
  country: string | null
  currency: string | null
  teacher: {
    id: string
    name: string | null
    email: string | null
  } | null
}

export default async function AdminTeacherBankAccountsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("teacher_bank_accounts")
    .select(
      `
      id,
      bank_name,
      account_holder,
      account_number,
      account_type,
      account_alias,
      country,
      currency,
      teacher:profiles(id, name, email)
    `,
    )
    .order("updated_at", { ascending: false })

  const accounts = (data as BankAccountRow[] | null) || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Datos bancarios de docentes</h1>
          <p className="text-sm text-muted-foreground">
            Consulta la información para pagos manuales y verificaciones.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <IconShieldCheck className="h-4 w-4" />
          Registros: {accounts.length}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconBuildingBank className="h-5 w-5 text-slate-600" />
            <CardTitle>Cuentas registradas</CardTitle>
          </div>
          <Badge variant="outline">Docentes</Badge>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              Error al cargar datos bancarios
            </p>
          )}
          {!error && accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay datos bancarios registrados.</p>
          )}
          {!error && accounts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Docente</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Moneda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{acc.teacher?.name || "Docente"}</span>
                        <span className="text-xs text-muted-foreground">{acc.teacher?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{acc.bank_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{acc.account_number}</span>
                        <span className="text-xs text-muted-foreground">{acc.account_holder}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{acc.account_type || "N/D"}</TableCell>
                    <TableCell>{acc.account_alias || "—"}</TableCell>
                    <TableCell>{acc.country || "—"}</TableCell>
                    <TableCell>{acc.currency || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
