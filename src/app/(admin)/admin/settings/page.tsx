import { requireAdmin } from "@/lib/auth/admin"
import { getPlatformSettings } from "@/lib/data/admin-settings-actions"
import { CommissionRateForm } from "@/components/admin/CommissionRateForm"
import { BankAccountForm } from "@/components/admin/BankAccountForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default async function AdminSettingsPage() {
  await requireAdmin()
  const settings = await getPlatformSettings()

  if (!settings) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Error al cargar la configuración
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Administra la configuración financiera de la plataforma
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* Commission Rate Section */}
        <Card>
          <CardHeader>
            <CardTitle>Parámetros Financieros</CardTitle>
            <CardDescription>
              Configura la tasa de comisión que la plataforma retiene de cada transacción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommissionRateForm initialRate={settings.commission_rate} />
          </CardContent>
        </Card>

        {/* Bank Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cuenta Bancaria Principal</CardTitle>
            <CardDescription>
              Información de la cuenta bancaria donde se reciben los pagos de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountForm initialData={settings} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
