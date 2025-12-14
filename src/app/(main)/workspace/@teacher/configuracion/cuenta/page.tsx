import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ProfileForm from "@/app/(auth)/account/_template/ProfileForm"
import { Separator } from "@/components/ui/separator"

export default async function AccountPageTeacher() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch data for ProfileForm
  const { data: profileUser } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const initialProfileData = {
    name: profileUser?.name || "",
    lastname: profileUser?.lastname || "",
    phone: profileUser?.phone || "",
    date_of_birth: profileUser?.date_of_birth || "",
    gender: profileUser?.gender || "",
    country: profileUser?.country || "",
    profile_picture_url: profileUser?.profile_picture_url || "",
    website_url: profileUser?.website_url || "",
    linkedin_url: profileUser?.linkedin_url || "",
    city: profileUser?.city || "",
    state: profileUser?.state || "",
    bio: profileUser?.bio || "",
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cuenta</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza tu informacion personal.
        </p>
      </div>
      <Separator />
      <ProfileForm
        profileId={user.id}
        initialData={initialProfileData}
        compact={true}
      />
    </div>
  )
}
