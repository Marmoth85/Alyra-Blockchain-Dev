# Project 3 — Frontend

A Next.js decentralised voting application built with wagmi, viem, and Reown AppKit. It interacts with the `Voting.sol` smart contract deployed on a local Hardhat node or on Sepolia.

## Stack

- **Next.js 16** — React framework
- **wagmi + viem** — Ethereum interactions
- **Reown AppKit** (ex-WalletConnect) — wallet connection UI
- **shadcn/ui** — component library (Radix UI primitives)
- **Tailwind CSS** — styling
- **Sonner** — toast notifications

## Prerequisites

- Node.js ≥ 18
- npm
- MetaMask (or any EIP-1193 compatible wallet)
- A [Reown](https://dashboard.reown.com) project ID

## Installation

```shell
cd frontend/voting
npm install
```

Install the shadcn/ui components used by the app:

```shell
npx shadcn@latest add alert badge button card input label separator skeleton sonner
```

> **SSL issues behind a corporate proxy?** Disable strict SSL around `npm install`, then re-enable it:
> ```shell
> npm config set strict-ssl false
> npm install
> npm config set strict-ssl true
> ```
> For `npx` commands, prefix with `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Environment variables

Create a `.env.local` file in `frontend/voting/`:

```env
# Reown / WalletConnect project ID (required — get one at https://dashboard.reown.com)
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id

# Contract address — use the address matching the network you intend to target
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# First block to scan for past events (0 for local Hardhat, deployment block number for Sepolia)
NEXT_PUBLIC_DEPLOYMENT_BLOCK=0
```

Known contract addresses:
- **Hardhat local:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Sepolia:** `0xc5848F895C9b6c47aBF3BdD24C30b50F9be283F5`

## Running locally against Hardhat

1. Start the local Hardhat node (from the `backend/` directory):

```shell
npx hardhat node
```

2. Deploy the contract on localhost (from `backend/`):

```shell
npx hardhat ignition deploy ignition/modules/Voting.ts --network localhost
```

3. In `.env.local`, set `NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS` to the local address and `NEXT_PUBLIC_DEPLOYMENT_BLOCK=0`.

4. Start the dev server:

```shell
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) and connect MetaMask to the **Hardhat** network (`localhost:8545`, chain ID `31337`). Import an account using the private keys printed by `npx hardhat node`.

## Running against Sepolia

1. In `.env.local`, set:

```env
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=0xc5848F895C9b6c47aBF3BdD24C30b50F9be283F5
NEXT_PUBLIC_DEPLOYMENT_BLOCK=<deployment_block_number>
```

2. Start the dev server:

```shell
npm run dev
```

3. Connect MetaMask to **Sepolia** and use the wallet that deployed the contract to act as owner.

## Deploying on Vercel

Set the following environment variables in the Vercel project dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PROJECT_ID` | Your Reown project ID |
| `NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS` | Sepolia contract address |
| `NEXT_PUBLIC_DEPLOYMENT_BLOCK` | Block number of the deployment transaction |

## Roles

| Role | Capabilities |
|---|---|
| **Owner** | Register voters, advance the workflow through all phases, tally votes |
| **Registered voter** | Submit proposals, cast a vote, view the voters list and results |
| **Visitor** | View results only |

The app automatically redirects to the tab matching the current workflow phase on login.
