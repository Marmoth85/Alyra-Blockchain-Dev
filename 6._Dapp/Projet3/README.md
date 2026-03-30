# Project 3 — Decentralised Voting DApp

A full-stack decentralised application built as part of the [Alyra](https://www.alyra.fr) blockchain developer training programme. It implements a structured, on-chain voting system on Ethereum, combining a Solidity smart contract and a Next.js frontend.

---

## Live Demo

The application is deployed and accessible at:

**[https://alyra-blockchain-dev-hvll-gx5k1m39k-marmoth85s-projects.vercel.app](https://alyra-blockchain-dev-hvll-gx5k1m39k-marmoth85s-projects.vercel.app)**

To interact with it you will need MetaMask (or any EIP-1193 compatible wallet) connected to the **Sepolia** testnet.

---

## Smart Contract

The `Voting.sol` contract is deployed and verified on Sepolia:

**[0xc5848F895C9b6c47aBF3BdD24C30b50F9be283F5 — View on Etherscan](https://sepolia.etherscan.io/address/0xc5848f895c9b6c47abf3bdd24c30b50f9be283f5#code)**

---

## Video Walkthrough

A walkthrough of the dApp demonstrating the full voting workflow is available on YouTube:

**[Watch the demo — coming soon](#)**

> _Link will be updated once the video is published._

---

## Project Structure

```
Projet3/
├── backend/        # Solidity smart contract, Hardhat config, tests & deployment
└── frontend/       # Next.js frontend application
    └── voting/
```

### Backend

The smart contract and its test suite live in the `backend/` directory.

- **Contract:** `backend/contracts/Voting.sol`
- **Tests:** `backend/test/Voting.ts`
- **Deployment:** Hardhat Ignition (`backend/ignition/modules/Voting.ts`)

→ [Backend README](./backend/README.md)

### Frontend

The Next.js application lives in `frontend/voting/`. It connects to the deployed contract via wagmi + viem and uses Reown AppKit for wallet connection.

→ [Frontend README](./frontend/voting/README.md)

---

## Roles

| Role | Description |
|---|---|
| **Owner** | Deploys the contract, registers voters, drives the workflow through all phases, tallies votes |
| **Registered voter** | Submits proposals, casts a vote, views the voters list |
| **Visitor** | Views the results (public) |

---

## AI-Assisted Development

This project was built with the assistance of [Claude Code](https://claude.ai/code) (Anthropic). The full conversation log — all prompts and interactions used during development — is available here:

→ [claude_ia.md](./claude_ia.md)

> Each individual prompt is separated by a horizontal rule (`---`) in the file.
