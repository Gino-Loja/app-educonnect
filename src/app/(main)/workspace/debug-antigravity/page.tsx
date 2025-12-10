
import { createClient } from "@/utils/supabase/server"
import { LessonEditorDialog } from "../@teacher/mis-cursos/LessonEditorDialog"
import { signLessonUrl } from "@/lib/data/course-actions"

export default async function DebugPage() {
    const supabase = await createClient()

    // Fetch all lessons from all modules/courses for the current user (teacher)
    // This is a naive fetch for debugging purposes
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    const { data: courses } = await supabase
        .from("courses")
        .select("id, title, modules:course_modules(id, lessons:lessons(*))")
        .eq("teacher_id", user.id)

    if (!courses) return <div>No courses found</div>

    const allLessons = []

    for (const course of courses) {
        for (const courseModule of course.modules) {
            if (!courseModule.lessons) continue
            for (const lesson of courseModule.lessons) {
                const signedUrl = await signLessonUrl(lesson.content_url)
                allLessons.push({
                    courseTitle: course.title,
                    ...lesson,
                    signed_url: signedUrl
                })
            }
        }
    }

    // Mock functions for the dialog
    async function mockDelete(formData: FormData) {
        "use server"
        console.log("Mock delete", formData)
    }

    return (
        <div className="p-10 space-y-8">
            <h1 className="text-2xl font-bold">Debug Lessons</h1>
            <div className="grid gap-4">
                {allLessons.map((lesson) => (
                    <div key={lesson.id} className="border p-4 rounded bg-white shadow flex flex-col gap-2">
                        <h3 className="font-bold text-lg">{lesson.title} (Course: {lesson.courseTitle})</h3>
                        <pre className="bg-slate-100 p-2 text-xs overflow-auto max-h-40">
                            {JSON.stringify(lesson, null, 2)}
                        </pre>
                        <div className="p-4 border border-dashed border-red-300">
                            <p className="text-sm text-red-500 mb-2">Test Render of Dialog:</p>
                            <div className="flex items-center gap-2">
                                <LessonEditorDialog
                                    lesson={{
                                        id: lesson.id,
                                        title: lesson.title,
                                        content_type: lesson.content_type,
                                        content_url: lesson.content_url,
                                        duration_minutes: lesson.duration_minutes,
                                        signed_url: lesson.signed_url
                                    }}
                                    deleteAction={mockDelete}
                                />
                                <span>(If button is visible, click to test open)</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
