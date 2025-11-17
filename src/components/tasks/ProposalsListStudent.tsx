"use client"

import { ProposalCardStudent } from "./ProposalCardStudent"
import { SubmissionPreviewSheet } from "./SubmissionPreviewSheet"
import { AcceptProposalDialog } from "@/components/forms/AcceptProposalDialog"
import { acceptProposal, rejectProposal } from "@/lib/data/proposal-actions"
import { getSubmissionByTaskId } from "@/lib/data/submission-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Database } from "@/model/schema"

interface ProposalsListStudentProps {
  proposals: Array<{
    id: string
    proposed_amount: number
    estimated_hours: number | null
    cover_letter: string
    status: Database["public"]["Enums"]["proposal_status"]
    created_at: string
    task?: {
      id: string
      title: string
      status?: string
      installments?: number | null
    }
    teacher?: {
      name: string | null
      profile_picture_url: string | null
    }
  }>
  studentName: string
}

export function ProposalsListStudent({ proposals, studentName }: ProposalsListStudentProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<{
    type: "accept" | "reject"
    proposalId: string
  } | null>(null)

  // Accept dialog state
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [proposalToAccept, setProposalToAccept] = useState<any>(null)

  // Submission preview state
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [submission, setSubmission] = useState<any | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)

  const handleAccept = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    if (proposal) {
      setProposalToAccept(proposal)
      setAcceptDialogOpen(true)
    }
  }

  const handleReject = (proposalId: string) => {
    setPendingAction({ type: "reject", proposalId })
  }

  const handleViewSubmission = async (proposal: any) => {
    if (!proposal.task?.id) {
      toast.error("No se puede cargar la entrega")
      return
    }

    setLoadingSubmission(true)
    try {
      const result = await getSubmissionByTaskId(proposal.task.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (!result.submission) {
        toast.error("No se encontró la entrega")
        return
      }

      setSelectedProposal(proposal)
      setSubmission(result.submission)
      setSheetOpen(true)
    } catch (error) {
      console.error("Error loading submission:", error)
      toast.error("Error al cargar la entrega")
    } finally {
      setLoadingSubmission(false)
    }
  }

  const confirmAccept = async () => {
    if (!proposalToAccept) return

    try {
      const result = await acceptProposal(proposalToAccept.id)

      if (result.status === "success") {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Error al aceptar la propuesta")
    } finally {
      setAcceptDialogOpen(false)
      setProposalToAccept(null)
    }
  }

  const confirmReject = async () => {
    if (!pendingAction) return

    try {
      const result = await rejectProposal(pendingAction.proposalId)

      if (result.status === "success") {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Error al rechazar la propuesta")
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {proposals.map((proposal) => (
          <ProposalCardStudent
            key={proposal.id}
            proposal={proposal}
            onAccept={handleAccept}
            onReject={handleReject}
            onViewSubmission={handleViewSubmission}
            loadingSubmission={loadingSubmission}
          />
        ))}
      </div>

      {/* Accept Proposal Dialog with Payment Plan */}
      {proposalToAccept && (
        <AcceptProposalDialog
          open={acceptDialogOpen}
          onOpenChange={setAcceptDialogOpen}
          onConfirm={confirmAccept}
          proposal={proposalToAccept}
        />
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={!!pendingAction && pendingAction.type === "reject"}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar propuesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción rechazará la propuesta. El profesor será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject}>
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission Preview Modal */}
      {selectedProposal && submission && (
        <SubmissionPreviewSheet
          submission={submission}
          taskTitle={selectedProposal.task?.title || "Tarea"}
          studentName={studentName}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
