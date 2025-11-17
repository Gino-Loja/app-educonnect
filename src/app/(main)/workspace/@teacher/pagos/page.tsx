import { getTeacherPaymentMilestones } from "@/lib/data/milestone-actions"
import { TeacherPaymentsTable } from "@/components/tasks/TeacherPaymentsTable"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconClock, IconCheck, IconShieldCheck, IconCash } from "@tabler/icons-react"

export default async function TeacherPagosPage() {
  const { milestones, error } = await getTeacherPaymentMilestones()

  if (error) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Mis Pagos</h1>
          <p className="text-muted-foreground">Estado de los pagos de tus trabajos</p>
        </div>
        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const stats = {
    pendingPayment: milestones?.filter((m) => m.status === "pending_payment").length || 0,
    pendingVerification:
      milestones?.filter((m) => m.status === "pending_verification").length || 0,
    inCustody: milestones?.filter((m) => m.status === "in_custody").length || 0,
    paid: milestones?.filter((m) => m.status === "paid").length || 0,
  }

  const totalPending =
    milestones
      ?.filter((m) => m.status !== "paid")
      .reduce((sum, m) => sum + m.amount, 0) || 0

  const totalPaid =
    milestones
      ?.filter((m) => m.status === "paid")
      .reduce((sum, m) => sum + m.amount, 0) || 0

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mis Pagos</h1>
        <p className="text-muted-foreground">
          Seguimiento de pagos de tus trabajos aceptados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Esperando Pago del Estudiante
            </CardTitle>
            <IconCash className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayment}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Verificación</CardTitle>
            <IconClock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerification}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Custodia</CardTitle>
            <IconShieldCheck className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inCustody}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <IconCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recibido</CardTitle>
            <IconCash className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendiente: ${totalPending.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      {milestones && milestones.length > 0 ? (
        <TeacherPaymentsTable milestones={milestones} />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            No tienes pagos registrados. Acepta propuestas para comenzar a trabajar.
          </p>
        </div>
      )}
    </div>
  )
}
