import { getTeacherPaymentMilestones } from "@/lib/data/milestone-actions"
import { getTeacherCoursePayments } from "@/lib/data/course-actions"
import { TeacherPaymentsTable } from "@/components/tasks/TeacherPaymentsTable"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconClock, IconCheck, IconShieldCheck, IconCash } from "@tabler/icons-react"

export default async function TeacherPagosPage() {
  const [{ milestones, error: milestonesError }, { payments, error: courseError }] = await Promise.all([
    getTeacherPaymentMilestones(),
    getTeacherCoursePayments(),
  ])

  if (milestonesError && courseError) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Mis Pagos</h1>
          <p className="text-muted-foreground">Estado de los pagos de tus trabajos</p>
        </div>
        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">{milestonesError || courseError}</p>
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

  const coursePaid =
    payments
      ?.filter((p) => p.payout_id)
      .reduce((sum, p) => sum + (p.enrollment?.course?.price || 0), 0) ||
    0
  const coursePending =
    payments
      ?.filter((p) => !p.payout_id)
      .reduce((sum, p) => sum + (p.enrollment?.course?.price || 0), 0) || 0

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Mis Pagos</h1>
        <p className="text-muted-foreground">Pagos por cursos vendidos y trabajos entregados.</p>
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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos (recibido)</CardTitle>
            <IconCash className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">${coursePaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendiente: ${coursePending.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos de Cursos</CardTitle>
          <p className="text-sm text-muted-foreground">Compras y verificaciones de tus cursos.</p>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Curso</th>
                    <th className="py-2 pr-3">Estudiante</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Monto</th>
                    <th className="py-2 pr-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const amount = p.enrollment?.course?.price || 0
                    const status = p.payout_id ? "pagado" : p.status === "verified" ? "custodia" : p.status
                    const badgeVariant: "default" | "secondary" | "destructive" | "outline" =
                      status === "pagado"
                        ? "default"
                        : status === "custodia"
                          ? "secondary"
                          : status === "pending"
                            ? "secondary"
                            : status === "rejected"
                              ? "destructive"
                              : "outline"
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{p.enrollment?.course?.title || "Curso"}</td>
                        <td className="py-2 pr-3">
                          {p.enrollment?.student?.name || p.enrollment?.student?.email || "-"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={badgeVariant} className="capitalize">
                            {status === "custodia" ? "En custodia" : status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">${amount.toFixed(2)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no registras pagos de cursos.</p>
          )}
        </CardContent>
      </Card>

      {/* Payments Table (Tasks) */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos de Trabajos</CardTitle>
          <p className="text-sm text-muted-foreground">Hitos y entregas aceptadas.</p>
        </CardHeader>
        <CardContent>
          {milestones && milestones.length > 0 ? (
            <TeacherPaymentsTable milestones={milestones} />
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                No tienes pagos registrados. Acepta propuestas para comenzar a trabajar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
