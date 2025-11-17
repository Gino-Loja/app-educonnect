import { createClient } from "@/utils/supabase/server"
import ProfileForm from "./_template/ProfileForm"

export default async function RootLayout({
    children,

}: {
    children: React.ReactNode

}) {

    const supabase = await createClient()

    const user = supabase.auth.getUser()
    const { data, error } = await supabase.auth.getUser()

    if (error) {

        return <div className="min-h-screen bg-gray-50">
            <main className="max-w-4xl mx-auto px-4 py-16">
                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold">Error</h1>
                    <p className="text-gray-600">Something went wrong</p>
                </div>
            </main>
        </div>

    }

    const { data: profileUser, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()

    if (profileError) {

        return <div className="min-h-screen bg-gray-50">
            <main className="max-w-4xl mx-auto px-4 py-16">
                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold">Error</h1>
                    <p className="text-gray-600">Something went wrong</p>
                </div>
            </main>
        </div>

    }

    // if (profileUser.onboarding_completed ) {
    //     redirect('/workspace/')
    // }

    // Preparar los datos iniciales del perfil
    const initialData = {
        name: profileUser.name || '',
        lastname: profileUser.lastname || '',
        phone: profileUser.phone || '',
        date_of_birth: profileUser.date_of_birth || '',
        gender: profileUser.gender || '',
        country: profileUser.country || '',
        profile_picture_url: profileUser.profile_picture_url || '',
        website_url: profileUser.website_url || '',
        linkedin_url: profileUser.linkedin_url || '',
        city: profileUser.city || '',
        state: profileUser.state || '',
        bio: profileUser.bio || '',
    }

    return (
        <>
            <ProfileForm profileId={data.user.id} initialData={initialData} />
        </>
    )
}