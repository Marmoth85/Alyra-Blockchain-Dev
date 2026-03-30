'use client'

import { Trophy, HelpCircle, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkflowStatus, WORKFLOW_LABELS } from '@/contracts/voting'
import { useWinningProposalID, useProposal, useProposals, useVoteCounts } from '@/hooks/useVoting'
import { ProposalItem } from './ProposalItem'

type Props = {
  status: WorkflowStatus | undefined
  isVoter: boolean
  isOwner: boolean
}

type WinnerCardProps = {
  winningId: number
  isVoter: boolean
  isOwner: boolean
  winningVoteCount: number
}

function WinnerCard({ winningId, isVoter, isOwner, winningVoteCount }: WinnerCardProps) {
  const canReadDetails = isVoter || isOwner
  const { proposal, isLoading } = useProposal(winningId, canReadDetails)
  const displayVoteCount = proposal ? Number(proposal.voteCount) : winningVoteCount

  return (
    <Card className="border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-500" />
          <CardTitle className="text-lg">Résultat du vote</CardTitle>
        </div>
        <CardDescription>La proposition gagnante est :</CardDescription>
      </CardHeader>
      <CardContent>
        {canReadDetails && isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-yellow-400/30 text-sm font-bold text-yellow-700">
                {winningId}
              </span>
              {proposal ? (
                <p className="text-xl font-semibold text-foreground">{proposal.description}</p>
              ) : (
                <p className="text-lg font-semibold text-foreground">Proposition n°{winningId}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {displayVoteCount} vote{displayVoteCount > 1 ? 's' : ''} reçu{displayVoteCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AllProposalsResults({ proposalIds, winningId }: { proposalIds: number[]; winningId: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4" />
          Toutes les propositions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {proposalIds.map(id => (
            <ProposalItem
              key={id}
              id={id}
              isWinner={id === winningId}
              showVoteCount
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function NotYetPanel({ status }: { status: WorkflowStatus | undefined }) {
  const statusLabel = status !== undefined ? WORKFLOW_LABELS[status] : 'Inconnu'

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HelpCircle className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Résultats non disponibles</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Le vote n'a pas encore été comptabilisé. Revenez une fois que l'administrateur
            aura clôturé et comptabilisé le scrutin.
          </p>
        </div>
        {status !== undefined && (
          <Badge variant="outline" className="text-xs">
            Phase actuelle : {statusLabel}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

export function ResultsPanel({ status, isVoter, isOwner }: Props) {
  const { winningProposalID } = useWinningProposalID()
  const { proposalIds } = useProposals(isVoter || isOwner)
  const { voteCounts } = useVoteCounts()

  const isTallied = status === WorkflowStatus.VotesTallied

  if (!isTallied) {
    return <NotYetPanel status={status} />
  }

  const winningVoteCount = winningProposalID !== undefined ? (voteCounts[winningProposalID] ?? 0) : 0

  return (
    <div className="space-y-6">
      {winningProposalID !== undefined && (
        <WinnerCard
          winningId={winningProposalID}
          isVoter={isVoter}
          isOwner={isOwner}
          winningVoteCount={winningVoteCount}
        />
      )}

      {(isVoter || isOwner) && proposalIds.length > 0 && winningProposalID !== undefined && (
        <AllProposalsResults proposalIds={proposalIds} winningId={winningProposalID} />
      )}

      {!isVoter && !isOwner && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec un compte électeur pour voir le détail des propositions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
