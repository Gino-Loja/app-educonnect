import { redirect } from "next/navigation"
import Link from "next/link"

import { CourseWizard } from "@/app/(main)/workspace/@teacher/mis-cursos/CourseWizard"
import { createClient } from "@/utils/supabase/server"

export default async function NewCoursePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    redirect("/workspace")
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Crear y gestionar cursos</h1>
        <Link
          href="/workspace/mis-cursos"
          className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver
        </Link>
      </div>
      <CourseWizard />
    </div>
  )
}
