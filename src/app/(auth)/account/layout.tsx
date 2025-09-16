import { createClient } from "@/utils/supabase/server"

export default async function RootLayout({
  children,
  estudiante,
  profesor,
}: {
  children: React.ReactNode
  estudiante: React.ReactNode
  profesor: React.ReactNode
}) {

  const supabase = await createClient()

  const user = supabase.auth.getUser()
  const { data, error } = await supabase.auth.getUser()

  if (error) {

    return <div>Error al recuperar usuario</div>
   
  }

   const role = data.user.user_metadata.role
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-16">
        {role === "estudiante" ? estudiante : profesor}
      </main>
    </div>
  )
}