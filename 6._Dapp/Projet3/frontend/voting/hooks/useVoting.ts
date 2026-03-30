'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWatchContractEvent } from 'wagmi'
import { useState, useEffect, useCallback, useRef } from 'react'
import { parseAbiItem } from 'viem'
import { toast } from 'sonner'
import { VOTING_ABI, VOTING_CONTRACT_ADDRESS, WorkflowStatus, type VoterData, type ProposalData } from '@/contracts/voting'

// ── Contrat error messages → messages lisibles ────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  "You have already voted": "Vous avez déjà voté pour cette session.",
  "You're not a voter": "Vous n'êtes pas inscrit comme électeur.",
  "Already registered": "Cette adresse est déjà inscrite.",
  "Voters registration is not open yet": "L'enregistrement des votants n'est pas ouvert.",
  "Proposals are not allowed yet": "La session de propositions n'est pas encore ouverte.",
  "Vous ne pouvez pas ne rien proposer": "La description de la proposition ne peut pas être vide.",
  "Max proposals reached": "Le nombre maximum de propositions (100) est atteint.",
  "Proposal not found": "Proposition introuvable.",
  "Voting session havent started yet": "La session de vote n'a pas encore démarré.",
  "Registering proposals cant be started now": "Impossible d'ouvrir les propositions dans la phase actuelle.",
  "Registering proposals havent started yet": "La session de propositions n'a pas encore démarré.",
  "Registering proposals phase is not finished": "La phase de propositions n'est pas encore terminée.",
  "Current status is not voting session ended": "Le vote n'est pas encore terminé.",
}

function humanizeContractError(raw: string): string {
  for (const [key, label] of Object.entries(ERROR_MESSAGES)) {
    if (raw.includes(key)) return label
  }
  return `Erreur : ${raw}`
}

// ── Core contract state ───────────────────────────────────────────────────

export function useWorkflowStatus() {
  const { data, refetch } = useReadContract({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    functionName: 'workflowStatus',
  })
  const status = data !== undefined ? (Number(data) as WorkflowStatus) : undefined
  return { status, refetch }
}

export function useContractOwner() {
  const { data: owner } = useReadContract({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    functionName: 'owner',
  })
  return owner as `0x${string}` | undefined
}

export function useWinningProposalID() {
  const { data, refetch } = useReadContract({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    functionName: 'winningProposalID',
  })
  return { winningProposalID: data !== undefined ? Number(data) : undefined, refetch }
}

// ── Role detection ────────────────────────────────────────────────────────

export function useRole() {
  const { address, isConnected } = useAccount()
  const owner = useContractOwner()

  const isOwner = !!(isConnected && address && owner && address.toLowerCase() === owner.toLowerCase())

  const { data: voterData, isSuccess: voterQuerySuccess, refetch: refetchVoterData } = useReadContract({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    functionName: 'getVoter',
    args: [address!],
    account: address,          // ← force msg.sender = adresse connectée pour passer onlyVoters
    query: { enabled: !!address },
  })

  const isVoter = voterQuerySuccess && !!(voterData as VoterData | undefined)?.isRegistered

  return { address, isConnected, isOwner, isVoter, voterData: voterData as VoterData | undefined, refetchVoterData }
}

// ── Single proposal fetcher (used in list rendering) ─────────────────────

export function useProposal(id: number, enabled: boolean) {
  const { address } = useAccount()
  const { data, isLoading } = useReadContract({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    functionName: 'getOneProposal',
    args: [BigInt(id)],
    account: address,          // ← force msg.sender pour passer onlyVoters
    query: { enabled },
  })
  return { proposal: data as ProposalData | undefined, isLoading }
}

// ── Proposals list (via events) ───────────────────────────────────────────

export function useProposals(isVoter: boolean) {
  const [proposalIds, setProposalIds] = useState<number[]>([])
  const publicClient = usePublicClient()

  const loadHistoricalProposals = useCallback(async () => {
    if (!publicClient) return
    try {
      const logs = await publicClient.getLogs({
        address: VOTING_CONTRACT_ADDRESS,
        event: parseAbiItem('event ProposalRegistered(uint256 proposalId)'),
        fromBlock: 0n,
        toBlock: 'latest',
      })
      const ids = logs.map(log => Number((log as { args: { proposalId: bigint } }).args.proposalId))
      setProposalIds([...new Set(ids)].sort((a, b) => a - b))
    } catch {
      // contract not deployed or no proposals yet
    }
  }, [publicClient])

  useEffect(() => {
    if (isVoter) loadHistoricalProposals()
  }, [isVoter, loadHistoricalProposals])

  useWatchContractEvent({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    eventName: 'ProposalRegistered',
    enabled: isVoter,
    onLogs(logs) {
      const newIds = logs.map(log => Number((log as { args: { proposalId: bigint } }).args.proposalId))
      setProposalIds(prev => [...new Set([...prev, ...newIds])].sort((a, b) => a - b))
    },
  })

  return { proposalIds, reload: loadHistoricalProposals }
}

// ── Voters list (via events) ──────────────────────────────────────────────

export function useVotersList() {
  const [voters, setVoters] = useState<string[]>([])
  const publicClient = usePublicClient()

  const loadHistoricalVoters = useCallback(async () => {
    if (!publicClient) return
    try {
      const logs = await publicClient.getLogs({
        address: VOTING_CONTRACT_ADDRESS,
        event: parseAbiItem('event VoterRegistered(address indexed voterAddress)'),
        fromBlock: 0n,
        toBlock: 'latest',
      })
      const addresses = logs.map(log => String((log as { args: { voterAddress: string } }).args.voterAddress))
      setVoters([...new Set(addresses)])
    } catch {
      // contract not deployed yet
    }
  }, [publicClient])

  useEffect(() => {
    loadHistoricalVoters()
  }, [loadHistoricalVoters])

  useWatchContractEvent({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    eventName: 'VoterRegistered',
    onLogs(logs) {
      const newAddresses = logs.map(log => String((log as { args: { voterAddress: string } }).args.voterAddress))
      setVoters(prev => [...new Set([...prev, ...newAddresses])])
    },
  })

  return { voters, reload: loadHistoricalVoters }
}

// ── Generic write hook with toast feedback ────────────────────────────────

export function useContractWrite(onSuccess?: () => void) {
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // Keep a stable ref to onSuccess so it never triggers the effect by itself
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess })

  // Track the last hash we already toasted to avoid firing multiple times
  const toastedHash = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (isConfirmed && txHash && txHash !== toastedHash.current) {
      toastedHash.current = txHash
      // Small delay so the user sees the UI settle before the toast appears
      const id = setTimeout(() => {
        toast.success('Transaction confirmée !')
        onSuccessRef.current?.()
      }, 1500)
      return () => clearTimeout(id)
    }
  }, [isConfirmed, txHash])

  const toastedError = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (writeError) {
      const raw = (writeError as { shortMessage?: string })?.shortMessage ?? writeError.message
      const msg = humanizeContractError(raw)
      if (msg !== toastedError.current) {
        toastedError.current = msg
        toast.error(msg)
      }
    } else {
      // Reset when error clears so a future identical error toasts again
      toastedError.current = undefined
    }
  }, [writeError])

  return {
    writeContract,
    isPending: isPending || isConfirming,
    isConfirmed,
  }
}

// ── Workflow transitions ──────────────────────────────────────────────────

export function useWorkflowTransitions(onSuccess: () => void) {
  const { writeContract, isPending } = useContractWrite(onSuccess)

  const startProposals = () =>
    writeContract({ abi: VOTING_ABI, address: VOTING_CONTRACT_ADDRESS, functionName: 'startProposalsRegistering' })

  const endProposals = () =>
    writeContract({ abi: VOTING_ABI, address: VOTING_CONTRACT_ADDRESS, functionName: 'endProposalsRegistering' })

  const startVoting = () =>
    writeContract({ abi: VOTING_ABI, address: VOTING_CONTRACT_ADDRESS, functionName: 'startVotingSession' })

  const endVoting = () =>
    writeContract({ abi: VOTING_ABI, address: VOTING_CONTRACT_ADDRESS, functionName: 'endVotingSession' })

  const tallyVotes = () =>
    writeContract({ abi: VOTING_ABI, address: VOTING_CONTRACT_ADDRESS, functionName: 'tallyVotes' })

  return { startProposals, endProposals, startVoting, endVoting, tallyVotes, isPending }
}
