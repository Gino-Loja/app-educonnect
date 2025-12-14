import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancialSettingsForm } from "@/modules/settings/financial-settings-form"

export default async function ConfiguracionFinanzasPageTeacher() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "teacher") {
    redirect("/workspace/configuracion/cuenta")
  }

  const { data: teacherData } = await supabase
    .from("teachers")
    .select("hourly_rate, currency, payment_info")
    .eq("id", user.id)
    .maybeSingle()

  const { data: bankData } = await supabase
    .from("teacher_bank_accounts")
    .select("bank_name, account_holder, account_number, account_type, routing_number, account_alias, country, currency")
    .eq("teacher_id", user.id)
    .maybeSingle()

  const paymentInfo = (teacherData?.payment_info as {
    primary_account?: {
      bank_name?: string
      account_number?: string
      account_holder?: string
      account_type?: string
      alias?: string
    }
  }) || {}
  const primary = paymentInfo.primary_account || {}

  const initialData = {
    hourly_rate: teacherData?.hourly_rate ?? 0,
    currency: bankData?.currency || teacherData?.currency || "USD",
    country: bankData?.country || "",
    bank_name: bankData?.bank_name || primary.bank_name || "",
    account_number: bankData?.account_number || primary.account_number || "",
    account_holder: bankData?.account_holder || primary.account_holder || "",
    account_type: bankData?.account_type || primary.account_type || "",
    account_alias: bankData?.account_alias || primary.alias || "",
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-8">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Configuracion</h1>
          <p className="text-sm text-muted-foreground">
            Ajusta tus datos financieros y bancarios para recibir pagos.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Parametros financieros</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialSettingsForm initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  )
}
