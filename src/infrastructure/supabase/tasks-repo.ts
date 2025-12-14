import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  MilestonesRepository,
  NewMilestoneInput,
  SubmissionsRepository,
  SubmissionRecordInput,
  TaskInput,
  TaskOwnership,
  TaskStatus,
  TasksRepository,
} from "@/domain/tasks"

export function makeTasksRepository(supabase: SupabaseClient): TasksRepository {
  return {
    async getUserRole(userId: string): Promise<string | null> {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
      if (error) {
        console.error("getUserRole tasks repo error", error)
        return null
      }
      return data?.role ?? null
    },

    async createTask(input: TaskInput) {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          student_id: input.studentId,
          title: input.title,
          description: input.description,
          subject: input.subject,
          academic_level: input.academicLevel,
          difficulty: input.difficulty,
          topic_tags: input.topicTags,
          budget_min: input.budgetMin,
          budget_max: input.budgetMax,
          payment_type: input.paymentType,
          due_date: input.dueDate,
          estimated_hours: input.estimatedHours,
          priority: input.priority,
          installments: input.installments,
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("No data returned when creating task")
      }

      return { id: data.id as string }
    },

    async getTaskOwnership(taskId: string): Promise<TaskOwnership | null> {
      const { data, error } = await supabase
        .from("tasks")
        .select("student_id, teacher_id, status")
        .eq("id", taskId)
        .maybeSingle()

      if (error) {
        console.error("getTaskOwnership tasks repo error", error)
        return null
      }

      if (!data) return null

      return {
        studentId: (data.student_id as string) ?? "",
        teacherId: (data.teacher_id as string | null) ?? null,
        status: (data.status as TaskStatus) ?? "open",
      }
    },

    async cancelTask(taskId: string): Promise<void> {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "cancelled" })
        .eq("id", taskId)

      if (error) throw error
    },

    async completeTask(taskId: string): Promise<void> {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId)

      if (error) throw error
    },

    async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId)

      if (error) throw error
    },
  }
}

export function makeMilestonesRepository(supabase: SupabaseClient): MilestonesRepository {
  return {
    async createMilestones(taskId: string, milestones: NewMilestoneInput[]): Promise<void> {
      if (!milestones.length) return

      const payload = milestones.map((milestone) => ({
        task_id: taskId,
        milestone_number: milestone.milestoneNumber,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        status: milestone.status,
        due_date: milestone.dueDate ?? null,
      }))

      const { error } = await supabase.from("payment_milestones").insert(payload)
      if (error) throw error
    },

    async findMilestoneOwner(milestoneId: string) {
      const { data, error } = await supabase
        .from("payment_milestones")
        .select("id, task_id, submission_id, milestone_number, title, tasks!inner(student_id)")
        .eq("id", milestoneId)
        .maybeSingle()

      if (error) {
        console.error("findMilestoneOwner repo error", error)
        return null
      }

      if (!data) return null

      return {
        id: data.id as string,
        taskId: data.task_id as string,
        submissionId: (data.submission_id as string | null) ?? null,
        milestoneNumber: (data.milestone_number as number | null) ?? null,
        title: (data.title as string | null) ?? null,
        studentId: ((data.tasks as { student_id?: string } | null)?.student_id as string) ?? "",
      }
    },

    async updatePaymentProof(input: {
      milestoneId: string
      paymentProofUrl: string
      paymentReference: string
    }): Promise<void> {
      const { error } = await supabase
        .from("payment_milestones")
        .update({
          status: "pending_verification",
          payment_proof_url: input.paymentProofUrl,
          payment_reference: input.paymentReference,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", input.milestoneId)

      if (error) throw error
    },

    async linkSubmission(milestoneId: string, submissionId: string): Promise<void> {
      const { error } = await supabase
        .from("payment_milestones")
        .update({ submission_id: submissionId })
        .eq("id", milestoneId)

      if (error) throw error
    },
  }
}

export function makeSubmissionsRepository(supabase: SupabaseClient): SubmissionsRepository {
  return {
    async createSubmission(input: SubmissionRecordInput): Promise<{ id: string }> {
      const { data, error } = await supabase
        .from("task_submissions")
        .insert({
          task_id: input.taskId,
          teacher_id: input.teacherId,
          content: input.content,
          attachments: input.attachments,
          is_final: input.isFinal,
          version: input.version ?? null,
          review_status: input.reviewStatus ?? null,
        })
        .select("id")
        .single()

      if (error || !data) {
        throw error || new Error("Error creating submission")
      }

      return { id: data.id as string }
    },

    async getSubmissionReviewStatus(submissionId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("review_status")
        .eq("id", submissionId)
        .maybeSingle()

      if (error) {
        console.error("getSubmissionReviewStatus repo error", error)
        return null
      }

      return (data?.review_status as string | null) ?? null
    },
  }
}
