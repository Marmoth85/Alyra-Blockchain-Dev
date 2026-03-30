'use client'

import { useState } from 'react'
import { Vote, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { WorkflowStatus } from '@/contracts/voting'
import { VOTING_ABI, VOTING_CONTRACT_ADDRESS } from '@/contracts/voting'
import { useProposals, useContractWrite, useWorkflowTransitions, useProposal, useVoteCounts } from '@/hooks/useVoting'
import type { VoterData } from '@/contracts/voting'

type VoteOptionProps = {
  id: number
  isSelected: boolean
  hasVoted: boolean
  onVote: (id: number) => void
  isSubmitting: boolean
}

function VoteOption({ id, isSelected, hasVoted, onVote, isSubmitting }: VoteOptionProps) {
  const { proposal, isLoading } = useProposal(id, true)

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-lg" />
  }

  if (!proposal) return null

  return (
    <button
      onClick={() => !hasVoted && onVote(id)}
      disabled={hasVoted || isSubmitting}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all',
        'hover:border-primary hover:bg-muted/50',
        'disabled:cursor-not-allowed',
        isSelected && 'border-green-500 bg-green-50 dark:bg-green-950/20',
        !isSelected && !hasVoted && 'border-border',
        !isSelected && hasVoted && 'border-border opacity-50',
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        {id}
      </span>
      <span className="flex-1 text-sm">{proposal.description}</span>
      {isSelected && (
        <CheckCircle2 className="size-5 shrink-0 text-green-500" />
      )}
    </button>
  )
}

type Props = {
  status: WorkflowStatus | undefined
  isOwner: boolean
  isVoter: boolean
  voterData: VoterData | undefined
  onStatusChange: () => void
  onVoteSuccess: () => void
}

export function VotingPanel({ status, isOwner, isVoter, voterData, onStatusChange, onVoteSuccess }: Props) {
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null)

  const { proposalIds, reload } = useProposals(isVoter || isOwner)
  const { totalVotes } = useVoteCounts()
  const { writeContract, isPending: isVoting } = useContractWrite(() => {
    reload()
    setSelectedProposalId(null)
    onVoteSuccess()   // ← rafraîchit voterData pour afficher immédiatement "déjà voté"
  })
  const { endVoting, tallyVotes, isPending: isTransitioning } = useWorkflowTransitions(() => {
    onStatusChange()
  })

  const canVote = status === WorkflowStatus.VotingSessionStarted
  const hasVoted = voterData?.hasVoted ?? false
  const alreadyVotedFor = voterData?.votedProposalId

  const handleVote = () => {
    if (selectedProposalId === null) return
    writeContract({
      abi: VOTING_ABI,
      address: VOTING_CONTRACT_ADDRESS,
      functionName: 'setVote',
      args: [selectedProposalId],
    })
  }

  return (
    <div className="space-y-6">
      {/* Vote already cast */}
      {hasVoted && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Vous avez voté pour la proposition n°{alreadyVotedFor}. Merci pour votre participation !
          </AlertDescription>
        </Alert>
      )}

      {/* Voting interface */}
      {isVoter && canVote && !hasVoted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Vote className="size-4" />
              Choisissez votre proposition
            </CardTitle>
            <CardDescription>
              Sélectionnez une proposition puis confirmez votre vote. Ce choix est définitif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposalIds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucune proposition disponible
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {proposalIds.map(id => (
                    <VoteOption
                      key={id}
                      id={id}
                      isSelected={selectedProposalId === id}
                      hasVoted={hasVoted}
                      onVote={setSelectedProposalId}
                      isSubmitting={isVoting}
                    />
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={handleVote}
                  disabled={selectedProposalId === null || isVoting}
                >
                  {isVoting
                    ? 'Envoi du vote…'
                    : selectedProposalId !== null
                      ? `Voter pour la proposition n°${selectedProposalId}`
                      : 'Sélectionnez une proposition'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vote count for owner who is not a voter — no proposal details exposed */}
      {isOwner && !isVoter && (canVote || status === WorkflowStatus.VotingSessionEnded) && (
        <Alert>
          <AlertDescription className="text-sm">
            {totalVotes} vote{totalVotes > 1 ? 's' : ''} exprimé{totalVotes > 1 ? 's' : ''} au total.
          </AlertDescription>
        </Alert>
      )}

      {/* Proposal overview for voters who have voted or when voting is not active */}
      {isVoter && (hasVoted || !canVote) && proposalIds.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                Propositions en lice
                <Badge variant="secondary">{proposalIds.length}</Badge>
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {totalVotes} vote{totalVotes > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {proposalIds.map(id => (
                <li key={id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {id}
                  </span>
                  <ProposalLabel id={id} />
                  {hasVoted && alreadyVotedFor === id && (
                    <Badge className="shrink-0 bg-green-500 text-white">Votre vote</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Admin workflow actions */}
      {isOwner && (
        <>
          <Separator />
          {status === WorkflowStatus.VotingSessionStarted && (
            <Alert>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  Clôturez la session de vote quand tous les électeurs ont voté.
                </span>
                <Button
                  onClick={endVoting}
                  disabled={isTransitioning}
                  variant="outline"
                  className="shrink-0"
                >
                  {isTransitioning ? 'Confirmation…' : 'Clôturer le vote'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {status === WorkflowStatus.VotingSessionEnded && (
            <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  Le vote est terminé. Comptabilisez les votes pour publier les résultats.
                </span>
                <Button
                  onClick={tallyVotes}
                  disabled={isTransitioning}
                  className="shrink-0"
                >
                  {isTransitioning ? 'Confirmation…' : 'Comptabiliser les votes →'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {!canVote && status !== undefined && status < WorkflowStatus.VotingSessionStarted && (
        <Alert>
          <AlertDescription className="text-sm">
            La session de vote n'est pas encore ouverte.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Small inline label component to avoid Rules of Hooks violation in loops
function ProposalLabel({ id }: { id: number }) {
  const { proposal } = useProposal(id, true)
  return <span className="flex-1 truncate">{proposal?.description ?? '…'}</span>
}
