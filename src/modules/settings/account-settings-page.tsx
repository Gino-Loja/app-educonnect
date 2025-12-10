import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import ProfileForm from "@/app/(auth)/account/_template/ProfileForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfigNavigation } from "@/modules/settings/config-navigation"

export async function AccountSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profileUser, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">No se pudo cargar el perfil</p>
      </div>
    )
  }

  const role: "student" | "teacher" = profileUser.role === "teacher" ? "teacher" : "student"

  const initialData = {
    name: profileUser.name || "",
    lastname: profileUser.lastname || "",
    phone: profileUser.phone || "",
    date_of_birth: profileUser.date_of_birth || "",
    gender: profileUser.gender || "",
    country: profileUser.country || "",
    profile_picture_url: profileUser.profile_picture_url || "",
    website_url: profileUser.website_url || "",
    linkedin_url: profileUser.linkedin_url || "",
    city: profileUser.city || "",
    state: profileUser.state || "",
    bio: profileUser.bio || "",
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Configuracion de cuenta</h1>
        <p className="text-sm text-muted-foreground">Actualiza tus datos personales y de contacto.</p>
        <ConfigNavigation role={role} active="cuenta" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profileId={user.id} initialData={initialData} compact />
        </CardContent>
      </Card>
    </div>
  )
}
