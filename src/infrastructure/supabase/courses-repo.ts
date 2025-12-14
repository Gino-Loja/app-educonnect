import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  CourseModuleInput,
  CourseUpdateInput,
  CoursesRepository,
  LessonInput,
  LessonQuestion,
  CourseModuleUpdateInput,
  LessonUpdateInput,
  LessonWithCourse,
} from "@/domain/courses"

export function makeCoursesRepository(supabase: SupabaseClient): CoursesRepository {
  return {
    async getCourseTeacher(courseId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from("courses")
        .select("teacher_id")
        .eq("id", courseId)
        .single()

      if (error || !data) {
        console.error("getCourseTeacher error", error)
        return null
      }
      return (data as { teacher_id: string | null }).teacher_id ?? null
    },

    async createCourse(input) {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          teacher_id: input.teacherId,
          title: input.title,
          description: input.description,
          price: input.price,
          status: "draft",
          cover_url: input.coverUrl,
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("No data returned when creating course")
      }

      return { id: (data as { id: string }).id }
    },

    async publishCourse(courseId: string) {
      const { error } = await supabase
        .from("courses")
        .update({ status: "published" })
        .eq("id", courseId)
      if (error) throw error
    },

    async updateCourse(input: CourseUpdateInput) {
      const { error } = await supabase
        .from("courses")
        .update({
          title: input.title,
          description: input.description,
          price: input.price,
          cover_url: input.coverUrl,
          status: input.status,
        })
        .eq("id", input.id)

      if (error) throw error
    },

    async createModule(input: CourseModuleInput) {
      const { error } = await supabase
        .from("course_modules")
        .insert({
          course_id: input.courseId,
          title: input.title,
          description: input.description,
          position: input.position ?? 1,
        })

      if (error) throw error
    },

    async getModuleWithCourse(moduleId: string) {
      const { data, error } = await supabase
        .from("course_modules")
        .select("id, course_id, course:courses!inner(teacher_id)")
        .eq("id", moduleId)
        .single()

      if (error || !data) {
        console.error("getModuleWithCourse error", error)
        return null
      }

      const courseRelation = Array.isArray(data.course) ? data.course[0] : data.course

      return {
        id: data.id as string,
        courseId: data.course_id as string,
        courseTeacherId: (courseRelation?.teacher_id as string) ?? "",
      }
    },

    async updateModule(input: CourseModuleUpdateInput) {
      const { error } = await supabase
        .from("course_modules")
        .update({
          title: input.title,
          description: input.description,
        })
        .eq("id", input.id)

      if (error) throw error
    },

    async deleteModule(moduleId: string) {
      const { error: lessonsError } = await supabase.from("lessons").delete().eq("module_id", moduleId)
      if (lessonsError) throw lessonsError
      const { error } = await supabase.from("course_modules").delete().eq("id", moduleId)
      if (error) throw error
    },

    async createLesson(input: LessonInput) {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          module_id: input.moduleId,
          title: input.title,
          content_type: input.contentType || null,
          content_url: input.contentUrl || null,
          text_content: input.textContent,
          duration_minutes: input.durationMinutes,
          position: input.position,
          pass_score: input.passScore,
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("No data returned when creating lesson")
      }

      return { id: (data as { id: string }).id }
    },

    async addLessonQuestions(lessonId: string, questions: LessonQuestion[]) {
      if (!questions.length) return

      const payload = questions
        .filter((q) => (q.prompt || "").trim().length > 0)
        .map((q, idx) => ({
          lesson_id: lessonId,
          question_type: q.type,
          prompt: q.prompt,
          options:
            q.options && q.options.length
              ? q.options
              : q.type === "true_false"
                ? ["Verdadero", "Falso"]
                : null,
          correct_answer:
            q.correctAnswer || (q.type === "true_false" ? "Verdadero" : q.options?.[0] || null),
          feedback: q.feedback || null,
          position: q.position ?? idx + 1,
        }))

      if (!payload.length) return

      const { error } = await supabase.from("lesson_questions").insert(payload)
      if (error) throw error
    },

    async getLessonWithCourse(lessonId: string): Promise<LessonWithCourse | null> {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, module_id, content_url, content_type, duration_minutes, pass_score, text_content, module:course_modules!inner(course_id, course:courses!inner(teacher_id))")
        .eq("id", lessonId)
        .maybeSingle()

      if (error) {
        console.error("getLessonWithCourse error", error)
        return null
      }

      if (!data) return null

      const moduleRelation = Array.isArray((data as { module?: unknown }).module)
        ? ((data as { module?: unknown }).module as Array<{ course_id?: string; course?: unknown }>)[0]
        : ((data as { module?: { course_id?: string; course?: unknown } }).module ?? null)
      if (!moduleRelation) return null

      const courseRelation = Array.isArray(moduleRelation.course)
        ? (moduleRelation.course as Array<{ teacher_id?: string }>)[0]
        : (moduleRelation.course as { teacher_id?: string } | null | undefined)
      if (!courseRelation) return null

      return {
        id: data.id as string,
        moduleId: data.module_id as string,
        courseId: moduleRelation.course_id as string,
        courseTeacherId: (courseRelation?.teacher_id as string) ?? "",
        contentUrl: (data as { content_url?: string | null }).content_url ?? null,
        contentType: (data as { content_type?: string | null }).content_type ?? null,
        durationMinutes: (data as { duration_minutes?: number | null }).duration_minutes ?? null,
        passScore: (data as { pass_score?: number | null }).pass_score ?? null,
        textContent: (data as { text_content?: string | null }).text_content ?? null,
      }
    },

    async updateLesson(input: LessonUpdateInput) {
      const { id, ...lessonFields } = input
      const { error } = await supabase
        .from("lessons")
        .update({
          title: lessonFields.title,
          content_type: lessonFields.contentType ?? null,
          content_url: lessonFields.contentUrl ?? null,
          text_content: lessonFields.textContent ?? null,
          duration_minutes: lessonFields.durationMinutes ?? null,
          position: lessonFields.position ?? null,
          pass_score: lessonFields.passScore ?? null,
        })
        .eq("id", id)

      if (error) throw error
    },

    async deleteLesson(lessonId: string) {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId)
      if (error) throw error
    },
  }
}
