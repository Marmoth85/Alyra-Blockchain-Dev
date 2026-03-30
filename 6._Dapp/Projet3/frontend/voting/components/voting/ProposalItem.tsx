'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy } from 'lucide-react'
import { useProposal } from '@/hooks/useVoting'

type Props = {
  id: number
  isWinner?: boolean
  showVoteCount?: boolean
}

export function ProposalItem({ id, isWinner, showVoteCount }: Props) {
  const { proposal, isLoading } = useProposal(id, true)

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 flex-1" />
      </div>
    )
  }

  if (!proposal) return null

  return (
    <li className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${isWinner ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : 'border-border bg-card'}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        {id}
      </span>
      <span className="flex-1 text-sm">{proposal.description}</span>
      {showVoteCount && (
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {Number(proposal.voteCount)} vote{Number(proposal.voteCount) > 1 ? 's' : ''}
        </Badge>
      )}
      {isWinner && (
        <Trophy className="size-4 shrink-0 text-yellow-500" />
      )}
    </li>
  )
}
