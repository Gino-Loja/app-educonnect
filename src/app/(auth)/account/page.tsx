import { createClient } from "@/utils/supabase/server"
import ProfileForm from "./_template/ProfileForm"
import { redirect } from "next/navigation"

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

    const role = data.user.user_metadata.role

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

    if (profileUser.onboarding_completed ) {
        redirect('/workspace/')
    }

    return (
        <>
            <ProfileForm profileId={data.user.id} />
        </>
    )
}