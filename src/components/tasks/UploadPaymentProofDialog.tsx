"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import type { PaymentMilestone } from "@/lib/data/milestone-actions"
import { submitPaymentProof } from "@/lib/data/milestone-actions"
import { getPublicBankInfo } from "@/lib/data/admin-settings-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { IconUpload, IconAlertCircle } from "@tabler/icons-react"

interface Props {
  milestone: PaymentMilestone
  open: boolean
  onClose: () => void
}

export function UploadPaymentProofDialog({ milestone, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [paymentReference, setPaymentReference] = useState("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [bankInfo, setBankInfo] = useState<Awaited<ReturnType<typeof getPublicBankInfo>> | null>(null)
  const [loadingBankInfo, setLoadingBankInfo] = useState(false)

  // Load bank info when dialog opens
  useEffect(() => {
    if (open && !bankInfo) {
      setLoadingBankInfo(true)
      getPublicBankInfo().then((settings) => {
        setBankInfo(settings)
        setLoadingBankInfo(false)
      })
    }
  }, [open, bankInfo])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("Solo se permiten imágenes (PNG, JPG) o archivos PDF")
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB")
        return
      }

      setProofFile(file)

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!proofFile) {
      toast.error("Debes seleccionar un archivo")
      return
    }

    if (!paymentReference.trim()) {
      toast.error("Debes ingresar el número de referencia")
      return
    }

    startTransition(async () => {
      // Create FormData with file and payment reference
      const formData = new FormData()
      formData.append("file", proofFile)
      formData.append("paymentReference", paymentReference)

      const result = await submitPaymentProof(milestone.id, formData)

      if (result.status === "success") {
        toast.success(result.message)
        onClose()
        setPaymentReference("")
        setProofFile(null)
        setPreviewUrl(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Sube tu comprobante de pago para el Hito {milestone.milestone_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Amount */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monto a pagar:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${milestone.amount.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Bank Account Information */}
          {loadingBankInfo ? (
            <div className="text-center text-sm text-muted-foreground">
              Cargando información bancaria...
            </div>
          ) : bankInfo?.bank_name ? (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Información de la Cuenta Bancaria
              </h3>
              <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Banco:</span>
                    <p className="font-medium">{bankInfo.bank_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Titular:</span>
                    <p className="font-medium">{bankInfo.account_holder}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Número de Cuenta:</span>
                    <p className="font-medium font-mono">{bankInfo.account_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium capitalize">{bankInfo.account_type}</p>
                  </div>
                  {bankInfo.fiscal_id && (
                    <div>
                      <span className="text-muted-foreground">
                        Cédula / RUC:
                      </span>
                      <p className="font-medium">{bankInfo.fiscal_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <IconAlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">
                    Error de Configuración
                  </p>
                  <p className="text-amber-700">
                    El administrador no ha configurado una cuenta bancaria para
                    recibir pagos.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label htmlFor="payment-reference">
              Número de Transacción / Referencia *
            </Label>
            <Input
              id="payment-reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Ej: 0012345678"
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el número de referencia de tu transferencia o depósito
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="proof-file">
              Archivo del Comprobante (PNG, JPG, PDF) *
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="proof-file"
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={handleFileChange}
                disabled={isPending}
                required
              />
              <IconUpload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Tamaño máximo: 5MB
            </p>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Vista Previa</Label>
              <div className="rounded-lg border overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Vista previa del comprobante"
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            </div>
          )}

          {proofFile && !previewUrl && (
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Archivo PDF seleccionado: {proofFile.name}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !bankInfo?.bank_name}>
              {isPending ? "Enviando..." : "Enviar para Verificación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
