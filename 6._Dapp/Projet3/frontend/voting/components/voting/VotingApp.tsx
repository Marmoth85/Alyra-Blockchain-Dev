'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { WorkflowStatus } from '@/contracts/voting'
import { useRole, useWorkflowStatus } from '@/hooks/useVoting'
import { WorkflowProgress } from './WorkflowProgress'
import { VotersPanel } from './VotersPanel'
import { ProposalsPanel } from './ProposalsPanel'
import { VotingPanel } from './VotingPanel'
import { ResultsPanel } from './ResultsPanel'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

type Tab = 'voters' | 'proposals' | 'votes' | 'results'

const TAB_LABELS: Record<Tab, string> = {
  voters: 'Votants',
  proposals: 'Propositions',
  votes: 'Votes',
  results: 'Résultats',
}

export function VotingApp() {
  const [activeTab, setActiveTab] = useState<Tab>('results')

  const { address, isConnected, isOwner, isVoter, voterData, refetchVoterData } = useRole()
  const { status, refetch: refetchStatus } = useWorkflowStatus()

  // Determine which tabs are visible based on role
  const visibleTabs: Tab[] = (() => {
    if (isOwner) return ['voters', 'proposals', 'votes', 'results']
    if (isVoter) return ['proposals', 'votes', 'results']
    return ['results']
  })()

  // Switch to results tab if current tab becomes invisible
  const safeTab = visibleTabs.includes(activeTab) ? activeTab : 'results'

  const handleTabChange = (tab: Tab) => {
    if (visibleTabs.includes(tab)) setActiveTab(tab)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Workflow progress bar */}
      <WorkflowProgress status={status} />

      {/* Main content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Role badge */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Système de Vote</h1>
          {isConnected && (
            <Badge
              variant={isOwner ? 'default' : isVoter ? 'secondary' : 'outline'}
              className={cn(
                isOwner && 'bg-purple-600 text-white',
                isVoter && !isOwner && 'bg-blue-100 text-blue-700 border-blue-200',
              )}
            >
              {isOwner ? 'Administrateur' : isVoter ? 'Électeur enregistré' : 'Visiteur'}
            </Badge>
          )}
        </div>

        {/* Not connected notice */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              Connectez votre portefeuille pour participer. Les résultats sont visibles par tous.
            </AlertDescription>
          </Alert>
        )}

        {/* Tab navigation */}
        <nav className="flex gap-1 border-b border-border" aria-label="Sections">
          {visibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                safeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {TAB_LABELS[tab]}
              {/* Highlight dot for active workflow phase */}
              {tab === 'voters' && status === WorkflowStatus.RegisteringVoters && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-green-500 align-middle" />
              )}
              {tab === 'proposals' &&
                (status === WorkflowStatus.ProposalsRegistrationStarted ||
                  status === WorkflowStatus.ProposalsRegistrationEnded) && (
                  <span className="ml-1.5 inline-block size-1.5 rounded-full bg-green-500 align-middle" />
                )}
              {tab === 'votes' &&
                (status === WorkflowStatus.VotingSessionStarted ||
                  status === WorkflowStatus.VotingSessionEnded) && (
                  <span className="ml-1.5 inline-block size-1.5 rounded-full bg-green-500 align-middle" />
                )}
              {tab === 'results' && status === WorkflowStatus.VotesTallied && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-yellow-400 align-middle" />
              )}
            </button>
          ))}
        </nav>

        {/* Panel content */}
        <div>
          {safeTab === 'voters' && (
            <VotersPanel
              status={status}
              isOwner={isOwner}
              onStatusChange={refetchStatus}
            />
          )}
          {safeTab === 'proposals' && (
            <ProposalsPanel
              status={status}
              isOwner={isOwner}
              isVoter={isVoter}
              onStatusChange={refetchStatus}
            />
          )}
          {safeTab === 'votes' && (
            <VotingPanel
              status={status}
              isOwner={isOwner}
              isVoter={isVoter}
              voterData={voterData}
              onStatusChange={refetchStatus}
              onVoteSuccess={refetchVoterData}
            />
          )}
          {safeTab === 'results' && (
            <ResultsPanel
              status={status}
              isVoter={isVoter}
              isOwner={isOwner}
            />
          )}
        </div>
      </div>
    </div>
  )
}
