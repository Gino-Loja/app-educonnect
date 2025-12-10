import { getStudentPaymentMilestones } from "@/lib/data/milestone-actions"
import { StudentPaymentsTable } from "@/components/tasks/StudentPaymentsTable"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconClock, IconCheck, IconAlertCircle, IconShieldCheck } from "@tabler/icons-react"

export default async function PagosPage() {
  const { milestones, error } = await getStudentPaymentMilestones()

  if (error) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Pagos</h1>
          <p className="text-muted-foreground">Gestiona tus transacciones y métodos de pago</p>
        </div>
        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const stats = {
    pending: milestones?.filter((m) => m.status === "pending_payment").length || 0,
    pendingVerification:
      milestones?.filter((m) => m.status === "pending_verification").length || 0,
    inCustody: milestones?.filter((m) => m.status === "in_custody").length || 0,
    paid: milestones?.filter((m) => m.status === "paid").length || 0,
    rejected: milestones?.filter((m) => m.status === "rejected").length || 0,
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Pagos</h1>
        <p className="text-muted-foreground">
          Gestiona tus pagos y comprobantes de las tareas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
            <IconAlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Verificación</CardTitle>
            <IconClock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerification}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Custodia</CardTitle>
            <IconShieldCheck className="h-5 w-5 text-blue-600" />
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
      </div>

      {/* Payments Table */}
      {milestones && milestones.length > 0 ? (
        <StudentPaymentsTable milestones={milestones} />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No hay pagos registrados</p>
        </div>
      )}
    </div>
  )
}
