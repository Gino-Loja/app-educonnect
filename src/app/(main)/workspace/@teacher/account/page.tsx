import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import ProfileForm from "@/app/(auth)/account/_template/ProfileForm"

export default async function TeacherAccountPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    redirect("/login")
  }

  // Solo permitir docentes en esta ruta
  const userRole = (data.user.user_metadata as { role?: string })?.role
  if (userRole !== "teacher") {
    redirect("/workspace")
  }

  const { data: profileUser, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single()

  if (profileError) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">No se pudo cargar el perfil</p>
      </div>
    )
  }

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

  return <ProfileForm profileId={data.user.id} initialData={initialData} compact />
}
