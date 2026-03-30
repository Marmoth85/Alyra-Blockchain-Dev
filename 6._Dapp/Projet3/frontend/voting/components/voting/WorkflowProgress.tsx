'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowStatus, WORKFLOW_LABELS } from '@/contracts/voting'

const STEPS = [
  WorkflowStatus.RegisteringVoters,
  WorkflowStatus.ProposalsRegistrationStarted,
  WorkflowStatus.ProposalsRegistrationEnded,
  WorkflowStatus.VotingSessionStarted,
  WorkflowStatus.VotingSessionEnded,
  WorkflowStatus.VotesTallied,
]

type Props = {
  status: WorkflowStatus | undefined
}

export function WorkflowProgress({ status }: Props) {
  const currentStep = status ?? -1

  return (
    <div className="w-full px-4 py-6 bg-card border-b border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Avancement du vote
        </p>

        {/* Step track */}
        <div className="relative flex items-start">
          {/* Background line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" aria-hidden />

          {/* Progress fill */}
          <div
            className="absolute top-4 left-0 h-0.5 bg-amber-500 transition-all duration-500"
            style={{
              width: currentStep >= 0
                ? `${(currentStep / (STEPS.length - 1)) * 100}%`
                : '0%',
            }}
            aria-hidden
          />

          {STEPS.map((step, index) => {
            const isDone = index < currentStep
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div key={step} className="relative flex flex-1 flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    'relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300',
                    isDone && 'border-amber-500 bg-amber-500 text-black',
                    isCurrent && 'border-amber-400 bg-card text-amber-400 shadow-lg shadow-amber-900/30 ring-4 ring-amber-500/20',
                    isUpcoming && 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-center text-[10px] leading-tight max-w-[80px]',
                    isDone && 'text-amber-500 font-medium',
                    isCurrent && 'text-amber-400 font-semibold',
                    isUpcoming && 'text-muted-foreground',
                  )}
                >
                  {WORKFLOW_LABELS[step]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
