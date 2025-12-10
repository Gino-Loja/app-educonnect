import Link from "next/link"
import { redirect } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { getCourseModulesWithLessons } from "@/lib/data/course-actions"
import { createClient } from "@/utils/supabase/server"
import { CourseContentClient } from "@/components/courses/CourseContentClient"

export default async function CourseContentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Get course details
    const { data: course } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", id)
        .single()

    if (!course) {
        redirect("/workspace/mis-cursos")
    }

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, status")
        .eq("course_id", course.id)
        .eq("student_id", user.id)
        .maybeSingle()

    const isActive = enrollment?.status === "active"

    if (!isActive) {
        redirect(`/workspace/cursos/${id}`)
    }

    // Get course modules and lessons
    const modules = await getCourseModulesWithLessons(course.id, enrollment.id)
    const normalizedModules = modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
            ...lesson,
            completed: Boolean(lesson.completed),
        })),
    }))

    // Calculate progress
    const totalLessons = normalizedModules.reduce((acc, m) => acc + m.lessons.length, 0)
    const completedLessons = normalizedModules.reduce((acc, m) => acc + m.lessons.filter((l) => l.completed).length, 0)
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-white">
                <div className="flex items-center justify-between px-4 py-3 md:px-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/workspace/cursos/${id}`}>
                                <IconArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Link>
                        </Button>
                        <div className="hidden md:block">
                            <h1 className="font-semibold text-lg">{course.title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium">{progress}% completado</p>
                            <div className="h-1.5 w-24 rounded-full bg-slate-200 mt-1">
                                <div
                                    className="h-1.5 rounded-full bg-blue-600"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Client Component */}
            <CourseContentClient modules={normalizedModules} courseTitle={course.title} />
        </div>
    )
}
