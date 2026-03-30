// Contract address — set NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS in .env.local
export const VOTING_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3'
) as `0x${string}`

export const VOTING_ABI = [
  // ── State variables (public getters) ──────────────────────────────────────
  {
    inputs: [],
    name: 'winningProposalID',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'workflowStatus',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ── Getters (onlyVoters) ──────────────────────────────────────────────────
  {
    inputs: [{ internalType: 'address', name: '_addr', type: 'address' }],
    name: 'getVoter',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'isRegistered', type: 'bool' },
          { internalType: 'bool', name: 'hasVoted', type: 'bool' },
          { internalType: 'uint8', name: 'votedProposalId', type: 'uint8' },
        ],
        internalType: 'struct Voting.Voter',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'getOneProposal',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'uint256', name: 'voteCount', type: 'uint256' },
        ],
        internalType: 'struct Voting.Proposal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // ── Write functions ───────────────────────────────────────────────────────
  {
    inputs: [{ internalType: 'address', name: '_addr', type: 'address' }],
    name: 'addVoter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_desc', type: 'string' }],
    name: 'addProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint8', name: '_id', type: 'uint8' }],
    name: 'setVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'startProposalsRegistering',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'endProposalsRegistering',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'startVotingSession',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'endVotingSession',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tallyVotes',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voterAddress',
        type: 'address',
      },
    ],
    name: 'VoterRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'previousStatus',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'newStatus',
        type: 'uint8',
      },
    ],
    name: 'WorkflowStatusChange',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'ProposalRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'Voted',
    type: 'event',
  },
] as const

// ── TypeScript mirrors of on-chain types ──────────────────────────────────
export enum WorkflowStatus {
  RegisteringVoters = 0,
  ProposalsRegistrationStarted = 1,
  ProposalsRegistrationEnded = 2,
  VotingSessionStarted = 3,
  VotingSessionEnded = 4,
  VotesTallied = 5,
}

export const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.RegisteringVoters]: 'Enregistrement des votants',
  [WorkflowStatus.ProposalsRegistrationStarted]: 'Propositions ouvertes',
  [WorkflowStatus.ProposalsRegistrationEnded]: 'Propositions fermées',
  [WorkflowStatus.VotingSessionStarted]: 'Vote en cours',
  [WorkflowStatus.VotingSessionEnded]: 'Vote terminé',
  [WorkflowStatus.VotesTallied]: 'Résultats disponibles',
}

export type VoterData = {
  isRegistered: boolean
  hasVoted: boolean
  votedProposalId: number
}

export type ProposalData = {
  description: string
  voteCount: bigint
}
