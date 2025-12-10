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
          Error al cargar la configuracion
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Parametros Financieros</h3>
        <p className="text-sm text-muted-foreground">
          Configura las tasas y cuentas de la plataforma.
        </p>
      </div>
      <Separator />

      <div className="grid gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Parametros Financieros</CardTitle>
            <CardDescription>
              Configura la tasa de comision que la plataforma retiene de cada transaccion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommissionRateForm initialRate={settings.commission_rate} />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Cuenta Bancaria Principal</CardTitle>
            <CardDescription>
              Informacion de la cuenta bancaria donde se reciben los pagos de la plataforma
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
