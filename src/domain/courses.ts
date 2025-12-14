export type CourseStatus = "draft" | "published" | "archived" | string

export type Course = {
  id: string
  title: string
  description: string | null
  price: number
  status: CourseStatus
  teacherId: string
  coverUrl?: string | null
}

export type CourseModule = {
  id: string
  courseId: string
  title: string
  description: string | null
  position: number
}

export type LessonQuestion = {
  type: "multiple_choice" | "true_false"
  prompt: string
  options?: string[] | null
  correctAnswer?: string | null
  feedback?: string | null
  position?: number | null
}

export type LessonInput = {
  moduleId: string
  title: string
  contentType?: string | null
  contentUrl?: string | null
  textContent?: string | null
  durationMinutes?: number | null
  position?: number | null
  passScore?: number | null
  questions?: LessonQuestion[]
}

export type CourseInput = {
  teacherId: string
  title: string
  description: string | null
  price: number
  coverUrl?: string | null
}

export type CourseUpdateInput = {
  id: string
  title: string
  description: string | null
  price: number
  coverUrl?: string | null
  status: CourseStatus
}

export type CourseModuleInput = {
  courseId: string
  title: string
  description: string | null
  position?: number | null
}

export type ModuleWithCourse = {
  id: string
  courseId: string
  courseTeacherId: string
}

export type CourseModuleUpdateInput = {
  id: string
  title: string
  description: string | null
}

export type CourseModuleDeleteInput = {
  id: string
}

export type LessonUpdateInput = {
  id: string
  title: string
  contentType?: string | null
  contentUrl?: string | null
  textContent?: string | null
  durationMinutes?: number | null
  position?: number | null
  passScore?: number | null
  questions?: LessonQuestion[]
}

export type LessonWithCourse = {
  id: string
  moduleId: string
  courseId: string
  courseTeacherId: string
  contentUrl?: string | null
  contentType?: string | null
  durationMinutes?: number | null
  passScore?: number | null
  textContent?: string | null
}

export interface CoursesRepository {
  getCourseTeacher(courseId: string): Promise<string | null>
  createCourse(input: CourseInput): Promise<{ id: string }>
  publishCourse(courseId: string): Promise<void>
  updateCourse(input: CourseUpdateInput): Promise<void>
  createModule(input: CourseModuleInput): Promise<void>
  getModuleWithCourse(moduleId: string): Promise<ModuleWithCourse | null>
  updateModule(input: CourseModuleUpdateInput): Promise<void>
  deleteModule(moduleId: string): Promise<void>
  createLesson(input: LessonInput): Promise<{ id: string }>
  addLessonQuestions(
    lessonId: string,
    questions: LessonQuestion[],
  ): Promise<void>
  getLessonWithCourse(lessonId: string): Promise<LessonWithCourse | null>
  updateLesson(input: LessonUpdateInput): Promise<void>
  deleteLesson(lessonId: string): Promise<void>
}
