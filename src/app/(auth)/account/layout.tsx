import { createClient } from "@/utils/supabase/server"

export default async function RootLayout({
  children,

}: {
  children: React.ReactNode

}) {

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-16">

        {children}
        
      </main>
    </div>
  )
}