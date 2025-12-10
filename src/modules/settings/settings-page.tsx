import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StudentProfileForm } from "./student-profile-form"
import { TeacherProfileForm } from "./teacher-profile-form"

export async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()

  const role: "student" | "teacher" = profile?.role === "teacher" ? "teacher" : "student"

  const { data: studentData } =
    role === "student"
      ? await supabase
        .from("students")
        .select(
          "academic_level, major, subjects_of_interest, preferred_learning_style, budget_range, max_budget_per_task",
        )
        .eq("id", user.id)
        .maybeSingle()
      : { data: null }

  const { data: teacherData } =
    role === "teacher"
      ? await supabase
        .from("teachers")
        .select(
          "hourly_rate, specialties, subjects, languages, education_level, teaching_experience_years, portfolio_url, accepts_urgent_tasks, accepts_long_term, teaching_methodology",
        )
        .eq("id", user.id)
        .maybeSingle()
      : { data: null }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Datos de perfil</CardTitle>
          <p className="text-sm text-muted-foreground">
            Información académica y de oferta para que tus coincidencias sean más precisas.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          {role === "teacher" ? (
            <TeacherProfileForm
              initialData={{
                hourly_rate: teacherData?.hourly_rate ?? 0,
                specialties: teacherData?.specialties ?? [],
                subjects: teacherData?.subjects ?? [],
                languages: teacherData?.languages ?? [],
                education_level: teacherData?.education_level ?? "",
                teaching_experience_years: teacherData?.teaching_experience_years ?? null,
                portfolio_url: teacherData?.portfolio_url ?? "",
                accepts_urgent_tasks: teacherData?.accepts_urgent_tasks ?? false,
                accepts_long_term: teacherData?.accepts_long_term ?? false,
                teaching_methodology: teacherData?.teaching_methodology ?? "",
              }}
            />
          ) : (
            <StudentProfileForm
              initialData={{
                academic_level: studentData?.academic_level ?? "",
                major: studentData?.major ?? "",
                subjects_of_interest: studentData?.subjects_of_interest ?? [],
                preferred_learning_style: studentData?.preferred_learning_style ?? "",
                budget_range: studentData?.budget_range ?? "",
                max_budget_per_task: studentData?.max_budget_per_task ?? null,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
