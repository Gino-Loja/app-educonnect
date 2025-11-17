import { getTransactions } from "@/lib/data/admin-transaction-actions"
import {
  getPendingVerifications,
  getPaymentsInCustody,
} from "@/lib/data/payment-verification-actions"
import { TransactionsTable } from "@/components/admin/TransactionsTable"
import { TransactionsFilters } from "@/components/admin/TransactionsFilters"
import { PendingVerificationsTable } from "@/components/admin/PendingVerificationsTable"
import { PaymentsInCustodyTable } from "@/components/admin/PaymentsInCustodyTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconCreditCard, IconClock, IconShieldCheck } from "@tabler/icons-react"

// Force dynamic rendering and disable caching for this page
export const dynamic = "force-dynamic"
export const revalidate = 0

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminTransactionsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = (params.status as string) || "all"

  const [result, pendingVerifications, paymentsInCustody] = await Promise.all([
    getTransactions({
      page,
      limit: 20,
      status: status === "all" ? undefined : status,
    }),
    getPendingVerifications(),
    getPaymentsInCustody(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
        <p className="text-muted-foreground">
          Gestión de pagos y verificaciones de la plataforma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes de Verificación
            </CardTitle>
            <IconClock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Comprobantes esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fondos en Custodia</CardTitle>
            <IconShieldCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentsInCustody.length}</div>
            <p className="text-xs text-muted-foreground">
              Pagos verificados, pendientes de transferir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <IconCreditCard className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${result.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              De {result.total} transacciones totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different transaction views */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Verificaciones Pendientes ({pendingVerifications.length})
          </TabsTrigger>
          <TabsTrigger value="custody">
            En Custodia ({paymentsInCustody.length})
          </TabsTrigger>
          <TabsTrigger value="all">Todas las Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <PendingVerificationsTable verifications={pendingVerifications} />
        </TabsContent>

        <TabsContent value="custody" className="space-y-4">
          <PaymentsInCustodyTable payments={paymentsInCustody} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <TransactionsFilters defaultStatus={status} />
          <TransactionsTable transactions={result.transactions} pagination={result} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
