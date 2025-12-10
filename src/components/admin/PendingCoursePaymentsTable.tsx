"use client"

import { useState } from "react"
import Image from "next/image"
import { IconCheck, IconX, IconEye, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { approveCoursePayment, rejectCoursePayment } from "@/lib/data/course-actions"
import type { PendingCoursePayment } from "@/lib/data/course-actions"

interface Props {
    payments: PendingCoursePayment[]
}

export function PendingCoursePaymentsTable({ payments }: Props) {
    const [loading, setLoading] = useState<string | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)

    async function handleApprove(paymentId: string, enrollmentId: string) {
        setLoading(paymentId)
        try {
            const result = await approveCoursePayment(paymentId, enrollmentId)
            if (result.status === "success") {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Error approving course payment", error)
            toast.error("Error al aprobar el pago")
        } finally {
            setLoading(null)
        }
    }

    async function handleReject(paymentId: string, enrollmentId: string) {
        setLoading(paymentId)
        try {
            const result = await rejectCoursePayment(paymentId, enrollmentId)
            if (result.status === "success") {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error("Error rejecting course payment", error)
            toast.error("Error al rechazar el pago")
        } finally {
            setLoading(null)
        }
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(value || 0)
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (payments.length === 0) {
        return (
            <div className="rounded-lg border bg-slate-50 p-8 text-center">
                <p className="text-sm text-muted-foreground">No hay pagos de cursos pendientes de verificación.</p>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead>Profesor</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{payment.enrollment.student.name || "Sin nombre"}</p>
                                        <p className="text-xs text-muted-foreground">{payment.enrollment.student.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{payment.enrollment.course.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(payment.enrollment.course.price)}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm">
                                        {payment.enrollment.course.teacher?.name || payment.enrollment.course.teacher?.email || "N/A"}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{formatCurrency(payment.enrollment.course.price)}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                        {payment.method}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-muted-foreground">{formatDate(payment.created_at)}</p>
                                </TableCell>
                                <TableCell>
                                    {payment.proof_url_signed ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setProofPreview(payment.proof_url_signed || null)}
                                        >
                                            <IconEye className="h-4 w-4 mr-1" />
                                            Ver
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Sin comprobante</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleApprove(payment.id, payment.enrollment.id)}
                                            disabled={loading === payment.id}
                                        >
                                            {loading === payment.id ? (
                                                <IconLoader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <IconCheck className="h-4 w-4 mr-1" />
                                                    Aprobar
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleReject(payment.id, payment.enrollment.id)}
                                            disabled={loading === payment.id}
                                        >
                                            {loading === payment.id ? (
                                                <IconLoader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <IconX className="h-4 w-4 mr-1" />
                                                    Rechazar
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Proof Preview Dialog */}
            <Dialog open={!!proofPreview} onOpenChange={() => setProofPreview(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Comprobante de Pago</DialogTitle>
                        <DialogDescription>Vista previa del comprobante subido por el estudiante</DialogDescription>
                    </DialogHeader>
                    {proofPreview && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
                            <Image src={proofPreview} alt="Comprobante de pago" fill className="object-contain" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
