'use client'

import { useState } from 'react'
import { PlusCircle, ListChecks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { WorkflowStatus } from '@/contracts/voting'
import { VOTING_ABI, VOTING_CONTRACT_ADDRESS } from '@/contracts/voting'
import { useProposals, useContractWrite, useWorkflowTransitions } from '@/hooks/useVoting'
import { ProposalItem } from './ProposalItem'

type Props = {
  status: WorkflowStatus | undefined
  isOwner: boolean
  isVoter: boolean
  onStatusChange: () => void
}

export function ProposalsPanel({ status, isOwner, isVoter, onStatusChange }: Props) {
  const [description, setDescription] = useState('')

  const { proposalIds, reload } = useProposals(isVoter || isOwner)
  const { writeContract, isPending: isSubmitting } = useContractWrite(() => {
    setDescription('')
    reload()
  })
  const { endProposals, startVoting, isPending: isTransitioning } = useWorkflowTransitions(() => {
    onStatusChange()
  })

  const canSubmit = status === WorkflowStatus.ProposalsRegistrationStarted

  const handleAddProposal = () => {
    if (!description.trim()) return
    writeContract({
      abi: VOTING_ABI,
      address: VOTING_CONTRACT_ADDRESS,
      functionName: 'addProposal',
      args: [description.trim()],
    })
  }

  return (
    <div className="space-y-6">
      {/* Submit proposal (voters only, during open phase) */}
      {isVoter && canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlusCircle className="size-4" />
              Soumettre une proposition
            </CardTitle>
            <CardDescription>
              Décrivez votre proposition en quelques mots
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="proposal-desc">Description</Label>
              <div className="flex gap-2">
                <Input
                  id="proposal-desc"
                  placeholder="Ma proposition…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddProposal()}
                  maxLength={200}
                />
                <Button
                  onClick={handleAddProposal}
                  disabled={!description.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Envoi…' : 'Soumettre'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/200
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposals list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4" />
              Propositions soumises
            </CardTitle>
            <Badge variant="secondary">
              {proposalIds.length} proposition{proposalIds.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {proposalIds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune proposition enregistrée pour l'instant
            </p>
          ) : (
            <ul className="space-y-2">
              {proposalIds.map(id => (
                <ProposalItem key={id} id={id} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Admin workflow actions */}
      {isOwner && (
        <>
          <Separator />
          {status === WorkflowStatus.ProposalsRegistrationStarted && (
            <Alert>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  Clôturez la session de propositions quand vous êtes prêt.
                </span>
                <Button
                  onClick={endProposals}
                  disabled={isTransitioning}
                  variant="outline"
                  className="shrink-0"
                >
                  {isTransitioning ? 'Confirmation…' : 'Clôturer les propositions'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {status === WorkflowStatus.ProposalsRegistrationEnded && (
            <Alert>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  Les propositions sont fermées. Lancez la session de vote.
                </span>
                <Button
                  onClick={startVoting}
                  disabled={isTransitioning || proposalIds.length === 0}
                  className="shrink-0"
                >
                  {isTransitioning ? 'Confirmation…' : 'Ouvrir le vote →'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {!canSubmit && status === WorkflowStatus.RegisteringVoters && (
        <Alert>
          <AlertDescription className="text-sm">
            La session de propositions n'est pas encore ouverte.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
