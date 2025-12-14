import type {
  MilestonesRepository,
  NewMilestoneInput,
  SubmissionsRepository,
  TaskInput,
  TaskStatus,
  TasksRepository,
} from "@/domain/tasks"

export type CommandResult =
  | { status: "success"; taskId?: string; submissionId?: string }
  | { status: "error"; message: string }

export async function createTask(
  input: TaskInput,
  deps: { tasksRepo: TasksRepository },
): Promise<CommandResult> {
  try {
    const role = await deps.tasksRepo.getUserRole(input.studentId)
    if (role !== "student") {
      return { status: "error", message: "Solo los estudiantes pueden crear tareas" }
    }

    const { id } = await deps.tasksRepo.createTask(input)
    return { status: "success", taskId: id }
  } catch (error) {
    console.error("createTask use-case error", error)
    return { status: "error", message: "No pudimos crear la tarea" }
  }
}

export async function cancelTask(
  taskId: string,
  studentId: string,
  deps: { tasksRepo: TasksRepository },
): Promise<CommandResult> {
  try {
    const ownership = await deps.tasksRepo.getTaskOwnership(taskId)
    if (!ownership || ownership.studentId !== studentId) {
      return { status: "error", message: "Tarea no encontrada" }
    }

    if (ownership.status === "completed") {
      return { status: "error", message: "No puedes cancelar una tarea completada" }
    }

    if (ownership.status === "cancelled") {
      return { status: "error", message: "La tarea ya estaba cancelada" }
    }

    await deps.tasksRepo.cancelTask(taskId)
    return { status: "success" }
  } catch (error) {
    console.error("cancelTask use-case error", error)
    return { status: "error", message: "No pudimos cancelar la tarea" }
  }
}

export async function completeTask(
  taskId: string,
  teacherId: string,
  deps: { tasksRepo: TasksRepository },
): Promise<CommandResult> {
  try {
    const ownership = await deps.tasksRepo.getTaskOwnership(taskId)
    if (!ownership || ownership.teacherId !== teacherId) {
      return { status: "error", message: "No tienes permiso para completar esta tarea" }
    }

    if (ownership.status === "completed") {
      return { status: "error", message: "Esta tarea ya esta completada" }
    }

    if (ownership.status === "cancelled") {
      return { status: "error", message: "No puedes completar una tarea cancelada" }
    }

    await deps.tasksRepo.completeTask(taskId)
    return { status: "success" }
  } catch (error) {
    console.error("completeTask use-case error", error)
    return { status: "error", message: "No pudimos completar la tarea" }
  }
}

export async function createMilestonesForTask(
  input: { taskId: string; studentId: string; totalAmount: number; installments: number },
  deps: { tasksRepo: TasksRepository; milestonesRepo: MilestonesRepository },
): Promise<CommandResult> {
  try {
    const ownership = await deps.tasksRepo.getTaskOwnership(input.taskId)
    if (!ownership || ownership.studentId !== input.studentId) {
      return { status: "error", message: "Tarea no encontrada" }
    }

    const amountPerMilestone = input.totalAmount / input.installments
    const milestones: NewMilestoneInput[] = Array.from(
      { length: input.installments },
      (_value, index) => ({
        milestoneNumber: index + 1,
        title: `Avance ${index + 1} de ${input.installments}`,
        description: `Pago de cuota ${index + 1} por avance del trabajo`,
        amount: amountPerMilestone,
        status: "pending_payment",
      }),
    )

    await deps.milestonesRepo.createMilestones(input.taskId, milestones)
    return { status: "success" }
  } catch (error) {
    console.error("createMilestonesForTask use-case error", error)
    return { status: "error", message: "Error al crear hitos de pago" }
  }
}

export async function submitPaymentProof(
  input: {
    milestoneId: string
    studentId: string
    paymentProofUrl: string
    paymentReference: string
  },
  deps: { milestonesRepo: MilestonesRepository },
): Promise<CommandResult> {
  try {
    const milestone = await deps.milestonesRepo.findMilestoneOwner(input.milestoneId)
    if (!milestone || milestone.studentId !== input.studentId) {
      return { status: "error", message: "Hito de pago no encontrado" }
    }

    await deps.milestonesRepo.updatePaymentProof({
      milestoneId: input.milestoneId,
      paymentProofUrl: input.paymentProofUrl,
      paymentReference: input.paymentReference,
    })

    return { status: "success" }
  } catch (error) {
    console.error("submitPaymentProof use-case error", error)
    return { status: "error", message: "No pudimos registrar el comprobante" }
  }
}

export async function saveSubmissionForMilestone(
  input: {
    taskId: string
    teacherId: string
    milestoneId: string
    content: string
    attachments: string[]
    version?: number | null
  },
  deps: {
    tasksRepo: TasksRepository
    milestonesRepo: MilestonesRepository
    submissionsRepo: SubmissionsRepository
  },
): Promise<CommandResult> {
  try {
    const ownership = await deps.tasksRepo.getTaskOwnership(input.taskId)
    if (!ownership || ownership.teacherId !== input.teacherId) {
      return { status: "error", message: "No tienes permiso para entregar esta tarea" }
    }

    if (ownership.status !== "in_progress" && ownership.status !== "submitted") {
      return { status: "error", message: "Solo puedes entregar tareas en progreso" }
    }

    const milestone = await deps.milestonesRepo.findMilestoneOwner(input.milestoneId)
    if (!milestone || milestone.taskId !== input.taskId) {
      return { status: "error", message: "Hito de pago no encontrado" }
    }

    if (milestone.submissionId) {
      const reviewStatus = await deps.submissionsRepo.getSubmissionReviewStatus(milestone.submissionId)
      if (reviewStatus && reviewStatus !== "changes_requested") {
        return { status: "error", message: "Este hito ya tiene una entrega registrada" }
      }
    }

    const submission = await deps.submissionsRepo.createSubmission({
      taskId: input.taskId,
      teacherId: input.teacherId,
      content: input.content,
      attachments: input.attachments,
      isFinal: false,
      version: input.version ?? null,
      reviewStatus: "pending_review",
    })

    await deps.milestonesRepo.linkSubmission(input.milestoneId, submission.id)
    await deps.tasksRepo.updateTaskStatus(input.taskId, "submitted" as TaskStatus)

    return { status: "success", submissionId: submission.id }
  } catch (error) {
    console.error("saveSubmissionForMilestone use-case error", error)
    return { status: "error", message: "No pudimos registrar la entrega" }
  }
}
