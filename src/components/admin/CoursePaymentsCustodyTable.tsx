"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CoursePaymentInCustody } from "@/lib/data/course-actions"
import { payOutTeacher } from "@/lib/data/course-actions"
import { PayoutTeacherButton } from "@/app/(admin)/admin/courses/payouts/payout-teacher-button"

interface Props {
  payments: CoursePaymentInCustody[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export function CoursePaymentsCustodyTable({ payments }: Props) {
  if (!payments.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay pagos de cursos en custodia.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Curso</TableHead>
            <TableHead>Estudiante</TableHead>
            <TableHead>Docente</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const amount = p.enrollment?.course?.price || 0
            const student = p.enrollment?.student
            const course = p.enrollment?.course
            const teacher = course?.teacher
            const teacherId = teacher?.id || course?.teacher_id || ""
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{course?.title || "Curso"}</span>
                    <span className="text-xs text-muted-foreground">ID: {course?.id || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{student?.name || student?.email || "Estudiante"}</span>
                    <span className="text-xs text-muted-foreground">{student?.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{teacher?.name || teacher?.email || "Docente"}</span>
                    <span className="text-xs text-muted-foreground">{teacher?.email}</span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-blue-700">
                  {formatCurrency(amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Custodia</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  {teacherId ? (
                    <PayoutTeacherButton
                      teacherId={teacherId}
                      amountLabel={formatCurrency(amount)}
                      action={payOutTeacher}
                    />
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Docente no asignado
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
