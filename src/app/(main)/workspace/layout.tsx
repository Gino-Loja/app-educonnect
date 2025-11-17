import { createClient } from "@/utils/supabase/server"
import { Toaster } from "@/components/ui/sonner"

export default async function RootLayout({
    children,
    student,
    teacher,

}: {
    children: React.ReactNode
    student: React.ReactNode
    teacher: React.ReactNode

}) {

    const user = await createClient()

    const {data, error} = await user.auth.getUser()

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


    

    return (
        <>

                {data.user.user_metadata.role === "student" ? student : teacher}
                <Toaster position="top-center" />

        </>
    )
}