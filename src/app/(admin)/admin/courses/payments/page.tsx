import { IconClock, IconExternalLink } from "@tabler/icons-react"

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
import { PendingCoursePayment, getPendingCoursePayments, verifyCoursePayment } from "@/lib/data/course-actions"
import { requireAdmin } from "@/lib/auth/admin"

import { VerifyPaymentButton } from "./verify-payment-button"

export default async function AdminCoursePaymentsPage() {
  await requireAdmin()
  const payments = await getPendingCoursePayments()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Pagos de cursos</h1>
          <p className="text-sm text-muted-foreground">
            Verifica comprobantes y activa inscripciones manuales.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <IconClock className="h-4 w-4" />
          Pendientes: {payments.length}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pagos pendientes de verificación</CardTitle>
          <Badge variant="outline">Curso</Badge>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay pagos pendientes.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: PendingCoursePayment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{payment.enrollment.course.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ${payment.enrollment.course.price.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{payment.enrollment.student.name || payment.enrollment.student.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {payment.enrollment.student.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell>
                      {payment.proof_url_signed ? (
                        <a
                          href={payment.proof_url_signed}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          Ver comprobante
                          <IconExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin comprobante</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <VerifyPaymentButton
                        paymentId={payment.id}
                        action={verifyCoursePayment}
                      />
                    </TableCell>
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
