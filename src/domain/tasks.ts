export type TaskStatus = "open" | "in_progress" | "submitted" | "completed" | "cancelled" | string

export type TaskPriority = "low" | "normal" | "high" | string

export type TaskInput = {
  studentId: string
  title: string
  description: string
  subject: string
  academicLevel: string
  difficulty?: string | null
  topicTags: string[]
  budgetMin: number | null
  budgetMax: number | null
  paymentType: string
  dueDate: string | null
  estimatedHours: number | null
  priority: TaskPriority
  installments: number
}

export type NewTask = { id: string }

export type TaskOwnership = {
  studentId: string
  teacherId: string | null
  status: TaskStatus
}

export type PaymentStatus = "pending_payment" | "pending_verification" | "in_custody" | "paid" | "rejected" | string

export type NewMilestoneInput = {
  milestoneNumber: number
  title: string
  description: string | null
  amount: number
  status: PaymentStatus
  dueDate?: string | null
}

export type MilestoneWithTask = {
  id: string
  taskId: string
  studentId: string
  submissionId?: string | null
  milestoneNumber?: number | null
  title?: string | null
}

export type SubmissionRecordInput = {
  taskId: string
  teacherId: string
  content: string
  attachments: string[]
  isFinal: boolean
  version?: number | null
  reviewStatus?: string | null
}

export interface TasksRepository {
  getUserRole(userId: string): Promise<string | null>
  createTask(input: TaskInput): Promise<NewTask>
  getTaskOwnership(taskId: string): Promise<TaskOwnership | null>
  cancelTask(taskId: string): Promise<void>
  completeTask(taskId: string): Promise<void>
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>
}

export interface MilestonesRepository {
  createMilestones(taskId: string, milestones: NewMilestoneInput[]): Promise<void>
  findMilestoneOwner(milestoneId: string): Promise<MilestoneWithTask | null>
  updatePaymentProof(input: {
    milestoneId: string
    paymentProofUrl: string
    paymentReference: string
  }): Promise<void>
  linkSubmission(milestoneId: string, submissionId: string): Promise<void>
}

export interface SubmissionsRepository {
  createSubmission(input: SubmissionRecordInput): Promise<{ id: string }>
  getSubmissionReviewStatus(submissionId: string): Promise<string | null>
}
