'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWatchContractEvent } from 'wagmi'
import { useState, useEffect, useCallback, useRef } from 'react'
import { parseAbiItem } from 'viem'
import { toast } from 'sonner'
import { VOTING_ABI, VOTING_CONTRACT_ADDRESS, WorkflowStatus, type VoterData, type ProposalData } from '@/contracts/voting'

const DEPLOYMENT_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK ?? '0')

// ── Contrat error messages → messages lisibles ────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  // ── Contrat : enregistrement ──────────────────────────────────────────────
  "Already registered": "Cette adresse est déjà inscrite comme électeur.",
  "Voters registration is not open yet": "L'enregistrement des votants n'est pas ouvert.",
  // ── Contrat : propositions ────────────────────────────────────────────────
  "Proposals are not allowed yet": "La session de propositions n'est pas encore ouverte.",
  "Vous ne pouvez pas ne rien proposer": "La description de la proposition ne peut pas être vide.",
  "Max proposals reached": "Le nombre maximum de propositions (100) est atteint.",
  // ── Contrat : vote ────────────────────────────────────────────────────────
  "You have already voted": "Vous avez déjà voté pour cette session.",
  "Proposal not found": "Proposition introuvable.",
  "Voting session havent started yet": "La session de vote n'a pas encore démarré.",
  // ── Contrat : accès ───────────────────────────────────────────────────────
  "You're not a voter": "Vous n'êtes pas inscrit comme électeur.",
  // ── Contrat : transitions workflow ────────────────────────────────────────
  "Registering proposals cant be started now": "Impossible d'ouvrir les propositions dans la phase actuelle.",
  "Registering proposals havent started yet": "La session de propositions n'a pas encore démarré.",
  "Registering proposals phase is not finished": "La phase de propositions n'est pas encore terminée.",
  "Current status is not voting session ended": "Le vote n'est pas encore terminé.",
  // ── OpenZeppelin Ownable (custom errors OZ v5) ────────────────────────────
  "OwnableUnauthorizedAccount": "Vous n'êtes pas autorisé à effectuer cette action (owner requis).",
  "OwnableInvalidOwner": "Adresse owner invalide.",
  // ── Wallet / réseau ───────────────────────────────────────────────────────
  "User rejected": "Transaction annulée par l'utilisateur.",
  "user rejected": "Transaction annulée par l'utilisateur.",
  "insufficient funds": "Fonds insuffisants pour payer les frais de transaction.",
  "network changed": "Le réseau a changé, veuillez réessayer.",
  "could not be found": "Contrat introuvable sur ce réseau. Vérifiez que vous êtes sur le bon réseau.",
}

function humanizeContractError(error: unknown): string {
  // Collect all searchable strings across the full cause chain
  const candidates: string[] = []
  let current: unknown = error
  while (current && typeof current === 'object') {
    const e = current as { shortMessage?: string; message?: string; name?: string; errorName?: string; reason?: string; cause?: unknown }
    if (e.shortMessage) candidates.push(e.shortMessage)
    if (e.message)      candidates.push(e.message)
    if (e.name)         candidates.push(e.name)
    if (e.errorName)    candidates.push(e.errorName)
    if (e.reason)       candidates.push(e.reason)
    current = e.cause
  }

  // Return the first known label found anywhere in the chain
  for (const candidate of candidates) {
    for (const [key, label] of Object.entries(ERROR_MESSAGES)) {
      if (candidate.includes(key)) return label
    }
  }

  // Fallback: top-level shortMessage is the most readable
  const top = error as { shortMessage?: string; message?: string }
  return `Erreur : ${top?.shortMessage ?? top?.message ?? String(error)}`
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
  const { data: owner, isSuccess: isOwnerResolved } = useReadContract({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    functionName: 'owner',
  })
  return { owner: owner as `0x${string}` | undefined, isOwnerResolved }
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
  const { owner, isOwnerResolved } = useContractOwner()

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
  const isRoleResolved = !isConnected || (isOwnerResolved && (isOwner || voterQuerySuccess))

  return { address, isConnected, isOwner, isVoter, isRoleResolved, voterData: voterData as VoterData | undefined, refetchVoterData }
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
        fromBlock: DEPLOYMENT_BLOCK,
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

// ── Vote counts per proposal (via Voted events — public, no voter restriction) ──

export function useVoteCounts() {
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({})
  const publicClient = usePublicClient()

  const loadVotes = useCallback(async () => {
    if (!publicClient) return
    try {
      const logs = await publicClient.getLogs({
        address: VOTING_CONTRACT_ADDRESS,
        event: parseAbiItem('event Voted(address indexed voter, uint256 proposalId)'),
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: 'latest',
      })
      const counts: Record<number, number> = {}
      for (const log of logs) {
        const id = Number((log as { args: { proposalId: bigint } }).args.proposalId)
        counts[id] = (counts[id] ?? 0) + 1
      }
      setVoteCounts(counts)
    } catch {
      // contract not deployed or no votes yet
    }
  }, [publicClient])

  useEffect(() => {
    loadVotes()
  }, [loadVotes])

  // On new vote event, reload everything from the chain to avoid double-counting
  // (useWatchContractEvent can replay recent events that getLogs already counted)
  useWatchContractEvent({
    abi: VOTING_ABI,
    address: VOTING_CONTRACT_ADDRESS,
    eventName: 'Voted',
    onLogs() {
      loadVotes()
    },
  })

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0)

  return { voteCounts, totalVotes, reload: loadVotes }
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
        fromBlock: DEPLOYMENT_BLOCK,
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
  const { writeContract: rawWrite, data: txHash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const publicClient = usePublicClient()
  const { address } = useAccount()

  // Keep a stable ref to onSuccess so it never triggers the effect by itself
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess })

  // Track the last hash we already toasted to avoid firing multiple times
  const toastedHash = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (isConfirmed && txHash && txHash !== toastedHash.current) {
      toastedHash.current = txHash
      const id = setTimeout(() => {
        toast.success('Transaction confirmée !')
        onSuccessRef.current?.()
      }, 1500)
      return () => clearTimeout(id)
    }
  }, [isConfirmed, txHash])

  useEffect(() => {
    if (writeError) {
      const msg = humanizeContractError(writeError)
      toast.error(msg)
    }
  }, [writeError])

  // Simulate first to get the proper Solidity revert reason, then write
  const writeContract = useCallback(async (params: Parameters<typeof rawWrite>[0]) => {
    if (!publicClient) { rawWrite(params); return }
    try {
      await publicClient.simulateContract({ ...params, account: address } as Parameters<typeof publicClient.simulateContract>[0])
    } catch (err) {
      toast.error(humanizeContractError(err))
      return
    }
    rawWrite(params)
  }, [publicClient, address, rawWrite])

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
