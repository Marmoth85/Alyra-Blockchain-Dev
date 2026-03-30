'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { isAddress } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { WorkflowStatus } from '@/contracts/voting'
import { VOTING_ABI, VOTING_CONTRACT_ADDRESS } from '@/contracts/voting'
import { useVotersList, useContractWrite, useWorkflowTransitions } from '@/hooks/useVoting'

type Props = {
  status: WorkflowStatus | undefined
  isOwner: boolean
  onStatusChange: () => void
}

export function VotersPanel({ status, isOwner, onStatusChange }: Props) {
  const [newVoterAddress, setNewVoterAddress] = useState('')
  const [addressError, setAddressError] = useState('')

  const { voters, reload } = useVotersList()
  const { writeContract, isPending: isAddingVoter } = useContractWrite(() => {
    setNewVoterAddress('')
    reload()
  })
  const { startProposals, isPending: isTransitioning } = useWorkflowTransitions(() => {
    onStatusChange()
  })

  const canRegister = status === WorkflowStatus.RegisteringVoters

  const handleAddVoter = () => {
    if (!isAddress(newVoterAddress)) {
      setAddressError('Adresse Ethereum invalide')
      return
    }
    setAddressError('')
    writeContract({
      abi: VOTING_ABI,
      address: VOTING_CONTRACT_ADDRESS,
      functionName: 'addVoter',
      args: [newVoterAddress as `0x${string}`],
    })
  }

  useEffect(() => {
    if (newVoterAddress && !isAddress(newVoterAddress)) {
      setAddressError('Adresse Ethereum invalide')
    } else {
      setAddressError('')
    }
  }, [newVoterAddress])

  return (
    <div className="space-y-6">
      {/* Add voter form */}
      {isOwner && canRegister && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4" />
              Enregistrer un votant
            </CardTitle>
            <CardDescription>
              Ajoutez des adresses Ethereum à la liste blanche des électeurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="voter-address">Adresse Ethereum</Label>
              <div className="flex gap-2">
                <Input
                  id="voter-address"
                  placeholder="0x..."
                  value={newVoterAddress}
                  onChange={e => setNewVoterAddress(e.target.value)}
                  aria-invalid={!!addressError}
                  onKeyDown={e => e.key === 'Enter' && handleAddVoter()}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleAddVoter}
                  disabled={!newVoterAddress || !!addressError || isAddingVoter}
                >
                  {isAddingVoter ? 'Envoi…' : 'Ajouter'}
                </Button>
              </div>
              {addressError && (
                <p className="text-xs text-destructive">{addressError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voter list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Liste des électeurs
            </CardTitle>
            <Badge variant="secondary">{voters.length} votant{voters.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {voters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun votant enregistré pour l'instant
            </p>
          ) : (
            <ul className="space-y-2">
              {voters.map((addr, i) => (
                <li key={addr} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono break-all">
                    {addr}
                  </code>
                  <Badge variant="outline" className="text-green-600 border-green-200 shrink-0">
                    Inscrit
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Admin workflow action */}
      {isOwner && canRegister && (
        <>
          <Separator />
          <Alert>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span className="text-sm">
                Une fois les électeurs enregistrés, ouvrez la session de propositions.
              </span>
              <Button
                onClick={startProposals}
                disabled={isTransitioning || voters.length === 0}
                className="shrink-0"
              >
                {isTransitioning ? 'Confirmation…' : 'Ouvrir les propositions →'}
              </Button>
            </AlertDescription>
          </Alert>
        </>
      )}

      {!canRegister && (
        <Alert>
          <AlertDescription className="text-sm">
            La phase d'enregistrement des votants est{' '}
            {(status ?? 0) > WorkflowStatus.RegisteringVoters ? 'terminée' : 'pas encore commencée'}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
